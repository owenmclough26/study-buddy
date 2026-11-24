import { useEffect, useState } from 'react'

/** State that survives reloads in this browser (for notes and checklists inside rooms). */
export function usePersisted<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      setValue(raw ? (JSON.parse(raw) as T) : initial)
    } catch {
      setValue(initial)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  const set = (v: T) => {
    setValue(v)
    try {
      localStorage.setItem(key, JSON.stringify(v))
    } catch {
      /* storage blocked */
    }
  }
  return [value, set]
}
