import type { ReactNode } from 'react'

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

/**
 * The buddy's bedroom. The window follows the real time of day, the lamp switches on at night,
 * and the corkboard gets a note for each thing finished today.
 */
export function RoomScene({ part, notesToday, children }: { part: DayPart; notesToday: number; children?: ReactNode }) {
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
          <pattern id="wallpaper" width="44" height="44" patternUnits="userSpaceOnUse">
            <rect width="44" height="44" fill="#efe1cc" />
            <circle cx="11" cy="11" r="2" fill="#e5d2b8" />
            <circle cx="33" cy="33" r="2" fill="#e5d2b8" />
          </pattern>
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
        <rect width="800" height="330" fill="url(#wallpaper)" />
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
          {/* distant hills */}
          <path d="M478 214 Q 530 186 580 206 T 674 200 V230 H478z" fill={night ? '#2b3858' : '#9dbd8e'} opacity=".9" />
          {/* frame */}
          <rect x="478" y="58" width="196" height="172" rx="6" fill="none" stroke="#fffaf2" strokeWidth="10" />
          <line x1="576" y1="58" x2="576" y2="230" stroke="#fffaf2" strokeWidth="7" />
          <line x1="478" y1="144" x2="674" y2="144" stroke="#fffaf2" strokeWidth="7" />
          <rect x="466" y="230" width="220" height="12" rx="3" fill="#fffaf2" />
          <rect x="466" y="240" width="220" height="4" fill="#e6d4bc" />
          {/* curtains */}
          <path d="M456 46 h40 c-6 60 -2 130 10 196 h-46 z" fill="#d98a68" />
          <path d="M696 46 h-40 c6 60 2 130 -10 196 h46 z" fill="#d98a68" />
          <path d="M470 46 c-2 70 2 130 10 196" stroke="#c97856" strokeWidth="3" fill="none" />
          <path d="M682 46 c2 70 -2 130 -10 196" stroke="#c97856" strokeWidth="3" fill="none" />
          <rect x="446" y="40" width="260" height="8" rx="4" fill="#8c5f3d" />
          {/* little plant on the sill */}
          <rect x="648" y="214" width="20" height="17" rx="3" fill="#c9714b" />
          <path d="M658 214 c-8 -10 -12 -16 -6 -24 M658 214 c6 -12 12 -14 14 -22 M658 214 c0 -10 2 -16 0 -26" stroke="#6c9461" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>

        {/* sunbeam on the floor */}
        {(part === 'day' || part === 'dawn') && <path d="M480 244 L680 244 L760 450 L380 450 Z" fill="url(#sunbeam)" />}

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
          {/* trophy for the level */}
          <path d="M196 120 h22 v6 a11 11 0 0 1 -22 0z" fill="#e3b04b" />
          <rect x="203" y="136" width="8" height="8" fill="#e3b04b" />
          <rect x="198" y="143" width="18" height="7" rx="1" fill="#b9852b" />
          {/* tiny pot */}
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

        {/* floor lamp */}
        <g>
          {night && <circle cx="742" cy="150" r="130" fill="url(#lampglow)" className="anim-flicker" />}
          <rect x="738" y="150" width="6" height="182" fill="#6b4a2e" />
          <ellipse cx="741" cy="334" rx="26" ry="6" fill="#6b4a2e" />
          <path d="M712 152 L726 106 H756 L770 152 Z" fill={night ? '#ffe2a0' : '#f1dcb5'} stroke="#d1b183" strokeWidth="2" />
        </g>

        {/* floor plant */}
        <g>
          <path d="M44 352 h52 l-6 46 h-40 z" fill="#c9714b" />
          <rect x="40" y="346" width="60" height="10" rx="3" fill="#b9633f" />
          <path d="M70 346 C 50 300 30 296 22 270 M70 346 C 66 300 74 270 70 236 M70 346 C 92 306 110 300 118 276 M70 346 C 58 320 46 318 40 304" stroke="#6c9461" strokeWidth="9" fill="none" strokeLinecap="round" />
        </g>

        {/* rug */}
        <ellipse cx="330" cy="398" rx="196" ry="36" fill="#cf6440" />
        <ellipse cx="330" cy="398" rx="170" ry="28" fill="none" stroke="#f3c99f" strokeWidth="4" strokeDasharray="10 8" />
        <ellipse cx="330" cy="398" rx="120" ry="18" fill="#d9805c" />

        {/* night dim */}
        {night && <rect width="800" height="450" fill="#1d2140" opacity=".22" />}
      </svg>
      {children}
    </div>
  )
}
