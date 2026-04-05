-- ============================================================
-- 00024: RPCs for event_group participant sync (403 / 42501)
--
-- Client-side upsert into conversation_participants still fails when
-- can_insert_conversation_participant evaluates under RLS in some
-- environments even after 00023. These SECURITY DEFINER functions
-- run with row_security off and re-implement the same rules as the app.
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_event_group_participants_for_event(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_conv uuid;
  v_creator uuid;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT e.created_by INTO v_creator
  FROM public.events e
  WHERE e.id = p_event_id AND e.deleted_at IS NULL;

  IF NOT FOUND OR v_creator IS NULL THEN
    RETURN;
  END IF;

  IF v_creator IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Only the event creator can sync group participants';
  END IF;

  SELECT c.id INTO v_conv
  FROM public.conversations c
  WHERE c.type = 'event_group' AND c.event_id = p_event_id
  LIMIT 1;

  IF v_conv IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM public.conversation_participants cp
  WHERE cp.conversation_id = v_conv
    AND cp.profile_id IS DISTINCT FROM v_creator
    AND NOT EXISTS (
      SELECT 1
      FROM public.event_lineup el
      WHERE el.event_id = p_event_id AND el.profile_id = cp.profile_id
    );

  INSERT INTO public.conversation_participants (conversation_id, profile_id)
  VALUES (v_conv, v_creator)
  ON CONFLICT (conversation_id, profile_id) DO NOTHING;

  INSERT INTO public.conversation_participants (conversation_id, profile_id)
  SELECT v_conv, el.profile_id
  FROM public.event_lineup el
  WHERE el.event_id = p_event_id
  ON CONFLICT (conversation_id, profile_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_event_group_participants_for_event(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_event_group_participants_for_event(uuid) TO authenticated;


CREATE OR REPLACE FUNCTION public.add_self_to_event_group_chat(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_conv uuid;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.event_lineup el
    WHERE el.event_id = p_event_id AND el.profile_id = v_uid
  ) AND NOT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = p_event_id AND e.deleted_at IS NULL AND e.created_by = v_uid
  ) THEN
    RAISE EXCEPTION 'Not an event member';
  END IF;

  SELECT c.id INTO v_conv
  FROM public.conversations c
  WHERE c.type = 'event_group' AND c.event_id = p_event_id
  LIMIT 1;

  IF v_conv IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.conversation_participants (conversation_id, profile_id)
  VALUES (v_conv, v_uid)
  ON CONFLICT (conversation_id, profile_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.add_self_to_event_group_chat(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_self_to_event_group_chat(uuid) TO authenticated;
