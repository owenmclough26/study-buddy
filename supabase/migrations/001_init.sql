-- Study Buddy: initial schema.
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Every table is protected by row-level security so each user only sees their own rows.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  wake_time time not null default '07:00',
  sleep_time time not null default '23:00',
  no_work_after time not null default '22:00',
  session_minutes int not null default 45 check (session_minutes between 15 and 180),
  streak int not null default 0,
  last_active_date date,
  relax_minutes_banked int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.school_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  title text not null,
  location text,
  color text not null default '#64748b',
  check (end_time > start_time)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  category text not null check (category in ('study', 'homework', 'reading', 'chores')),
  estimated_minutes int not null check (estimated_minutes > 0),
  logged_minutes int not null default 0,
  due_at timestamptz not null,
  priority smallint not null default 2 check (priority between 1 and 3),
  status text not null default 'open' check (status in ('open', 'done')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.scheduled_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'planned' check (status in ('planned', 'done', 'missed')),
  pinned boolean not null default false,
  check (end_at > start_at)
);

create table if not exists public.buddies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique default auth.uid() references auth.users (id) on delete cascade,
  species text not null check (species in ('ginger', 'gray', 'black', 'calico', 'tuxedo', 'cream')),
  name text not null,
  level int not null default 1,
  xp int not null default 0,
  coins int not null default 0,
  energy real not null default 80,
  happiness real not null default 80,
  knowledge real not null default 50,
  equipped_hat text,
  last_decay_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  room text not null,
  started_at timestamptz not null,
  minutes int not null check (minutes >= 0)
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id text not null,
  acquired_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create index if not exists school_blocks_user_idx on public.school_blocks (user_id);
create index if not exists tasks_user_idx on public.tasks (user_id);
create index if not exists chunks_user_idx on public.scheduled_chunks (user_id);
create index if not exists sessions_user_idx on public.focus_sessions (user_id);

-- Row-level security
alter table public.profiles enable row level security;
alter table public.school_blocks enable row level security;
alter table public.tasks enable row level security;
alter table public.scheduled_chunks enable row level security;
alter table public.buddies enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.inventory enable row level security;

create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "own blocks" on public.school_blocks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own tasks" on public.tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own chunks" on public.scheduled_chunks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own buddy" on public.buddies
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own sessions" on public.focus_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own inventory" on public.inventory
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
