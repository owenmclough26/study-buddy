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
2. In the dashboard, go to **SQL Editor → New query**, paste [supabase/migrations/001_init.sql](supabase/migrations/001_init.sql), and click **Run**. Then do the same with [002_grants.sql](supabase/migrations/002_grants.sql) and [003_cat_coats.sql](supabase/migrations/003_cat_coats.sql).
3. Go to **Project Settings → API**. Copy `.env.example` to `.env.local` and fill in the Project URL and the `anon` public key.
4. Restart `npm run dev`. You'll now see a sign-in screen, and your data follows your account.

## Put it online (Vercel)

1. Push this repo to GitHub (a private repo is fine).
2. At https://vercel.com, sign in with GitHub, click **Add New → Project**, and import the repo. Vercel detects Vite; `vercel.json` handles the rest.
3. Under **Environment Variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (same values as `.env.local`), plus the PostHog ones if you use analytics. Then **Deploy**.
4. In Supabase, go to **Authentication → URL Configuration**. Set **Site URL** to your Vercel address (e.g. `https://study-buddy.vercel.app`) and add it under **Redirect URLs**, so confirmation emails link to the live site instead of localhost.

Every push to GitHub redeploys automatically.

## Install on a phone

The site is a PWA. On iPhone: open it in Safari → Share → **Add to Home Screen**. On Android: Chrome menu → **Install app**. It opens full-screen with a bottom tab bar, and the app shell works offline.

## Reminders (push notifications)

Phones get a notification before each planned session, plus an 8pm heads-up about tomorrow. Users turn it on in **Settings → Reminders**. On iPhone it only works in the installed app (iOS 16.4+).

How it works: the app registers each device in `push_subscriptions`. A Supabase cron job calls the `send-reminders` Edge Function every minute; the function finds sessions starting within each user's lead time and sends Web Push messages. `public/push-sw.js` shows them and opens the right room when tapped.

One-time setup:

1. Run [004_reminders.sql](supabase/migrations/004_reminders.sql) and [005_service_role_grants.sql](supabase/migrations/005_service_role_grants.sql) in the SQL Editor.
2. Generate keys (already done once; the private ones live in `supabase/functions/.env.reminders`, which git ignores). The public key is in `src/lib/pushConfig.ts`. To regenerate: `npx web-push generate-vapid-keys` and update both places.
3. Set the function secrets: `npx supabase secrets set --env-file supabase/functions/.env.reminders --remote <ref> --yes`
4. Deploy: `npx supabase functions deploy send-reminders --no-verify-jwt --use-api --remote=<ref>`
5. Schedule it: paste `supabase/reminders-cron.local.sql` (generated, git-ignored; template in `supabase/reminders-cron.template.sql`) into the SQL Editor.

## Analytics (optional)

Create a free project at https://posthog.com, then set `VITE_POSTHOG_KEY` (and `VITE_POSTHOG_HOST` if you're on the EU region). With no key, analytics is off. It only records a few named events (`task_added`, `focus_session_saved`, `buddy_adopted`, ...) with numbers and fixed labels: no autocapture, no recordings, no emails, no task names. Use PostHog's **Retention** insight on `app_opened` to see if people come back.

To regenerate the app icons after changing `public/favicon.svg`: `node scripts/make-icons.mjs`.

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
