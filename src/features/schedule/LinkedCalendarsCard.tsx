import { useState, type FormEvent } from 'react'
import { useData } from '../../lib/store'
import { checkCalendarLink } from '../../lib/calendars'
import { Icon } from '../../components/Icon'

export function LinkedCalendarsCard() {
  const { state, actions, mode } = useData()
  const [adding, setAdding] = useState(false)
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const cals = state.calendars
  const showForm = adding || cals.length === 0

  function submit(e: FormEvent) {
    e.preventDefault()
    const check = checkCalendarLink(url)
    if (!check.ok) return setErr(check.reason)
    setErr(null)
    actions.addCalendar(url, label)
    setUrl('')
    setLabel('')
    setAdding(false)
  }

  const countFor = (id: string) => state.busy.filter((b) => b.calendarId === id).length

  return (
    <section className="card p-5">
      <div className="mb-1 flex items-center gap-2">
        <Icon name="calendar" className="h-5 w-5 text-accent" />
        <h2 className="font-display text-xl font-semibold">Google Calendar</h2>
        {cals.length > 0 && <span className="rounded-md bg-sage-soft px-1.5 text-xs font-extrabold text-ink/70">linked</span>}
      </div>
      <p className="mb-4 text-sm text-ink/55">Practice, work, appointments: homework gets planned around everything on your Google Calendar.</p>

      {mode === 'local' ? (
        <p className="rounded-xl bg-mustard-soft p-3 text-sm">Linking a calendar needs an account. Sign in to use it.</p>
      ) : (
        <>
          {cals.length > 0 && (
            <ul className="mb-4 space-y-2">
              {cals.map((c) => {
                const error = state.calendarErrors[c.id]
                return (
                  <li key={c.id} className="flex items-center gap-3 rounded-xl bg-ink/[.03] p-3">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${error ? 'bg-accent' : 'bg-sage'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold">{c.label || 'My calendar'}</div>
                      <div className={`text-xs ${error ? 'font-semibold text-accent-dark' : 'text-ink/50'}`}>
                        {state.calendarsSyncing ? 'Checking…' : error ? error : `${countFor(c.id)} event${countFor(c.id) === 1 ? '' : 's'} in the next 2 weeks`}
                      </div>
                    </div>
                    <button className="btn-danger px-2.5 py-1 text-xs" onClick={() => actions.removeCalendar(c.id)}>
                      Unlink
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {cals.length > 0 && !adding && (
            <div className="flex flex-wrap gap-2">
              <button className="btn-ghost" onClick={() => void actions.refreshCalendars()} disabled={state.calendarsSyncing}>
                {state.calendarsSyncing ? 'Checking…' : 'Check again now'}
              </button>
              <button className="btn-ghost" onClick={() => setAdding(true)}>
                <Icon name="plus" className="h-4 w-4" />
                Link another calendar
              </button>
            </div>
          )}

          {showForm && (
            <form onSubmit={submit} className="space-y-4 rounded-2xl bg-ink/[.03] p-4">
              <ol className="space-y-2 text-sm">
                {[
                  <>
                    On a <b>computer</b>, open{' '}
                    <a href="https://calendar.google.com/calendar/r/settings" target="_blank" rel="noreferrer" className="font-bold text-accent underline">
                      Google Calendar settings
                    </a>
                    . (The phone app doesn’t show this link.)
                  </>,
                  <>
                    On the left, under <b>Settings for my calendars</b>, click your calendar.
                  </>,
                  <>
                    Scroll down to <b>Integrate calendar</b> and copy <b>Secret address in iCal format</b>.
                  </>,
                  <>Paste it below.</>,
                ].map((step, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-extrabold text-paper">{i + 1}</span>
                    <span className="pt-0.5 text-ink/75">{step}</span>
                  </li>
                ))}
              </ol>

              <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                <div>
                  <label className="label" htmlFor="cal-url">
                    Secret address in iCal format
                  </label>
                  <input
                    id="cal-url"
                    className="input font-mono text-xs"
                    placeholder="https://calendar.google.com/calendar/ical/…/private-…/basic.ics"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="cal-label">
                    Name (optional)
                  </label>
                  <input id="cal-label" className="input" placeholder="e.g. Soccer, Work" value={label} maxLength={30} onChange={(e) => setLabel(e.target.value)} />
                </div>
              </div>

              {err && <p className="text-sm font-semibold text-accent-dark">{err}</p>}

              <div className="flex flex-wrap items-center gap-2">
                <button className="btn-primary">Link calendar</button>
                {cals.length > 0 && (
                  <button type="button" className="btn-ghost" onClick={() => setAdding(false)}>
                    Cancel
                  </button>
                )}
              </div>

              <p className="text-xs text-ink/45">
                Keep this link private: anyone who has it can see your calendar. Only your account can read it here, and Study Buddy only uses it to see when you’re busy.
                All-day events and events marked “free” don’t block study time. Also works with Outlook and iCloud links.
              </p>
            </form>
          )}
        </>
      )}
    </section>
  )
}
