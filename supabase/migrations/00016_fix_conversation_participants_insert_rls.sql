-- ============================================================
-- 00016: Fix conversation_participants INSERT RLS for event_group
--
-- Problem:
-- - conversation_participants INSERT policy queries conversations.
-- - conversations SELECT RLS requires participant membership.
-- - When creating/syncing the initial participant rows, the policy's
--   subquery can't "see" the conversation yet → 403 / 42501.
--
-- Fix:
-- - Use SECURITY DEFINER helpers to read conversation metadata
--   without depending on conversations SELECT RLS visibility.
-- - Allow eligible event members (creator or lineup) to add
--   event_group participants, but restrict added participants to
--   event creator + event lineup members only.
-- - DM participants remain managed by get_or_create_dm().
-- ============================================================

-- Helpers deliberately bypass RLS by running as table owner.
-- They still use auth.uid() (JWT) for the caller identity.

CREATE OR REPLACE FUNCTION public.conversation_event_id(conv_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.event_id
  FROM conversations c
  WHERE c.id = conv_id
$$;

CREATE OR REPLACE FUNCTION public.conversation_type(conv_id uuid)
RETURNS conversation_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.type
  FROM conversations c
  WHERE c.id = conv_id
$$;

DROP POLICY IF EXISTS "Conversation creator or eligible event member can add participants"
  ON conversation_participants;

CREATE POLICY "Conversation creator or eligible event member can add participants"
  ON conversation_participants FOR INSERT TO authenticated
  WITH CHECK (
    public.conversation_type(conversation_id) = 'event_group'
    AND public.conversation_event_id(conversation_id) IS NOT NULL
    AND (
      -- Eligible inserter: event creator OR any lineup member
      auth.uid() = public.event_creator_id(public.conversation_event_id(conversation_id))
      OR public.is_event_lineup_member(public.conversation_event_id(conversation_id))
    )
    AND (
      -- Eligible participant row: event creator OR anyone on the lineup
      conversation_participants.profile_id =
        public.event_creator_id(public.conversation_event_id(conversation_id))
      OR EXISTS (
        SELECT 1
        FROM event_lineup el
        WHERE el.event_id = public.conversation_event_id(conversation_id)
          AND el.profile_id = conversation_participants.profile_id
      )
    )
  );

