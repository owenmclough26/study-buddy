// Study Buddy: reads a user's calendar from its private iCal link and returns the busy times
// for the next couple of weeks, so the scheduler can plan homework around them.
//
// Called by signed-in users from the app (JWT verified by Supabase). Nothing is stored here.
// Deploy with: npx supabase functions deploy calendar-busy --use-api --remote=<ref>

import { busyTimes, type BusyEvent } from './parse.ts'

const ALLOWED_HOSTS = [
  'calendar.google.com', // Google Calendar "Secret address in iCal format"
  'outlook.office365.com', // Outlook / school Microsoft accounts
  'outlook.live.com',
]
const ALLOWED_HOST_SUFFIXES = ['.icloud.com'] // Apple iCloud public calendars (p01-caldav.icloud.com, ...)

const MAX_BYTES = 5_000_000

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

/** webcal:// links are just https:// links in disguise. Only known calendar hosts are allowed. */
function checkUrl(raw: string): URL | null {
  try {
    const u = new URL(raw.trim().replace(/^webcals?:\/\//i, 'https://'))
    if (u.protocol !== 'https:') return null
    const host = u.hostname.toLowerCase()
    if (ALLOWED_HOSTS.includes(host) || ALLOWED_HOST_SUFFIXES.some((s) => host.endsWith(s))) return u
    return null
  } catch {
    return null
  }
}

async function fetchCalendar(u: URL): Promise<string> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 10_000)
  try {
    const res = await fetch(u, { signal: ctrl.signal, headers: { Accept: 'text/calendar' }, redirect: 'follow' })
    if (res.status === 404 || res.status === 403 || res.status === 401) throw new Error('That link didn’t work. Copy the secret iCal address again (it may have been reset).')
    if (!res.ok) throw new Error(`The calendar server answered ${res.status}. Try again later.`)
    const text = await res.text()
    if (text.length > MAX_BYTES) throw new Error('That calendar is too big to read.')
    if (!text.includes('BEGIN:VCALENDAR')) throw new Error('That link isn’t an iCal calendar. Use the “Secret address in iCal format”.')
    return text
  } finally {
    clearTimeout(timer)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  let body: { urls?: unknown; days?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad request' }, 400)
  }
  const urls = Array.isArray(body.urls) ? body.urls.filter((u): u is string => typeof u === 'string').slice(0, 5) : []
  const days = Math.min(31, Math.max(1, Number(body.days) || 15))
  const from = new Date(Date.now() - 12 * 3600_000)
  const to = new Date(Date.now() + days * 24 * 3600_000)

  const events: BusyEvent[] = []
  const errors: { calendar: number; error: string }[] = []
  await Promise.all(
    urls.map(async (raw, i) => {
      const u = checkUrl(raw)
      if (!u) return errors.push({ calendar: i, error: 'Only Google, Outlook, or iCloud calendar links are supported.' })
      try {
        events.push(...busyTimes(await fetchCalendar(u), from, to, i))
      } catch (e) {
        errors.push({ calendar: i, error: e instanceof Error ? e.message : 'Couldn’t read that calendar.' })
      }
    }),
  )
  return json({ events: events.sort((a, b) => a.start.localeCompare(b.start)), errors })
})
