import type { ReactNode } from 'react'
import type { Species } from '../../lib/types'
import { evolutionStage, SHOP, type Mood } from '../../lib/rewards'

interface Props {
  species: Species
  level: number
  mood: Mood
  hat?: string | null
  /** pixels, or "fill" to stretch to the parent width */
  size?: number | 'fill'
  animate?: boolean
}

interface Coat {
  fur: string
  /** outline + stripes */
  shade: string
  belly: string
  muzzle: string
  innerEar: string
  nose: string
  /** eye + mouth line color */
  line: string
  mouth: string
  /** colored iris for dark coats (otherwise eyes are solid line color) */
  iris?: string
  stripes?: boolean
  extra?: ReactNode
  tail?: string
  paws?: string
}

const INK = '#2f2622'
const CREAM = '#f6ead6'

export const COAT_STYLE: Record<Species, Coat> = {
  ginger: { fur: '#e39a62', shade: '#b96d3d', belly: '#f8e2c8', muzzle: '#f8e2c8', innerEar: '#efb39c', nose: '#d47a7c', line: INK, mouth: INK, stripes: true },
  gray: { fur: '#a9a29b', shade: '#7a736c', belly: '#ece5dc', muzzle: '#ece5dc', innerEar: '#e6b6ad', nose: '#c98488', line: INK, mouth: INK, stripes: true },
  black: { fur: '#3d3431', shade: '#231d1b', belly: '#4b403c', muzzle: '#4b403c', innerEar: '#8a605c', nose: '#b97a7d', line: CREAM, mouth: CREAM, iris: '#e6c35c' },
  calico: {
    fur: '#f6eee2',
    shade: '#b8a690',
    belly: '#fffaf2',
    muzzle: '#fffaf2',
    innerEar: '#efb7a6',
    nose: '#d68a8a',
    line: INK,
    mouth: INK,
    extra: (
      <>
        <path d="M58 62 C 70 46, 92 48, 96 64 C 90 76, 70 80, 56 76 Z" fill="#df8a4f" />
        <path d="M118 52 C 130 46, 146 56, 146 72 C 138 74, 126 70, 118 62 Z" fill="#3d3431" />
        <path d="M70 132 C 80 126, 92 132, 90 146 C 84 156, 70 152, 66 144 Z" fill="#3d3431" />
        <path d="M112 150 C 122 140, 136 146, 138 160 C 132 170, 118 168, 112 160 Z" fill="#df8a4f" />
      </>
    ),
    tail: '#df8a4f',
  },
  tuxedo: { fur: '#302a29', shade: '#1c1817', belly: '#f6eee2', muzzle: '#f6eee2', innerEar: '#8a605c', nose: '#d68a8a', line: CREAM, mouth: INK, iris: '#b7d08a', paws: '#f6eee2' },
  cream: {
    fur: '#efdfc6',
    shade: '#b89e80',
    belly: '#f8efe2',
    muzzle: '#8a6a55',
    innerEar: '#7a5a46',
    nose: '#5e463a',
    line: INK,
    mouth: CREAM,
    iris: '#7fa7c9',
    tail: '#7a5a46',
    paws: '#7a5a46',
  },
}

const STAGE_SCALE = [0.74, 0.86, 0.95, 1]

/** Hand-drawn cats. Four growth stages (kitten → wise old cat) and four moods. */
export function BuddySprite({ species, level, mood, hat, size = 200, animate = true }: Props) {
  const stage = evolutionStage(level)
  const c = COAT_STYLE[species] ?? COAT_STYLE.ginger
  const s = STAGE_SCALE[stage]
  const hatEmoji = hat ? SHOP.find((x) => x.id === hat)?.emoji : null
  const anim = !animate ? '' : mood === 'sad' || mood === 'tired' ? 'anim-float-slow' : 'anim-float'
  const dim = size === 'fill' ? '100%' : size

  return (
    <svg viewBox="0 0 200 200" width={dim} height={dim} role="img" aria-label={`cat buddy, feeling ${mood}`} className="mx-auto block overflow-visible">
      <ellipse cx="100" cy="189" rx={40 * s + 8} ry="6" fill="#2f2622" opacity=".12" />
      <g className={anim} style={{ transformBox: 'fill-box' }}>
        <g transform={`translate(100 188) scale(${s}) translate(-100 -188)`}>
          {stage === 3 && (
            <g fill="#e3b04b">
              <path d="M34 70 l4 -10 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4z" />
              <path d="M166 96 l3 -7 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3z" />
              <path d="M150 34 l2 -5 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2z" />
            </g>
          )}

          {/* tail */}
          <path d="M136 176 C 174 174, 182 136, 160 112" stroke={c.shade} strokeWidth="17" fill="none" strokeLinecap="round" />
          <path d="M136 176 C 174 174, 182 136, 160 112" stroke={c.fur} strokeWidth="11" fill="none" strokeLinecap="round" />
          <path d="M163 126 C 162 120, 161 116, 160 112" stroke={c.tail ?? (c.stripes ? c.shade : c.fur)} strokeWidth="11" fill="none" strokeLinecap="round" />
          {c.stripes && <path d="M166 150 l9 -3 M168 136 l9 1" stroke={c.shade} strokeWidth="3.5" strokeLinecap="round" />}

          {/* body */}
          <path d="M62 186 C 54 146, 72 114, 100 112 C 128 114, 146 146, 138 186 Z" fill={c.fur} stroke={c.shade} strokeWidth="3" strokeLinejoin="round" />
          <path d="M84 186 C 80 158, 88 134, 100 132 C 112 134, 120 158, 116 186 Z" fill={c.belly} />
          {c.stripes && (
            <g stroke={c.shade} strokeWidth="3.5" strokeLinecap="round" fill="none">
              <path d="M66 150 q8 3 13 -1" />
              <path d="M64 166 q8 3 13 -1" />
              <path d="M134 150 q-8 3 -13 -1" />
              <path d="M136 166 q-8 3 -13 -1" />
            </g>
          )}
          {species === 'calico' && c.extra}

          {/* paws */}
          {[86, 114].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy="184" rx="12" ry="7.5" fill={c.paws ?? c.belly} stroke={c.shade} strokeWidth="2.5" />
              <path d={`M${x - 4} 181 v4 M${x + 4} 181 v4`} stroke={c.shade} strokeWidth="1.8" strokeLinecap="round" opacity=".7" />
            </g>
          ))}

          {/* scarf for the final stage */}
          {stage === 3 && (
            <g>
              <path d="M64 118 Q 100 136 136 118 L 137 130 Q 100 150 63 130 Z" fill="#cf6440" stroke="#a84d2e" strokeWidth="2.5" />
              <path d="M112 132 l6 30 l12 -3 l-4 -30 z" fill="#cf6440" stroke="#a84d2e" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M76 125 l2 7 M90 129 l1 8 M104 130 l0 8 M118 128 l-1 8" stroke="#f3c99f" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}

          {/* ears */}
          <path d="M54 80 Q 50 36 64 28 Q 74 28 96 50 Z" fill={c.fur} stroke={c.shade} strokeWidth="3" strokeLinejoin="round" />
          <path d="M146 80 Q 150 36 136 28 Q 126 28 104 50 Z" fill={c.fur} stroke={c.shade} strokeWidth="3" strokeLinejoin="round" />
          <path d="M62 68 Q 62 44 68 38 Q 76 40 86 52 Z" fill={c.innerEar} />
          <path d="M138 68 Q 138 44 132 38 Q 124 40 114 52 Z" fill={c.innerEar} />
          {species === 'cream' && (
            <>
              <path d="M54 80 Q 50 36 64 28 Q 74 28 96 50 Z" fill="#7a5a46" opacity=".85" />
              <path d="M146 80 Q 150 36 136 28 Q 126 28 104 50 Z" fill="#7a5a46" opacity=".85" />
            </>
          )}

          {/* head */}
          <ellipse cx="100" cy="84" rx="50" ry="42" fill={c.fur} stroke={c.shade} strokeWidth="3" />
          {/* cheek fluff */}
          <path d="M52 92 l-9 3 l8 4 M148 92 l9 3 l-8 4" stroke={c.shade} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {species === 'calico' && (
            <>
              <path d="M62 56 C 72 46, 92 50, 94 62 C 92 74, 76 80, 58 78 C 54 70, 56 62, 62 56 Z" fill="#df8a4f" />
              <path d="M116 50 C 128 44, 144 54, 146 72 C 138 76, 124 72, 116 62 Z" fill="#3d3431" />
            </>
          )}
          {species === 'tuxedo' && <path d="M100 74 C 80 80, 72 104, 78 120 L 122 120 C 128 104, 120 80, 100 74 Z" fill={c.belly} />}
          {species === 'cream' && <ellipse cx="100" cy="96" rx="22" ry="17" fill={c.muzzle} opacity=".9" />}
          {c.stripes && (
            <g stroke={c.shade} strokeWidth="3.5" strokeLinecap="round">
              <path d="M100 46 v11" />
              <path d="M88 48 l3 9" />
              <path d="M112 48 l-3 9" />
            </g>
          )}

          {/* muzzle + nose */}
          {species !== 'cream' && species !== 'tuxedo' && (
            <>
              <ellipse cx="92" cy="99" rx="10" ry="7.5" fill={c.muzzle} />
              <ellipse cx="108" cy="99" rx="10" ry="7.5" fill={c.muzzle} />
            </>
          )}
          <path d="M95.5 92 h9 l-4.5 5.5 z" fill={c.nose} strokeLinejoin="round" stroke={c.nose} strokeWidth="1.5" />
          <g stroke={c.line} strokeWidth="1.6" strokeLinecap="round" opacity=".45">
            <path d="M78 98 l-24 -3 M78 103 l-22 4" />
            <path d="M122 98 l24 -3 M122 103 l22 4" />
          </g>

          <Face mood={mood} c={c} kitten={stage === 0} />

          {/* round glasses once they're a scholar */}
          {stage >= 2 && (
            <g stroke={c.line === CREAM ? '#d8c3a0' : '#4a3a30'} strokeWidth="3" fill="#fff" fillOpacity=".18">
              <circle cx="81" cy="80" r="12.5" />
              <circle cx="119" cy="80" r="12.5" />
              <path d="M93.5 80 h13" fill="none" />
            </g>
          )}

          {hatEmoji && (
            <text x="100" y="36" fontSize="52" textAnchor="middle" dominantBaseline="middle" style={{ userSelect: 'none' }}>
              {hatEmoji}
            </text>
          )}
          {mood === 'tired' && (
            <text x="150" y="44" fontSize="20" fontWeight="900" fill="#7d74b0" fontFamily="Nunito, sans-serif">
              z<tspan dx="2" dy="-9" fontSize="14">z</tspan>
            </text>
          )}
        </g>
      </g>
    </svg>
  )
}

function Face({ mood, c, kitten }: { mood: Mood; c: Coat; kitten: boolean }) {
  const dx = 19
  const r = kitten ? 8.5 : 7.5
  const eye = (x: number) =>
    c.iris ? (
      <g key={x}>
        <circle cx={x} cy="80" r={r} fill={c.iris} />
        <ellipse cx={x} cy="80" rx="2.8" ry={r - 2} fill="#1d1715" />
        <circle cx={x + 2.5} cy="77" r="2" fill="#fff" />
      </g>
    ) : (
      <g key={x}>
        <circle cx={x} cy="80" r={r} fill={c.line} />
        <circle cx={x + 2.5} cy="77.5" r="2.3" fill="#fff" />
      </g>
    )

  return (
    <g>
      {(mood === 'happy' || mood === 'neutral') && (
        <>
          <ellipse cx="70" cy="94" rx="8" ry="4.5" fill="#e98c8a" opacity=".4" />
          <ellipse cx="130" cy="94" rx="8" ry="4.5" fill="#e98c8a" opacity=".4" />
        </>
      )}

      {mood === 'happy' && (
        <g stroke={c.line} strokeWidth="4" fill="none" strokeLinecap="round">
          <path d={`M${100 - dx - 8} 82 q8 -10 16 0`} />
          <path d={`M${100 + dx - 8} 82 q8 -10 16 0`} />
        </g>
      )}
      {mood === 'neutral' && [100 - dx, 100 + dx].map(eye)}
      {mood === 'tired' && (
        <g stroke={c.line} strokeWidth="4" fill="none" strokeLinecap="round">
          <path d={`M${100 - dx - 8} 79 q8 6 16 0`} />
          <path d={`M${100 + dx - 8} 79 q8 6 16 0`} />
        </g>
      )}
      {mood === 'sad' && (
        <>
          {[100 - dx, 100 + dx].map(eye)}
          <g stroke={c.line} strokeWidth="3" strokeLinecap="round">
            <path d={`M${100 - dx - 10} 67 l12 4`} />
            <path d={`M${100 + dx + 10} 67 l-12 4`} />
          </g>
          <path d={`M${100 + dx + 5} 90 q3 6 0 10 q-3 -4 0 -10`} fill="#8fbcd8" />
        </>
      )}

      {/* mouth */}
      {mood === 'happy' && (
        <>
          <path d="M91 101 q4.5 5 9 0 q4.5 5 9 0" stroke={c.mouth} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M96 103.5 q4 7 8 0 z" fill="#c9636b" />
        </>
      )}
      {mood === 'neutral' && (
        <path d="M92 101 q4 4 8 0 q4 4 8 0" stroke={c.mouth} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {mood === 'tired' && <ellipse cx="100" cy="105" rx="3.5" ry="4" fill={c.mouth} />}
      {mood === 'sad' && <path d="M93 107 q7 -6 14 0" stroke={c.mouth} strokeWidth="3" fill="none" strokeLinecap="round" />}
    </g>
  )
}
