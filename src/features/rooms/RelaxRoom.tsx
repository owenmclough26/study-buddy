import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../../lib/store'
import { RELAX_BREAK_MIN, RELAX_COST_MIN } from '../../lib/rewards'
import { BuddySprite } from '../buddy/BuddySprite'
import { Icon } from '../../components/Icon'

const IDEAS = ['Go outside for a few minutes', 'Stretch, then grab some water', 'Talk to someone in person', 'Look out a window at something far away', 'Have a snack away from your desk', 'Put on a song and move around']

/** The relax room tells you to get off your computer. You earn it with focus time. */
export function RelaxRoom() {
  const { state, actions } = useData()
  const p = state.profile!
  const b = state.buddy!
  const ready = p.relax_minutes_banked >= RELAX_COST_MIN
  const [phase, setPhase] = useState<'intro' | 'away' | 'back'>('intro')
  const [left, setLeft] = useState(RELAX_BREAK_MIN * 60)
  const endAt = useRef(0)
  const idea = IDEAS[new Date().getMinutes() % IDEAS.length]

  useEffect(() => {
    if (phase !== 'away') return
    const t = window.setInterval(() => {
      const s = Math.max(0, Math.round((endAt.current - Date.now()) / 1000))
      setLeft(s)
      if (s === 0) {
        setPhase('back')
        actions.takeRelaxBreak(RELAX_BREAK_MIN)
      }
    }, 500)
    return () => window.clearInterval(t)
  }, [phase, actions])

  return (
    <div className="relative grid min-h-[78vh] place-items-center overflow-hidden rounded-3xl p-6 text-center text-white" style={{ background: 'linear-gradient(170deg, #24473a 0%, #3f6e52 55%, #6f9a6d 100%)' }}>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="anim-breathe h-[28rem] w-[28rem] rounded-full bg-white/10" />
      </div>
      <Link to="/rooms" className="absolute left-5 top-5 grid h-10 w-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15" aria-label="Back to rooms" title="Back to rooms"><Icon name="back" className="h-5 w-5" /></Link>

      <div className="relative max-w-lg">
        <BuddySprite species={b.species} level={b.level} mood={ready || phase !== 'intro' ? 'happy' : 'neutral'} hat={b.equipped_hat} size={150} />

        {!ready && phase === 'intro' && (
          <>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Relax Room</h1>
            <p className="mt-2 text-white/80">Breaks here are earned. Focus for {RELAX_COST_MIN} minutes in any room to unlock one.</p>
            <div className="mx-auto mt-5 h-3 max-w-xs overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-paper" style={{ width: `${(p.relax_minutes_banked / RELAX_COST_MIN) * 100}%` }} />
            </div>
            <p className="mt-2 text-sm font-bold">{p.relax_minutes_banked} / {RELAX_COST_MIN} min</p>
            <Link to="/rooms" className="btn mt-6 bg-paper text-[#24473a]">Go earn it</Link>
          </>
        )}

        {ready && phase === 'intro' && (
          <>
            <h1 className="mt-2 font-display text-5xl font-semibold leading-tight tracking-tight">Get off your computer.<br />You earned it.</h1>
            <p className="mt-3 text-lg text-white/85">Take {RELAX_BREAK_MIN} minutes away from the screen. {b.name} will wait right here.</p>
            <p className="mt-4 font-hand text-2xl text-white/80">idea: {idea.toLowerCase()}</p>
            <button
              className="btn mt-6 bg-paper px-6 py-3 text-base text-[#24473a]"
              onClick={() => {
                endAt.current = Date.now() + RELAX_BREAK_MIN * 60_000
                setLeft(RELAX_BREAK_MIN * 60)
                setPhase('away')
              }}
            >
              Start my break
            </button>
          </>
        )}

        {phase === 'away' && (
          <>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Go on, step away</h1>
            <div className="mt-3 font-display text-8xl font-semibold tabular-nums tracking-tight">
              {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
            </div>
            <p className="mt-3 text-white/80">Breathe in as the circle grows, out as it shrinks. Or better, don't look at this at all.</p>
          </>
        )}

        {phase === 'back' && (
          <>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-white/85">{b.name} feels refreshed too (+happiness, +energy).</p>
            <Link to="/" className="btn mt-6 bg-paper text-[#24473a]">Back to Home</Link>
          </>
        )}
      </div>
    </div>
  )
}
