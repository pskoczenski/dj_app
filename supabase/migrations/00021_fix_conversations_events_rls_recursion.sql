-- 00020 "Event members can view event group thread" referenced public.events inside a
-- conversations SELECT policy. Evaluating events RLS runs "Event group participants can
-- view linked event" (00011), which queries conversations again → infinite recursion
-- (often surfaced as 42P17 / broken reads & writes across the DB from the client).

DROP POLICY IF EXISTS "Event members can view event group thread" ON public.conversations;

-- Bypass event_lineup RLS so this check does not re-enter events → conversations.
CREATE OR REPLACE FUNCTION public.profile_on_event_lineup(
  p_event_id uuid,
  p_profile_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_lineup el
    WHERE el.event_id = p_event_id
      AND el.profile_id = p_profile_id
  );
$$;

REVOKE ALL ON FUNCTION public.profile_on_event_lineup(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.profile_on_event_lineup(uuid, uuid) TO authenticated;

-- Event group threads use conversations.created_by = events.created_by (app invariant).
CREATE POLICY "Event members can view event group thread"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (
    type = 'event_group'
    AND event_id IS NOT NULL
    AND (
      conversations.created_by = auth.uid()
      OR public.profile_on_event_lineup(conversations.event_id, auth.uid())
    )
  );
