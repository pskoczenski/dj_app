-- Step 46: Enforce blocking for DM creation and message send

-- Update get_or_create_dm to prevent DMs when either user blocked the other.
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
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF other_user_id IS NULL OR other_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Invalid other_user_id';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = other_user_id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'User not found or no longer active';
  END IF;

  -- Block guard (either direction)
  IF EXISTS (
    SELECT 1 FROM blocks
    WHERE (blocker_id = auth.uid() AND blocked_id = other_user_id)
       OR (blocker_id = other_user_id AND blocked_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Messaging unavailable';
  END IF;

  a := LEAST(auth.uid(), other_user_id);
  b := GREATEST(auth.uid(), other_user_id);
  lock_key := hashtextextended(a::text || ':' || b::text, 0);
  PERFORM pg_advisory_xact_lock(lock_key);

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

-- Replace messages INSERT policy to deny sending in DMs when blocked.
DROP POLICY IF EXISTS "Participants can send messages as themselves" ON messages;

CREATE POLICY "Participants can send messages as themselves"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.profile_id = auth.uid()
    )
    AND (
      NOT EXISTS (
        SELECT 1
        FROM conversations c
        WHERE c.id = messages.conversation_id
          AND c.type = 'dm'
      )
      OR NOT EXISTS (
        SELECT 1
        FROM blocks b
        WHERE (
          b.blocker_id = auth.uid()
          AND b.blocked_id = (
            SELECT cp2.profile_id
            FROM conversation_participants cp2
            WHERE cp2.conversation_id = messages.conversation_id
              AND cp2.profile_id <> auth.uid()
            LIMIT 1
          )
        )
        OR (
          b.blocker_id = (
            SELECT cp2.profile_id
            FROM conversation_participants cp2
            WHERE cp2.conversation_id = messages.conversation_id
              AND cp2.profile_id <> auth.uid()
            LIMIT 1
          )
          AND b.blocked_id = auth.uid()
        )
      )
    )
  );

