import type { Milestone, TraitStatus } from '../../lib/journal'
import { decorItem, DECOR } from '../../lib/decor'

/** Remembers (per browser) which traits and milestones you've already celebrated. */
const KEY = 'studybuddy:seen-unlocks'

export interface Unlock {
  id: string
  title: string
  detail: string
  sticker: string
}

function seen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function earnedIds(traits: TraitStatus[], mems: Milestone[]): string[] {
  return [...traits.filter((t) => t.earned).map((t) => `trait:${t.def.id}`), ...mems.filter((m) => m.earned).map((m) => `memory:${m.id}`)]
}

export function newUnlocks(traits: TraitStatus[], mems: Milestone[]): Unlock[] {
  const s = seen()
  const out: Unlock[] = []
  for (const t of traits) {
    if (!t.earned || s.has(`trait:${t.def.id}`)) continue
    const reward = DECOR.find((d) => d.trait === t.def.id)
    out.push({
      id: `trait:${t.def.id}`,
      title: `New personality: ${t.def.name}!`,
      detail: reward ? `Unlocked for the room: ${decorItem(reward.id)!.name}.` : t.def.how,
      sticker: '✨',
    })
  }
  for (const m of mems) {
    if (!m.earned || s.has(`memory:${m.id}`)) continue
    out.push({ id: `memory:${m.id}`, title: m.title, detail: 'Added to your memories.', sticker: m.sticker })
  }
  return out
}

export function markUnlocksSeen(traits: TraitStatus[], mems: Milestone[]) {
  try {
    const s = seen()
    for (const id of earnedIds(traits, mems)) s.add(id)
    localStorage.setItem(KEY, JSON.stringify([...s]))
  } catch {
    /* storage blocked: the banner just shows again next time */
  }
}
