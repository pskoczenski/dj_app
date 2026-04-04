-- Event creators and lineup DJs could not SELECT the event_group conversation row until
-- they appeared in conversation_participants. findEventGroupConversationId() returned null,
-- ensureEventGroupThread() attempted INSERT, and uniq_event_group_conversation_per_event
-- raised 23505. The retry still could not read the row, so the client surfaced 409.

DROP POLICY IF EXISTS "Event members can view event group thread" ON public.conversations;

CREATE POLICY "Event members can view event group thread"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (
    type = 'event_group'
    AND event_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1
        FROM public.events e
        WHERE e.id = conversations.event_id
          AND e.created_by = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.event_lineup el
        WHERE el.event_id = conversations.event_id
          AND el.profile_id = auth.uid()
      )
    )
  );
