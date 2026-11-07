-- OUTPOST UZ v1.2 — initial secure schema
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'contributor' check (role in ('super_admin','admin','editor','contributor')),
  created_at timestamptz not null default now()
);

create table if not exists public.content_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content_type text not null check (content_type in ('item','weapon','monument','guide','recipe')),
  category text,
  description text,
  body jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name',''), 'contributor');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid());
$$;

alter table public.profiles enable row level security;
alter table public.content_entries enable row level security;

-- Users can read their own profile; only privileged roles can manage profiles.
drop policy if exists "profile read self or admins" on public.profiles;
create policy "profile read self or admins" on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.current_user_role() in ('super_admin','admin'));
drop policy if exists "super admins manage profiles" on public.profiles;
create policy "super admins manage profiles" on public.profiles for update to authenticated
using (public.current_user_role() = 'super_admin') with check (public.current_user_role() = 'super_admin');

-- Public visitors can only see published content.
drop policy if exists "public read published content" on public.content_entries;
create policy "public read published content" on public.content_entries for select to anon, authenticated
using (status = 'published' or (select auth.uid()) is not null and public.current_user_role() in ('super_admin','admin','editor','contributor'));
-- Contributors may create drafts; editors/admins may update; only editor+ may publish.
drop policy if exists "contributors create content" on public.content_entries;
create policy "contributors create content" on public.content_entries for insert to authenticated
with check (public.current_user_role() in ('super_admin','admin','editor','contributor') and status = 'draft' and created_by = (select auth.uid()));
drop policy if exists "staff update content" on public.content_entries;
create policy "staff update content" on public.content_entries for update to authenticated
using (public.current_user_role() in ('super_admin','admin','editor','contributor'))
with check (
  public.current_user_role() in ('super_admin','admin','editor')
  or (public.current_user_role() = 'contributor' and status = 'draft')
);
drop policy if exists "admins delete content" on public.content_entries;
create policy "admins delete content" on public.content_entries for delete to authenticated
using (public.current_user_role() in ('super_admin','admin'));
