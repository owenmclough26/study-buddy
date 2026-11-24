import type { Buddy, Task } from './types'

export const STAT_FLOOR = 10 // the buddy gets sad, never dies
export const STAT_MAX = 100
export const RELAX_COST_MIN = 45 // focus minutes needed to unlock a relax break
export const RELAX_BREAK_MIN = 10

const clamp = (v: number) => Math.max(STAT_FLOOR, Math.min(STAT_MAX, v))

/** XP needed to go from `level` to `level + 1`. */
export const xpForLevel = (level: number) => 50 * level

export function applyXp(buddy: Pick<Buddy, 'level' | 'xp'>, gained: number): { level: number; xp: number; leveledUp: boolean } {
  let { level, xp } = buddy
  xp += gained
  let leveledUp = false
  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level)
    level++
    leveledUp = true
  }
  return { level, xp, leveledUp }
}

/** 0 = baby, 1 = kid, 2 = teen, 3 = final form */
export function evolutionStage(level: number): 0 | 1 | 2 | 3 {
  if (level >= 30) return 3
  if (level >= 15) return 2
  if (level >= 5) return 1
  return 0
}

/** Every coat grows the same way: kitten → cat → scholar (glasses) → wise old cat (scarf). */
export const STAGE_NAMES = ['Kitten', 'Cat', 'Scholar Cat', 'Wise Old Cat']

export type Mood = 'happy' | 'neutral' | 'tired' | 'sad'

export function mood(b: Pick<Buddy, 'energy' | 'happiness' | 'knowledge'>): Mood {
  if (b.happiness < 30) return 'sad'
  if (b.energy < 30) return 'tired'
  const avg = (b.energy + b.happiness + b.knowledge) / 3
  if (avg >= 65) return 'happy'
  if (avg >= 40) return 'neutral'
  return 'sad'
}

/** Stats fall a little every hour you're away. */
const DECAY_PER_HOUR = { energy: 1.2, happiness: 0.8, knowledge: 0.4 }

export function decay(b: Buddy, now: Date): Pick<Buddy, 'energy' | 'happiness' | 'knowledge' | 'last_decay_at'> {
  const hours = Math.max(0, (now.getTime() - new Date(b.last_decay_at).getTime()) / 3_600_000)
  return {
    energy: clamp(b.energy - DECAY_PER_HOUR.energy * hours),
    happiness: clamp(b.happiness - DECAY_PER_HOUR.happiness * hours),
    knowledge: clamp(b.knowledge - DECAY_PER_HOUR.knowledge * hours),
    last_decay_at: now.toISOString(),
  }
}

/** Streak multiplier: +5% per day, capped at +50%. */
export const streakMultiplier = (streak: number) => 1 + Math.min(streak, 10) * 0.05

export function nextStreak(lastActive: string | null, streak: number, today: string, yesterday: string): number {
  if (lastActive === today) return Math.max(streak, 1)
  if (lastActive === yesterday) return streak + 1
  return 1
}

export interface Reward {
  xp: number
  coins: number
  energy: number
  happiness: number
  knowledge: number
}

/** Reward for a focused session in a room. */
export function focusReward(minutes: number, streak: number): Reward {
  const m = streakMultiplier(streak)
  return {
    xp: Math.round(minutes * m),
    coins: Math.round((minutes / 5) * m),
    energy: -minutes * 0.15,
    happiness: minutes * 0.1,
    knowledge: minutes * 0.5,
  }
}

const PRIORITY_MULT = { 1: 1, 2: 1.25, 3: 1.5 } as const

/** Bonus for checking a task off. */
export function completionReward(task: Pick<Task, 'estimated_minutes' | 'priority'>, streak: number): Reward {
  const base = (10 + task.estimated_minutes / 6) * PRIORITY_MULT[task.priority] * streakMultiplier(streak)
  return { xp: Math.round(base), coins: Math.round(base / 2), energy: 0, happiness: 8, knowledge: 2 }
}

export function applyReward(b: Buddy, r: Reward): Partial<Buddy> & { leveledUp: boolean } {
  const lv = applyXp(b, r.xp)
  return {
    level: lv.level,
    xp: lv.xp,
    leveledUp: lv.leveledUp,
    coins: b.coins + r.coins,
    energy: clamp(b.energy + r.energy),
    happiness: clamp(b.happiness + r.happiness),
    knowledge: clamp(b.knowledge + r.knowledge),
  }
}

export interface ShopItem {
  id: string
  name: string
  emoji: string
  price: number
  kind: 'food' | 'hat'
  effect?: Partial<Pick<Buddy, 'energy' | 'happiness'>>
}

export const SHOP: ShopItem[] = [
  { id: 'apple', name: 'Apple', emoji: '🍎', price: 5, kind: 'food', effect: { energy: 15 } },
  { id: 'cookie', name: 'Cookie', emoji: '🍪', price: 8, kind: 'food', effect: { energy: 10, happiness: 10 } },
  { id: 'smoothie', name: 'Smoothie', emoji: '🥤', price: 15, kind: 'food', effect: { energy: 30, happiness: 5 } },
  { id: 'cake', name: 'Cake', emoji: '🍰', price: 25, kind: 'food', effect: { energy: 20, happiness: 30 } },
  { id: 'cap', name: 'Ball Cap', emoji: '🧢', price: 30, kind: 'hat' },
  { id: 'beanie', name: 'Beanie', emoji: '🧶', price: 40, kind: 'hat' },
  { id: 'grad', name: 'Grad Cap', emoji: '🎓', price: 80, kind: 'hat' },
  { id: 'wizard', name: 'Wizard Hat', emoji: '🧙', price: 100, kind: 'hat' },
  { id: 'crown', name: 'Crown', emoji: '👑', price: 150, kind: 'hat' },
]

export function feed(b: Buddy, item: ShopItem): Pick<Buddy, 'energy' | 'happiness' | 'coins'> {
  return {
    coins: b.coins - item.price,
    energy: clamp(b.energy + (item.effect?.energy ?? 0)),
    happiness: clamp(b.happiness + (item.effect?.happiness ?? 0)),
  }
}
