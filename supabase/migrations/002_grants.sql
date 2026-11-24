-- Study Buddy: let signed-in users reach the tables.
-- Newer Supabase projects don't grant table access to API roles automatically.
-- Row-level security (from 001_init.sql) still limits each user to their own rows.
-- Signed-out (anon) visitors get no access at all.
-- Run once: Dashboard -> SQL Editor -> New query -> paste -> Run.

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.school_blocks,
  public.tasks,
  public.scheduled_chunks,
  public.buddies,
  public.focus_sessions,
  public.inventory
to authenticated;
