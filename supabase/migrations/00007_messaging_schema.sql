-- Step 20: Messaging schema & RLS
-- Adds conversations, participants, messages, triggers, and DM helper.

CREATE TYPE conversation_type AS ENUM ('dm', 'event_group');

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type conversation_type NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (
    (type = 'event_group' AND event_id IS NOT NULL)
    OR (type = 'dm' AND event_id IS NULL)
  )
);

CREATE INDEX idx_conversations_event_id ON conversations(event_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE UNIQUE INDEX uniq_event_group_conversation_per_event
  ON conversations(event_id)
  WHERE type = 'event_group';

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz,
  UNIQUE(conversation_id, profile_id)
);

CREATE INDEX idx_cp_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX idx_cp_profile_id ON conversation_participants(profile_id);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id),
  body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_messages_conversation_id_created_at
  ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);

CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER messages_bump_conversation_updated_at
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view conversations"
  ON conversations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id
        AND cp.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Participants can update conversations"
  ON conversations FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id
        AND cp.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id
        AND cp.profile_id = auth.uid()
    )
  );

CREATE POLICY "Participants can view participant rows"
  ON conversation_participants FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
        AND cp.profile_id = auth.uid()
    )
  );

CREATE POLICY "Conversation creator or eligible event member can add participants"
  ON conversation_participants FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
        AND c.created_by = auth.uid()
    )
    OR (
      conversation_participants.profile_id = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM conversations c
        WHERE c.id = conversation_participants.conversation_id
          AND c.type = 'event_group'
          AND (
            c.created_by = auth.uid()
            OR EXISTS (
              SELECT 1
              FROM event_lineup el
              WHERE el.event_id = c.event_id
                AND el.profile_id = auth.uid()
            )
          )
      )
    )
  );

CREATE POLICY "Conversation creator or self can remove participants"
  ON conversation_participants FOR DELETE TO authenticated
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
        AND c.created_by = auth.uid()
    )
  );

CREATE POLICY "Participants can view messages"
  ON messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.profile_id = auth.uid()
    )
  );

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
  );

CREATE POLICY "Senders can delete own messages"
  ON messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid());

CREATE OR REPLACE FUNCTION get_or_create_dm(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_conversation_id uuid;
  new_conversation_id uuid;
  a uuid;
  b uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF other_user_id IS NULL OR other_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Invalid other_user_id';
  END IF;

  a := LEAST(auth.uid(), other_user_id);
  b := GREATEST(auth.uid(), other_user_id);
  PERFORM pg_advisory_xact_lock(hashtext(a::text || ':' || b::text));

  SELECT c.id
  INTO existing_conversation_id
  FROM conversations c
  JOIN conversation_participants cp
    ON cp.conversation_id = c.id
  WHERE c.type = 'dm'
  GROUP BY c.id
  HAVING COUNT(*) = 2
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
