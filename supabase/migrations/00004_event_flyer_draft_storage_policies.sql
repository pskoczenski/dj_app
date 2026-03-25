-- Allow uploads before an event row exists (create flow).
-- Paths: {auth.uid()}/draft-flyer.<ext> — first segment must match the signed-in user.
-- Existing policies still cover {event_id}/flyer.<ext> after the event is created.

create policy "Users can upload event flyer drafts in own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'event-flyers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own event flyer drafts"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'event-flyers'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'event-flyers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own event flyer drafts"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'event-flyers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
