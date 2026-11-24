import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Repo } from './repo'
import { uid } from './repo'
import type { Buddy, Category, Chunk, FocusSession, InventoryItem, Profile, RoomKey, SchoolBlock, Species, Task } from './types'
import { normalizeSpecies } from './types'
import { track } from './analytics'
import { schedule } from './scheduler'
import {
  applyReward,
  completionReward,
  decay,
  feed,
  focusReward,
  nextStreak,
  RELAX_COST_MIN,
  STAT_MAX,
  type Reward,
  type ShopItem,
} from './rewards'
import { addDays, dateKey } from './time'

interface State {
  loading: boolean
  error: string | null
  toast: string | null
  profile: Profile | null
  blocks: SchoolBlock[]
  tasks: Task[]
  chunks: Chunk[]
  buddy: Buddy | null
  sessions: FocusSession[]
  inventory: InventoryItem[]
  /** task id → minutes that didn't fit before the due date */
  unfit: Record<string, number>
}

const initial: State = {
  loading: true,
  error: null,
  toast: null,
  profile: null,
  blocks: [],
  tasks: [],
  chunks: [],
  buddy: null,
  sessions: [],
  inventory: [],
  unfit: {},
}

export interface NewTask {
  title: string
  category: Category
  estimated_minutes: number
  due_at: string
  priority: 1 | 2 | 3
}

const ms = (iso: string) => new Date(iso).getTime()
const chunkKey = (taskId: string, s: number, e: number) => `${taskId}|${s}|${e}`

function useStore(repo: Repo, userId: string) {
  const [state, setState] = useState<State>(initial)
  const ref = useRef(state)
  const commit = useCallback((patch: Partial<State>) => {
    ref.current = { ...ref.current, ...patch }
    setState(ref.current)
  }, [])

  const fail = useCallback(
    (e: unknown) => commit({ error: e instanceof Error ? e.message : String(e) }),
    [commit],
  )
  /**
   * Queue a save. Saves run one at a time in the order they were made, so a task is
   * always stored before the calendar sessions that point at it. Errors show in the banner.
   */
  const queue = useRef<Promise<unknown>>(Promise.resolve())
  const pending = useRef(0)
  const persist = useCallback(
    (write: () => Promise<unknown>) => {
      pending.current++
      queue.current = queue.current
        .then(write)
        .catch(fail)
        .finally(() => pending.current--)
    },
    [fail],
  )
  // Closing or reloading the tab mid-save would drop the change, so ask first.
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (pending.current > 0) e.preventDefault()
    }
    window.addEventListener('beforeunload', onLeave)
    return () => window.removeEventListener('beforeunload', onLeave)
  }, [])

  const toastTimer = useRef<number | undefined>(undefined)
  const toast = useCallback(
    (msg: string) => {
      commit({ toast: msg })
      window.clearTimeout(toastTimer.current)
      toastTimer.current = window.setTimeout(() => commit({ toast: null }), 3500)
    },
    [commit],
  )

  /** Re-plan every open task around school and fixed chunks. Only changed chunks are written. */
  const replan = useCallback(() => {
    const s = ref.current
    if (!s.profile) return
    const now = new Date()
    const taskIds = new Set(s.tasks.map((t) => t.id))
    const open = new Set(s.tasks.filter((t) => t.status === 'open').map((t) => t.id))
    const keep: Chunk[] = []
    const candidates: Chunk[] = []
    const drop: Chunk[] = []
    for (const c of s.chunks) {
      if (!taskIds.has(c.task_id)) drop.push(c)
      else if (c.status === 'planned' && !open.has(c.task_id) && ms(c.end_at) > now.getTime()) drop.push(c)
      else if (c.status === 'planned' && !c.pinned && ms(c.start_at) >= now.getTime()) candidates.push(c)
      else keep.push(c)
    }
    const result = schedule({ blocks: s.blocks, prefs: s.profile, tasks: s.tasks, fixed: keep, now })
    const byKey = new Map(candidates.map((c) => [chunkKey(c.task_id, ms(c.start_at), ms(c.end_at)), c]))
    const reused: Chunk[] = []
    const fresh: Chunk[] = []
    for (const p of result.chunks) {
      const k = chunkKey(p.task_id, p.start.getTime(), p.end.getTime())
      const hit = byKey.get(k)
      if (hit) {
        reused.push(hit)
        byKey.delete(k)
      } else {
        fresh.push({
          id: uid(),
          task_id: p.task_id,
          start_at: p.start.toISOString(),
          end_at: p.end.toISOString(),
          status: 'planned',
          pinned: false,
        })
      }
    }
    drop.push(...byKey.values())
    commit({
      chunks: [...keep, ...reused, ...fresh],
      unfit: Object.fromEntries(result.unfit.map((u) => [u.task_id, u.minutesShort])),
    })
    persist(
      async () => {
        await repo.remove('scheduled_chunks', drop.map((c) => c.id))
        await repo.insert('scheduled_chunks', fresh)
      },
    )
  }, [commit, persist, repo])

  /** Planned chunks whose time has passed become "missed" so the scheduler finds them a new slot. */
  const markMissed = useCallback(() => {
    const now = Date.now()
    const missed = ref.current.chunks.filter((c) => c.status === 'planned' && ms(c.end_at) < now)
    if (!missed.length) return
    const ids = new Set(missed.map((c) => c.id))
    commit({ chunks: ref.current.chunks.map((c) => (ids.has(c.id) ? { ...c, status: 'missed' } : c)) })
    for (const c of missed) persist(() => repo.update('scheduled_chunks', c.id, { status: 'missed' }))
  }, [commit, persist, repo])

  // Initial load
  const loaded = useRef(false)
  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    ;(async () => {
      try {
        const [profiles, blocks, tasks, chunks, buddies, sessions, inventory] = await Promise.all([
          repo.list<Profile>('profiles'),
          repo.list<SchoolBlock>('school_blocks'),
          repo.list<Task>('tasks'),
          repo.list<Chunk>('scheduled_chunks'),
          repo.list<Buddy>('buddies'),
          repo.list<FocusSession>('focus_sessions'),
          repo.list<InventoryItem>('inventory'),
        ])
        let profile = profiles.find((p) => p.id === userId) ?? profiles[0]
        if (!profile) {
          profile = {
            id: userId,
            display_name: null,
            wake_time: '07:00',
            sleep_time: '23:00',
            no_work_after: '22:00',
            session_minutes: 45,
            streak: 0,
            last_active_date: null,
            relax_minutes_banked: 0,
          }
          await repo.insert('profiles', [profile])
        }
        let buddy = buddies[0] ?? null
        if (buddy) {
          const d = decay(buddy, new Date())
          // older buddies were blobs/dragons; everyone is a cat now
          buddy = { ...buddy, ...d, species: normalizeSpecies(buddy.species) }
          persist(() => repo.update('buddies', buddy.id, d))
        }
        // reminders are sent in the user's own time zone; keep it current if they travel
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
        if (profile.reminders_enabled && tz && profile.timezone !== tz) {
          profile = { ...profile, timezone: tz }
          const pid = profile.id
          persist(() => repo.update('profiles', pid, { timezone: tz }))
        }
        commit({ loading: false, profile, blocks, tasks, chunks, buddy, sessions, inventory })
        markMissed()
        replan()
      } catch (e) {
        commit({ loading: false })
        fail(e)
      }
    })()
  }, [commit, fail, markMissed, persist, replan, repo, userId])

  // Keep the plan fresh while the tab is open
  useEffect(() => {
    const t = window.setInterval(() => {
      markMissed()
      replan()
    }, 5 * 60_000)
    return () => window.clearInterval(t)
  }, [markMissed, replan])

  // ---------- helpers ----------
  const touchStreak = useCallback((): number => {
    const p = ref.current.profile!
    const now = new Date()
    const today = dateKey(now)
    if (p.last_active_date === today) return p.streak
    const streak = nextStreak(p.last_active_date, p.streak, today, dateKey(addDays(now, -1)))
    commit({ profile: { ...p, streak, last_active_date: today } })
    persist(() => repo.update('profiles', p.id, { streak, last_active_date: today }))
    return streak
  }, [commit, persist, repo])

  const rewardBuddy = useCallback(
    (r: Reward) => {
      const b = ref.current.buddy
      if (!b) return
      const { leveledUp, ...next } = applyReward(b, r)
      commit({ buddy: { ...b, ...next } })
      persist(() => repo.update('buddies', b.id, next))
      if (leveledUp) toast(`${b.name} grew to level ${next.level}!`)
    },
    [commit, persist, repo, toast],
  )

  const patchTask = useCallback(
    (id: string, patch: Partial<Task>) => {
      commit({ tasks: ref.current.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })
      persist(() => repo.update('tasks', id, patch))
    },
    [commit, persist, repo],
  )

  const patchChunk = useCallback(
    (id: string, patch: Partial<Chunk>) => {
      commit({ chunks: ref.current.chunks.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
      persist(() => repo.update('scheduled_chunks', id, patch))
    },
    [commit, persist, repo],
  )

  // ---------- actions ----------
  const actions = useMemo(() => {
    const completeTask = (id: string) => {
      const t = ref.current.tasks.find((x) => x.id === id)
      if (!t || t.status === 'done') return
      const streak = touchStreak()
      patchTask(id, { status: 'done', completed_at: new Date().toISOString() })
      const r = completionReward(t, streak)
      track('task_completed', { category: t.category, on_time: Date.now() <= new Date(t.due_at).getTime(), minutes: t.estimated_minutes })
      rewardBuddy(r)
      toast(`Done! +${r.xp} xp and ${r.coins} coins`)
      replan()
    }

    return {
      clearError: () => commit({ error: null }),
      toast,

      saveProfile(patch: Partial<Profile>) {
        const p = ref.current.profile!
        commit({ profile: { ...p, ...patch } })
        persist(() => repo.update('profiles', p.id, patch))
        replan()
      },

      // School schedule
      /** Add one or more blocks (e.g. the same class on several days) in a single save. */
      addBlocks(blocks: Omit<SchoolBlock, 'id'>[]) {
        if (!blocks.length) return
        const rows = blocks.map((b) => ({ id: uid(), ...b }))
        commit({ blocks: [...ref.current.blocks, ...rows] })
        persist(() => repo.insert('school_blocks', rows))
        track('schedule_block_added', { days: rows.length })
        replan()
      },
      updateBlock(id: string, patch: Partial<SchoolBlock>) {
        commit({ blocks: ref.current.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) })
        persist(() => repo.update('school_blocks', id, patch))
        replan()
      },
      deleteBlock(id: string) {
        commit({ blocks: ref.current.blocks.filter((b) => b.id !== id) })
        persist(() => repo.remove('school_blocks', [id]))
        replan()
      },
      /** Replace the blocks on each target weekday with copies of `from`. */
      copyDay(from: number, to: number[]) {
        const src = ref.current.blocks.filter((b) => b.weekday === from)
        const removed = ref.current.blocks.filter((b) => to.includes(b.weekday))
        const copies = to.flatMap((wd) => src.map((b) => ({ ...b, id: uid(), weekday: wd })))
        commit({ blocks: [...ref.current.blocks.filter((b) => !to.includes(b.weekday)), ...copies] })
        persist(
          async () => {
            await repo.remove('school_blocks', removed.map((b) => b.id))
            await repo.insert('school_blocks', copies)
          },
        )
        replan()
      },

      // Tasks
      addTask(t: NewTask) {
        const row: Task = {
          id: uid(),
          ...t,
          logged_minutes: 0,
          status: 'open',
          created_at: new Date().toISOString(),
          completed_at: null,
        }
        commit({ tasks: [...ref.current.tasks, row] })
        persist(() => repo.insert('tasks', [row]))
        track('task_added', { category: row.category, minutes: row.estimated_minutes, important: row.priority === 3 })
        replan()
      },
      updateTask(id: string, patch: Partial<Task>) {
        patchTask(id, patch)
        replan()
      },
      deleteTask(id: string) {
        const chunkIds = ref.current.chunks.filter((c) => c.task_id === id).map((c) => c.id)
        commit({
          tasks: ref.current.tasks.filter((t) => t.id !== id),
          chunks: ref.current.chunks.filter((c) => c.task_id !== id),
        })
        persist(
          async () => {
            await repo.remove('scheduled_chunks', chunkIds)
            await repo.remove('tasks', [id])
          },
        )
        replan()
      },
      completeTask,
      reopenTask(id: string) {
        patchTask(id, { status: 'open', completed_at: null })
        replan()
      },

      // Calendar chunks
      moveChunk(id: string, start: Date) {
        const c = ref.current.chunks.find((x) => x.id === id)
        if (!c) return
        const len = ms(c.end_at) - ms(c.start_at)
        patchChunk(id, {
          start_at: start.toISOString(),
          end_at: new Date(start.getTime() + len).toISOString(),
          pinned: true,
          status: 'planned',
        })
        replan()
      },
      unpinChunk(id: string) {
        patchChunk(id, { pinned: false })
        replan()
      },
      markChunkMissed(id: string) {
        patchChunk(id, { status: 'missed' })
        replan()
      },

      /** Record focused time from a room. Awards points, banks relax time, advances the task. */
      logFocus(opts: { room: RoomKey; taskId: string | null; chunkId: string | null; minutes: number; startedAt: Date }) {
        const { room, taskId, chunkId, minutes, startedAt } = opts
        if (minutes <= 0) return
        const streak = touchStreak()
        const session: FocusSession = { id: uid(), task_id: taskId, room, started_at: startedAt.toISOString(), minutes }
        commit({ sessions: [...ref.current.sessions, session] })
        persist(() => repo.insert('focus_sessions', [session]))

        const p = ref.current.profile!
        const banked = p.relax_minutes_banked + minutes
        commit({ profile: { ...p, relax_minutes_banked: banked } })
        persist(() => repo.update('profiles', p.id, { relax_minutes_banked: banked }))

        const r = focusReward(minutes, streak)
        track('focus_session_saved', { room, minutes })
        rewardBuddy(r)

        if (chunkId) patchChunk(chunkId, { status: 'done' })
        const t = taskId ? ref.current.tasks.find((x) => x.id === taskId) : undefined
        if (t) {
          const logged = t.logged_minutes + minutes
          patchTask(t.id, { logged_minutes: logged })
        }
        toast(`${minutes} min of focus saved. +${r.xp} xp, ${r.coins} coins`)
        replan()
      },

      // Buddy
      createBuddy(species: Species, name: string) {
        const b: Buddy = {
          id: uid(),
          species,
          name,
          level: 1,
          xp: 0,
          coins: 20,
          energy: 80,
          happiness: 80,
          knowledge: 50,
          equipped_hat: null,
          last_decay_at: new Date().toISOString(),
        }
        commit({ buddy: b })
        persist(() => repo.insert('buddies', [b]))
        track('buddy_adopted', { coat: species })
      },
      buy(item: ShopItem) {
        const b = ref.current.buddy
        if (!b || b.coins < item.price) return
        if (item.kind === 'food') {
          const next = feed(b, item)
          commit({ buddy: { ...b, ...next } })
          persist(() => repo.update('buddies', b.id, next))
          toast(`${item.emoji} ${b.name} loved the ${item.name.toLowerCase()}!`)
          track('shop_purchase', { kind: 'food', item: item.id })
        } else {
          if (ref.current.inventory.some((i) => i.item_id === item.id)) return
          const row = { id: uid(), item_id: item.id }
          const coins = b.coins - item.price
          commit({ inventory: [...ref.current.inventory, row], buddy: { ...b, coins, equipped_hat: item.id } })
          persist(() => repo.insert('inventory', [row]))
          track('shop_purchase', { kind: 'hat', item: item.id })
          persist(() => repo.update('buddies', b.id, { coins, equipped_hat: item.id }))
          toast(`New ${item.name.toLowerCase()}! It looks great.`)
        }
      },
      equipHat(itemId: string | null) {
        const b = ref.current.buddy
        if (!b) return
        commit({ buddy: { ...b, equipped_hat: itemId } })
        persist(() => repo.update('buddies', b.id, { equipped_hat: itemId }))
      },
      renameBuddy(name: string) {
        const b = ref.current.buddy
        if (!b) return
        commit({ buddy: { ...b, name } })
        persist(() => repo.update('buddies', b.id, { name }))
      },
      setCoat(species: Species) {
        const b = ref.current.buddy
        if (!b) return
        commit({ buddy: { ...b, species } })
        persist(() => repo.update('buddies', b.id, { species }))
        track('coat_changed', { coat: species })
      },

      /** Spend banked focus minutes on a screen-free break. */
      takeRelaxBreak(minutes: number) {
        const p = ref.current.profile!
        const banked = Math.max(0, p.relax_minutes_banked - RELAX_COST_MIN)
        commit({ profile: { ...p, relax_minutes_banked: banked } })
        persist(() => repo.update('profiles', p.id, { relax_minutes_banked: banked }))
        const session: FocusSession = { id: uid(), task_id: null, room: 'relax', started_at: new Date().toISOString(), minutes }
        commit({ sessions: [...ref.current.sessions, session] })
        persist(() => repo.insert('focus_sessions', [session]))
        const b = ref.current.buddy
        if (b) {
          const next = { happiness: Math.min(STAT_MAX, b.happiness + 15), energy: Math.min(STAT_MAX, b.energy + 15) }
          commit({ buddy: { ...b, ...next } })
          persist(() => repo.update('buddies', b.id, next))
        }
        toast('Welcome back. Your buddy feels refreshed too.')
        track('relax_break_taken', { minutes })
      },
    }
  }, [commit, patchChunk, patchTask, persist, replan, repo, rewardBuddy, toast, touchStreak])

  return { state, actions, mode: repo.mode }
}

type Store = ReturnType<typeof useStore>
const Ctx = createContext<Store | null>(null)

export function DataProvider({ repo, userId, children }: { repo: Repo; userId: string; children: ReactNode }) {
  const store = useStore(repo, userId)
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useData(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useData outside DataProvider')
  return s
}
