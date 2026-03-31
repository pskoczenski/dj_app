-- Create storage buckets for user uploads
insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('event-flyers', 'event-flyers', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('mix-covers', 'mix-covers', true)
on conflict (id) do nothing;

-- Profile images: users can upload/update/delete their own folder
create policy "Users can upload their own profile image"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own profile image"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own profile image"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Profile images are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'profile-images');

-- Event flyers: event creators can manage flyers
create policy "Event creators can upload flyers"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'event-flyers'
    and exists (
      select 1 from public.events
      where id::text = (storage.foldername(name))[1]
        and created_by = auth.uid()
    )
  );

create policy "Event creators can update flyers"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'event-flyers'
    and exists (
      select 1 from public.events
      where id::text = (storage.foldername(name))[1]
        and created_by = auth.uid()
    )
  );

create policy "Event creators can delete flyers"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'event-flyers'
    and exists (
      select 1 from public.events
      where id::text = (storage.foldername(name))[1]
        and created_by = auth.uid()
    )
  );

create policy "Event flyers are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'event-flyers');

-- Mix covers: mix owners can manage covers
create policy "Mix owners can upload covers"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'mix-covers'
    and exists (
      select 1 from public.mixes
      where id::text = (storage.foldername(name))[1]
        and profile_id = auth.uid()
    )
  );

create policy "Mix owners can update covers"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'mix-covers'
    and exists (
      select 1 from public.mixes
      where id::text = (storage.foldername(name))[1]
        and profile_id = auth.uid()
    )
  );

create policy "Mix owners can delete covers"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'mix-covers'
    and exists (
      select 1 from public.mixes
      where id::text = (storage.foldername(name))[1]
        and profile_id = auth.uid()
    )
  );

create policy "Mix covers are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'mix-covers');
