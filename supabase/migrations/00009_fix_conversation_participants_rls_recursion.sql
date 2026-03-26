-- Step 20+ follow-up: fix infinite recursion in conversation_participants RLS
-- The 00008 migration introduced the intended helper-based policy, but the
-- table ended up with an additional self-referential policy definition that
-- can cause "infinite recursion detected in policy" errors.
--
-- This migration force-resets the SELECT policy to use the
-- `is_conversation_participant(conversation_id)` SECURITY DEFINER helper.

-- Ensure the helper exists even if 00008 wasn't applied (or was applied without it).
CREATE OR REPLACE FUNCTION public.is_conversation_participant(conv_id uuid)
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

DROP POLICY IF EXISTS "Participants can view participant rows"
  ON conversation_participants;

CREATE POLICY "Participants can view participant rows"
  ON conversation_participants FOR SELECT TO authenticated
  USING (public.is_conversation_participant(conversation_id));

