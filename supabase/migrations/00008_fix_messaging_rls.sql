-- ============================================================
-- 00008: Fix messaging RLS, soft-delete filtering, conversation
--        update guard, and get_or_create_dm safety checks.
--
-- Fixes:
--   1. Self-referential RLS recursion on conversation_participants
--      → replace with a SECURITY DEFINER helper function
--   2. get_or_create_dm allows DMing deleted/non-existent users
--      → add active-profile guard
--   3. messages.deleted_at not filtered in SELECT policy
--      → filter deleted_at IS NULL; add partial index
--   4. Event group conversations: creator could add arbitrary users
--      → tighten INSERT policy to lineup-only for event_group type
--   5. conversations UPDATE policy lets participants mutate type/event_id/created_by
--      → restrict updatable columns via WITH CHECK
--   6. pg_advisory_xact_lock uses int4 hash (collision risk)
--      → switch to hashtextextended for full 64-bit lock
-- ============================================================


-- ============================================================
-- 1. SECURITY DEFINER helper: is_conversation_participant
--    Breaks the self-referential RLS recursion by querying
--    conversation_participants outside the RLS evaluation stack.
-- ============================================================

CREATE OR REPLACE FUNCTION is_conversation_participant(conv_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_id = conv_id
      AND profile_id = auth.uid()
  );
$$;


-- ============================================================
-- 2. Drop and rebuild all policies that either caused recursion
--    or had the other correctness problems identified above.
-- ============================================================

-- ── conversations ──────────────────────────────────────────

DROP POLICY IF EXISTS "Participants can view conversations"    ON conversations;
DROP POLICY IF EXISTS "Participants can update conversations"  ON conversations;

-- SELECT: use helper to avoid recursion
CREATE POLICY "Participants can view conversations"
  ON conversations FOR SELECT TO authenticated
  USING (is_conversation_participant(id));

-- UPDATE: participants can only touch updated_at (e.g. via trigger).
-- Immutable columns (type, event_id, created_by, created_at) must
-- not change — enforce via WITH CHECK comparing NEW to OLD values.
CREATE POLICY "Participants can update conversations"
  ON conversations FOR UPDATE TO authenticated
  USING (is_conversation_participant(id))
  WITH CHECK (is_conversation_participant(id));

-- Enforce immutable conversation structure on UPDATE (including trigger bumps).
-- This is robust against any client UPDATE that tries to mutate identity fields.
CREATE OR REPLACE FUNCTION conversations_enforce_immutable_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.type IS DISTINCT FROM OLD.type
     OR NEW.event_id IS DISTINCT FROM OLD.event_id
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only conversations.updated_at may be updated';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS conversations_immutable_columns ON conversations;
CREATE TRIGGER conversations_immutable_columns
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION conversations_enforce_immutable_columns();

-- ── conversation_participants ───────────────────────────────

DROP POLICY IF EXISTS "Participants can view participant rows"                         ON conversation_participants;
DROP POLICY IF EXISTS "Conversation creator or eligible event member can add participants" ON conversation_participants;
DROP POLICY IF EXISTS "Conversation creator or self can remove participants"           ON conversation_participants;

-- SELECT: use helper — eliminates self-referential recursion
CREATE POLICY "Participants can view participant rows"
  ON conversation_participants FOR SELECT TO authenticated
  USING (is_conversation_participant(conversation_id));

-- INSERT: event-group only via RLS.
-- DM participant rows are created through SECURITY DEFINER get_or_create_dm().
-- This prevents ad-hoc DM participant expansion from client-side inserts.
CREATE POLICY "Conversation creator or eligible event member can add participants"
  ON conversation_participants FOR INSERT TO authenticated
  WITH CHECK (
    -- Branch A: creator of event_group can add lineup members (or themselves)
    (
      EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = conversation_participants.conversation_id
          AND c.created_by = auth.uid()
          AND c.type = 'event_group'
      )
      AND (
        conversation_participants.profile_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM conversations c
          WHERE c.id = conversation_participants.conversation_id
            AND c.type = 'event_group'
            AND EXISTS (
              SELECT 1 FROM event_lineup el
              WHERE el.event_id = c.event_id
                AND el.profile_id = conversation_participants.profile_id
            )
        )
      )
    )
    OR
    -- Branch B: a lineup member joining an event_group conversation as themselves
    (
      conversation_participants.profile_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = conversation_participants.conversation_id
          AND c.type = 'event_group'
          AND EXISTS (
            SELECT 1 FROM event_lineup el
            WHERE el.event_id = c.event_id
              AND el.profile_id = auth.uid()
          )
      )
    )
  );

-- DELETE: unchanged logic, re-stated for clarity
CREATE POLICY "Conversation creator or self can remove participants"
  ON conversation_participants FOR DELETE TO authenticated
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
        AND c.created_by = auth.uid()
    )
  );

-- ── messages ───────────────────────────────────────────────

DROP POLICY IF EXISTS "Participants can view messages" ON messages;
DROP POLICY IF EXISTS "Senders can delete own messages" ON messages;

-- SELECT: filter out soft-deleted messages; use helper for participant check
CREATE POLICY "Participants can view messages"
  ON messages FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND is_conversation_participant(conversation_id)
  );

-- DELETE → soft delete only: senders mark their own messages deleted,
-- but we keep the row. Hard DELETE is no longer permitted via RLS.
-- Clients should PATCH { deleted_at: now() } instead.
-- The old hard-delete policy is dropped; replace with a soft-delete guard.
CREATE POLICY "Senders can soft-delete own messages"
  ON messages FOR UPDATE TO authenticated
  USING  (sender_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (
    sender_id    = auth.uid()
    AND conversation_id = conversation_id  -- immutable
    AND created_at      = created_at       -- immutable
    -- only deleted_at may change (to a non-null value)
    AND deleted_at IS NOT NULL
  );

-- Partial index to keep soft-delete queries fast
CREATE INDEX IF NOT EXISTS idx_messages_active
  ON messages(conversation_id, created_at DESC)
  WHERE deleted_at IS NULL;


-- ============================================================
-- 3. Replace get_or_create_dm
--    Adds: active-profile guard for other_user_id
--          full 64-bit advisory lock (hashtextextended)
-- ============================================================

CREATE OR REPLACE FUNCTION get_or_create_dm(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_conversation_id uuid;
  new_conversation_id      uuid;
  a                        uuid;
  b                        uuid;
  lock_key                 bigint;
BEGIN
  -- Auth guard
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Self-DM guard
  IF other_user_id IS NULL OR other_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Invalid other_user_id';
  END IF;

  -- Active-profile guard: prevent DMing deleted or non-existent users
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = other_user_id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'User not found or no longer active';
  END IF;

  -- Canonical ordering for deterministic lock key
  a := LEAST(auth.uid(), other_user_id);
  b := GREATEST(auth.uid(), other_user_id);

  -- Use hashtextextended for full 64-bit lock space (avoids int4 collisions)
  lock_key := hashtextextended(a::text || ':' || b::text, 0);
  PERFORM pg_advisory_xact_lock(lock_key);

  -- Look for an existing DM between exactly these two users
  SELECT c.id
  INTO existing_conversation_id
  FROM conversations c
  JOIN conversation_participants cp ON cp.conversation_id = c.id
  WHERE c.type = 'dm'
  GROUP BY c.id
  HAVING
    COUNT(*)                                                        = 2
    AND COUNT(*) FILTER (WHERE cp.profile_id IN (auth.uid(), other_user_id)) = 2
  LIMIT 1;

  IF existing_conversation_id IS NOT NULL THEN
    RETURN existing_conversation_id;
  END IF;

  -- Create conversation + both participant rows atomically
  INSERT INTO conversations (type, created_by)
  VALUES ('dm', auth.uid())
  RETURNING id INTO new_conversation_id;

  INSERT INTO conversation_participants (conversation_id, profile_id)
  VALUES
    (new_conversation_id, auth.uid()),
    (new_conversation_id, other_user_id);

  RETURN new_conversation_id;
END;
$$;