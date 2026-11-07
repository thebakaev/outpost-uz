-- OUTPOST UZ v1.3 migration
-- Run once in Supabase SQL Editor after the v1.2 schema.
create or replace function public.set_content_entry_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists content_entries_updated_at on public.content_entries;
create trigger content_entries_updated_at
before update on public.content_entries
for each row execute function public.set_content_entry_updated_at();

create index if not exists content_entries_status_updated_idx
  on public.content_entries (status, updated_at desc);
create index if not exists content_entries_type_idx
  on public.content_entries (content_type);
