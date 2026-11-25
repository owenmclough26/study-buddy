// Run: npx deno@2 test --config supabase/functions/calendar-busy/deno.json supabase/functions/calendar-busy/parse.test.ts
import { busyTimes } from './parse.ts'

const eq = (a: unknown, b: unknown, msg: string) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg}\n  expected ${JSON.stringify(b)}\n  got      ${JSON.stringify(a)}`)
}

// Shaped like a Google Calendar export: a time zone, a weekly repeat with one moved and one
// skipped instance, an all-day event, a "free" event, and a one-off event.
const ICS = `BEGIN:VCALENDAR
PRODID:-//Google Inc//Google Calendar 70.9054//EN
VERSION:2.0
BEGIN:VTIMEZONE
TZID:America/New_York
BEGIN:DAYLIGHT
TZOFFSETFROM:-0500
TZOFFSETTO:-0400
TZNAME:EDT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0400
TZOFFSETTO:-0500
TZNAME:EST
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:soccer@test
DTSTART;TZID=America/New_York:20261102T160000
DTEND;TZID=America/New_York:20261102T180000
RRULE:FREQ=WEEKLY;BYDAY=MO,WE
EXDATE;TZID=America/New_York:20261125T160000
SUMMARY:Soccer practice
END:VEVENT
BEGIN:VEVENT
UID:soccer@test
RECURRENCE-ID;TZID=America/New_York:20261123T160000
DTSTART;TZID=America/New_York:20261123T170000
DTEND;TZID=America/New_York:20261123T190000
SUMMARY:Soccer practice (late)
END:VEVENT
BEGIN:VEVENT
UID:bday@test
DTSTART;VALUE=DATE:20261124
DTEND;VALUE=DATE:20261125
SUMMARY:Mom's birthday
END:VEVENT
BEGIN:VEVENT
UID:free@test
DTSTART:20261124T180000Z
DTEND:20261124T190000Z
TRANSP:TRANSPARENT
SUMMARY:Reminder to call grandma
END:VEVENT
BEGIN:VEVENT
UID:dentist@test
DTSTART:20261124T190000Z
DTEND:20261124T200000Z
SUMMARY:Dentist
END:VEVENT
END:VCALENDAR`

Deno.test('reads repeats, moved and skipped instances, and skips all-day and free events', () => {
  const ev = busyTimes(ICS, new Date('2026-11-22T00:00:00Z'), new Date('2026-12-06T00:00:00Z'), 0)
  eq(
    ev.map((e) => [e.title, e.start, e.end]),
    [
      ['Soccer practice (late)', '2026-11-23T22:00:00.000Z', '2026-11-24T00:00:00.000Z'], // moved to 5-7pm EST
      ['Dentist', '2026-11-24T19:00:00.000Z', '2026-11-24T20:00:00.000Z'],
      // Wed 11/25 skipped (EXDATE)
      ['Soccer practice', '2026-11-30T21:00:00.000Z', '2026-11-30T23:00:00.000Z'],
      ['Soccer practice', '2026-12-02T21:00:00.000Z', '2026-12-02T23:00:00.000Z'],
    ],
    'busy times',
  )
})

Deno.test('only returns events inside the window', () => {
  const ev = busyTimes(ICS, new Date('2026-12-01T00:00:00Z'), new Date('2026-12-03T00:00:00Z'), 2)
  eq(ev.length, 1, 'one practice in the window')
  eq(ev[0].calendar, 2, 'keeps which calendar it came from')
})
