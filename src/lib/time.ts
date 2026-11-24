/** 'HH:MM' or 'HH:MM:SS' → minutes since midnight */
export function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** minutes since midnight → 'HH:MM' */
export function minutesToHm(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes())
}

export function atMinutes(day: Date, minutes: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes)
}

/** Local 'YYYY-MM-DD' */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Monday of the week containing d */
export function startOfWeek(d: Date): Date {
  const s = startOfDay(d)
  const dow = (s.getDay() + 6) % 7 // Monday = 0
  return addDays(s, -dow)
}

export function fmtTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function fmtHm12(hm: string): string {
  return fmtTime(atMinutes(new Date(), hmToMinutes(hm)))
}

export function fmtDay(d: Date): string {
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

export function fmtDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

/** value for <input type="datetime-local"> */
export function toLocalInput(d: Date): string {
  return `${dateKey(d)}T${minutesToHm(d.getHours() * 60 + d.getMinutes())}`
}

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
/** Display order, Monday first */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
