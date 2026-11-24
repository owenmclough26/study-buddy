// Study Buddy: sends push reminders. Called every minute by a Supabase cron job.
//
// 1. "Chem review in 10 min": for every planned session starting within each user's lead time.
// 2. "Tomorrow: 3 sessions": once a day at 8pm in the user's own time zone.
//
// Secrets (Dashboard -> Edge Functions -> Secrets): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, CRON_SECRET.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.
// Deploy with: npx supabase functions deploy send-reminders --no-verify-jwt

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://study-buddy-tau-amber.vercel.app'
const ROOM_NAMES: Record<string, string> = {
  study: 'Study Room',
  homework: 'Homework Room',
  reading: 'Reading Nook',
  chores: 'kitchen',
}

type Profile = { id: string; remind_minutes_before: number | null; nightly_summary: boolean | null; timezone: string | null; last_summary_date: string | null }
type Sub = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string }
type TaskRef = { title: string; category: string; status: string } | null
type ChunkRow = { id: string; user_id: string; task_id: string; start_at: string; tasks: TaskRef }

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** Local calendar date and hour for a moment in someone's time zone. */
function localParts(d: Date, tz: string) {
  const safeTz = (() => {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: tz })
      return tz
    } catch {
      return 'UTC'
    }
  })()
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: safeTz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  )
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour), tz: safeTz }
}

const fmtTime = (d: Date, tz: string) => new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(d)

Deno.serve(async (req) => {
  const secret = Deno.env.get('CRON_SECRET')
  if (!secret || req.headers.get('x-cron-secret') !== secret) return json({ error: 'unauthorized' }, 401)

  webpush.setVapidDetails(SITE_URL, Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!)
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  const now = new Date()
  const stats = { sessions: 0, summaries: 0, deliveries: 0, removedDevices: 0 }

  const { data: profiles, error: pErr } = await db
    .from('profiles')
    .select('id, remind_minutes_before, nightly_summary, timezone, last_summary_date')
    .eq('reminders_enabled', true)
  if (pErr) return json({ error: pErr.message }, 500)
  if (!profiles?.length) return json(stats)

  const ids = profiles.map((p) => p.id)
  const profileById = new Map<string, Profile>(profiles.map((p) => [p.id, p as Profile]))
  const [{ data: subs }, { data: buddies }] = await Promise.all([
    db.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth').in('user_id', ids),
    db.from('buddies').select('user_id, name').in('user_id', ids),
  ])
  const subsByUser = new Map<string, Sub[]>()
  for (const s of (subs ?? []) as Sub[]) subsByUser.set(s.user_id, [...(subsByUser.get(s.user_id) ?? []), s])
  const buddyName = new Map<string, string>((buddies ?? []).map((b) => [b.user_id as string, b.name as string]))

  /** Send to every device the user turned reminders on for; forget devices that are gone. */
  async function notify(userId: string, payload: { title: string; body: string; url: string; tag: string }) {
    for (const s of subsByUser.get(userId) ?? []) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 600, urgency: 'high' })
        stats.deliveries++
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) {
          await db.from('push_subscriptions').delete().eq('id', s.id)
          stats.removedDevices++
        }
      }
    }
  }

  // 1. sessions starting soon
  const { data: chunks } = await db
    .from('scheduled_chunks')
    .select('id, user_id, task_id, start_at, tasks(title, category, status)')
    .eq('status', 'planned')
    .is('reminded_at', null)
    .in('user_id', ids)
    .gte('start_at', new Date(now.getTime() - 5 * 60_000).toISOString())
    .lte('start_at', new Date(now.getTime() + 125 * 60_000).toISOString())

  const due = ((chunks ?? []) as unknown as ChunkRow[]).filter((c) => {
    const lead = profileById.get(c.user_id)?.remind_minutes_before ?? 10
    return c.tasks?.status === 'open' && new Date(c.start_at).getTime() - now.getTime() <= lead * 60_000
  })

  for (const c of due) {
    const t = c.tasks!
    const mins = Math.max(0, Math.round((new Date(c.start_at).getTime() - now.getTime()) / 60_000))
    const name = buddyName.get(c.user_id) ?? 'Your buddy'
    await notify(c.user_id, {
      title: mins <= 1 ? `Time for ${t.title}` : `${t.title} in ${mins} min`,
      body: `${name} is waiting in the ${ROOM_NAMES[t.category] ?? 'study room'}. Tap to start.`,
      url: `/rooms/${t.category}?task=${c.task_id}&chunk=${c.id}`,
      tag: c.id,
    })
    stats.sessions++
  }
  if (due.length) {
    await db
      .from('scheduled_chunks')
      .update({ reminded_at: now.toISOString() })
      .in(
        'id',
        due.map((c) => c.id),
      )
  }

  // 2. evening heads-up at 8pm local time
  for (const p of profiles as Profile[]) {
    if (p.nightly_summary === false) continue
    const local = localParts(now, p.timezone ?? 'UTC')
    if (local.hour !== 20 || p.last_summary_date === local.date) continue

    const tomorrow = localParts(new Date(now.getTime() + 24 * 3600_000), local.tz).date
    const { data: upcoming } = await db
      .from('scheduled_chunks')
      .select('start_at, tasks(title, status)')
      .eq('user_id', p.id)
      .eq('status', 'planned')
      .gte('start_at', now.toISOString())
      .lte('start_at', new Date(now.getTime() + 40 * 3600_000).toISOString())
      .order('start_at')
    const tomorrows = ((upcoming ?? []) as unknown as { start_at: string; tasks: TaskRef }[]).filter(
      (c) => c.tasks?.status === 'open' && localParts(new Date(c.start_at), local.tz).date === tomorrow,
    )

    if (tomorrows.length) {
      const first = tomorrows[0]
      const name = buddyName.get(p.id) ?? 'Your buddy'
      await notify(p.id, {
        title: `Tomorrow: ${tomorrows.length} session${tomorrows.length === 1 ? '' : 's'} planned`,
        body: `First up: ${first.tasks!.title} at ${fmtTime(new Date(first.start_at), local.tz)}. ${name} will remind you.`,
        url: '/',
        tag: 'summary',
      })
      stats.summaries++
    }
    await db.from('profiles').update({ last_summary_date: local.date }).eq('id', p.id)
  }

  return json(stats)
})
