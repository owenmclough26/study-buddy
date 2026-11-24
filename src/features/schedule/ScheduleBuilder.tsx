import { useState, type FormEvent } from 'react'
import { useData } from '../../lib/store'
import { fmtHm12, hmToMinutes, WEEKDAY_ORDER, WEEKDAYS } from '../../lib/time'

const COLORS = ['#8a8178', '#c4553f', '#d9853b', '#d2a63a', '#6c9461', '#4f9a96', '#3f86ad', '#6f63a6', '#b8607e']

export function ScheduleBuilder() {
  const { state, actions } = useData()
  const [day, setDay] = useState(1)
  const [title, setTitle] = useState('')
  const [start, setStart] = useState('08:00')
  const [end, setEnd] = useState('09:00')
  const [location, setLocation] = useState('')
  const [color, setColor] = useState(COLORS[6])
  const [err, setErr] = useState<string | null>(null)
  const [copyTo, setCopyTo] = useState<number[]>([])

  const blocks = state.blocks
    .filter((b) => b.weekday === day)
    .sort((a, b) => hmToMinutes(a.start_time) - hmToMinutes(b.start_time))

  function add(e: FormEvent) {
    e.preventDefault()
    if (hmToMinutes(end) <= hmToMinutes(start)) return setErr('End time must be after start time.')
    const overlap = blocks.find((b) => hmToMinutes(start) < hmToMinutes(b.end_time) && hmToMinutes(end) > hmToMinutes(b.start_time))
    if (overlap) return setErr(`Overlaps with ${overlap.title}.`)
    setErr(null)
    actions.addBlock({ weekday: day, title: title.trim() || 'Class', start_time: start, end_time: end, location: location.trim() || null, color })
    setTitle('')
    setLocation('')
    setStart(end)
    setEnd(minutesLater(end, hmToMinutes(end) - hmToMinutes(start)))
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1">
        {WEEKDAY_ORDER.map((wd) => {
          const count = state.blocks.filter((b) => b.weekday === wd).length
          return (
            <button
              key={wd}
              onClick={() => setDay(wd)}
              className={`rounded-xl px-3 py-1.5 text-sm font-bold ${day === wd ? 'bg-accent text-white' : 'bg-ink/5 hover:bg-ink/10'}`}
            >
              {WEEKDAYS[wd].slice(0, 3)}
              {count > 0 && <span className="ml-1 opacity-60">· {count}</span>}
            </button>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <h3 className="mb-2 font-display text-lg font-semibold">{WEEKDAYS[day]}</h3>
          {blocks.length === 0 ? (
            <p className="rounded-xl border-2 border-dashed border-ink/10 p-6 text-center text-sm text-ink/40">
              No classes on {WEEKDAYS[day]} yet. Add your first block →
            </p>
          ) : (
            <ul className="space-y-2">
              {blocks.map((b) => (
                <li key={b.id} className="flex items-center gap-3 rounded-xl bg-ink/[.03] p-2.5">
                  <span className="h-9 w-1.5 rounded-full" style={{ background: b.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{b.title}</div>
                    <div className="text-xs text-ink/50">
                      {fmtHm12(b.start_time)} – {fmtHm12(b.end_time)}
                      {b.location && ` · ${b.location}`}
                    </div>
                  </div>
                  <button className="btn-danger px-2.5 py-1 text-xs" onClick={() => actions.deleteBlock(b.id)} aria-label={`Delete ${b.title}`}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          {blocks.length > 0 && (
            <div className="mt-4 rounded-xl bg-accent-soft/60 p-3">
              <div className="mb-2 text-sm font-bold text-accent-dark">Copy {WEEKDAYS[day]} to…</div>
              <div className="flex flex-wrap items-center gap-2">
                {WEEKDAY_ORDER.filter((wd) => wd !== day).map((wd) => (
                  <label key={wd} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={copyTo.includes(wd)}
                      onChange={(e) => setCopyTo(e.target.checked ? [...copyTo, wd] : copyTo.filter((x) => x !== wd))}
                    />
                    {WEEKDAYS[wd].slice(0, 3)}
                  </label>
                ))}
                <button
                  className="btn-primary ml-auto px-3 py-1 text-xs"
                  disabled={!copyTo.length}
                  onClick={() => {
                    actions.copyDay(day, copyTo)
                    actions.toast(`Copied to ${copyTo.map((d) => WEEKDAYS[d].slice(0, 3)).join(', ')}`)
                    setCopyTo([])
                  }}
                >
                  Copy (replaces those days)
                </button>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={add} className="space-y-3 rounded-2xl bg-ink/[.03] p-4">
          <h3 className="font-display text-lg font-semibold">Add a class or block</h3>
          <div>
            <label className="label" htmlFor="bt">Class / block</label>
            <input id="bt" className="input" placeholder="e.g. AP Bio, Lunch, Practice" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label" htmlFor="bs">Start</label>
              <input id="bs" type="time" className="input" required value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="be">End</label>
              <input id="be" type="time" className="input" required value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="bl">Room (optional)</label>
            <input id="bl" className="input" placeholder="e.g. 204" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div>
            <span className="label">Color</span>
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  aria-label={`Color ${c}`}
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full ring-offset-2 ${color === c ? 'ring-2 ring-ink' : ''}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          {err && <p className="text-sm font-semibold text-accent-dark">{err}</p>}
          <button className="btn-primary w-full">Add to {WEEKDAYS[day]}</button>
        </form>
      </div>
    </div>
  )
}

function minutesLater(hm: string, add: number): string {
  const m = Math.min(23 * 60 + 59, hmToMinutes(hm) + Math.max(add, 30))
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}
