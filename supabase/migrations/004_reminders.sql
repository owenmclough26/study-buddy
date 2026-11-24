-- Study Buddy: push reminders.
-- Run once: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- (The scheduled job that sends reminders is set up separately, see README "Reminders".)

-- per-user reminder settings
alter table public.profiles
  add column if not exists reminders_enabled boolean not null default false,
  add column if not exists remind_minutes_before int not null default 10 check (remind_minutes_before between 0 and 120),
  add column if not exists nightly_summary boolean not null default true,
  add column if not exists timezone text not null default 'UTC',
  add column if not exists last_summary_date date;

-- so each planned session is only reminded once
alter table public.scheduled_chunks
  add column if not exists reminded_at timestamptz;

create index if not exists chunks_reminder_idx on public.scheduled_chunks (start_at) where status = 'planned' and reminded_at is null;

-- one row per phone/browser that said yes to notifications
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  device text,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "own push subscriptions" on public.push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.push_subscriptions to authenticated;
