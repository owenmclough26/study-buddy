import { useEffect, useState } from 'react'
import { useData } from '../../lib/store'
import { mood, RELAX_COST_MIN, type Mood } from '../../lib/rewards'
import type { Chunk, DecorSlot, Task } from '../../lib/types'
import { purr } from '../../lib/ambient'
import type { TraitStatus } from '../../lib/journal'
import { BuddySprite } from './BuddySprite'
import { RoomScene, dayPart, type DayPart } from './RoomScene'

export type Activity = 'rug' | 'bed' | 'window' | 'reading' | 'playing'

/** What the cat is up to right now, from its mood, the time, and whether you studied today. */
export function chooseActivity(m: Mood, energy: number, now: Date, focusedToday: number): Activity {
  const h = now.getHours()
  if (m === 'tired' || energy < 30 || h >= 22 || h < 6) return 'bed'
  if (h >= 19) return 'window'
  if (focusedToday > 0) return 'reading'
  if (m === 'happy') return 'playing'
  return 'rug'
}

/** Where the cat sits in the 16:9 room, and where its speech bubble goes. */
const SPOTS: Record<Activity, { left: string; bottom: string; width: string; bubble: { left: string; top: string; maxW: string; tail: 'left' | 'right' } }> = {
  rug: { left: '41%', bottom: '4%', width: '26%', bubble: { left: '47%', top: '41%', maxW: '40%', tail: 'left' } },
  reading: { left: '41%', bottom: '4%', width: '26%', bubble: { left: '47%', top: '41%', maxW: '40%', tail: 'left' } },
  playing: { left: '38%', bottom: '4%', width: '26%', bubble: { left: '44%', top: '41%', maxW: '40%', tail: 'left' } },
  bed: { left: '78%', bottom: '10%', width: '20%', bubble: { left: '58%', top: '50%', maxW: '24%', tail: 'right' } },
  window: { left: '72%', bottom: '47%', width: '15%', bubble: { left: '38%', top: '22%', maxW: '30%', tail: 'right' } },
}

const ACTIVITY_LINES: Record<Activity, string[]> = {
  bed: ['zzz… five more minutes', 'dreaming about tuna and A+s', 'shh. recharging.'],
  window: ['watching the sky. thinking about stuff', 'is that a bird', 'nice night for studying'],
  reading: ['proud of us today', 'i read along. mostly the pictures', 'this book is very warm'],
  playing: ['yarn!!', 'can’t stop won’t stop', 'one more bat at the yarn'],
  rug: ['wanna study together?', 'what’s next on the list?', 'i’m just sitting here. being cute.'],
}

function speech(opts: {
  name: string
  m: Mood
  activity: Activity
  next: { chunk: Chunk; task: Task } | null
  breakReady: boolean
  traits: TraitStatus[]
}): string[] {
  const { m, activity, next, breakReady, traits } = opts
  if (breakReady && activity !== 'bed') return ['you earned a break. go outside!', 'screen break time? 🌿']
  if (next) {
    const mins = Math.round((new Date(next.chunk.start_at).getTime() - Date.now()) / 60_000)
    if (mins <= 0) return [`${next.task.title.toLowerCase()} time! let's go`]
    if (mins <= 45) return [`${next.task.title.toLowerCase()} in ${mins} min`, 'almost time to lock in']
  }
  if (m === 'sad') return ['i missed you…', 'can we do one thing together?', 'it got kinda lonely']
  const mine = traits.filter((t) => t.earned).flatMap((t) => t.def.lines)
  return [...ACTIVITY_LINES[activity], ...mine]
}

let heartId = 0

export function CatRoom({ decor, notesToday, focusedToday, next, traits }: {
  decor: Record<DecorSlot, string>
  notesToday: number
  focusedToday: number
  next: { chunk: Chunk; task: Task } | null
  traits: TraitStatus[]
}) {
  const { state, actions } = useData()
  const b = state.buddy!
  const p = state.profile!
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(t)
  }, [])
  const [lineIdx, setLineIdx] = useState(0)
  const [hearts, setHearts] = useState<{ id: number; dx: number; bonus: boolean }[]>([])
  const [awake, setAwake] = useState(false) // a pet wakes a napping cat for a bit

  const m = mood(b)
  const part: DayPart = dayPart(now)
  // dev-only: ?cat=reading (etc.) to preview each activity without waiting for the right time
  const forced = import.meta.env.DEV ? (new URLSearchParams(window.location.search).get('cat') as Activity | null) : null
  let activity = forced && forced in SPOTS ? forced : chooseActivity(m, b.energy, now, focusedToday)
  if (activity === 'bed' && awake) activity = 'rug'
  const spot = SPOTS[activity]
  const said = speech({ name: b.name, m, activity, next, breakReady: p.relax_minutes_banked >= RELAX_COST_MIN, traits })
  const line = said[lineIdx % said.length]
  const sleeping = activity === 'bed'

  function pet() {
    purr()
    const bonus = actions.pet()
    const burst = Array.from({ length: 4 }, (_, i) => ({ id: ++heartId, dx: (i - 1.5) * 18 + Math.random() * 10, bonus: bonus && i === 0 }))
    setHearts((h) => [...h, ...burst])
    window.setTimeout(() => setHearts((h) => h.filter((x) => !burst.includes(x))), 1300)
    setLineIdx((i) => i + 1)
    if (sleeping) {
      setAwake(true)
      window.setTimeout(() => setAwake(false), 20_000)
    }
  }

  return (
    <RoomScene part={part} notesToday={notesToday} decor={decor}>
      {/* speech bubble */}
      <div
        key={line + activity}
        className="anim-pop absolute rounded-2xl border-2 border-ink/80 bg-paper px-3 py-1.5 font-hand text-lg leading-tight text-ink sm:text-2xl"
        style={{ left: spot.bubble.left, top: spot.bubble.top, maxWidth: spot.bubble.maxW }}
      >
        {sleeping && !awake ? 'zzz…' : line}
        <span
          className={`absolute -bottom-[9px] h-4 w-4 rotate-45 border-b-2 border-r-2 border-ink/80 bg-paper ${spot.bubble.tail === 'left' ? 'left-5' : 'right-5'}`}
        />
      </div>

      {/* yarn to play with */}
      {activity === 'playing' && (
        <svg viewBox="0 0 40 40" className="anim-yarn absolute bottom-[6%] left-[55%] w-[5%]" aria-hidden>
          <circle cx="20" cy="20" r="16" fill="#cf6440" />
          <path d="M8 14 q12 6 24 -2 M6 22 q14 8 28 0 M10 30 q10 2 20 -4 M14 6 q4 14 -2 28 M26 6 q-6 14 2 28" stroke="#e8946f" strokeWidth="2" fill="none" />
          <path d="M34 26 q10 6 6 14" stroke="#cf6440" strokeWidth="2" fill="none" />
        </svg>
      )}

      {/* the cat */}
      <button
        type="button"
        onClick={pet}
        className="absolute -translate-x-1/2 cursor-pointer transition-[left,bottom,width] duration-700"
        style={{ left: spot.left, bottom: spot.bottom, width: spot.width }}
        aria-label={`Pet ${b.name}`}
        title={`Pet ${b.name}`}
      >
        <div className={activity === 'playing' ? 'anim-hop' : ''}>
          <BuddySprite
            species={b.species}
            level={b.level}
            mood={sleeping ? 'tired' : m}
            hat={b.equipped_hat}
            size="fill"
            pose={sleeping ? 'loaf' : activity === 'reading' ? 'read' : 'sit'}
            animate={!sleeping}
          />
        </div>
        {hearts.map((h) => (
          <span key={h.id} className="anim-heart pointer-events-none absolute left-1/2 top-[15%] text-xl sm:text-2xl" style={{ marginLeft: h.dx }} aria-hidden>
            {h.bonus ? <span className="whitespace-nowrap rounded-full bg-paper px-1.5 text-xs font-extrabold text-accent shadow-sm">+2 happy</span> : '❤'}
          </span>
        ))}
      </button>
    </RoomScene>
  )
}
