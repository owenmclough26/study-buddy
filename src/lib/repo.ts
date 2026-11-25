import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type TableName =
  | 'profiles'
  | 'school_blocks'
  | 'tasks'
  | 'scheduled_chunks'
  | 'buddies'
  | 'focus_sessions'
  | 'inventory'
  | 'external_calendars'

type Row = { id: string } & Record<string, unknown>

/** Minimal storage interface. Every table has an `id` column; ids are generated on the client. */
export interface Repo {
  mode: 'cloud' | 'local'
  list<T>(table: TableName): Promise<T[]>
  insert<T extends { id: string }>(table: TableName, rows: T[]): Promise<void>
  update(table: TableName, id: string, patch: Record<string, unknown>): Promise<void>
  remove(table: TableName, ids: string[]): Promise<void>
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null

export function cloudRepo(client: SupabaseClient): Repo {
  const check = (error: { message: string } | null) => {
    if (error) throw new Error(error.message)
  }
  return {
    mode: 'cloud',
    async list<T>(table: TableName) {
      const { data, error } = await client.from(table).select('*')
      check(error)
      return (data ?? []) as T[]
    },
    async insert(table, rows) {
      if (!rows.length) return
      const { error } = await client.from(table).insert(rows)
      check(error)
    },
    async update(table, id, patch) {
      const { error } = await client.from(table).update(patch).eq('id', id)
      check(error)
    },
    async remove(table, ids) {
      if (!ids.length) return
      const { error } = await client.from(table).delete().in('id', ids)
      check(error)
    },
  }
}

/** Browser-only storage, used when Supabase isn't configured (guest mode). */
export function localRepo(): Repo {
  const k = (t: TableName) => `studybuddy:${t}`
  const read = (t: TableName): Row[] => {
    try {
      return JSON.parse(localStorage.getItem(k(t)) ?? '[]')
    } catch {
      return []
    }
  }
  const write = (t: TableName, rows: Row[]) => {
    try {
      localStorage.setItem(k(t), JSON.stringify(rows))
    } catch {
      /* storage full or blocked; keep working in memory */
    }
  }
  return {
    mode: 'local',
    async list<T>(t: TableName) {
      return read(t) as unknown as T[]
    },
    async insert(t, rows) {
      write(t, [...read(t), ...(rows as unknown as Row[])])
    },
    async update(t, id, patch) {
      write(
        t,
        read(t).map((r) => (r.id === id ? { ...r, ...patch } : r)),
      )
    },
    async remove(t, ids) {
      const set = new Set(ids)
      write(
        t,
        read(t).filter((r) => !set.has(r.id)),
      )
    },
  }
}

export const uid = () => crypto.randomUUID()
