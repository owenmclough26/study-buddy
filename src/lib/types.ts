export type Category = 'study' | 'homework' | 'reading' | 'chores'
export type RoomKey = Category | 'relax'
/** Every buddy is a cat. This is their coat. (Stored in the `species` column.) */
export type Species = 'ginger' | 'gray' | 'black' | 'calico' | 'tuxedo' | 'cream'

export const COATS: { key: Species; name: string; blurb: string }[] = [
  { key: 'ginger', name: 'Ginger', blurb: 'Orange tabby. Sunny, a little dramatic.' },
  { key: 'gray', name: 'Smoky', blurb: 'Silver tabby. Calm and thoughtful.' },
  { key: 'black', name: 'Midnight', blurb: 'Black cat with golden eyes. Night-owl energy.' },
  { key: 'calico', name: 'Calico', blurb: 'Patchwork coat. Curious about everything.' },
  { key: 'tuxedo', name: 'Tux', blurb: 'Always dressed for the occasion.' },
  { key: 'cream', name: 'Latte', blurb: 'Cream with cocoa points and blue eyes.' },
]

/** Buddies made before everyone became a cat. */
const LEGACY: Record<string, Species> = { blob: 'gray', cat: 'ginger', dragon: 'black' }
export function normalizeSpecies(s: string): Species {
  if (COATS.some((c) => c.key === s)) return s as Species
  return LEGACY[s] ?? 'ginger'
}

export interface Profile {
  id: string
  display_name: string | null
  wake_time: string // 'HH:MM' or 'HH:MM:SS'
  sleep_time: string
  no_work_after: string
  session_minutes: number
  streak: number
  last_active_date: string | null // 'YYYY-MM-DD'
  relax_minutes_banked: number
  // reminders (optional so older local data still loads)
  reminders_enabled?: boolean
  remind_minutes_before?: number
  nightly_summary?: boolean
  timezone?: string
}

export interface SchoolBlock {
  id: string
  user_id?: string
  weekday: number // 0 = Sunday … 6 = Saturday
  start_time: string
  end_time: string
  title: string
  location: string | null
  color: string
}

export interface Task {
  id: string
  user_id?: string
  title: string
  category: Category
  estimated_minutes: number
  logged_minutes: number
  due_at: string // ISO
  priority: 1 | 2 | 3 // 3 = high
  status: 'open' | 'done'
  created_at: string
  completed_at: string | null
}

export interface Chunk {
  id: string
  user_id?: string
  task_id: string
  start_at: string
  end_at: string
  status: 'planned' | 'done' | 'missed'
  pinned: boolean
}

export type DecorSlot = 'wallpaper' | 'rug' | 'bed' | 'art' | 'plant' | 'lamp'

export interface Buddy {
  id: string
  user_id?: string
  species: Species
  name: string
  level: number
  xp: number
  coins: number
  energy: number
  happiness: number
  knowledge: number
  equipped_hat: string | null
  /** what's placed in the room, by slot (wallpaper, rug, bed, art, plant, lamp) */
  decor?: Partial<Record<DecorSlot, string>> | null
  last_decay_at: string
}

export interface FocusSession {
  id: string
  user_id?: string
  task_id: string | null
  room: RoomKey
  started_at: string
  minutes: number
}

export interface InventoryItem {
  id: string
  user_id?: string
  item_id: string
}

/** Muted, earthy colors so blocks sit nicely on the cream background. */
export const CATEGORIES: { key: Category; label: string; short: string; color: string; soft: string }[] = [
  { key: 'study', label: 'Study', short: 'Study', color: '#6f63a6', soft: '#e7e3f3' },
  { key: 'homework', label: 'Homework / Writing', short: 'Homework', color: '#3f86ad', soft: '#dde9f0' },
  { key: 'reading', label: 'Reading', short: 'Reading', color: '#c7802f', soft: '#f6e7d2' },
  { key: 'chores', label: 'Chores / Quick', short: 'Quick task', color: '#6c9461', soft: '#e1ebdc' },
]

export const categoryInfo = (c: Category) => CATEGORIES.find((x) => x.key === c)!

/** A linked Google/Outlook/iCloud calendar (its private iCal link). */
export interface LinkedCalendar {
  id: string
  user_id?: string
  url: string
  label: string | null
  created_at?: string
}

/** An event from a linked calendar that homework gets planned around. */
export interface BusyEvent {
  start: string
  end: string
  title: string
  calendarId: string
}
