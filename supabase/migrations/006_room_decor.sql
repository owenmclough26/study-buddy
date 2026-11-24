-- Study Buddy: room decorations. Which wallpaper/rug/bed/etc. is placed in the buddy's room.
-- Owned items live in `inventory` like hats do. Run once in the SQL Editor.

alter table public.buddies
  add column if not exists decor jsonb not null default '{}'::jsonb;
