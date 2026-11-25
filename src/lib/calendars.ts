import { supabase } from './repo'
import type { BusyEvent, LinkedCalendar } from './types'

/** Same rule as the server: only real calendar hosts. */
export function checkCalendarLink(raw: string): { ok: true } | { ok: false; reason: string } {
  const text = raw.trim()
  if (!text) return { ok: false, reason: 'Paste the link first.' }
  let u: URL
  try {
    u = new URL(text.replace(/^webcals?:\/\//i, 'https://'))
  } catch {
    return { ok: false, reason: 'That doesn’t look like a link. It should start with https://' }
  }
  const host = u.hostname.toLowerCase()
  const known = host === 'calendar.google.com' || host === 'outlook.office365.com' || host === 'outlook.live.com' || host.endsWith('.icloud.com')
  if (!known) return { ok: false, reason: 'Use the private link from Google Calendar (or Outlook / iCloud).' }
  if (host === 'calendar.google.com' && !u.pathname.endsWith('.ics')) {
    return { ok: false, reason: 'That’s the calendar page, not the iCal link. Copy “Secret address in iCal format” (it ends in .ics).' }
  }
  if (host === 'calendar.google.com' && u.pathname.includes('/public/')) {
    return { ok: false, reason: 'That’s the public address. Use the “Secret address in iCal format” instead, so private events show as busy too.' }
  }
  return { ok: true }
}

/** Busy times for the next ~2 weeks from every linked calendar, plus per-calendar errors. */
export async function fetchBusy(calendars: LinkedCalendar[]): Promise<{ events: BusyEvent[]; errors: Record<string, string> }> {
  if (!supabase) return { events: [], errors: {} }
  const { data, error } = await supabase.functions.invoke('calendar-busy', { body: { urls: calendars.map((c) => c.url), days: 15 } })
  if (error) throw new Error('Couldn’t reach your calendar right now. We’ll try again soon.')
  const res = data as { events: { start: string; end: string; title: string; calendar: number }[]; errors: { calendar: number; error: string }[] }
  return {
    events: res.events.map((e) => ({ start: e.start, end: e.end, title: e.title, calendarId: calendars[e.calendar]?.id ?? '' })),
    errors: Object.fromEntries(res.errors.map((e) => [calendars[e.calendar]?.id ?? '', e.error])),
  }
}
