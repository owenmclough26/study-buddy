# Study Buddy

Enter your school schedule once. Add to-dos, and they get planned around your classes automatically. Finish work in themed rooms to grow your study buddy.

## Run it

```powershell
npm install
npm run dev
```

Open http://localhost:5173. Without Supabase keys the app runs in **guest mode**, which saves everything in your browser.

## Turn on accounts + sync (Supabase)

1. Create a free project at https://supabase.com.
2. In the dashboard, go to **SQL Editor → New query**, paste [supabase/migrations/001_init.sql](supabase/migrations/001_init.sql), and click **Run**. Then do the same with [supabase/migrations/002_grants.sql](supabase/migrations/002_grants.sql).
3. Go to **Project Settings → API**. Copy `.env.example` to `.env.local` and fill in the Project URL and the `anon` public key.
4. Restart `npm run dev`. You'll now see a sign-in screen, and your data follows your account.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm test` | Run the scheduler tests |
| `npm run build` | Type-check and build for production |

## How it fits together

- `src/lib/scheduler.ts` is the auto-planner. It's a pure function, tested in `scheduler.test.ts`.
- `src/lib/rewards.ts` handles XP, coins, levels, evolution, stat decay, and the shop.
- `src/lib/store.tsx` holds all app state and actions, and re-plans after every change.
- `src/lib/repo.ts` is the storage layer: Supabase (cloud) or localStorage (guest).
- `src/features/*` contains each tab (buddy/Home, calendar, tasks, rooms, schedule/Settings).

## Later

- Photo or PDF schedule import, using the Claude API to read the picture into school blocks.
- Move reward calculation to the server so points can't be edited from the browser.
