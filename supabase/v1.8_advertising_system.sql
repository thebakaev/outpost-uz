-- OUTPOST UZ v1.8 — Advertising manager
-- Run once in Supabase Dashboard → SQL Editor → New query.
-- Allow larger banner artwork in the shared public media bucket (up to 20 MB).
-- This raises the server-side upload ceiling for the bucket.
update storage.buckets
set file_size_limit = 20971520,
    allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif']
where id = 'outpost-media';

create table if not exists public.advertisements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  target_url text not null,
  placement text not null default 'home_top' check (placement in ('home_top','wiki_inline','footer')),
  is_active boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint advertisement_dates_valid check (starts_at is null or ends_at is null or ends_at > starts_at)
);
create index if not exists advertisements_public_lookup_idx
  on public.advertisements (placement, is_active, starts_at, ends_at);
alter table public.advertisements enable row level security;
grant select on public.advertisements to anon, authenticated;
grant insert, update, delete on public.advertisements to authenticated;
drop policy if exists "public read active advertisements" on public.advertisements;
create policy "public read active advertisements" on public.advertisements
for select to anon, authenticated
using (is_active = true and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now())
  or auth.uid() is not null and public.current_user_role() in ('super_admin','admin','editor'));
drop policy if exists "staff manage advertisements" on public.advertisements;
create policy "staff manage advertisements" on public.advertisements
for all to authenticated
using (public.current_user_role() in ('super_admin','admin','editor'))
with check (public.current_user_role() in ('super_admin','admin','editor'));

create or replace function public.record_ad_impression(ad_id uuid)
returns void language sql security definer set search_path = '' as $$
  update public.advertisements set impressions = impressions + 1 where id = ad_id and is_active = true;
$$;
create or replace function public.record_ad_click(ad_id uuid)
returns void language sql security definer set search_path = '' as $$
  update public.advertisements set clicks = clicks + 1 where id = ad_id and is_active = true;
$$;
grant execute on function public.record_ad_impression(uuid) to anon, authenticated;
grant execute on function public.record_ad_click(uuid) to anon, authenticated;

-- Admin audit trail for ad changes.
drop trigger if exists audit_advertisements on public.advertisements;
create trigger audit_advertisements after insert or update or delete on public.advertisements
for each row execute function public.outpost_audit_row();
