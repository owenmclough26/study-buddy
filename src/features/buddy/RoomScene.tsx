import type { ReactNode } from 'react'
import type { DecorSlot } from '../../lib/types'
import { DEFAULT_DECOR } from '../../lib/decor'

export type DayPart = 'dawn' | 'day' | 'dusk' | 'night'

export function dayPart(d: Date): DayPart {
  const h = d.getHours() + d.getMinutes() / 60
  if (h >= 5.5 && h < 8) return 'dawn'
  if (h >= 8 && h < 17) return 'day'
  if (h >= 17 && h < 20) return 'dusk'
  return 'night'
}

const SKY: Record<DayPart, [string, string]> = {
  dawn: ['#f6c9a8', '#f9e6c6'],
  day: ['#9cc8e4', '#d8ecf4'],
  dusk: ['#e98a5c', '#f6c98d'],
  night: ['#1f2a4a', '#3a4670'],
}

const BOOKS = [
  { w: 12, h: 46, c: '#b9583a' },
  { w: 10, h: 40, c: '#6f63a6' },
  { w: 14, h: 50, c: '#3f86ad' },
  { w: 9, h: 36, c: '#dfa63b' },
  { w: 12, h: 44, c: '#6c9461' },
]

/* ------------------------------------------------------------ wallpaper */
function Wallpaper({ id }: { id: string }) {
  const tile = (() => {
    switch (id) {
      case 'wp_sage':
        return (
          <>
            <rect width="40" height="40" fill="#dfe6d3" />
            <rect width="16" height="40" fill="#d3ddc4" />
          </>
        )
      case 'wp_gingham':
        return (
          <>
            <rect width="40" height="40" fill="#eef2f4" />
            <rect width="20" height="40" fill="#c9d9e6" opacity=".55" />
            <rect width="40" height="20" fill="#c9d9e6" opacity=".55" />
          </>
        )
      case 'wp_floral':
        return (
          <>
            <rect width="40" height="40" fill="#f4e1dc" />
            {[
              [10, 10],
              [30, 30],
            ].map(([x, y]) => (
              <g key={x} fill="#e3a9a0">
                <circle cx={x - 3} cy={y} r="2.6" />
                <circle cx={x + 3} cy={y} r="2.6" />
                <circle cx={x} cy={y - 3} r="2.6" />
                <circle cx={x} cy={y + 3} r="2.6" />
                <circle cx={x} cy={y} r="1.8" fill="#f6d78b" />
              </g>
            ))}
          </>
        )
      case 'wp_grid':
        return (
          <>
            <rect width="40" height="40" fill="#f6f0e4" />
            <path d="M40 0H0V40" fill="none" stroke="#c9d6e3" strokeWidth="2" />
          </>
        )
      case 'wp_stars':
        return (
          <>
            <rect width="40" height="40" fill="#34406a" />
            <path d="M10 6l1.6 3.4 3.6.4-2.7 2.4.8 3.6-3.3-1.9-3.3 1.9.8-3.6L4.8 9.8l3.6-.4z" fill="#e3b04b" />
            <circle cx="30" cy="28" r="1.6" fill="#f6e3a8" />
          </>
        )
      default:
        return (
          <>
            <rect width="44" height="44" fill="#efe1cc" />
            <circle cx="11" cy="11" r="2" fill="#e5d2b8" />
            <circle cx="33" cy="33" r="2" fill="#e5d2b8" />
          </>
        )
    }
  })()
  const size = id === 'wp_cream' || !id ? 44 : 40
  return (
    <>
      <defs>
        <pattern id={`wp-${id}`} width={size} height={size} patternUnits="userSpaceOnUse">
          {tile}
        </pattern>
      </defs>
      <rect width="800" height="330" fill={`url(#wp-${id})`} />
    </>
  )
}

/* ------------------------------------------------------------ wall art (above the shelf) */
function WallArt({ id }: { id: string }) {
  if (id === 'art_none') return null
  const inner = (() => {
    switch (id) {
      case 'art_mountains':
        return (
          <>
            <rect x="108" y="34" width="104" height="66" fill="#d8ecf4" />
            <path d="M108 100 L140 62 L160 82 L182 52 L212 100 Z" fill="#7d9b72" />
            <path d="M182 52 L190 63 L176 63 Z" fill="#fffaf2" />
            <circle cx="198" cy="46" r="7" fill="#f6d78b" />
          </>
        )
      case 'art_cat':
        return (
          <>
            <rect x="108" y="34" width="104" height="66" fill="#f4e6cf" />
            <ellipse cx="160" cy="76" rx="20" ry="17" fill="#e39a62" />
            <path d="M143 66 l2 -16 l10 10 z M177 66 l-2 -16 l-10 10 z" fill="#e39a62" />
            <circle cx="153" cy="74" r="2.4" fill="#2f2622" />
            <circle cx="167" cy="74" r="2.4" fill="#2f2622" />
            <path d="M156 82 q4 3 8 0" stroke="#2f2622" strokeWidth="1.6" fill="none" />
          </>
        )
      case 'art_sunrise':
        return (
          <>
            <rect x="108" y="34" width="104" height="66" fill="#f8dcb4" />
            <circle cx="160" cy="88" r="20" fill="#f6b25c" />
            {[-60, -30, 0, 30, 60].map((a) => (
              <line key={a} x1="160" y1="88" x2={160 + Math.sin((a * Math.PI) / 180) * 34} y2={88 - Math.cos((a * Math.PI) / 180) * 34} stroke="#f6b25c" strokeWidth="3" strokeLinecap="round" />
            ))}
            <rect x="108" y="88" width="104" height="12" fill="#e98a5c" />
          </>
        )
      case 'art_tomato':
        return (
          <>
            <rect x="108" y="34" width="104" height="66" fill="#fbf3e4" />
            <circle cx="160" cy="70" r="22" fill="#d9483b" />
            <path d="M150 50 q10 -6 20 0 q-10 6 -20 0z" fill="#6c9461" />
            <path d="M160 70 V56 M160 70 L170 76" stroke="#fffaf2" strokeWidth="3" strokeLinecap="round" />
          </>
        )
      default:
        return null
    }
  })()
  return (
    <g>
      {inner}
      <rect x="104" y="30" width="112" height="74" rx="3" fill="none" stroke="#8c5f3d" strokeWidth="7" />
      <path d="M160 30 L148 16 M160 30 L172 16" stroke="#8c5f3d" strokeWidth="2" />
    </g>
  )
}

/* ------------------------------------------------------------ rug */
function Rug({ id }: { id: string }) {
  switch (id) {
    case 'rug_sage':
      return (
        <>
          <ellipse cx="330" cy="398" rx="190" ry="36" fill="#7d9b72" />
          <ellipse cx="330" cy="398" rx="160" ry="27" fill="#e9e2c9" />
          <ellipse cx="330" cy="398" rx="120" ry="19" fill="#7d9b72" />
        </>
      )
    case 'rug_navy':
      return (
        <g>
          <rect x="150" y="368" width="360" height="62" rx="10" fill="#3f5a86" />
          {[380, 398, 416].map((y) => (
            <rect key={y} x="150" y={y} width="360" height="6" fill="#f3ead8" />
          ))}
          <path d="M150 372 v54 M510 372 v54" stroke="#f3ead8" strokeWidth="3" strokeDasharray="4 4" />
        </g>
      )
    case 'rug_rainbow':
      return (
        <>
          {['#cf6440', '#dfa63b', '#7d9b72', '#7fa7c9', '#6f63a6'].map((c, i) => (
            <ellipse key={c} cx="330" cy="398" rx={196 - i * 32} ry={36 - i * 6} fill={c} />
          ))}
        </>
      )
    case 'rug_track':
      return (
        <>
          <ellipse cx="330" cy="398" rx="196" ry="38" fill="#c4553f" />
          {[0, 1, 2].map((i) => (
            <ellipse key={i} cx="330" cy="398" rx={176 - i * 22} ry={32 - i * 5} fill="none" stroke="#fff" strokeWidth="2.5" />
          ))}
          <ellipse cx="330" cy="398" rx="104" ry="16" fill="#7d9b72" />
        </>
      )
    default:
      return (
        <>
          <ellipse cx="330" cy="398" rx="196" ry="36" fill="#cf6440" />
          <ellipse cx="330" cy="398" rx="170" ry="28" fill="none" stroke="#f3c99f" strokeWidth="4" strokeDasharray="10 8" />
          <ellipse cx="330" cy="398" rx="120" ry="18" fill="#d9805c" />
        </>
      )
  }
}

/* ------------------------------------------------------------ cat bed (floor, right of the rug) */
function Bed({ id }: { id: string }) {
  switch (id) {
    case 'bed_cloud':
      return (
        <g>
          {[560, 590, 625, 660, 690].map((x, i) => (
            <circle key={x} cx={x} cy={i % 2 ? 388 : 396} r={i % 2 ? 26 : 22} fill="#ffffff" />
          ))}
          <ellipse cx="625" cy="400" rx="78" ry="18" fill="#eef4f8" />
          <ellipse cx="625" cy="388" rx="58" ry="12" fill="#d9e6f0" />
        </g>
      )
    case 'bed_tent':
      return (
        <g>
          <path d="M550 412 L625 300 L700 412 Z" fill="#e3b04b" />
          <path d="M625 300 L600 412 H650 Z" fill="#cf6440" />
          <path d="M625 300 L618 290 M625 300 L632 290" stroke="#8c5f3d" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="625" cy="410" rx="62" ry="10" fill="#f3e4c6" />
          <path d="M560 380 h130" stroke="#f6d78b" strokeWidth="3" strokeDasharray="6 6" />
        </g>
      )
    case 'bed_royal':
      return (
        <g>
          <rect x="552" y="372" width="146" height="40" rx="18" fill="#6f63a6" />
          <rect x="560" y="364" width="130" height="22" rx="11" fill="#8a7fc0" />
          <path d="M556 392 h138" stroke="#e3b04b" strokeWidth="4" strokeDasharray="2 8" strokeLinecap="round" />
          {[552, 698].map((x) => (
            <path key={x} d={`M${x} 380 l-6 14 h12z`} fill="#e3b04b" />
          ))}
        </g>
      )
    default:
      return (
        <g>
          <ellipse cx="625" cy="398" rx="76" ry="24" fill="#b7865a" />
          <path d="M553 398 a72 22 0 0 0 144 0" stroke="#9c6c45" strokeWidth="3" fill="none" strokeDasharray="5 5" />
          <ellipse cx="625" cy="390" rx="60" ry="14" fill="#fbf3e4" />
        </g>
      )
  }
}

/* ------------------------------------------------------------ floor plant (left corner) */
function Plant({ id }: { id: string }) {
  switch (id) {
    case 'plant_cactus':
      return (
        <g>
          <path d="M48 362 h44 l-6 38 h-32z" fill="#d9a06b" />
          <rect x="62" y="290" width="18" height="74" rx="9" fill="#7d9b72" />
          <path d="M62 324 h-10 a6 6 0 0 1 -6 -6 v-14" stroke="#7d9b72" strokeWidth="12" fill="none" strokeLinecap="round" />
          <path d="M80 334 h10 a6 6 0 0 0 6 -6 v-10" stroke="#7d9b72" strokeWidth="12" fill="none" strokeLinecap="round" />
          <circle cx="71" cy="288" r="5" fill="#f6c1a7" />
        </g>
      )
    case 'plant_monstera':
      return (
        <g>
          <path d="M44 352 h52 l-6 46 h-40 z" fill="#f1e4cf" />
          <rect x="40" y="346" width="60" height="10" rx="3" fill="#e3d2b3" />
          {[
            [40, 290, -30],
            [96, 280, 25],
            [64, 250, 0],
          ].map(([x, y, r], i) => (
            <g key={i} transform={`rotate(${r} ${x} ${y})`}>
              <path d={`M70 346 Q ${x} ${y + 40} ${x} ${y}`} stroke="#4f8a5b" strokeWidth="4" fill="none" />
              <ellipse cx={x} cy={y} rx="26" ry="20" fill="#4f8a5b" />
              <path d={`M${x - 20} ${y} h12 M${x + 8} ${y} h12 M${x} ${y - 16} v10`} stroke="#3f7049" strokeWidth="3" />
            </g>
          ))}
        </g>
      )
    case 'plant_books':
      return (
        <g>
          {[
            ['#6f63a6', 0],
            ['#dfa63b', 6],
            ['#3f86ad', -4],
            ['#cf6440', 8],
            ['#6c9461', 0],
            ['#c7802f', -6],
          ].map(([c, dx], i) => (
            <rect key={i} x={40 + (dx as number)} y={396 - (i + 1) * 18} width="64" height="16" rx="2" fill={c as string} />
          ))}
          <circle cx="76" cy="276" r="9" fill="#e3b04b" />
        </g>
      )
    default:
      return (
        <g>
          <path d="M44 352 h52 l-6 46 h-40 z" fill="#c9714b" />
          <rect x="40" y="346" width="60" height="10" rx="3" fill="#b9633f" />
          <path
            d="M70 346 C 50 300 30 296 22 270 M70 346 C 66 300 74 270 70 236 M70 346 C 92 306 110 300 118 276 M70 346 C 58 320 46 318 40 304"
            stroke="#6c9461"
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )
  }
}

/* ------------------------------------------------------------ lamp (right corner) */
function Lamp({ id, night }: { id: string; night: boolean }) {
  switch (id) {
    case 'lamp_mushroom':
      return (
        <g>
          {night && <circle cx="742" cy="330" r="110" fill="url(#lampglow)" className="anim-flicker" />}
          <rect x="734" y="320" width="16" height="22" rx="4" fill="#fffaf2" />
          <path d="M706 324 Q742 270 778 324 Z" fill={night ? '#f08a64' : '#cf6440'} />
          {[
            [726, 306],
            [752, 298],
            [762, 316],
          ].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="5" fill="#fffaf2" />
          ))}
        </g>
      )
    case 'lamp_string':
      return (
        <g>
          <path d="M440 46 Q 560 76 720 46 T 800 60" stroke="#6c9461" strokeWidth="2" fill="none" />
          {[460, 500, 540, 580, 620, 660, 700, 740, 780].map((x, i) => {
            const y = 46 + Math.sin((i / 8) * Math.PI) * 26
            return (
              <g key={x}>
                {night && <circle cx={x} cy={y + 6} r="14" fill="#ffd98a" opacity=".35" className="anim-flicker" />}
                <circle cx={x} cy={y + 6} r="4.5" fill={night ? '#ffe7a8' : '#f3dca6'} />
              </g>
            )
          })}
        </g>
      )
    case 'lamp_owl':
      return (
        <g>
          {night && <circle cx="742" cy="300" r="120" fill="url(#lampglow)" className="anim-flicker" />}
          <ellipse cx="742" cy="306" rx="30" ry="36" fill="#8c5f3d" />
          <path d="M716 280 l6 -18 l12 14 z M768 280 l-6 -18 l-12 14 z" fill="#8c5f3d" />
          <ellipse cx="742" cy="318" rx="18" ry="18" fill="#c9a07a" />
          <circle cx="730" cy="296" r="9" fill={night ? '#ffe7a8' : '#fffaf2'} />
          <circle cx="754" cy="296" r="9" fill={night ? '#ffe7a8' : '#fffaf2'} />
          <circle cx="730" cy="296" r="3.5" fill="#2f2622" />
          <circle cx="754" cy="296" r="3.5" fill="#2f2622" />
          <path d="M738 306 l4 6 l4 -6z" fill="#dfa63b" />
          <ellipse cx="742" cy="342" rx="26" ry="5" fill="#6b4a2e" />
        </g>
      )
    default:
      return (
        <g>
          {night && <circle cx="742" cy="150" r="130" fill="url(#lampglow)" className="anim-flicker" />}
          <rect x="738" y="150" width="6" height="182" fill="#6b4a2e" />
          <ellipse cx="741" cy="334" rx="26" ry="6" fill="#6b4a2e" />
          <path d="M712 152 L726 106 H756 L770 152 Z" fill={night ? '#ffe2a0' : '#f1dcb5'} stroke="#d1b183" strokeWidth="2" />
        </g>
      )
  }
}

/**
 * The buddy's bedroom. The window follows the real time of day, the lamp switches on at night,
 * the corkboard gets a note for each thing finished today, and every slot can be redecorated.
 */
export function RoomScene({
  part,
  notesToday,
  decor = DEFAULT_DECOR,
  children,
}: {
  part: DayPart
  notesToday: number
  decor?: Record<DecorSlot, string>
  children?: ReactNode
}) {
  const [skyTop, skyBottom] = SKY[part]
  const night = part === 'night'
  const notes = Math.min(notesToday, 6)
  const noteColors = ['#f8e08e', '#f6c1a7', '#cfe3c1', '#c9dcef', '#f8e08e', '#f6c1a7']

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[18px] sm:aspect-[16/9]">
      <svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={skyTop} />
            <stop offset="1" stopColor={skyBottom} />
          </linearGradient>
          <radialGradient id="lampglow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffd98a" stopOpacity=".75" />
            <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sunbeam" cx="0.5" cy="0" r="1">
            <stop offset="0" stopColor="#fff3d6" stopOpacity=".55" />
            <stop offset="1" stopColor="#fff3d6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* wall */}
        <Wallpaper id={decor.wallpaper} />
        {/* wainscot */}
        <rect y="262" width="800" height="68" fill="#e4cfb1" />
        <rect y="258" width="800" height="6" fill="#d7bd98" />
        {Array.from({ length: 16 }, (_, i) => (
          <rect key={i} x={i * 52 + 14} y="274" width="38" height="44" rx="3" fill="none" stroke="#d6bd9a" strokeWidth="2" />
        ))}
        {/* floor */}
        <rect y="330" width="800" height="120" fill="#b98457" />
        <rect y="326" width="800" height="8" fill="#9c6c45" />
        {[352, 380, 412].map((y) => (
          <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#a7744b" strokeWidth="2" />
        ))}
        {[90, 260, 430, 610, 170, 520, 700].map((x, i) => (
          <line key={x} x1={x} y1={[334, 352, 380, 412][i % 4]} x2={x} y2={[352, 380, 412, 450][i % 4]} stroke="#a7744b" strokeWidth="2" />
        ))}

        {/* window */}
        <g>
          <rect x="478" y="58" width="196" height="172" rx="6" fill="url(#sky)" />
          {part === 'day' && (
            <>
              <circle cx="630" cy="102" r="18" fill="#fff1bf" />
              <g className="anim-drift" fill="#fff" opacity=".9">
                <ellipse cx="530" cy="118" rx="26" ry="10" />
                <ellipse cx="548" cy="110" rx="16" ry="10" />
              </g>
            </>
          )}
          {(part === 'dawn' || part === 'dusk') && <circle cx={part === 'dawn' ? 520 : 630} cy="196" r="24" fill="#ffe2a8" opacity=".95" />}
          {night && (
            <>
              <path d="M628 92a20 20 0 1 0 18 28 16 16 0 1 1-18-28z" fill="#f4ecd0" />
              {[
                [508, 84],
                [540, 120],
                [586, 78],
                [520, 170],
                [600, 150],
                [650, 190],
              ].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={i % 2 ? 1.6 : 2.2} fill="#fff" opacity=".85" />
              ))}
            </>
          )}
          <path d="M478 214 Q 530 186 580 206 T 674 200 V230 H478z" fill={night ? '#2b3858' : '#9dbd8e'} opacity=".9" />
          <rect x="478" y="58" width="196" height="172" rx="6" fill="none" stroke="#fffaf2" strokeWidth="10" />
          <line x1="576" y1="58" x2="576" y2="230" stroke="#fffaf2" strokeWidth="7" />
          <line x1="478" y1="144" x2="674" y2="144" stroke="#fffaf2" strokeWidth="7" />
          <rect x="466" y="230" width="220" height="12" rx="3" fill="#fffaf2" />
          <rect x="466" y="240" width="220" height="4" fill="#e6d4bc" />
          <path d="M456 46 h40 c-6 60 -2 130 10 196 h-46 z" fill="#d98a68" />
          <path d="M696 46 h-40 c6 60 2 130 -10 196 h46 z" fill="#d98a68" />
          <path d="M470 46 c-2 70 2 130 10 196" stroke="#c97856" strokeWidth="3" fill="none" />
          <path d="M682 46 c2 70 -2 130 -10 196" stroke="#c97856" strokeWidth="3" fill="none" />
          <rect x="446" y="40" width="260" height="8" rx="4" fill="#8c5f3d" />
          <rect x="648" y="214" width="20" height="17" rx="3" fill="#c9714b" />
          <path d="M658 214 c-8 -10 -12 -16 -6 -24 M658 214 c6 -12 12 -14 14 -22 M658 214 c0 -10 2 -16 0 -26" stroke="#6c9461" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>

        {(part === 'day' || part === 'dawn') && <path d="M480 244 L680 244 L760 450 L380 450 Z" fill="url(#sunbeam)" />}

        <WallArt id={decor.art} />

        {/* shelf with books */}
        <g>
          <rect x="70" y="150" width="200" height="10" rx="2" fill="#8c5f3d" />
          <path d="M86 160 l10 14 M254 160 l-10 14" stroke="#7a5233" strokeWidth="5" strokeLinecap="round" />
          {(() => {
            let x = 82
            return BOOKS.map((bk, i) => {
              const el = <rect key={i} x={x} y={150 - bk.h} width={bk.w} height={bk.h} rx="2" fill={bk.c} />
              x += bk.w + 2
              return el
            })
          })()}
          <rect x="146" y="112" width="12" height="38" rx="2" fill="#c7802f" transform="rotate(14 152 150)" />
          <path d="M196 120 h22 v6 a11 11 0 0 1 -22 0z" fill="#e3b04b" />
          <rect x="203" y="136" width="8" height="8" fill="#e3b04b" />
          <rect x="198" y="143" width="18" height="7" rx="1" fill="#b9852b" />
          <rect x="234" y="132" width="20" height="18" rx="3" fill="#7d9b72" />
          <circle cx="244" cy="126" r="9" fill="#6c9461" />
        </g>

        {/* corkboard: one note per thing finished today */}
        <g>
          <rect x="300" y="78" width="132" height="96" rx="6" fill="#c99a6a" stroke="#8c5f3d" strokeWidth="6" />
          {Array.from({ length: notes }, (_, i) => {
            const col = i % 3
            const row = Math.floor(i / 3)
            const x = 312 + col * 38
            const y = 90 + row * 40
            return (
              <g key={i} transform={`rotate(${[-6, 4, -2, 5, -4, 3][i]} ${x + 15} ${y + 15})`}>
                <rect x={x} y={y} width="30" height="30" fill={noteColors[i]} />
                <path d={`M${x + 6} ${y + 12} h18 M${x + 6} ${y + 19} h12`} stroke="#00000030" strokeWidth="2" strokeLinecap="round" />
                <circle cx={x + 15} cy={y + 3} r="3" fill="#cf6440" />
              </g>
            )
          })}
          {notes === 0 && (
            <text x="366" y="132" textAnchor="middle" fontFamily="Caveat, cursive" fontSize="20" fill="#6b4a2e" opacity=".8">
              nothing yet!
            </text>
          )}
        </g>

        <Lamp id={decor.lamp} night={night} />
        <Plant id={decor.plant} />
        <Rug id={decor.rug} />
        <Bed id={decor.bed} />

        {night && <rect width="800" height="450" fill="#1d2140" opacity=".22" />}
      </svg>
      {children}
    </div>
  )
}
