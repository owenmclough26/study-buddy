import type { Buddy, FocusSession, Task } from './types'
import { addDays, dateKey, fmtDuration, startOfDay } from './time'

/*
 * The cat's inner life, worked out from your real study history. Nothing here is stored:
 * it's all derived from focus sessions and tasks, so it stays in sync on every device.
 */

// ---------------------------------------------------------------- stats

export interface StudyStats {
  totalMinutes: number
  nightSessions: number
  earlySessions: number
  readingMinutes: number
  longSessions: number
  shortSessions: number
  longestStreak: number
  currentStreak: number
  onTimeTasks: number
  completedTasks: number
}

const focusOnly = (s: FocusSession[]) => s.filter((x) => x.room !== 'relax' && x.minutes > 0)

/** Days with any study activity (a focus session or a finished task). */
function activeDays(sessions: FocusSession[], tasks: Task[]): Set<string> {
  const days = new Set<string>()
  for (const s of focusOnly(sessions)) days.add(dateKey(new Date(s.started_at)))
  for (const t of tasks) if (t.completed_at) days.add(dateKey(new Date(t.completed_at)))
  return days
}

/** Longest run of consecutive active days, plus the date each length was first reached. */
export function streakHistory(days: Set<string>): { longest: number; reachedOn: Map<number, string>; current: number } {
  const sorted = [...days].sort()
  const reachedOn = new Map<number, string>()
  let longest = 0
  let run = 0
  let prev: string | null = null
  for (const d of sorted) {
    if (prev && dateKey(addDays(new Date(`${prev}T12:00:00`), 1)) === d) run++
    else run = 1
    if (run > longest) {
      longest = run
      if (!reachedOn.has(run)) reachedOn.set(run, d)
    }
    for (let n = 1; n <= run; n++) if (!reachedOn.has(n)) reachedOn.set(n, d)
    prev = d
  }
  // current streak counts today or yesterday as still alive
  let current = 0
  const today = startOfDay(new Date())
  let cursor = days.has(dateKey(today)) ? today : addDays(today, -1)
  while (days.has(dateKey(cursor))) {
    current++
    cursor = addDays(cursor, -1)
  }
  return { longest, reachedOn, current }
}

export function studyStats(sessions: FocusSession[], tasks: Task[]): StudyStats {
  const focus = focusOnly(sessions)
  const hour = (s: FocusSession) => new Date(s.started_at).getHours()
  const real = focus.filter((s) => s.minutes >= 10)
  const done = tasks.filter((t) => t.status === 'done' && t.completed_at)
  const streak = streakHistory(activeDays(sessions, tasks))
  return {
    totalMinutes: focus.reduce((a, s) => a + s.minutes, 0),
    nightSessions: real.filter((s) => hour(s) >= 21 || hour(s) < 3).length,
    earlySessions: real.filter((s) => hour(s) >= 4 && hour(s) < 8).length,
    readingMinutes: focus.filter((s) => s.room === 'reading').reduce((a, s) => a + s.minutes, 0),
    longSessions: focus.filter((s) => s.minutes >= 60).length,
    shortSessions: focus.filter((s) => s.minutes >= 10 && s.minutes <= 25).length,
    longestStreak: streak.longest,
    currentStreak: streak.current,
    onTimeTasks: done.filter((t) => new Date(t.completed_at!) <= new Date(t.due_at)).length,
    completedTasks: done.length,
  }
}

// ---------------------------------------------------------------- personality

export type TraitId = 'night_owl' | 'early_bird' | 'bookworm' | 'marathoner' | 'sprinter' | 'steady' | 'planner' | 'closer'

export interface TraitDef {
  id: TraitId
  name: string
  /** how you earn it, in plain words */
  how: string
  goal: number
  value: (s: StudyStats) => number
  unit: string
  /** what the cat says once it has this trait */
  lines: string[]
  color: string
}

export const TRAITS: TraitDef[] = [
  {
    id: 'night_owl',
    name: 'Night Owl',
    how: 'Focus after 9pm, 5 times',
    goal: 5,
    value: (s) => s.nightSessions,
    unit: 'late sessions',
    lines: ['the lamp is my sun', 'late night study club, just us two', 'nights are for thinking'],
    color: '#4f5b8a',
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    how: 'Focus before 8am, 5 times',
    goal: 5,
    value: (s) => s.earlySessions,
    unit: 'early sessions',
    lines: ['up before the birds again', 'morning brain is the best brain', 'sunrise study, then breakfast?'],
    color: '#e98a5c',
  },
  {
    id: 'bookworm',
    name: 'Bookworm',
    how: 'Spend 5 hours in the Reading Nook',
    goal: 300,
    value: (s) => s.readingMinutes,
    unit: 'reading minutes',
    lines: ['one more chapter?', 'i sat on that book. it was a good book', 'books smell like naps'],
    color: '#c7802f',
  },
  {
    id: 'marathoner',
    name: 'Marathoner',
    how: 'Focus for an hour or more, 3 times',
    goal: 3,
    value: (s) => s.longSessions,
    unit: 'hour-long sessions',
    lines: ['we can go the distance', 'long sessions? easy', 'pace yourself. i will nap'],
    color: '#c4553f',
  },
  {
    id: 'sprinter',
    name: 'Sprinter',
    how: 'Do 10 short sessions (25 min or less)',
    goal: 10,
    value: (s) => s.shortSessions,
    unit: 'short sessions',
    lines: ['quick one? quick one.', '25 minutes, go go go', 'small bites, big brain'],
    color: '#d9483b',
  },
  {
    id: 'steady',
    name: 'Steady',
    how: 'Study 7 days in a row',
    goal: 7,
    value: (s) => s.longestStreak,
    unit: 'days in a row',
    lines: ['every day, a little', 'consistency is my middle name', 'same time tomorrow?'],
    color: '#6f63a6',
  },
  {
    id: 'planner',
    name: 'Planner',
    how: 'Finish 10 to-dos before they’re due',
    goal: 10,
    value: (s) => s.onTimeTasks,
    unit: 'on-time finishes',
    lines: ['ahead of schedule, as usual', 'deadlines fear us', 'i love a good plan'],
    color: '#3f86ad',
  },
  {
    id: 'closer',
    name: 'Closer',
    how: 'Finish 25 to-dos',
    goal: 25,
    value: (s) => s.completedTasks,
    unit: 'to-dos done',
    lines: ['another one, done', 'we finish what we start', 'checkmarks are my favorite snack'],
    color: '#6c9461',
  },
]

export interface TraitStatus {
  def: TraitDef
  current: number
  earned: boolean
  /** 0..1 */
  progress: number
}

export function traitStatuses(stats: StudyStats): TraitStatus[] {
  return TRAITS.map((def) => {
    const current = def.value(stats)
    return { def, current, earned: current >= def.goal, progress: Math.min(1, current / def.goal) }
  })
}

export const earnedTraitIds = (statuses: TraitStatus[]) => new Set(statuses.filter((t) => t.earned).map((t) => t.def.id))

/** "A Night Owl Bookworm": the two traits it's strongest in. */
export function personalityTitle(statuses: TraitStatus[]): string | null {
  const earned = statuses
    .filter((t) => t.earned)
    .sort((a, b) => b.current / b.def.goal - a.current / a.def.goal)
    .slice(0, 2)
  if (!earned.length) return null
  return earned.map((t) => t.def.name).join(' ')
}

// ---------------------------------------------------------------- milestones

export interface Milestone {
  id: string
  title: string
  how: string
  sticker: string
  earned: boolean
  /** 'YYYY-MM-DD' when known */
  on: string | null
}

export function milestones(sessions: FocusSession[], tasks: Task[], buddy: Pick<Buddy, 'level'>): Milestone[] {
  const t = (iso: string) => new Date(iso).getTime()
  const focus = focusOnly(sessions).sort((a, b) => t(a.started_at) - t(b.started_at))
  const done = tasks.filter((x) => x.completed_at).sort((a, b) => t(a.completed_at!) - t(b.completed_at!))
  const breaks = sessions.filter((s) => s.room === 'relax').sort((a, b) => t(a.started_at) - t(b.started_at))
  const day = (iso: string) => dateKey(new Date(iso))

  // date the running total first crossed each threshold
  const crossed = (minutes: number): string | null => {
    let sum = 0
    for (const s of focus) {
      sum += s.minutes
      if (sum >= minutes) return day(s.started_at)
    }
    return null
  }
  const streak = streakHistory(activeDays(sessions, tasks))
  const big = done.find((x) => x.estimated_minutes >= 180)

  const m = (id: string, title: string, how: string, sticker: string, on: string | null, earned = on !== null): Milestone => ({ id, title, how, sticker, on, earned })
  return [
    m('first_focus', 'First focus session', 'Save a focus session in any room', '🌱', focus[0] ? day(focus[0].started_at) : null),
    m('first_done', 'First thing finished', 'Check off a to-do', '✅', done[0] ? day(done[0].completed_at!) : null),
    m('hours_1', 'One whole hour', 'Focus for 1 hour in total', '⏰', crossed(60)),
    m('hours_10', 'Ten hours in', 'Focus for 10 hours in total', '📚', crossed(600)),
    m('hours_50', 'Fifty hours. Wow.', 'Focus for 50 hours in total', '🏆', crossed(3000)),
    m('streak_3', 'Three days in a row', 'Study 3 days in a row', '🔥', streak.reachedOn.get(3) ?? null),
    m('streak_7', 'A full week', 'Study 7 days in a row', '🌟', streak.reachedOn.get(7) ?? null),
    m('streak_30', 'A whole month', 'Study 30 days in a row', '👑', streak.reachedOn.get(30) ?? null),
    m('big_task', 'Took on a big one', 'Finish a to-do estimated at 3+ hours', '⛰️', big ? day(big.completed_at!) : null),
    m('first_break', 'Touched grass', 'Take a break in the Relax Room', '🌿', breaks[0] ? day(breaks[0].started_at) : null),
    m('grew_cat', 'All grown up', 'Reach level 5', '🐈', null, buddy.level >= 5),
    m('scholar', 'Scholar glasses', 'Reach level 15', '👓', null, buddy.level >= 15),
  ]
}

// ---------------------------------------------------------------- diary

export interface DiaryEntry {
  date: string
  text: string
}

const ROOM_LINES: Record<string, string[]> = {
  study: ['I guarded the lamp.', 'I sat on the desk and pretended to understand it.', 'I kept watch by the window.'],
  homework: ['I helped by sitting on the keyboard.', 'I stared at the steps list very seriously.', 'I chewed one pencil. Just one.'],
  reading: ['I sat on the pages. On purpose.', 'The fire was warm and so was the book.', 'I turned one page with my paw.'],
  chores: ['We tidied things up and I supervised.', 'I inspected the laundry basket. From inside.', 'Quick tasks, quick paws.'],
}
const OPENERS = ['Dear diary,', 'Diary, listen.', 'Today was a good one.', 'Notes from the rug:']
const CLOSERS = ['Proud of us.', 'Same time tomorrow?', 'Going to nap now.', 'I think I got smarter.', 'Good day. Very good day.']

/** Small stable hash so each day always gets the same wording. */
function seeded(key: string) {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619)
  return (list: string[], salt = 0) => list[Math.abs(h + salt * 7919) % list.length]
}

/** One short entry, in the cat's voice, for each day you studied (newest first). */
export function diary(sessions: FocusSession[], tasks: Task[], buddyName: string, days = 21): DiaryEntry[] {
  const out: DiaryEntry[] = []
  const today = startOfDay(new Date())
  for (let i = 0; i < days; i++) {
    const d = addDays(today, -i)
    const key = dateKey(d)
    const daySessions = sessions.filter((s) => dateKey(new Date(s.started_at)) === key)
    const focus = focusOnly(daySessions)
    const finished = tasks.filter((t) => t.completed_at && dateKey(new Date(t.completed_at)) === key)
    if (!focus.length && !finished.length) continue

    const pick = seeded(key + buddyName)
    const parts: string[] = [pick(OPENERS)]
    const minutes = focus.reduce((a, s) => a + s.minutes, 0)
    if (minutes) {
      const rooms = [...new Set(focus.map((s) => s.room))]
      parts.push(`We focused for ${fmtDuration(minutes)}.`)
      parts.push(pick(ROOM_LINES[rooms[0]] ?? ROOM_LINES.study, 1))
    }
    if (finished.length) {
      const names = finished.slice(0, 2).map((t) => `“${t.title}”`).join(' and ')
      parts.push(`We finished ${names}${finished.length > 2 ? ` and ${finished.length - 2} more` : ''}!`)
    }
    if (focus.some((s) => new Date(s.started_at).getHours() >= 21)) parts.push('We stayed up late. The lamp was cozy.')
    if (focus.some((s) => new Date(s.started_at).getHours() < 8)) parts.push('We were up before the birds.')
    if (daySessions.some((s) => s.room === 'relax')) parts.push('Then we took a real break outside. Best part.')
    if (minutes >= 120) parts.push('Big day. My brain is full.')
    parts.push(pick(CLOSERS, 2))
    out.push({ date: key, text: parts.join(' ') })
  }
  return out
}
