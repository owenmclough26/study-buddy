import { describe, expect, it } from 'vitest'
import { schedule, BREAK_MIN, SCHOOL_BUFFER_MIN, MAX_CHUNKS_PER_TASK_PER_DAY } from './scheduler'
import type { SchoolBlock, Task } from './types'
import { dateKey } from './time'

// Monday 2026-11-23, 06:00 local
const NOW = new Date(2026, 10, 23, 6, 0)
const prefs = { wake_time: '07:00', sleep_time: '23:00', no_work_after: '22:00', session_minutes: 45 }

// School 8:00–15:00 on Mon–Fri
const school: SchoolBlock[] = [1, 2, 3, 4, 5].map((weekday) => ({
  id: `b${weekday}`,
  weekday,
  start_time: '08:00:00',
  end_time: '15:00:00',
  title: 'School',
  location: null,
  color: '#999',
}))

let n = 0
function task(over: Partial<Task>): Task {
  return {
    id: `t${++n}`,
    title: 'Task',
    category: 'study',
    estimated_minutes: 60,
    logged_minutes: 0,
    due_at: new Date(2026, 10, 27, 23, 59).toISOString(),
    priority: 2,
    status: 'open',
    created_at: NOW.toISOString(),
    completed_at: null,
    ...over,
  }
}

const mins = (d: Date) => d.getHours() * 60 + d.getMinutes()

describe('schedule', () => {
  it('never overlaps school (with buffer) and stays inside waking hours', () => {
    const tasks = [task({ estimated_minutes: 600 }), task({ estimated_minutes: 300 })]
    const { chunks } = schedule({ blocks: school, prefs, tasks, fixed: [], now: NOW })
    expect(chunks.length).toBeGreaterThan(0)
    for (const c of chunks) {
      const wd = c.start.getDay()
      const s = mins(c.start)
      const e = mins(c.end)
      expect(s).toBeGreaterThanOrEqual(7 * 60)
      expect(e).toBeLessThanOrEqual(22 * 60)
      if (wd >= 1 && wd <= 5) {
        const overlaps = s < 15 * 60 + SCHOOL_BUFFER_MIN && e > 8 * 60 - SCHOOL_BUFFER_MIN
        expect(overlaps).toBe(false)
      }
    }
  })

  it('never double-books: chunks are separated by at least the break', () => {
    const tasks = [task({ estimated_minutes: 240 }), task({ estimated_minutes: 240 }), task({ estimated_minutes: 120 })]
    const { chunks } = schedule({ blocks: school, prefs, tasks, fixed: [], now: NOW })
    const sorted = [...chunks].sort((a, b) => a.start.getTime() - b.start.getTime())
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].start.getTime()).toBeGreaterThanOrEqual(sorted[i - 1].end.getTime() + BREAK_MIN * 60_000)
    }
  })

  it('ends every chunk before the due date', () => {
    const due = new Date(2026, 10, 24, 18, 0)
    const t = task({ estimated_minutes: 180, due_at: due.toISOString() })
    const { chunks } = schedule({ blocks: school, prefs, tasks: [t], fixed: [], now: NOW })
    for (const c of chunks) expect(c.end.getTime()).toBeLessThanOrEqual(due.getTime())
  })

  it('splits long tasks into session-sized chunks spread over days', () => {
    const t = task({ estimated_minutes: 180 })
    const { chunks, unfit } = schedule({ blocks: school, prefs, tasks: [t], fixed: [], now: NOW })
    expect(unfit).toEqual([])
    expect(chunks.reduce((s, c) => s + (c.end.getTime() - c.start.getTime()) / 60_000, 0)).toBe(180)
    for (const c of chunks) expect((c.end.getTime() - c.start.getTime()) / 60_000).toBeLessThanOrEqual(45)
    const perDay = new Map<string, number>()
    for (const c of chunks) perDay.set(dateKey(c.start), (perDay.get(dateKey(c.start)) ?? 0) + 1)
    for (const v of perDay.values()) expect(v).toBeLessThanOrEqual(MAX_CHUNKS_PER_TASK_PER_DAY)
    expect(perDay.size).toBeGreaterThan(1)
  })

  it('flags tasks that cannot fit before the due date', () => {
    // due tonight at 16:00: only 15:15–16:00 is free after school (45 min), plus 7:00–7:45 this morning
    const t = task({ estimated_minutes: 300, due_at: new Date(2026, 10, 23, 16, 0).toISOString() })
    const { unfit } = schedule({ blocks: school, prefs, tasks: [t], fixed: [], now: NOW })
    expect(unfit).toHaveLength(1)
    expect(unfit[0].minutesShort).toBeGreaterThan(0)
  })

  it('works around pinned chunks and counts them toward the task', () => {
    const t = task({ estimated_minutes: 90 })
    const pinned = {
      task_id: t.id,
      start_at: new Date(2026, 10, 23, 16, 0).toISOString(),
      end_at: new Date(2026, 10, 23, 16, 45).toISOString(),
      status: 'planned' as const,
    }
    const other = task({ estimated_minutes: 120 })
    const { chunks } = schedule({ blocks: school, prefs, tasks: [t, other], fixed: [pinned], now: NOW })
    const forT = chunks.filter((c) => c.task_id === t.id)
    expect(forT.reduce((s, c) => s + (c.end.getTime() - c.start.getTime()) / 60_000, 0)).toBe(45)
    const ps = new Date(pinned.start_at).getTime()
    const pe = new Date(pinned.end_at).getTime()
    for (const c of chunks) expect(c.end.getTime() <= ps || c.start.getTime() >= pe).toBe(true)
  })

  it('subtracts minutes already logged', () => {
    const t = task({ estimated_minutes: 90, logged_minutes: 60 })
    const { chunks } = schedule({ blocks: school, prefs, tasks: [t], fixed: [], now: NOW })
    expect(chunks.reduce((s, c) => s + (c.end.getTime() - c.start.getTime()) / 60_000, 0)).toBe(30)
  })

  it('schedules earlier due dates first', () => {
    const later = task({ estimated_minutes: 45, due_at: new Date(2026, 10, 27, 22, 0).toISOString() })
    const sooner = task({ estimated_minutes: 45, due_at: new Date(2026, 10, 25, 22, 0).toISOString() })
    const { chunks } = schedule({ blocks: school, prefs, tasks: [later, sooner], fixed: [], now: NOW })
    const s = chunks.find((c) => c.task_id === sooner.id)!
    const l = chunks.find((c) => c.task_id === later.id)!
    expect(s.start.getTime()).toBeLessThan(l.start.getTime())
  })

  it('ignores done tasks', () => {
    const t = task({ status: 'done' })
    expect(schedule({ blocks: school, prefs, tasks: [t], fixed: [], now: NOW }).chunks).toEqual([])
  })
})

describe('linked calendar events', () => {
  it('never plans on top of a busy event (with buffer)', () => {
    // soccer practice Monday 16:00-18:00
    const busy = [{ start: new Date(2026, 10, 23, 16, 0), end: new Date(2026, 10, 23, 18, 0) }]
    const t = task({ estimated_minutes: 300, due_at: new Date(2026, 10, 24, 22, 0).toISOString() })
    const { chunks } = schedule({ blocks: school, prefs, tasks: [t], fixed: [], now: NOW, busy })
    const bs = busy[0].start.getTime() - 15 * 60_000
    const be = busy[0].end.getTime() + 15 * 60_000
    expect(chunks.length).toBeGreaterThan(0)
    for (const c of chunks) expect(c.end.getTime() <= bs || c.start.getTime() >= be).toBe(true)
  })

  it('accepts ISO strings from the server', () => {
    const busy = [{ start: new Date(2026, 10, 23, 15, 0).toISOString(), end: new Date(2026, 10, 23, 22, 0).toISOString() }]
    const t = task({ estimated_minutes: 45, due_at: new Date(2026, 10, 23, 23, 0).toISOString() })
    // Monday after school is fully busy, and only 7:00-7:45 is left before school
    const { chunks } = schedule({ blocks: school, prefs, tasks: [t], fixed: [], now: NOW, busy })
    for (const c of chunks) expect(c.start.getHours()).toBeLessThan(8)
  })
})
