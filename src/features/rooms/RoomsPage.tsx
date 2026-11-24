import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../../lib/store'
import { RELAX_COST_MIN } from '../../lib/rewards'
import { Icon, type IconName } from '../../components/Icon'
import { THEMES } from './rooms'

const RELAX = {
  key: 'relax',
  title: 'Relax Room',
  tagline: 'A screen-free break you earn by focusing.',
  icon: 'relax' as IconName,
  bg: 'linear-gradient(165deg, #2f5a44 0%, #5f8f68 100%)',
  dark: true,
}

export function RoomsPage() {
  const { state } = useData()
  const p = state.profile!
  const openCount = (cat: string) => state.tasks.filter((t) => t.status === 'open' && t.category === cat).length
  const relaxReady = p.relax_minutes_banked >= RELAX_COST_MIN
  const rooms = [...Object.values(THEMES), RELAX]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Rooms</h1>
        <p className="mt-1 text-ink/60">Every kind of work gets its own space. Pressing Start on a to-do brings you straight to the right one.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((t) => {
          const n = t.key === 'relax' ? null : openCount(t.key)
          const meta =
            t.key === 'relax'
              ? relaxReady
                ? 'Your break is ready'
                : `${RELAX_COST_MIN - Math.min(p.relax_minutes_banked, RELAX_COST_MIN)} focus min to unlock`
              : n
                ? `${n} to-do${n === 1 ? '' : 's'} waiting`
                : 'nothing waiting'
          return (
            <Link
              key={t.key}
              to={`/rooms/${t.key}`}
              className={`group relative flex min-h-48 flex-col justify-between overflow-hidden rounded-[22px] p-5 shadow-[0_3px_0_rgb(0_0_0/.12)] transition hover:-translate-y-1 ${t.dark ? 'text-paper' : 'text-ink'}`}
              style={{ background: t.bg }}
            >
              {'decor' in t && (t.decor as ReactNode)}
              <span className={`relative grid h-11 w-11 place-items-center rounded-2xl ${t.dark ? 'bg-white/12' : 'bg-ink/[.06]'} transition group-hover:scale-105`}>
                <Icon name={t.icon} className="h-6 w-6" />
              </span>
              <div className="relative">
                <div className="font-display text-2xl font-semibold tracking-tight">{t.title}</div>
                <div className={`text-sm ${t.dark ? 'text-paper/70' : 'text-ink/60'}`}>{t.tagline}</div>
                <div className={`mt-3 flex items-center gap-1 text-xs font-extrabold ${t.dark ? 'text-paper/80' : 'text-ink/55'}`}>
                  {meta}
                  <Icon name="arrow" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
