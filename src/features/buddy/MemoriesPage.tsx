import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../../lib/store'
import { mood } from '../../lib/rewards'
import { diary, milestones, personalityTitle, studyStats, traitStatuses } from '../../lib/journal'
import { DECOR } from '../../lib/decor'
import { fmtDuration } from '../../lib/time'
import { Icon } from '../../components/Icon'
import { BuddySprite } from './BuddySprite'
import { markUnlocksSeen } from './unlocks'

const prettyDate = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date()
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

export function MemoriesPage() {
  const { state } = useData()
  const b = state.buddy!
  const stats = useMemo(() => studyStats(state.sessions, state.tasks), [state.sessions, state.tasks])
  const traits = useMemo(() => traitStatuses(stats), [stats])
  const mems = useMemo(() => milestones(state.sessions, state.tasks, b), [state.sessions, state.tasks, b])
  const entries = useMemo(() => diary(state.sessions, state.tasks, b.name), [state.sessions, state.tasks, b.name])
  const title = personalityTitle(traits)
  const earnedCount = mems.filter((m) => m.earned).length

  // visiting the page counts as celebrating anything new
  useEffect(() => markUnlocksSeen(traits, mems), [traits, mems])

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/" className="btn-ghost grid h-10 w-10 place-items-center p-0" aria-label="Back home" title="Back home">
          <Icon name="back" className="h-5 w-5" />
        </Link>
        <div className="w-20 shrink-0">
          <BuddySprite species={b.species} level={b.level} mood={mood(b)} hat={b.equipped_hat} size="fill" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{b.name}</h1>
          <p className="font-hand text-2xl text-accent">{title ? `a ${title.toLowerCase()}` : 'still figuring out who they are'}</p>
          <p className="text-sm text-ink/55">
            {fmtDuration(stats.totalMinutes)} focused together · {stats.completedTasks} to-dos done · best streak {stats.longestStreak} day{stats.longestStreak === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* personality */}
      <section>
        <h2 className="font-display text-2xl font-semibold">Personality</h2>
        <p className="mb-4 text-sm text-ink/55">Your cat picks up traits from how you study. Each one changes what it says and unlocks something for the room that can’t be bought.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {traits.map((t) => {
            const reward = DECOR.find((d) => d.trait === t.def.id)
            return (
              <div key={t.def.id} className={`card flex gap-3 p-4 ${t.earned ? '' : 'opacity-80'}`}>
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-lg font-semibold text-paper"
                  style={{ background: t.earned ? t.def.color : 'rgb(47 38 34 / .2)' }}
                >
                  {t.def.name[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-lg font-semibold">{t.def.name}</span>
                    {t.earned && <span className="rounded-md bg-sage-soft px-1.5 text-[11px] font-extrabold text-ink/70">earned</span>}
                  </div>
                  <p className="text-[13px] text-ink/60">{t.def.how}</p>
                  {!t.earned && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/[.08]">
                        <span className="block h-full rounded-full" style={{ width: `${t.progress * 100}%`, background: t.def.color }} />
                      </span>
                      <span className="text-[11px] font-bold text-ink/45">
                        {Math.min(t.current, t.def.goal)}/{t.def.goal}
                      </span>
                    </div>
                  )}
                  {reward && (
                    <p className="mt-1.5 text-[12px] font-semibold text-ink/50">
                      {t.earned ? 'Unlocked' : 'Unlocks'}: <span className="text-ink/75">{reward.name}</span>
                      {t.earned && (
                        <>
                          {' '}
                          · <Link to="/" className="text-accent hover:underline">place it in Room</Link>
                        </>
                      )}
                    </p>
                  )}
                  {t.earned && <p className="mt-1 font-hand text-lg leading-tight text-ink/60">“{t.def.lines[0]}”</p>}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* milestones */}
      <section>
        <h2 className="font-display text-2xl font-semibold">
          Memories <span className="text-base font-bold text-ink/35">{earnedCount}/{mems.length}</span>
        </h2>
        <p className="mb-4 text-sm text-ink/55">Big moments get a sticker on the board.</p>
        <div className="card grid grid-cols-2 gap-3 bg-[#c99a6a] p-4 sm:grid-cols-4" style={{ boxShadow: 'inset 0 0 0 8px #8c5f3d' }}>
          {mems.map((m, i) => (
            <div
              key={m.id}
              className={`relative rounded-sm p-3 pt-4 text-center shadow-[0_3px_6px_rgb(0_0_0/.18)] ${m.earned ? 'bg-paper' : 'bg-[#e7d6bd]'}`}
              style={{ transform: `rotate(${[-3, 2, -1, 3, -2, 1, 2, -3][i % 8]}deg)` }}
            >
              <span className="absolute left-1/2 top-1 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-accent shadow" />
              <div className={`text-3xl ${m.earned ? '' : 'opacity-30 grayscale'}`}>{m.sticker}</div>
              <div className={`mt-1 text-[13px] font-bold leading-tight ${m.earned ? '' : 'text-ink/45'}`}>{m.earned ? m.title : '???'}</div>
              <div className="mt-0.5 text-[11px] text-ink/50">{m.earned ? (m.on ? prettyDate(m.on) : 'earned') : m.how}</div>
            </div>
          ))}
        </div>
      </section>

      {/* diary */}
      <section>
        <h2 className="font-display text-2xl font-semibold">{b.name}’s diary</h2>
        <p className="mb-4 text-sm text-ink/55">Written by your cat, about the days you studied together.</p>
        {entries.length === 0 ? (
          <div className="card ruled p-5">
            <p className="font-hand text-2xl leading-[44px] text-ink/55">no entries yet. let’s go study something so i have stuff to write about!</p>
          </div>
        ) : (
          <div className="card divide-y divide-dashed divide-line">
            {entries.map((e) => (
              <article key={e.date} className="p-5">
                <div className="text-xs font-extrabold uppercase tracking-wide text-ink/40">{prettyDate(e.date)}</div>
                <p className="mt-1 font-hand text-2xl leading-snug text-ink/80">{e.text}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
