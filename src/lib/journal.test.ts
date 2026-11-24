import { describe, expect, it } from 'vitest'
import { diary, milestones, personalityTitle, streakHistory, studyStats, traitStatuses } from './journal'
import type { FocusSession, Task } from './types'
import { addDays, dateKey, startOfDay } from './time'

let n = 0
const at = (daysAgo: number, hour: number) => {
  const d = addDays(startOfDay(new Date()), -daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}
const session = (daysAgo: number, hour: number, minutes: number, room: FocusSession['room'] = 'study'): FocusSession => ({
  id: `s${++n}`,
  task_id: null,
  room,
  started_at: at(daysAgo, hour),
  minutes,
})
const task = (over: Partial<Task>): Task => ({
  id: `t${++n}`,
  title: 'Essay',
  category: 'homework',
  estimated_minutes: 60,
  logged_minutes: 0,
  due_at: at(-3, 23),
  priority: 2,
  status: 'done',
  created_at: at(10, 9),
  completed_at: at(1, 18),
  ...over,
})

describe('streaks', () => {
  it('finds the longest run and when each length was reached', () => {
    const days = new Set(['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-05', '2026-01-06'])
    const s = streakHistory(days)
    expect(s.longest).toBe(3)
    expect(s.reachedOn.get(3)).toBe('2026-01-03')
    expect(s.reachedOn.get(1)).toBe('2026-01-01')
  })

  it('counts the current streak through yesterday', () => {
    const today = startOfDay(new Date())
    const days = new Set([dateKey(addDays(today, -1)), dateKey(addDays(today, -2))])
    expect(streakHistory(days).current).toBe(2)
  })
})

describe('personality', () => {
  it('earns Night Owl after 5 late sessions and not before', () => {
    const four = [1, 2, 3, 4].map((d) => session(d, 22, 30))
    expect(traitStatuses(studyStats(four, [])).find((t) => t.def.id === 'night_owl')!.earned).toBe(false)
    const five = [...four, session(5, 23, 30)]
    const statuses = traitStatuses(studyStats(five, []))
    expect(statuses.find((t) => t.def.id === 'night_owl')!.earned).toBe(true)
    expect(personalityTitle(statuses)).toContain('Night Owl')
  })

  it('ignores relax breaks and tiny sessions', () => {
    const s = studyStats([session(1, 22, 5), session(1, 22, 40, 'relax')], [])
    expect(s.nightSessions).toBe(0)
    expect(s.totalMinutes).toBe(5)
  })

  it('counts on-time finishes for Planner', () => {
    const tasks = [task({}), task({ due_at: at(3, 9), completed_at: at(1, 9) })]
    expect(studyStats([], tasks).onTimeTasks).toBe(1)
  })
})

describe('milestones', () => {
  it('dates the moment total focus crossed one hour', () => {
    const sessions = [session(3, 15, 40), session(2, 15, 30), session(1, 15, 30)]
    const hour = milestones(sessions, [], { level: 1 }).find((m) => m.id === 'hours_1')!
    expect(hour.earned).toBe(true)
    expect(hour.on).toBe(dateKey(new Date(at(2, 15))))
  })

  it('leaves unearned milestones locked', () => {
    const ms = milestones([], [], { level: 1 })
    expect(ms.every((m) => !m.earned)).toBe(true)
  })
})

describe('diary', () => {
  it('writes one entry per active day, newest first, mentioning finished work', () => {
    const entries = diary([session(0, 16, 45), session(2, 22, 30)], [task({ title: 'Lab report', completed_at: at(0, 18) })], 'Mochi')
    expect(entries).toHaveLength(2)
    expect(entries[0].text).toContain('“Lab report”')
    expect(entries[0].text).toContain('45m')
    expect(entries[1].text).toContain('stayed up late')
  })

  it('is stable: the same day always reads the same', () => {
    const s = [session(1, 16, 30)]
    expect(diary(s, [], 'Mochi')[0].text).toBe(diary(s, [], 'Mochi')[0].text)
  })
})
