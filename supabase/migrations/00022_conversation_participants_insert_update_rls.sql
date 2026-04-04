-- ============================================================
-- 00022: Fix conversation_participants INSERT RLS (42501) and
--        add missing UPDATE policy for last_read_at.
--
-- Problems:
--
--   1. INSERT policy (00016) only allows event_group participant rows.
--      DM participant rows created by get_or_create_dm() work because
--      that function is SECURITY DEFINER, but any other client-side
--      INSERT (e.g. re-adding a removed participant, or future flows)
--      is blocked outright.
--
--      More critically, during event_group thread creation the INSERT
--      policy calls conversation_event_id(conversation_id) on a row
--      that was just created in the same statement/transaction. The
--      SECURITY DEFINER helper may not see the conversation row yet,
--      returning NULL, which cascades through event_creator_id(NULL)
--      → NULL, failing the entire WITH CHECK → 42501.
--
--   2. No UPDATE policy exists on conversation_participants at all.
--      Any attempt to update last_read_at (marking messages as read)
--      silently fails or returns 403, breaking unread counts / read
--      receipts in the messaging UI.
--
-- Fixes:
--
--   1. Replace the INSERT policy with a SECURITY DEFINER function
--      that checks eligibility in a single call, reading conversations
--      and event_lineup directly (no RLS re-entry). This avoids the
--      nested-helper-returning-NULL problem entirely.
--
--   2. Add an UPDATE policy so participants can update their own row
--      (scoped to last_read_at changes via a BEFORE UPDATE trigger
--      that prevents mutation of other columns).
-- ============================================================


-- ============================================================
-- 1. SECURITY DEFINER helper: can_insert_conversation_participant
--    Single function that checks both inserter eligibility and
--    inserted-profile eligibility without depending on any RLS.
-- ============================================================

CREATE OR REPLACE FUNCTION public.can_insert_conversation_participant(
  p_conversation_id uuid,
  p_profile_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type conversation_type;
  v_event_id uuid;
  v_event_creator_id uuid;
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RETURN false;
  END IF;

  -- Read conversation metadata directly (bypasses RLS).
  SELECT c.type, c.event_id
  INTO v_type, v_event_id
  FROM conversations c
  WHERE c.id = p_conversation_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- DM participants are managed exclusively by get_or_create_dm().
  -- Block direct client INSERTs for DMs.
  IF v_type = 'dm' THEN
    RETURN false;
  END IF;

  -- event_group: look up the event creator.
  SELECT e.created_by
  INTO v_event_creator_id
  FROM events e
  WHERE e.id = v_event_id
    AND e.deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Inserter must be event creator OR on the lineup.
  IF v_caller != v_event_creator_id
     AND NOT EXISTS (
       SELECT 1 FROM event_lineup el
       WHERE el.event_id = v_event_id
         AND el.profile_id = v_caller
     )
  THEN
    RETURN false;
  END IF;

  -- Inserted profile must be event creator OR on the lineup.
  IF p_profile_id != v_event_creator_id
     AND NOT EXISTS (
       SELECT 1 FROM event_lineup el
       WHERE el.event_id = v_event_id
         AND el.profile_id = p_profile_id
     )
  THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.can_insert_conversation_participant(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_insert_conversation_participant(uuid, uuid) TO authenticated;


-- ============================================================
-- 2. Replace INSERT policy
-- ============================================================

DROP POLICY IF EXISTS "Conversation creator or eligible event member can add participants"
  ON conversation_participants;

CREATE POLICY "Eligible event members can add participants"
  ON conversation_participants FOR INSERT TO authenticated
  WITH CHECK (
    public.can_insert_conversation_participant(conversation_id, profile_id)
  );


-- ============================================================
-- 3. UPDATE policy for last_read_at
-- ============================================================

-- Guard: only last_read_at may change on participant rows.
CREATE OR REPLACE FUNCTION public.conversation_participants_enforce_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.id              IS DISTINCT FROM OLD.id
     OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
     OR NEW.profile_id      IS DISTINCT FROM OLD.profile_id
     OR NEW.joined_at       IS DISTINCT FROM OLD.joined_at THEN
    RAISE EXCEPTION 'Only conversation_participants.last_read_at may be updated';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS conversation_participants_immutable ON conversation_participants;
CREATE TRIGGER conversation_participants_immutable
  BEFORE UPDATE ON conversation_participants
  FOR EACH ROW
  EXECUTE FUNCTION conversation_participants_enforce_immutable();

-- Allow participants to update their own row (for last_read_at).
DROP POLICY IF EXISTS "Participants can update own last_read_at" ON conversation_participants;

CREATE POLICY "Participants can update own last_read_at"
  ON conversation_participants FOR UPDATE TO authenticated
  USING  (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
