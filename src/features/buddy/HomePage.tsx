import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../../lib/store'
import { evolutionStage, RELAX_COST_MIN, STAGE_NAMES, xpForLevel } from '../../lib/rewards'
import { categoryInfo, type Chunk, type Task } from '../../lib/types'
import { dateKey, fmtDuration, fmtTime } from '../../lib/time'
import { placedDecor, type DecorItem } from '../../lib/decor'
import { earnedTraitIds, milestones, personalityTitle, studyStats, traitStatuses } from '../../lib/journal'
import { roomLink } from '../../components/roomLink'
import { Icon, type IconName } from '../../components/Icon'
import { CatRoom } from './CatRoom'
import { Shop } from './Shop'
import { dayPart, type DayPart } from './RoomScene'
import { newUnlocks, markUnlocksSeen } from './unlocks'

function greeting(part: DayPart, h: number) {
  if (h < 5) return 'Still up?'
  if (part === 'dawn' || h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function HomePage() {
  const { state } = useData()
  const b = state.buddy!
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(t)
  }, [])
  const [preview, setPreview] = useState<DecorItem | null>(null)

  const stage = evolutionStage(b.level)
  const part = dayPart(now)
  const today = dateKey(now)
  const tasksById = new Map(state.tasks.map((t) => [t.id, t]))

  // the cat's personality and memories, from your study history
  const stats = useMemo(() => studyStats(state.sessions, state.tasks), [state.sessions, state.tasks])
  const traits = useMemo(() => traitStatuses(stats), [stats])
  const earned = useMemo(() => earnedTraitIds(traits), [traits])
  const mems = useMemo(() => milestones(state.sessions, state.tasks, b), [state.sessions, state.tasks, b])
  const title = personalityTitle(traits)
  const [fresh, setFresh] = useState(() => newUnlocks(traits, mems))
  useEffect(() => setFresh(newUnlocks(traits, mems)), [traits, mems])

  const plan = state.chunks
    .filter((c) => c.status === 'planned' && new Date(c.end_at) > now && dateKey(new Date(c.start_at)) === today && tasksById.has(c.task_id))
    .sort((a, z) => new Date(a.start_at).getTime() - new Date(z.start_at).getTime())
  const next = plan[0] ? { chunk: plan[0], task: tasksById.get(plan[0].task_id)! } : null
  const doneToday =
    state.tasks.filter((t) => t.completed_at && dateKey(new Date(t.completed_at)) === today).length +
    state.sessions.filter((s) => s.room !== 'relax' && dateKey(new Date(s.started_at)) === today).length
  const focusedToday = state.sessions.filter((s) => s.room !== 'relax' && dateKey(new Date(s.started_at)) === today).reduce((sum, s) => sum + s.minutes, 0)
  const plannedMin = plan.reduce((s, c) => s + (new Date(c.end_at).getTime() - new Date(c.start_at).getTime()) / 60_000, 0)

  const decor = { ...placedDecor(b), ...(preview ? { [preview.slot]: preview.id } : {}) }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{greeting(part, now.getHours())}</h1>
          <p className="mt-1 text-ink/60">
            {now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            {plan.length > 0 && ` · ${fmtDuration(Math.round(plannedMin))} of work planned for the rest of today`}
          </p>
        </div>
      </div>

      {fresh.length > 0 && (
        <div className="anim-pop card flex flex-wrap items-center gap-3 border-mustard bg-mustard-soft p-4">
          <span className="text-3xl" aria-hidden>
            {fresh[0].sticker}
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg font-semibold">{fresh.length === 1 ? fresh[0].title : `${fresh.length} new memories!`}</div>
            <div className="text-sm text-ink/65">{fresh.length === 1 ? fresh[0].detail : fresh.map((f) => f.title).slice(0, 3).join(' · ')}</div>
          </div>
          <Link to="/memories" className="btn-primary" onClick={() => markUnlocksSeen(traits, mems)}>
            See them
          </Link>
          <button
            className="text-sm font-bold text-ink/45 hover:text-ink"
            onClick={() => {
              markUnlocksSeen(traits, mems)
              setFresh([])
            }}
          >
            Later
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.65fr_1fr]">
        <section className="card p-2.5">
          <CatRoom decor={decor} notesToday={doneToday} focusedToday={focusedToday} next={next} traits={traits} />

          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-3 pb-2 pt-4">
            <div className="min-w-44 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <h2 className="font-display text-2xl font-semibold">{b.name}</h2>
                <span className="whitespace-nowrap text-sm font-bold text-ink/50">
                  {STAGE_NAMES[stage].toLowerCase()} · lv {b.level}
                </span>
              </div>
              <Link to="/memories" className="group mt-0.5 inline-flex items-center gap-1 font-hand text-xl text-accent hover:text-accent-dark">
                {title ? `a ${title.toLowerCase()}` : 'still figuring out who they are'}
                <Icon name="arrow" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </Link>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/[.07]">
                <div className="h-full rounded-full bg-mustard transition-all duration-700" style={{ width: `${(b.xp / xpForLevel(b.level)) * 100}%` }} />
              </div>
              <div className="mt-1 text-xs font-semibold text-ink/50">
                {xpForLevel(b.level) - b.xp} xp to level {b.level + 1}
                {stage < 3 && ` · grows into a ${STAGE_NAMES[stage + 1].toLowerCase()} at level ${[5, 15, 30][stage]}`}
              </div>
            </div>
            <div className="grid w-full grid-cols-3 gap-4 sm:w-auto sm:min-w-80 sm:flex-1">
              <Meter icon="bolt" label="Energy" value={b.energy} color="#dfa63b" />
              <Meter icon="heart" label="Happy" value={b.happiness} color="#cf6440" />
              <Meter icon="bulb" label="Smarts" value={b.knowledge} color="#6f63a6" />
            </div>
          </div>
          <p className="px-3 pb-2 text-xs font-semibold text-ink/40">Tap {b.name} to pet them.</p>
        </section>

        <div className="space-y-6">
          <TodayCard plan={plan} tasksById={tasksById} now={now} focusedToday={focusedToday} />
          <Shop earnedTraits={earned} preview={preview} onPreview={setPreview} />
        </div>
      </div>
    </div>
  )
}

function Meter({ icon, label, value, color }: { icon: IconName; label: string; value: number; color: string }) {
  const filled = Math.round(value / 10)
  return (
    <div>
      <div className="mb-1 flex items-center gap-1 text-xs font-extrabold text-ink/60">
        <Icon name={icon} className="h-3.5 w-3.5" style={{ color }} strokeWidth={2.4} />
        {label}
      </div>
      <div className="flex gap-[3px]" role="meter" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="h-3 flex-1 rounded-[3px]" style={{ background: i < filled ? color : 'rgb(47 38 34 / .08)' }} />
        ))}
      </div>
    </div>
  )
}

function TodayCard({ plan, tasksById, now, focusedToday }: { plan: Chunk[]; tasksById: Map<string, Task>; now: Date; focusedToday: number }) {
  const { state } = useData()
  const p = state.profile!
  const banked = Math.min(p.relax_minutes_banked, RELAX_COST_MIN)
  const ready = p.relax_minutes_banked >= RELAX_COST_MIN

  return (
    <section className="card overflow-hidden">
      <div className="flex items-baseline justify-between px-5 pb-2 pt-4">
        <h2 className="font-display text-xl font-semibold">Today</h2>
        <span className="text-xs font-bold text-ink/45">{focusedToday ? `${fmtDuration(focusedToday)} focused so far` : 'no focus time yet'}</span>
      </div>

      {state.blocks.length === 0 ? (
        <Link to="/settings" className="mx-5 mb-4 block rounded-xl bg-accent-soft px-4 py-3 text-sm font-bold text-accent-dark">
          First things first: add your school schedule so I can plan around it →
        </Link>
      ) : plan.length === 0 ? (
        <div className="ruled px-5 pb-3" style={{ minHeight: 132 }}>
          <p className="pt-3 font-hand text-2xl leading-[44px] text-ink/55">Nothing else planned today.</p>
          <Link to="/todos" className="font-hand text-2xl leading-[44px] text-accent">add something to your list →</Link>
        </div>
      ) : (
        <ul className="ruled px-5">
          {plan.slice(0, 5).map((c) => {
            const t = tasksById.get(c.task_id)!
            const info = categoryInfo(t.category)
            const live = new Date(c.start_at) <= now
            return (
              <li key={c.id} className="flex h-11 items-center gap-3">
                <span className="w-14 shrink-0 font-display text-sm font-semibold text-ink/55">{fmtTime(new Date(c.start_at)).replace(' ', '').toLowerCase()}</span>
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: info.color }} />
                <span className="min-w-0 flex-1 truncate font-bold">{t.title}</span>
                {live && <span className="rounded-md bg-accent-soft px-1.5 text-[11px] font-extrabold text-accent-dark">now</span>}
                <Link to={roomLink(t, c)} className="group flex items-center gap-0.5 text-sm font-extrabold text-accent hover:text-accent-dark" aria-label={`Start ${t.title}`}>
                  start
                  <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
              </li>
            )
          })}
          {plan.length > 5 && (
            <li className="flex h-11 items-center text-sm font-bold text-ink/45">
              <Link to="/calendar">+ {plan.length - 5} more on the calendar</Link>
            </li>
          )}
        </ul>
      )}

      <Link
        to="/rooms/relax"
        className={`flex items-center gap-3 border-t-[1.5px] border-line px-5 py-3 text-sm font-bold ${ready ? 'bg-sage-soft text-ink' : 'text-ink/55 hover:text-ink'}`}
      >
        <Icon name="relax" className="h-5 w-5 shrink-0 text-sage" />
        <span className="flex-1">{ready ? 'Your screen break is ready' : `Screen break unlocks after ${RELAX_COST_MIN - banked} more focus min`}</span>
        {!ready && (
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-ink/[.08]">
            <span className="block h-full rounded-full bg-sage" style={{ width: `${(banked / RELAX_COST_MIN) * 100}%` }} />
          </span>
        )}
        {ready && <Icon name="arrow" className="h-4 w-4" />}
      </Link>
    </section>
  )
}

