import type { ReactNode } from 'react'
import type { Species } from '../../lib/types'
import { evolutionStage, SHOP, type Mood } from '../../lib/rewards'

interface Props {
  species: Species
  level: number
  mood: Mood
  hat?: string | null
  /** pixels, or "fill" to stretch to the parent width */
  size?: number | "fill"
  animate?: boolean
}

/** Hand-drawn SVG buddies. Each species has 4 evolution stages and 4 moods. */
export function BuddySprite({ species, level, mood, hat, size = 200, animate = true }: Props) {
  const stage = evolutionStage(level)
  const spec = SPECIES[species]
  const face = spec.face(stage)
  const hatEmoji = hat ? SHOP.find((s) => s.id === hat)?.emoji : null
  const anim = !animate ? '' : mood === 'happy' ? 'anim-float' : mood === 'sad' || mood === 'tired' ? 'anim-float-slow' : 'anim-float'
  return (
    <svg viewBox="0 0 200 200" width={size === "fill" ? "100%" : size} height={size === "fill" ? "100%" : size} role="img" aria-label={`${species} buddy, feeling ${mood}`} className="mx-auto block overflow-visible">
      <ellipse cx="100" cy="188" rx={46 + stage * 6} ry="7" fill="#000" opacity=".08" />
      <g className={anim} style={{ transformBox: 'fill-box' }}>
        {stage === 3 && <circle cx="100" cy="110" r="88" fill={spec.aura} opacity=".25" />}
        {spec.body(stage)}
        <Face x={face.x} y={face.y} mood={mood} scale={face.scale} />
        {spec.extras?.(stage)}
        {hatEmoji && (
          <text x="100" y={face.hatY} fontSize="54" textAnchor="middle" dominantBaseline="middle" style={{ userSelect: 'none' }}>
            {hatEmoji}
          </text>
        )}
        {mood === 'tired' && (
          <text x={face.x + 48} y={face.y - 36} fontSize="18" fontWeight="900" fill="#6366f1" opacity=".7">
            z<tspan dx="2" dy="-8" fontSize="13">z</tspan>
          </text>
        )}
      </g>
    </svg>
  )
}

function Face({ x, y, mood, scale = 1 }: { x: number; y: number; mood: Mood; scale?: number }) {
  const ink = '#1e1b2e'
  const dx = 17
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* cheeks */}
      {mood === 'happy' && (
        <>
          <ellipse cx={-dx - 9} cy="10" rx="7" ry="4.5" fill="#fb7185" opacity=".45" />
          <ellipse cx={dx + 9} cy="10" rx="7" ry="4.5" fill="#fb7185" opacity=".45" />
        </>
      )}
      {/* eyes */}
      {mood === 'happy' && (
        <>
          <path d={`M${-dx - 7} 2 q7 -10 14 0`} stroke={ink} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d={`M${dx - 7} 2 q7 -10 14 0`} stroke={ink} strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      )}
      {mood === 'neutral' && (
        <>
          <circle cx={-dx} cy="0" r="6.5" fill={ink} />
          <circle cx={dx} cy="0" r="6.5" fill={ink} />
          <circle cx={-dx + 2} cy="-2" r="2" fill="#fff" />
          <circle cx={dx + 2} cy="-2" r="2" fill="#fff" />
        </>
      )}
      {mood === 'tired' && (
        <>
          <path d={`M${-dx - 7} 1 h14`} stroke={ink} strokeWidth="4" strokeLinecap="round" />
          <path d={`M${dx - 7} 1 h14`} stroke={ink} strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {mood === 'sad' && (
        <>
          <circle cx={-dx} cy="1" r="6" fill={ink} />
          <circle cx={dx} cy="1" r="6" fill={ink} />
          <path d={`M${-dx - 9} -10 l12 4`} stroke={ink} strokeWidth="3" strokeLinecap="round" />
          <path d={`M${dx + 9} -10 l-12 4`} stroke={ink} strokeWidth="3" strokeLinecap="round" />
          <path d={`M${dx + 4} 10 q3 6 0 10 q-3 -4 0 -10`} fill="#38bdf8" />
        </>
      )}
      {/* mouth */}
      {mood === 'happy' && <path d="M-9 13 q9 10 18 0" stroke={ink} strokeWidth="4" fill="#fb7185" strokeLinecap="round" />}
      {mood === 'neutral' && <path d="M-6 15 q6 4 12 0" stroke={ink} strokeWidth="3.5" fill="none" strokeLinecap="round" />}
      {mood === 'tired' && <ellipse cx="0" cy="16" rx="4.5" ry="5" fill={ink} />}
      {mood === 'sad' && <path d="M-8 20 q8 -8 16 0" stroke={ink} strokeWidth="3.5" fill="none" strokeLinecap="round" />}
    </g>
  )
}

type FaceSpot = { x: number; y: number; hatY: number; scale: number }

const SPECIES: Record<
  Species,
  { aura: string; face: (s: number) => FaceSpot; body: (s: number) => ReactNode; extras?: (s: number) => ReactNode }
> = {
  blob: {
    aura: '#a78bfa',
    face: (s) => ({ x: 100, y: 118 - s * 4, hatY: 58 - s * 10, scale: 0.9 + s * 0.08 }),
    body: (s) => {
      const w = 52 + s * 12
      const h = 50 + s * 12
      return (
        <>
          {s >= 2 && (
            <>
              <ellipse cx={100 - w + 4} cy="140" rx="13" ry="9" fill="#7c3aed" />
              <ellipse cx={100 + w - 4} cy="140" rx="13" ry="9" fill="#7c3aed" />
            </>
          )}
          <path
            d={`M${100 - w} 180 C ${100 - w} ${180 - h * 2.2}, ${100 + w} ${180 - h * 2.2}, ${100 + w} 180 Z`}
            fill="#8b5cf6"
          />
          <ellipse cx={100 - w * 0.35} cy={180 - h * 1.25} rx={w * 0.18} ry={h * 0.12} fill="#fff" opacity=".35" />
        </>
      )
    },
    extras: (s) =>
      s >= 3 ? (
        <g fill="#fde047">
          <path d="M40 60 l4 -10 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 z" />
          <path d="M158 80 l3 -7 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 z" />
        </g>
      ) : null,
  },
  cat: {
    aura: '#fdba74',
    face: (s) => ({ x: 100, y: 92 - s * 2, hatY: 40 - s * 4, scale: 0.85 + s * 0.06 }),
    body: (s) => {
      const r = 38 + s * 4
      const cy = 90 - s * 2
      return (
        <>
          {/* tail */}
          <path d={`M${140 + s * 4} 175 q40 -10 30 -60`} stroke="#f97316" strokeWidth={10 + s * 2} fill="none" strokeLinecap="round" />
          {/* body */}
          <ellipse cx="100" cy={158 - s} rx={34 + s * 7} ry={30 + s * 3} fill="#fb923c" />
          <ellipse cx="100" cy={164 - s} rx={18 + s * 4} ry={18} fill="#fed7aa" />
          {/* paws */}
          <ellipse cx={82 - s * 2} cy="186" rx="11" ry="6" fill="#fed7aa" />
          <ellipse cx={118 + s * 2} cy="186" rx="11" ry="6" fill="#fed7aa" />
          {/* ears */}
          <path d={`M${100 - r + 4} ${cy - r * 0.45} l6 ${-r * 0.85} l${r * 0.6} ${r * 0.5} z`} fill="#fb923c" />
          <path d={`M${100 + r - 4} ${cy - r * 0.45} l-6 ${-r * 0.85} l${-r * 0.6} ${r * 0.5} z`} fill="#fb923c" />
          <path d={`M${100 - r + 10} ${cy - r * 0.55} l4 ${-r * 0.5} l${r * 0.32} ${r * 0.3} z`} fill="#fda4af" />
          <path d={`M${100 + r - 10} ${cy - r * 0.55} l-4 ${-r * 0.5} l${-r * 0.32} ${r * 0.3} z`} fill="#fda4af" />
          {/* head */}
          <circle cx="100" cy={cy} r={r} fill="#fb923c" />
          {/* whiskers */}
          <g stroke="#7c2d12" strokeWidth="1.6" opacity=".5" strokeLinecap="round">
            <path d={`M${100 - r + 6} ${cy + 10} h-16`} />
            <path d={`M${100 - r + 6} ${cy + 16} l-14 5`} />
            <path d={`M${100 + r - 6} ${cy + 10} h16`} />
            <path d={`M${100 + r - 6} ${cy + 16} l14 5`} />
          </g>
        </>
      )
    },
    extras: (s) =>
      s >= 2 ? (
        // scholar glasses
        <g stroke="#1e1b2e" strokeWidth="2.5" fill="#fff" fillOpacity=".25">
          <circle cx="84" cy={92 - s * 2} r="12" />
          <circle cx="116" cy={92 - s * 2} r="12" />
          <path d={`M96 ${92 - s * 2} h8`} />
        </g>
      ) : null,
  },
  dragon: {
    aura: '#6ee7b7',
    face: (s) =>
      s === 0 ? { x: 100, y: 112, hatY: 50, scale: 0.75 } : { x: 100, y: 96 - s * 2, hatY: 42 - s * 4, scale: 0.85 + s * 0.06 },
    body: (s) => {
      if (s === 0) {
        return (
          <>
            <path d="M100 38 C 52 38, 46 130, 52 150 C 60 186, 140 186, 148 150 C 154 130, 148 38, 100 38 Z" fill="#fef3c7" stroke="#fcd34d" strokeWidth="3" />
            <g fill="#34d399" opacity=".7">
              <circle cx="72" cy="80" r="7" />
              <circle cx="128" cy="150" r="9" />
              <circle cx="130" cy="72" r="5" />
              <circle cx="68" cy="156" r="5" />
            </g>
            <path d="M58 100 l14 8 l10 -10 l12 10 l12 -10 l12 10 l12 -10 l12 8" stroke="#b45309" strokeWidth="3" fill="none" strokeLinejoin="round" />
          </>
        )
      }
      const r = 34 + s * 4
      const cy = 96 - s * 2
      const wing = 30 + s * 14
      return (
        <>
          {/* wings */}
          <path d={`M70 140 q${-wing} -${wing * 0.4} -${wing * 0.6} -${wing * 1.1} q${wing * 0.25} ${wing * 0.4} ${wing * 0.6} ${wing * 0.5} z`} fill="#059669" />
          <path d={`M130 140 q${wing} -${wing * 0.4} ${wing * 0.6} -${wing * 1.1} q-${wing * 0.25} ${wing * 0.4} -${wing * 0.6} ${wing * 0.5} z`} fill="#059669" />
          {/* tail */}
          <path d="M130 172 q36 4 44 -20 l6 10 l-12 2" stroke="#10b981" strokeWidth="10" fill="#10b981" strokeLinecap="round" strokeLinejoin="round" />
          {/* body */}
          <ellipse cx="100" cy={158 - s} rx={32 + s * 6} ry={30 + s * 2} fill="#10b981" />
          <ellipse cx="100" cy={164 - s} rx={18 + s * 3} ry="20" fill="#a7f3d0" />
          {/* horns */}
          {s >= 2 && (
            <>
              <path d={`M${100 - r * 0.55} ${cy - r * 0.75} l-8 -22 l18 14 z`} fill="#fef3c7" />
              <path d={`M${100 + r * 0.55} ${cy - r * 0.75} l8 -22 l-18 14 z`} fill="#fef3c7" />
            </>
          )}
          {/* head */}
          <ellipse cx="100" cy={cy} rx={r * 1.05} ry={r} fill="#10b981" />
          <g fill="#047857">
            <circle cx="92" cy={cy + r * 0.5} r="2.2" />
            <circle cx="108" cy={cy + r * 0.5} r="2.2" />
          </g>
          {/* spikes */}
          <path d={`M88 ${cy - r + 2} l6 -12 l6 12 l6 -12 l6 12`} fill="#34d399" />
        </>
      )
    },
  },
}
