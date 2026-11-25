-- Study Buddy: linked calendars (Google/Outlook/iCloud private iCal links).
-- The scheduler plans homework around the events in them. Run once in the SQL Editor.
-- These links are private (anyone with one can read that calendar), so only the owner can see them.

create table if not exists public.external_calendars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  url text not null,
  label text,
  created_at timestamptz not null default now()
);

create index if not exists external_calendars_user_idx on public.external_calendars (user_id);

alter table public.external_calendars enable row level security;

create policy "own calendars" on public.external_calendars
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.external_calendars to authenticated;
grant select, insert, update, delete on public.external_calendars to service_role;
