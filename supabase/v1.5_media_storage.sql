-- OUTPOST UZ v1.5 — public media bucket with staff-only uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'outpost-media',
  'outpost-media',
  true,
  5242880,
  array['image/png','image/jpeg','image/webp','image/gif']
)
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view OUTPOST media" on storage.objects;
create policy "Public can view OUTPOST media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'outpost-media');

drop policy if exists "Staff can upload OUTPOST media" on storage.objects;
create policy "Staff can upload OUTPOST media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'outpost-media'
  and public.current_user_role() in ('super_admin','admin','editor','contributor')
);

drop policy if exists "Staff can update OUTPOST media" on storage.objects;
create policy "Staff can update OUTPOST media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'outpost-media'
  and public.current_user_role() in ('super_admin','admin','editor')
)
with check (
  bucket_id = 'outpost-media'
  and public.current_user_role() in ('super_admin','admin','editor')
);

drop policy if exists "Admins can delete OUTPOST media" on storage.objects;
create policy "Admins can delete OUTPOST media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'outpost-media'
  and public.current_user_role() in ('super_admin','admin')
);
