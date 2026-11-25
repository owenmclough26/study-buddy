import ICAL from 'npm:ical.js@2.2.1'

const MAX_OCCURRENCES = 400

export interface BusyEvent {
  start: string
  end: string
  title: string
  calendar: number
}

/** Every timed event (including repeats) overlapping [from, to]. All-day and "free" events are skipped. */
export function busyTimes(ics: string, from: Date, to: Date, calendar: number): BusyEvent[] {
  const root = new ICAL.Component(ICAL.parse(ics))
  for (const tz of root.getAllSubcomponents('vtimezone')) ICAL.TimezoneService.register(tz)

  const out: BusyEvent[] = []
  const fromT = ICAL.Time.fromJSDate(from, true)
  const vevents = root.getAllSubcomponents('vevent')
  // overridden single occurrences of a repeating event (moved/cancelled instances)
  const exceptions = vevents.filter((v) => v.hasProperty('recurrence-id'))

  for (const v of vevents) {
    if (v.hasProperty('recurrence-id')) continue
    const ev = new ICAL.Event(v, { strictExceptions: true, exceptions: exceptions.filter((x) => x.getFirstPropertyValue('uid') === v.getFirstPropertyValue('uid')) })
    if (ev.startDate?.isDate) continue // all-day
    if (String(v.getFirstPropertyValue('transp') ?? '').toUpperCase() === 'TRANSPARENT') continue // shown as "free"
    if (String(v.getFirstPropertyValue('status') ?? '').toUpperCase() === 'CANCELLED') continue
    const title = ev.summary || 'Busy'

    if (!ev.isRecurring()) {
      const s = ev.startDate.toJSDate()
      const e = (ev.endDate ?? ev.startDate).toJSDate()
      if (e > from && s < to) out.push({ start: s.toISOString(), end: e.toISOString(), title, calendar })
      continue
    }

    const it = ev.iterator()
    let next: ICAL.Time | null
    let n = 0
    while ((next = it.next()) && n++ < MAX_OCCURRENCES * 4) {
      if (next.compare(fromT) < 0 && next.toJSDate() < new Date(from.getTime() - 24 * 3600_000)) continue
      const occ = ev.getOccurrenceDetails(next)
      const s = occ.startDate.toJSDate()
      if (s >= to) break
      const e = occ.endDate.toJSDate()
      const st = String(occ.item.component.getFirstPropertyValue('status') ?? '').toUpperCase()
      if (e > from && st !== 'CANCELLED') out.push({ start: s.toISOString(), end: e.toISOString(), title: occ.item.summary || title, calendar })
      if (out.length > MAX_OCCURRENCES) break
    }
  }
  return out.sort((a, b) => a.start.localeCompare(b.start))
}

