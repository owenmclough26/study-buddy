import type { Chunk, Task } from '../lib/types'

export function roomLink(task: Task, chunk?: Chunk | null): string {
  const q = new URLSearchParams({ task: task.id })
  if (chunk) q.set('chunk', chunk.id)
  return `/rooms/${task.category}?${q}`
}
