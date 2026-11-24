import { useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../../lib/store'
import { CATEGORIES, categoryInfo, type Category, type Task } from '../../lib/types'
import { addDays, atMinutes, dateKey, fmtDuration, fmtTime, startOfDay } from '../../lib/time'
import { roomLink } from '../../components/roomLink'
import { Icon } from '../../components/Icon'

const DURATIONS = [10, 15, 30, 45, 60, 90, 120, 180, 240, 300]

type Group = { key: string; title: string; tasks: Task[] }

function groupTasks(tasks: Task[], now: Date): Group[] {
  const today = dateKey(now)
  const tomorrow = dateKey(addDays(now, 1))
  const weekEnd = addDays(startOfDay(now), 7).getTime()
  const groups: Group[] = [
    { key: 'overdue', title: 'Overdue', tasks: [] },
    { key: 'today', title: 'Due today', tasks: [] },
    { key: 'tomorrow', title: 'Due tomorrow', tasks: [] },
    { key: 'week', title: 'This week', tasks: [] },
    { key: 'later', title: 'Later', tasks: [] },
  ]
  for (const t of tasks) {
    const due = new Date(t.due_at)
    const k = dateKey(due)
    const g = due < now ? 0 : k === today ? 1 : k === tomorrow ? 2 : due.getTime() < weekEnd ? 3 : 4
    groups[g].tasks.push(t)
  }
  return groups.filter((g) => g.tasks.length)
}

function dueLabel(due: Date, now: Date): string {
  const k = dateKey(due)
  const time = fmtTime(due).replace(' ', '').toLowerCase()
  if (due < now) return `was due ${due.toLocaleDateString([], { weekday: 'short' })} ${time}`
  if (k === dateKey(now)) return `due ${time}`
  if (k === dateKey(addDays(now, 1))) return `due tomorrow ${time}`
  if (due.getTime() - now.getTime() < 7 * 86_400_000) return `due ${due.toLocaleDateString([], { weekday: 'long' })}`
  return `due ${due.toLocaleDateString([], { month: 'short', day: 'numeric' })}`
}

export function TodosPage() {
  const { state, actions } = useData()
  const [showDone, setShowDone] = useState(false)
  const now = new Date()
  const open = state.tasks
    .filter((t) => t.status === 'open')
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime() || b.priority - a.priority)
  const done = state.tasks
    .filter((t) => t.status === 'done')
    .sort((a, b) => new Date(b.completed_at ?? 0).getTime() - new Date(a.completed_at ?? 0).getTime())
  const leftMin = open.reduce((s, t) => s + Math.max(0, t.estimated_minutes - t.logged_minutes), 0)
  const groups = groupTasks(open, now)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">To-do</h1>
        <p className="mt-1 text-ink/60">
          {open.length === 0
            ? 'Your list is empty. Nice.'
            : `${open.length} thing${open.length === 1 ? '' : 's'} on your list · about ${fmtDuration(leftMin)} of work left`}
        </p>
      </div>

      <QuickAdd />

      {open.length === 0 && (
        <div className="flex flex-col items-center gap-1 py-10 text-center">
          <Icon name="sprout" className="h-9 w-9 text-sage" />
          <p className="font-hand text-3xl text-ink/60">nothing on the list right now</p>
          <p className="text-sm text-ink/45">Add a test, an essay, or a chore above and it'll find a spot in your week.</p>
        </div>
      )}

      {open.length > 0 && (
        <section className="card px-5 py-2 sm:px-6">
          {groups.map((g) => (
            <div key={g.key} className="pt-4">
              <h2 className={`font-display text-lg font-semibold ${g.key === 'overdue' ? 'text-accent-dark' : ''}`}>
                {g.title} <span className="text-sm font-bold text-ink/35">{g.tasks.length}</span>
              </h2>
              <ul>
                {g.tasks.map((t) => (
                  <TaskRow key={t.id} task={t} now={now} />
                ))}
              </ul>
            </div>
          ))}
          <div className="h-2" />
        </section>
      )}

      {done.length > 0 && (
        <section>
          <button className="flex items-center gap-1.5 text-sm font-extrabold text-ink/50 hover:text-ink" onClick={() => setShowDone(!showDone)}>
            <Icon name="arrow" className={`h-4 w-4 transition ${showDone ? 'rotate-90' : ''}`} />
            Finished ({done.length})
          </button>
          {showDone && (
            <ul className="mt-2 px-1">
              {done.map((t) => (
                <li key={t.id} className="group flex items-center gap-3 border-b border-dashed border-line py-2 text-sm">
                  <span className="grid h-5 w-5 place-items-center rounded-full text-paper" style={{ background: categoryInfo(t.category).color }}>
                    <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span className="flex-1 truncate text-ink/45 line-through decoration-ink/30">{t.title}</span>
                  <button className="text-xs font-bold text-ink/40 opacity-0 transition hover:text-ink group-hover:opacity-100 focus:opacity-100" onClick={() => actions.reopenTask(t.id)}>
                    put back
                  </button>
                  <button
                    className="text-ink/30 opacity-0 transition hover:text-accent-dark group-hover:opacity-100 focus:opacity-100"
                    onClick={() => actions.deleteTask(t.id)}
                    aria-label={`Delete ${t.title}`}
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

function TaskRow({ task: t, now }: { task: Task; now: Date }) {
  const { state, actions } = useData()
  const [leaving, setLeaving] = useState(false)
  const info = categoryInfo(t.category)
  const chunks = state.chunks
    .filter((c) => c.task_id === t.id && c.status === 'planned' && new Date(c.end_at) > now)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
  const next = chunks[0]
  const short = state.unfit[t.id]
  const left = Math.max(0, t.estimated_minutes - t.logged_minutes)
  const pct = Math.min(100, (t.logged_minutes / t.estimated_minutes) * 100)

  const nextLabel = next
    ? dateKey(new Date(next.start_at)) === dateKey(now)
      ? `next session ${fmtTime(new Date(next.start_at)).replace(' ', '').toLowerCase()}`
      : `next session ${new Date(next.start_at).toLocaleDateString([], { weekday: 'short' })} ${fmtTime(new Date(next.start_at)).replace(' ', '').toLowerCase()}`
    : null

  return (
    <li className={`group flex items-start gap-3 border-b border-dashed border-line py-3 last:border-0 transition ${leaving ? 'opacity-0' : ''}`}>
      <button
        onClick={() => {
          setLeaving(true)
          window.setTimeout(() => actions.completeTask(t.id), 250)
        }}
        className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 bg-paper text-transparent transition hover:bg-[var(--c)] hover:text-paper"
        style={{ borderColor: info.color, '--c': info.color } as CSSProperties}
        aria-label={`Mark ${t.title} done`}
        title="Mark done"
      >
        <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-bold">{t.title}</span>
          {t.priority === 3 && <Icon name="star" className="h-4 w-4 shrink-0 fill-mustard text-mustard" aria-label="Important" />}
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-1.5 text-[13px] text-ink/55 [&>span+span]:before:mr-1.5 [&>span+span]:before:text-ink/30 [&>span+span]:before:content-['·']">
          <span className="font-bold" style={{ color: info.color }}>{info.short}</span>
          <span>{left ? `${fmtDuration(left)} left` : 'all time logged'}</span>
          <span>{dueLabel(new Date(t.due_at), now)}</span>
          {nextLabel && <span className="hidden sm:inline">{nextLabel}</span>}
        </div>
        {t.logged_minutes > 0 && (
          <div className="mt-1.5 h-1 max-w-56 overflow-hidden rounded-full bg-ink/[.07]">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: info.color }} />
          </div>
        )}
        {short > 0 && (
          <p className="mt-1.5 text-[13px] font-semibold text-accent-dark">
            {fmtDuration(short)} of this won't fit before it's due. A later due date or a shorter estimate would help.
          </p>
        )}
      </div>

      <Link to={roomLink(t, next)} className="btn-ghost shrink-0 px-2.5 py-1.5 sm:px-3" aria-label={`Start ${t.title}`} title="Start">
        <Icon name="play" className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Start</span>
      </Link>
      <button
        className="mt-1.5 shrink-0 text-ink/30 transition hover:text-accent-dark sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
        onClick={() => actions.deleteTask(t.id)}
        aria-label={`Delete ${t.title}`}
        title="Delete"
      >
        <Icon name="trash" className="h-[18px] w-[18px]" />
      </button>
    </li>
  )
}

function QuickAdd() {
  const { actions } = useData()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('study')
  const [minutes, setMinutes] = useState(60)
  const [dueDay, setDueDay] = useState(() => dateKey(addDays(new Date(), 1)))
  const [dueTime, setDueTime] = useState('23:59')
  const [important, setImportant] = useState(false)
  const [open, setOpen] = useState(false)

  const today = dateKey(new Date())
  const tomorrow = dateKey(addDays(new Date(), 1))

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const [y, mo, d] = dueDay.split('-').map(Number)
    const [h, mi] = dueTime.split(':').map(Number)
    actions.addTask({
      title: title.trim(),
      category,
      estimated_minutes: minutes,
      due_at: atMinutes(new Date(y, mo - 1, d), h * 60 + mi).toISOString(),
      priority: important ? 3 : 2,
    })
    actions.toast('Added to your list and the calendar')
    setTitle('')
    setImportant(false)
  }

  const chip = (active: boolean) =>
    `rounded-lg px-2.5 py-1 text-[13px] font-bold transition ${active ? 'bg-ink text-paper' : 'bg-ink/[.05] text-ink/65 hover:bg-ink/10'}`

  return (
    <form onSubmit={submit} className="card p-2">
      <div className="flex items-center gap-2">
        <Icon name="plus" className="ml-2 h-5 w-5 shrink-0 text-ink/35" />
        <input
          aria-label="New to-do"
          className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-base font-semibold outline-none placeholder:font-normal placeholder:text-ink/40"
          placeholder="Add a to-do, like “study for chem test”"
          value={title}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setTitle(e.target.value)
            setOpen(true)
          }}
        />
        <button className="btn-primary shrink-0" disabled={!title.trim()}>Add</button>
      </div>

      {open && (
        <div className="anim-pop space-y-3 border-t-[1.5px] border-dashed border-line px-3 pb-2 pt-3">
          <Row label="Type">
            {CATEGORIES.map((c) => (
              <button
                type="button"
                key={c.key}
                onClick={() => {
                  setCategory(c.key)
                  if (c.key === 'chores' && minutes > 30) setMinutes(15)
                }}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[13px] font-bold transition"
                style={category === c.key ? { background: c.color, color: '#fffaf2' } : { background: c.soft, color: c.color }}
              >
                {c.short}
              </button>
            ))}
          </Row>
          <Row label="Takes about">
            <select aria-label="How long it takes" className="input w-auto py-1 text-[13px] font-bold" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
              {DURATIONS.map((m) => (
                <option key={m} value={m}>{fmtDuration(m)}</option>
              ))}
            </select>
          </Row>
          <Row label="Due">
            <button type="button" className={chip(dueDay === today)} onClick={() => setDueDay(today)}>Today</button>
            <button type="button" className={chip(dueDay === tomorrow)} onClick={() => setDueDay(tomorrow)}>Tomorrow</button>
            <input aria-label="Due date" type="date" className="input w-auto py-1 text-[13px] font-bold" value={dueDay} min={today} onChange={(e) => e.target.value && setDueDay(e.target.value)} />
            <input aria-label="Due time" type="time" className="input w-auto py-1 text-[13px] font-bold" value={dueTime} onChange={(e) => e.target.value && setDueTime(e.target.value)} />
          </Row>
          <Row label="">
            <button type="button" className={`flex items-center gap-1.5 ${chip(important)}`} onClick={() => setImportant(!important)} aria-pressed={important}>
              <Icon name="star" className={`h-4 w-4 ${important ? 'fill-mustard text-mustard' : ''}`} />
              Important
            </button>
            <span className="text-xs text-ink/45">Important things get scheduled first when two are due at the same time.</span>
          </Row>
        </div>
      )}
    </form>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-24 shrink-0 text-[13px] font-bold text-ink/50">{label}</span>
      {children}
    </div>
  )
}
