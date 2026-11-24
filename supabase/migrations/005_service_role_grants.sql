-- Study Buddy: let the server-side reminder job (service_role) read and update the tables.
-- Newer Supabase projects don't grant this automatically. service_role is only ever used on
-- the server (Edge Functions); it is never sent to browsers.

grant usage on schema public to service_role;

grant select, insert, update, delete on
  public.profiles,
  public.school_blocks,
  public.tasks,
  public.scheduled_chunks,
  public.buddies,
  public.focus_sessions,
  public.inventory,
  public.push_subscriptions
to service_role;
