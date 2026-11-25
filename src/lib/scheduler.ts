import type { Chunk, SchoolBlock, Task } from './types'
import { addDays, atMinutes, dateKey, hmToMinutes, startOfDay } from './time'

export interface SchedulerPrefs {
  wake_time: string
  sleep_time: string
  no_work_after: string
  session_minutes: number
}

export interface SchedulerInput {
  blocks: SchoolBlock[]
  prefs: SchedulerPrefs
  tasks: Task[]
  /** Chunks that stay where they are (pinned, done, in progress). They take up time. */
  fixed: Pick<Chunk, 'task_id' | 'start_at' | 'end_at' | 'status'>[]
  now: Date
  horizonDays?: number
  /** Events from linked calendars (practice, work, appointments). Nothing gets planned on top of them. */
  busy?: { start: string | Date; end: string | Date }[]
}

export interface PlannedChunk {
  task_id: string
  start: Date
  end: Date
}

export interface SchedulerResult {
  chunks: PlannedChunk[]
  /** Tasks that could not fully fit before their due date, with the minutes left over. */
  unfit: { task_id: string; minutesShort: number }[]
}

/** Gap kept around school blocks. */
export const SCHOOL_BUFFER_MIN = 15
/** Gap kept around events from linked calendars (getting there, getting home). */
export const BUSY_BUFFER_MIN = 15
/** Short break after each planned chunk. */
export const BREAK_MIN = 10
/** Smallest chunk worth scheduling (unless the task needs less than this). */
export const MIN_CHUNK_MIN = 20
/** Most chunks of one task on a single day, so work spreads out. */
export const MAX_CHUNKS_PER_TASK_PER_DAY = 2

type Interval = [number, number] // ms timestamps

function subtract(intervals: Interval[], [s, e]: Interval): Interval[] {
  const out: Interval[] = []
  for (const [a, b] of intervals) {
    if (e <= a || s >= b) {
      out.push([a, b])
      continue
    }
    if (s > a) out.push([a, s])
    if (e < b) out.push([e, b])
  }
  return out
}

const MIN = 60_000

/** Round up to the next 5 minutes. */
function ceil5(ms: number): number {
  const step = 5 * MIN
  return Math.ceil(ms / step) * step
}

/** Free time windows from `now` across the horizon, with school and fixed chunks removed. */
export function freeWindows(input: SchedulerInput): Interval[] {
  const { blocks, prefs, fixed, now } = input
  const horizon = input.horizonDays ?? 14
  const wake = hmToMinutes(prefs.wake_time)
  const end = Math.min(hmToMinutes(prefs.no_work_after), hmToMinutes(prefs.sleep_time))
  const nowMs = ceil5(now.getTime())

  let free: Interval[] = []
  const today = startOfDay(now)
  for (let i = 0; i < horizon; i++) {
    const day = addDays(today, i)
    let s = atMinutes(day, wake).getTime()
    const e = atMinutes(day, end).getTime()
    if (e <= nowMs) continue
    s = Math.max(s, nowMs)
    if (e <= s) continue
    let dayFree: Interval[] = [[s, e]]
    for (const b of blocks) {
      if (b.weekday !== day.getDay()) continue
      const bs = atMinutes(day, hmToMinutes(b.start_time) - SCHOOL_BUFFER_MIN).getTime()
      const be = atMinutes(day, hmToMinutes(b.end_time) + SCHOOL_BUFFER_MIN).getTime()
      dayFree = subtract(dayFree, [bs, be])
    }
    free.push(...dayFree)
  }
  for (const c of fixed) {
    if (c.status === 'missed') continue
    const cs = new Date(c.start_at).getTime()
    const ce = new Date(c.end_at).getTime() + BREAK_MIN * MIN
    free = subtract(free, [cs, ce])
  }
  for (const ev of input.busy ?? []) {
    const es = new Date(ev.start).getTime() - BUSY_BUFFER_MIN * MIN
    const ee = new Date(ev.end).getTime() + BUSY_BUFFER_MIN * MIN
    if (ee > es) free = subtract(free, [es, ee])
  }
  return free.sort((a, b) => a[0] - b[0])
}

/** Minutes of a task still needing a slot. */
export function remainingMinutes(task: Task, fixed: SchedulerInput['fixed'], now: Date): number {
  const reserved = fixed
    .filter((c) => c.task_id === task.id && c.status === 'planned' && new Date(c.end_at) > now)
    .reduce((sum, c) => sum + (new Date(c.end_at).getTime() - Math.max(new Date(c.start_at).getTime(), now.getTime())) / MIN, 0)
  return Math.max(0, Math.round(task.estimated_minutes - task.logged_minutes - reserved))
}

/**
 * Place every open task into free time before its due date.
 * Earliest due first, then highest priority. Long tasks split into session-sized chunks,
 * at most MAX_CHUNKS_PER_TASK_PER_DAY per day. Never overbooks: leftovers are reported as unfit.
 */
export function schedule(input: SchedulerInput): SchedulerResult {
  const { prefs, now } = input
  const session = Math.max(15, prefs.session_minutes)
  let free = freeWindows(input)

  const tasks = input.tasks
    .filter((t) => t.status === 'open')
    .sort((a, b) => {
      const d = new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
      return d !== 0 ? d : b.priority - a.priority
    })

  const chunks: PlannedChunk[] = []
  const unfit: SchedulerResult['unfit'] = []

  for (const task of tasks) {
    let remaining = remainingMinutes(task, input.fixed, now)
    if (remaining <= 0) continue
    const due = new Date(task.due_at).getTime()
    const perDay = new Map<string, number>()
    for (const c of input.fixed) {
      if (c.task_id === task.id && c.status === 'planned') {
        const k = dateKey(new Date(c.start_at))
        perDay.set(k, (perDay.get(k) ?? 0) + 1)
      }
    }

    let i = 0
    while (remaining > 0 && i < free.length) {
      const [a, b] = free[i]
      if (a >= due) break
      const k = dateKey(new Date(a))
      if ((perDay.get(k) ?? 0) >= MAX_CHUNKS_PER_TASK_PER_DAY) {
        i++
        continue
      }
      const available = (Math.min(b, due) - a) / MIN
      const want = Math.min(session, remaining)
      const len = Math.min(want, Math.floor(available))
      const minUseful = Math.min(MIN_CHUNK_MIN, remaining)
      if (len < minUseful) {
        i++
        continue
      }
      const start = a
      const end = a + len * MIN
      chunks.push({ task_id: task.id, start: new Date(start), end: new Date(end) })
      remaining -= len
      perDay.set(k, (perDay.get(k) ?? 0) + 1)
      free = subtract(free, [start, end + BREAK_MIN * MIN])
      // free stays sorted; re-scan from the same index (the leftover of this window is now at i)
    }
    if (remaining > 0) unfit.push({ task_id: task.id, minutesShort: remaining })
  }

  return { chunks, unfit }
}
