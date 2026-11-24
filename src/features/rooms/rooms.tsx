import { useState } from 'react'
import { useData } from '../../lib/store'
import type { Task } from '../../lib/types'
import { addDays, atMinutes, startOfDay } from '../../lib/time'
import { usePersisted } from '../../components/usePersisted'
import type { RoomTheme } from './RoomShell'

const Stars = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    {Array.from({ length: 40 }, (_, i) => (
      <span
        key={i}
        className="absolute rounded-full bg-paper"
        style={{
          left: `${(i * 37) % 100}%`,
          top: `${(i * 53) % 70}%`,
          width: (i % 3) + 1,
          height: (i % 3) + 1,
          opacity: 0.25 + (i % 5) * 0.12,
        }}
      />
    ))}
    <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-200/20 blur-3xl" />
  </div>
)

export const THEMES: Record<string, RoomTheme> = {
  study: {
    key: 'study',
    title: 'Study Room',
    tagline: 'Phone away. One thing at a time. Lock in.',
    icon: 'study',
    bg: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 55%, #4c1d95 100%)',
    dark: true,
    defaultGoal: 45,
    defaultSound: 'rain',
    pomodoro: true,
    decor: <Stars />,
  },
  homework: {
    key: 'homework',
    title: 'Homework & Writing',
    tagline: 'Break it into steps, then knock them out.',
    icon: 'homework',
    bg: '#f0f9ff linear-gradient(#0ea5e910 1px, transparent 1px) 0 0 / 100% 28px',
    dark: false,
    defaultGoal: 45,
    defaultSound: 'brown',
    pomodoro: true,
  },
  reading: {
    key: 'reading',
    title: 'Reading Nook',
    tagline: 'Cozy up. Turn the pages.',
    icon: 'reading',
    bg: 'linear-gradient(170deg, #451a03 0%, #78350f 60%, #92400e 100%)',
    dark: true,
    defaultGoal: 30,
    defaultSound: 'fire',
    decor: <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-orange-400/25 blur-3xl" />,
  },
  chores: {
    key: 'chores',
    title: 'Quick Tasks',
    tagline: 'Small stuff, fast. Check, check, check.',
    icon: 'chores',
    bg: 'linear-gradient(160deg, #f2f1e4 0%, #dde8d2 100%)',
    dark: false,
    defaultGoal: 15,
    defaultSound: 'off',
  },
}

/** Study room: a parking lot for stray thoughts, so they don't break your focus. */
export function StudyTools({ task }: { task: Task | null }) {
  const [notes, setNotes] = usePersisted(`studybuddy:park:${task?.id ?? 'free'}`, '')
  return (
    <div>
      <h3 className="font-display text-xl font-semibold">Parking lot</h3>
      <p className="mb-2 text-xs text-white/60">Random thought? Park it here and get back to work. Deal with it later.</p>
      <textarea
        aria-label="Distraction parking lot"
        className="h-40 w-full resize-none rounded-xl bg-white/10 p-3 text-sm text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-white/40"
        placeholder="text Sam back · look up that song · …"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <p className="mt-5 text-xs font-bold text-white/50">Before you start</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-white/75 marker:text-white/35">
        <li>Phone face-down, across the room</li>
        <li>Water nearby</li>
        <li>Only the tabs you need</li>
      </ul>
    </div>
  )
}

/** Homework room: break the assignment into steps, and an optional word-count goal. */
export function HomeworkTools({ task }: { task: Task | null }) {
  const key = task?.id ?? 'free'
  const [steps, setSteps] = usePersisted<{ text: string; done: boolean }[]>(`studybuddy:steps:${key}`, [])
  const [wordGoal, setWordGoal] = usePersisted(`studybuddy:wordgoal:${key}`, 0)
  const [words, setWords] = usePersisted(`studybuddy:words:${key}`, 0)
  const [draft, setDraft] = useState('')
  const doneCount = steps.filter((s) => s.done).length
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-xl font-semibold">Steps {steps.length > 0 && <span className="text-sm text-ink/45">({doneCount}/{steps.length})</span>}</h3>
        <ul className="mt-2 space-y-1">
          {steps.map((s, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={s.done}
                onChange={() => setSteps(steps.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))}
              />
              <span className={`flex-1 ${s.done ? 'text-ink/40 line-through' : ''}`}>{s.text}</span>
              <button className="text-xs text-ink/30 hover:text-accent-dark" onClick={() => setSteps(steps.filter((_, j) => j !== i))} aria-label="Remove step">✕</button>
            </li>
          ))}
        </ul>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (draft.trim()) setSteps([...steps, { text: draft.trim(), done: false }])
            setDraft('')
          }}
        >
          <input className="input" placeholder="e.g. Outline 3 main points" value={draft} onChange={(e) => setDraft(e.target.value)} />
          <button className="btn-primary">Add</button>
        </form>
      </div>
      <div>
        <h3 className="font-display text-xl font-semibold">Word count</h3>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <input aria-label="Current words" type="number" min={0} className="input w-24" value={words || ''} placeholder="0" onChange={(e) => setWords(Number(e.target.value))} />
          <span className="text-ink/45">of</span>
          <input aria-label="Word goal" type="number" min={0} className="input w-24" value={wordGoal || ''} placeholder="goal" onChange={(e) => setWordGoal(Number(e.target.value))} />
          <span className="text-ink/45">words</span>
        </div>
        {wordGoal > 0 && (
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink/[.06]">
            <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${Math.min(100, (words / wordGoal) * 100)}%` }} />
          </div>
        )}
      </div>
    </div>
  )
}

/** Reading room: page tracker. */
export function ReadingTools({ task }: { task: Task | null }) {
  const key = task?.id ?? 'free'
  const [book, setBook] = usePersisted(`studybuddy:book:${key}`, { start: 1, current: 1, goal: 20 })
  const read = Math.max(0, book.current - book.start)
  const total = Math.max(1, book.goal - book.start)
  const field = 'w-20 rounded-lg bg-white/10 px-2 py-1.5 text-white outline-none focus:ring-2 focus:ring-white/40'
  return (
    <div className="space-y-4">
      <h3 className="font-display text-xl font-semibold">Pages</h3>
      <div className="grid grid-cols-3 gap-2 text-xs font-bold text-white/60">
        <label>Started on<input type="number" className={field} value={book.start} onChange={(e) => setBook({ ...book, start: Number(e.target.value) })} /></label>
        <label>Now on<input type="number" className={field} value={book.current} onChange={(e) => setBook({ ...book, current: Number(e.target.value) })} /></label>
        <label>Read to<input type="number" className={field} value={book.goal} onChange={(e) => setBook({ ...book, goal: Number(e.target.value) })} /></label>
      </div>
      <div className="flex items-center gap-2">
        <button className="btn bg-white/15 text-white hover:bg-white/25" onClick={() => setBook({ ...book, current: book.current + 1 })}>+1 page</button>
        <button className="btn bg-white/15 text-white hover:bg-white/25" onClick={() => setBook({ ...book, current: book.current + 5 })}>+5</button>
        <span className="ml-auto text-sm font-bold">{read} / {total} pages</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-amber-300 transition-all" style={{ width: `${Math.min(100, (read / total) * 100)}%` }} />
      </div>
      {book.current >= book.goal && <p className="text-sm font-bold text-amber-200">Reading goal reached. Nice!</p>}
    </div>
  )
}

/** Chores room: a fast checklist of every open quick task. */
export function ChoresTools() {
  const { state, actions } = useData()
  const [title, setTitle] = useState('')
  const chores = state.tasks.filter((t) => t.category === 'chores' && t.status === 'open')
  return (
    <div>
      <h3 className="font-display text-xl font-semibold">Quick list</h3>
      {chores.length === 0 && <p className="mt-2 text-sm text-ink/45">All clear! Add something small below.</p>}
      <ul className="mt-2 space-y-1.5">
        {chores.map((t) => (
          <li key={t.id}>
            <button
              className="flex w-full items-center gap-3 rounded-xl bg-paper px-3 py-2.5 text-left text-sm font-bold shadow-sm transition hover:bg-emerald-50"
              onClick={() => actions.completeTask(t.id)}
            >
              <span className="grid h-5 w-5 place-items-center rounded-md border-2 border-emerald-500" />
              <span className="flex-1">{t.title}</span>
              <span className="text-xs text-ink/35">{t.estimated_minutes}m</span>
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim()) return
          actions.addTask({
            title: title.trim(),
            category: 'chores',
            estimated_minutes: 10,
            priority: 2,
            due_at: atMinutes(addDays(startOfDay(new Date()), 1), 21 * 60).toISOString(),
          })
          setTitle('')
        }}
      >
        <input className="input" placeholder="e.g. Pack gym bag" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button className="btn-primary">Add</button>
      </form>
    </div>
  )
}
