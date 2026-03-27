-- Allow users who participate in an event_group conversation to read the linked
-- event row (including cancelled / soft-deleted) so thread headers and banners work.

CREATE POLICY "Event group participants can view linked event"
  ON events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM conversations c
      INNER JOIN conversation_participants cp ON cp.conversation_id = c.id
      WHERE c.event_id = events.id
        AND c.type = 'event_group'
        AND cp.profile_id = auth.uid()
    )
  );
