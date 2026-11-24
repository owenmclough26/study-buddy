import { Link } from 'react-router-dom'
import { useData } from '../../lib/store'
import { RELAX_COST_MIN } from '../../lib/rewards'
import { Icon } from '../../components/Icon'
import { THEMES } from './rooms'
import { RelaxScene } from './scenes'

export function RoomsPage() {
  const { state } = useData()
  const p = state.profile!
  const openCount = (cat: string) => state.tasks.filter((t) => t.status === 'open' && t.category === cat).length
  const banked = Math.min(p.relax_minutes_banked, RELAX_COST_MIN)
  const relaxReady = p.relax_minutes_banked >= RELAX_COST_MIN

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Rooms</h1>
        <p className="mt-1 text-ink/60">Every kind of work gets its own space. Pressing Start on a to-do brings you straight to the right one.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {Object.values(THEMES).map((t) => {
          const n = openCount(t.key)
          return (
            <Link key={t.key} to={`/rooms/${t.key}`} className="card group overflow-hidden p-2 transition hover:-translate-y-1">
              <div className="relative aspect-[16/8] overflow-hidden rounded-[14px]" style={{ background: t.bg }}>
                {t.scene}
              </div>
              <div className="flex items-center gap-3 px-3 pb-2 pt-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink/[.05]">
                  <Icon name={t.icon} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-xl font-semibold tracking-tight">{t.title}</div>
                  <div className="truncate text-sm text-ink/55">{t.tagline}</div>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs font-extrabold text-ink/50 group-hover:text-accent">
                  {n ? `${n} waiting` : 'open'}
                  <Icon name="arrow" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* the break room sits on its own: it's earned, not a place to work */}
      <Link to="/rooms/relax" className="card group relative block overflow-hidden p-2 transition hover:-translate-y-1">
        <div className="relative h-44 overflow-hidden rounded-[14px] sm:h-40">
          <RelaxScene />
          <div className="absolute inset-0 bg-gradient-to-r from-[rgb(36_56_44/.75)] via-[rgb(36_56_44/.35)] to-transparent" />
          <div className="relative flex h-full flex-col justify-center gap-1 px-6 text-paper">
            <div className="flex items-center gap-2">
              <Icon name="relax" className="h-5 w-5" />
              <span className="font-display text-2xl font-semibold tracking-tight">Relax Room</span>
            </div>
            <p className="max-w-sm text-sm text-paper/80">Focus for {RELAX_COST_MIN} minutes and you earn a real, screen-free break outside.</p>
            <div className="mt-2 flex items-center gap-2 text-xs font-extrabold">
              {relaxReady ? (
                <span className="rounded-md bg-paper px-2 py-1 text-[#2f4a3a]">Your break is ready →</span>
              ) : (
                <>
                  <span className="h-1.5 w-28 overflow-hidden rounded-full bg-paper/25">
                    <span className="block h-full rounded-full bg-paper" style={{ width: `${(banked / RELAX_COST_MIN) * 100}%` }} />
                  </span>
                  {RELAX_COST_MIN - banked} focus min to go
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
