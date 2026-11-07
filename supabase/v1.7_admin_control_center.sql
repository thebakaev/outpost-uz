-- OUTPOST UZ v1.7 — Admin roles, audit log and site settings
-- Run once in Supabase Dashboard → SQL Editor → New query.
create extension if not exists pgcrypto;

-- Site settings: public can read, staff can manage.
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '""'::jsonb,
  description text,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;

drop policy if exists "public read site settings" on public.site_settings;
create policy "public read site settings" on public.site_settings
for select to anon, authenticated using (true);
drop policy if exists "staff manage site settings" on public.site_settings;
create policy "staff manage site settings" on public.site_settings
for all to authenticated
using (public.current_user_role() in ('super_admin','admin','editor'))
with check (public.current_user_role() in ('super_admin','admin','editor'));

insert into public.site_settings (key,value,description) values
('site_name','"OUTPOST UZ"'::jsonb,'Saytning asosiy nomi'),
('site_description','"Rust olamini o‘zbek tilida o‘rganing."'::jsonb,'Saytning qisqa tavsifi'),
('site_logo_url','""'::jsonb,'Logo uchun rasm URL manzili'),
('contact_email','""'::jsonb,'Aloqa email manzili'),
('seo_title','"OUTPOST UZ — Rust Wiki o‘zbek tilida"'::jsonb,'Brauzer va qidiruv tizimlari sarlavhasi'),
('seo_description','"Rust o‘yini bo‘yicha o‘zbek tilidagi Wiki, Raid Calculator, Craft va Recycler."'::jsonb,'Qidiruv tizimlari uchun tavsif')
on conflict (key) do nothing;

-- Activity log stores who changed what and when.
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  entity_title text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_logs_created_at_idx on public.activity_logs(created_at desc);
create index if not exists activity_logs_actor_id_idx on public.activity_logs(actor_id);
alter table public.activity_logs enable row level security;
grant select on public.activity_logs to authenticated;
drop policy if exists "admins read activity logs" on public.activity_logs;
create policy "admins read activity logs" on public.activity_logs
for select to authenticated
using (public.current_user_role() in ('super_admin','admin'));
revoke insert, update, delete on public.activity_logs from anon, authenticated;

create or replace function public.outpost_audit_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_data jsonb;
  new_data jsonb;
  actor uuid;
  actor_mail text;
  target_id text;
  target_title text;
  changes jsonb;
begin
  actor := coalesce((select auth.uid()), null);
  select p.email into actor_mail from public.profiles p where p.id = actor;

  if tg_op = 'INSERT' then
    new_data := to_jsonb(new);
    target_id := coalesce(new_data->>'id', new_data->>'data_key', new_data->>'key');
    target_title := coalesce(new_data->>'title', new_data->>'data_key', new_data->>'key', new_data->>'email', tg_table_name);
    changes := jsonb_build_object('new', new_data);
  elsif tg_op = 'UPDATE' then
    old_data := to_jsonb(old);
    new_data := to_jsonb(new);
    target_id := coalesce(new_data->>'id', new_data->>'data_key', new_data->>'key');
    target_title := coalesce(new_data->>'title', new_data->>'data_key', new_data->>'key', new_data->>'email', tg_table_name);
    changes := jsonb_build_object('old', old_data, 'new', new_data);
  else
    old_data := to_jsonb(old);
    target_id := coalesce(old_data->>'id', old_data->>'data_key', old_data->>'key');
    target_title := coalesce(old_data->>'title', old_data->>'data_key', old_data->>'key', old_data->>'email', tg_table_name);
    changes := jsonb_build_object('old', old_data);
  end if;

  insert into public.activity_logs(actor_id, actor_email, action, entity_type, entity_id, entity_title, details)
  values (actor, actor_mail, tg_op, tg_table_name, target_id, target_title, changes);

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists audit_content_entries on public.content_entries;
create trigger audit_content_entries after insert or update or delete on public.content_entries
for each row execute function public.outpost_audit_row();

drop trigger if exists audit_game_data on public.game_data;
create trigger audit_game_data after insert or update or delete on public.game_data
for each row execute function public.outpost_audit_row();

drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles after insert or update or delete on public.profiles
for each row execute function public.outpost_audit_row();

drop trigger if exists audit_site_settings on public.site_settings;
create trigger audit_site_settings after insert or update or delete on public.site_settings
for each row execute function public.outpost_audit_row();

-- Only Super Admin can change staff roles. The client also hides this control from other roles.
drop policy if exists "super admins manage profiles" on public.profiles;
create policy "super admins manage profiles" on public.profiles
for update to authenticated
using (public.current_user_role() = 'super_admin' and id <> (select auth.uid()))
with check (public.current_user_role() = 'super_admin');

-- Ensure admins can list staff profiles; ordinary contributors cannot.
drop policy if exists "profile read self or admins" on public.profiles;
create policy "profile read self or admins" on public.profiles
for select to authenticated
using (id = (select auth.uid()) or public.current_user_role() in ('super_admin','admin'));
