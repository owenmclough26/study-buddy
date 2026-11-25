import { useEffect, useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../../lib/store'
import { categoryInfo, type Chunk } from '../../lib/types'
import { addDays, atMinutes, dateKey, fmtDay, fmtTime, hmToMinutes, startOfWeek } from '../../lib/time'
import { roomLink } from '../../components/roomLink'
import { Icon } from '../../components/Icon'

const PX_PER_MIN = 0.9
const SNAP = 15

export function CalendarPage() {
  const { state, actions } = useData()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [selected, setSelected] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(t)
  }, [])

  const p = state.profile!
  const dayStart = Math.max(0, Math.floor(hmToMinutes(p.wake_time) / 60) * 60 - 60)
  const dayEnd = Math.min(24 * 60, Math.ceil(hmToMinutes(p.sleep_time) / 60) * 60)
  const height = (dayEnd - dayStart) * PX_PER_MIN
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const tasksById = new Map(state.tasks.map((t) => [t.id, t]))
  const sel = state.chunks.find((c) => c.id === selected) ?? null
  const selTask = sel ? tasksById.get(sel.task_id) : undefined

  const top = (d: Date) => (d.getHours() * 60 + d.getMinutes() - dayStart) * PX_PER_MIN

  function onDrop(e: DragEvent<HTMLDivElement>, day: Date) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/chunk')
    const grabOffset = Number(e.dataTransfer.getData('text/offset') || 0)
    if (!id) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top - grabOffset
    const minutes = Math.round((dayStart + y / PX_PER_MIN) / SNAP) * SNAP
    const start = atMinutes(day, Math.max(dayStart, minutes))
    if (start.getTime() < Date.now() - 5 * 60_000) return actions.toast("Can't move work into the past")
    actions.moveChunk(id, start)
    actions.toast('Pinned. The rest of your plan moved around it.')
  }

  const hours: number[] = []
  for (let m = dayStart; m < dayEnd; m += 60) hours.push(m)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto font-display text-3xl font-semibold tracking-tight sm:text-4xl">Calendar</h1>
        <button className="btn-ghost" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week"><Icon name="back" className="h-4 w-4" /></button>
        <button className="btn-ghost" onClick={() => setWeekStart(startOfWeek(new Date()))}>This week</button>
        <button className="btn-ghost" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week"><Icon name="arrow" className="h-4 w-4" /></button>
        <span className="text-sm font-bold text-ink/50">
          {fmtDay(days[0])} – {fmtDay(days[6])}
        </span>
      </div>

      {state.blocks.length === 0 && (
        <p className="rounded-xl bg-accent-soft/60 p-3 text-sm text-accent-dark">
          Your school schedule is empty. <Link className="font-bold underline" to="/settings">Add your classes</Link> so to-dos get planned around them.
        </p>
      )}

      <div className="card overflow-x-auto">
        <div className="grid min-w-[760px]" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
          <div />
          {days.map((d) => {
            const isToday = dateKey(d) === dateKey(now)
            return (
              <div key={d.toISOString()} className={`border-b border-l border-ink/5 px-2 py-2 text-center text-sm font-bold ${isToday ? 'text-accent-dark' : 'text-ink/60'}`}>
                {d.toLocaleDateString([], { weekday: 'short' })}{' '}
                <span className={isToday ? 'rounded-full bg-accent px-1.5 text-white' : ''}>{d.getDate()}</span>
              </div>
            )
          })}

          <div className="relative" style={{ height }}>
            {hours.map((m) => (
              <div key={m} className="absolute right-1.5 -translate-y-1/2 text-[11px] font-semibold text-ink/35" style={{ top: (m - dayStart) * PX_PER_MIN }}>
                {m > dayStart && fmtTime(atMinutes(new Date(), m)).replace(':00', '')}
              </div>
            ))}
          </div>

          {days.map((day) => {
            const key = dateKey(day)
            const blocks = state.blocks.filter((b) => b.weekday === day.getDay())
            const chunks = state.chunks.filter((c) => c.status !== 'missed' && dateKey(new Date(c.start_at)) === key)
            const isToday = key === dateKey(now)
            const noWork = (hmToMinutes(p.no_work_after) - dayStart) * PX_PER_MIN
            return (
              <div
                key={key}
                className={`relative border-l border-ink/5 ${isToday ? 'bg-accent-soft/30' : ''}`}
                style={{ height }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, day)}
              >
                {hours.map((m) => (
                  <div key={m} className="absolute inset-x-0 border-t border-ink/[.04]" style={{ top: (m - dayStart) * PX_PER_MIN }} />
                ))}
                {noWork < height && (
                  <div className="absolute inset-x-0 bottom-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(0,0,0,.03)_6px,rgba(0,0,0,.03)_12px)]" style={{ top: noWork }} />
                )}
                {blocks.map((b) => {
                  const s = hmToMinutes(b.start_time)
                  const e = hmToMinutes(b.end_time)
                  return (
                    <div
                      key={b.id}
                      className="absolute inset-x-1 overflow-hidden rounded-lg px-1.5 py-1 text-[11px] leading-tight"
                      style={{ top: (s - dayStart) * PX_PER_MIN, height: (e - s) * PX_PER_MIN - 2, background: b.color + '26', borderLeft: `3px solid ${b.color}` }}
                      title={`${b.title} (school, locked)`}
                    >
                      <div className="truncate font-bold text-ink/70">{b.title}</div>
                      {b.location && <div className="truncate text-ink/45">{b.location}</div>}
                    </div>
                  )
                })}
                {/* events from linked Google calendars */}
                {state.busy
                  .filter((ev) => dateKey(new Date(ev.start)) === key)
                  .map((ev, i) => {
                    const s = new Date(ev.start)
                    const e = new Date(ev.end)
                    const sMin = Math.max(dayStart, s.getHours() * 60 + s.getMinutes())
                    const eMin = Math.min(dayEnd, dateKey(e) === key ? e.getHours() * 60 + e.getMinutes() : dayEnd)
                    if (eMin <= sMin) return null
                    return (
                      <div
                        key={`busy-${i}-${ev.start}`}
                        className="absolute inset-x-1 overflow-hidden rounded-lg border-[1.5px] border-dashed border-ink/25 bg-[repeating-linear-gradient(135deg,rgb(47_38_34/.05)_0_6px,rgb(47_38_34/.09)_6px_12px)] px-1.5 py-1 text-[11px] leading-tight"
                        style={{ top: (sMin - dayStart) * PX_PER_MIN, height: Math.max((eMin - sMin) * PX_PER_MIN - 2, 14) }}
                        title={`${ev.title} (from your linked calendar)`}
                      >
                        <div className="truncate font-bold text-ink/65">{ev.title}</div>
                        {(eMin - sMin) * PX_PER_MIN > 30 && (
                          <div className="truncate text-ink/45">
                            {fmtTime(s)} – {fmtTime(e)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                {chunks.map((c) => (
                  <ChunkBlock key={c.id} chunk={c} top={top(new Date(c.start_at))} selected={selected === c.id} onSelect={() => setSelected(selected === c.id ? null : c.id)} />
                ))}
                {isToday && now.getHours() * 60 + now.getMinutes() >= dayStart && (
                  <div className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-accent" style={{ top: top(now) }}>
                    <span className="absolute -left-1 -top-1.5 h-3 w-3 rounded-full bg-accent" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-xs text-ink/45">
        Drag a session to move it. Moved sessions stay pinned where you put them, and the rest of your plan works around them. The faded blocks are your classes, and dashed ones come from your linked Google Calendar.
      </p>

      {sel && selTask && (
        <div className="anim-pop fixed bottom-6 right-6 z-40 w-80 card p-4 shadow-xl">
          <div className="flex items-start gap-2">
            <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ background: categoryInfo(selTask.category).color }} />
            <div className="min-w-0 flex-1">
              <div className="font-display text-lg font-semibold">{selTask.title}</div>
              <div className="text-xs text-ink/50">
                {fmtDay(new Date(sel.start_at))}, {fmtTime(new Date(sel.start_at))} – {fmtTime(new Date(sel.end_at))}
                {sel.pinned && ' · pinned'}
                {sel.status === 'done' && ' · done'}
              </div>
            </div>
            <button className="text-ink/40 hover:text-black" onClick={() => setSelected(null)} aria-label="Close"><Icon name="close" className="h-4 w-4" /></button>
          </div>
          {sel.status === 'planned' && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to={roomLink(selTask, sel)} className="btn-primary">Start</Link>
              {sel.pinned && <button className="btn-ghost" onClick={() => actions.unpinChunk(sel.id)}>Unpin</button>}
              <button className="btn-ghost" onClick={() => { actions.markChunkMissed(sel.id); setSelected(null) }}>Skip (reschedule)</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ChunkBlock({ chunk: c, top, selected, onSelect }: { chunk: Chunk; top: number; selected: boolean; onSelect: () => void }) {
  const { state } = useData()
  const t = state.tasks.find((x) => x.id === c.task_id)
  if (!t) return null
  const info = categoryInfo(t.category)
  const s = new Date(c.start_at)
  const e = new Date(c.end_at)
  const h = ((e.getTime() - s.getTime()) / 60_000) * PX_PER_MIN - 2
  const done = c.status === 'done'
  const draggable = c.status === 'planned' && e.getTime() > Date.now()
  return (
    <button
      draggable={draggable}
      onDragStart={(ev) => {
        ev.dataTransfer.setData('text/chunk', c.id)
        ev.dataTransfer.setData('text/offset', String(ev.clientY - ev.currentTarget.getBoundingClientRect().top))
        ev.dataTransfer.effectAllowed = 'move'
      }}
      onClick={onSelect}
      className={`absolute inset-x-1 z-[5] overflow-hidden rounded-lg px-1.5 py-1 text-left text-[11px] leading-tight text-white shadow-sm transition ${
        draggable ? 'cursor-grab active:cursor-grabbing' : ''
      } ${selected ? 'ring-2 ring-ink ring-offset-1' : ''} ${done ? 'opacity-45' : 'hover:brightness-110'}`}
      style={{ top, height: Math.max(h, 16), background: info.color }}
      title={`${t.title}: ${fmtTime(s)} – ${fmtTime(e)}`}
    >
      <div className="truncate font-bold">
        {done ? '✓ ' : ''}{c.pinned && !done && <Icon name="pin" className="mr-0.5 inline h-3 w-3" strokeWidth={2.4} />}
        {t.title}
      </div>
      {h > 30 && <div className="truncate opacity-85">{fmtTime(s)} – {fmtTime(e)}</div>}
    </button>
  )
}
