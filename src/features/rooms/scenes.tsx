import type { ReactNode } from 'react'

/**
 * Illustrated backdrops for each room, drawn in the same flat, warm style as the
 * buddy's bedroom on Home. Every scene is 800×450 and crops to fill its box.
 */
function Scene({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      {children}
    </svg>
  )
}

function Planks({ y, fill, line }: { y: number; fill: string; line: string }) {
  return (
    <g>
      <rect y={y} width="800" height={450 - y} fill={fill} />
      <rect y={y - 4} width="800" height="7" fill={line} />
      {[0.25, 0.55].map((f) => (
        <line key={f} x1="0" x2="800" y1={y + (450 - y) * f} y2={y + (450 - y) * f} stroke={line} strokeWidth="2" opacity=".6" />
      ))}
      {[70, 230, 410, 580, 720].map((x, i) => (
        <line key={x} x1={x} x2={x} y1={i % 2 ? y : y + (450 - y) * 0.25} y2={i % 2 ? y + (450 - y) * 0.25 : y + (450 - y) * 0.55} stroke={line} strokeWidth="2" opacity=".6" />
      ))}
    </g>
  )
}

type WinProps = { id: string; x: number; y: number; w: number; h: number; sky: [string, string]; time: 'day' | 'night' | 'gold'; curtain: string; frame?: string }

function Win({ id, x, y, w, h, sky, time, curtain, frame = '#fffaf2' }: WinProps) {
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="1" stopColor={sky[1]} />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx="5" fill={`url(#${id})`} />
      {time === 'night' && (
        <>
          <path d={`M${x + w - 46} ${y + 30}a18 18 0 1 0 16 25 14 14 0 1 1-16-25z`} fill="#f4ecd0" />
          {[
            [0.15, 0.2],
            [0.35, 0.45],
            [0.55, 0.15],
            [0.2, 0.7],
            [0.7, 0.6],
          ].map(([fx, fy], i) => (
            <circle key={i} cx={x + w * fx} cy={y + h * fy} r={i % 2 ? 1.5 : 2.2} fill="#fff" opacity=".85" />
          ))}
        </>
      )}
      {time === 'day' && (
        <g fill="#fff" opacity=".9" className="anim-drift">
          <ellipse cx={x + w * 0.3} cy={y + h * 0.3} rx="24" ry="9" />
          <ellipse cx={x + w * 0.3 + 16} cy={y + h * 0.3 - 7} rx="14" ry="9" />
        </g>
      )}
      {time === 'gold' && <circle cx={x + w * 0.65} cy={y + h * 0.78} r="22" fill="#ffe2a8" />}
      <path d={`M${x} ${y + h - 18} Q ${x + w * 0.3} ${y + h - 40} ${x + w * 0.55} ${y + h - 24} T ${x + w} ${y + h - 30} V${y + h} H${x}z`} fill={time === 'night' ? '#2b3858' : '#9dbd8e'} />
      <rect x={x} y={y} width={w} height={h} rx="5" fill="none" stroke={frame} strokeWidth="9" />
      <line x1={x + w / 2} x2={x + w / 2} y1={y} y2={y + h} stroke={frame} strokeWidth="6" />
      <line x1={x} x2={x + w} y1={y + h * 0.48} y2={y + h * 0.48} stroke={frame} strokeWidth="6" />
      <rect x={x - 12} y={y + h} width={w + 24} height="10" rx="3" fill={frame} />
      <path d={`M${x - 20} ${y - 10} h34 c-5 ${h * 0.35} -2 ${h * 0.75} 8 ${h + 10} h-42 z`} fill={curtain} />
      <path d={`M${x + w + 20} ${y - 10} h-34 c5 ${h * 0.35} 2 ${h * 0.75} -8 ${h + 10} h42 z`} fill={curtain} />
      <rect x={x - 28} y={y - 16} width={w + 56} height="7" rx="3.5" fill="#7a5233" />
    </g>
  )
}

function Shelf({ x, y, books }: { x: number; y: number; books: [number, number, string][] }) {
  let cx = x + 8
  return (
    <g>
      {books.map(([w, h, c], i) => {
        const el = <rect key={i} x={cx} y={y - h} width={w} height={h} rx="2" fill={c} />
        cx += w + 2
        return el
      })}
      <rect x={x} y={y} width={Math.max(cx - x + 8, 60)} height="8" rx="2" fill="#7a5233" />
    </g>
  )
}

const BOOKS_A: [number, number, string][] = [
  [12, 44, '#b9583a'],
  [10, 38, '#6f63a6'],
  [14, 48, '#3f86ad'],
  [9, 34, '#dfa63b'],
  [12, 42, '#6c9461'],
]
const BOOKS_B: [number, number, string][] = [
  [11, 40, '#c7802f'],
  [13, 46, '#7d9b72'],
  [9, 36, '#cf6440'],
  [12, 44, '#4f6a8f'],
]

/** Study Room: late night, desk lamp on, everything else quiet. */
export function StudyScene() {
  return (
    <Scene>
      <defs>
        <pattern id="st-wall" width="28" height="28" patternUnits="userSpaceOnUse">
          <rect width="28" height="28" fill="#3a4263" />
          <rect width="14" height="28" fill="#3e4768" />
        </pattern>
        <radialGradient id="st-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd98a" stopOpacity=".7" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="450" fill="url(#st-wall)" />
      <Planks y={340} fill="#4f3a2e" line="#3f2e24" />
      <Win id="st-sky" x={230} y={70} w={200} h={180} sky={['#18223d', '#2d3a62']} time="night" curtain="#5f5280" frame="#d9ccb6" />
      {/* tall bookcase */}
      <rect x="34" y="96" width="140" height="244" rx="4" fill="#5e3f2c" />
      <Shelf x={42} y={160} books={BOOKS_A} />
      <Shelf x={42} y={228} books={BOOKS_B} />
      <Shelf x={42} y={296} books={BOOKS_A.slice(1)} />
      {/* lamp glow */}
      <ellipse cx="620" cy="282" rx="210" ry="140" fill="url(#st-glow)" className="anim-flicker" />
      {/* desk */}
      <rect x="470" y="292" width="310" height="14" rx="3" fill="#8c5f3d" />
      <rect x="484" y="306" width="12" height="40" fill="#6e4a30" />
      <rect x="640" y="306" width="126" height="40" rx="3" fill="#7a5233" />
      <circle cx="703" cy="326" r="4" fill="#d9b17e" />
      {/* desk lamp */}
      <ellipse cx="724" cy="290" rx="22" ry="5" fill="#3f2e24" />
      <path d="M724 288 L700 226 L660 214" stroke="#3f2e24" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M640 236 L652 196 L690 210 Z" fill="#dfa63b" />
      {/* books + mug + notebook */}
      <rect x="500" y="266" width="62" height="10" rx="2" fill="#6f63a6" />
      <rect x="504" y="256" width="56" height="10" rx="2" fill="#b9583a" />
      <rect x="498" y="276" width="66" height="16" rx="2" fill="#3f86ad" />
      <rect x="586" y="262" width="22" height="30" rx="4" fill="#f1e4cf" />
      <path d="M608 270 q10 2 0 14" stroke="#f1e4cf" strokeWidth="4" fill="none" />
      <path d="M593 254 q-4 -8 2 -14 M601 254 q-4 -8 2 -14" stroke="#f1e4cf" strokeWidth="2.5" fill="none" opacity=".6" strokeLinecap="round" />
      <path d="M620 290 l30 -6 l30 6 l-30 4 z" fill="#fffaf2" />
      <line x1="650" y1="284" x2="650" y2="294" stroke="#cdbfa8" strokeWidth="2" />
    </Scene>
  )
}

/** Homework & Writing: bright afternoon desk with a corkboard of to-dos. */
export function HomeworkScene() {
  return (
    <Scene>
      <defs>
        <pattern id="hw-wall" width="30" height="30" patternUnits="userSpaceOnUse">
          <rect width="30" height="30" fill="#e7ecea" />
          <path d="M30 0H0V30" fill="none" stroke="#d9e2e0" strokeWidth="1.5" />
        </pattern>
      </defs>
      <rect width="800" height="450" fill="url(#hw-wall)" />
      <Planks y={344} fill="#c9a27a" line="#b28b63" />
      <Win id="hw-sky" x={540} y={66} w={190} h={176} sky={['#9cc8e4', '#d8ecf4']} time="day" curtain="#e3b989" />
      {/* corkboard */}
      <rect x="110" y="70" width="230" height="140" rx="6" fill="#c99a6a" stroke="#8c5f3d" strokeWidth="7" />
      {[
        [128, 86, '#f8e08e', -5],
        [178, 92, '#cfe3c1', 4],
        [232, 84, '#c9dcef', -3],
        [284, 94, '#f6c1a7', 6],
        [150, 146, '#c9dcef', 3],
        [214, 150, '#f8e08e', -4],
      ].map(([x, y, c, r], i) => (
        <g key={i} transform={`rotate(${r} ${(x as number) + 18} ${(y as number) + 18})`}>
          <rect x={x as number} y={y as number} width="36" height="36" fill={c as string} />
          <path d={`M${(x as number) + 6} ${(y as number) + 15} h22 M${(x as number) + 6} ${(y as number) + 23} h14`} stroke="#00000030" strokeWidth="2" strokeLinecap="round" />
          <circle cx={(x as number) + 18} cy={(y as number) + 4} r="3" fill="#cf6440" />
        </g>
      ))}
      {/* wall clock */}
      <circle cx="420" cy="110" r="32" fill="#fffaf2" stroke="#7a5233" strokeWidth="6" />
      <path d="M420 110 V90 M420 110 L434 118" stroke="#2f2622" strokeWidth="4" strokeLinecap="round" />
      {/* desk */}
      <rect x="60" y="294" width="460" height="14" rx="3" fill="#a2724c" />
      <rect x="78" y="308" width="14" height="44" fill="#86593a" />
      <rect x="380" y="308" width="124" height="44" rx="3" fill="#8c5f3d" />
      <circle cx="442" cy="328" r="4" fill="#e3c08f" />
      {/* papers, pencil cup, laptop */}
      <path d="M130 292 l70 -8 l6 10 l-70 6z" fill="#fffaf2" />
      <path d="M150 292 l70 -4 l4 6 l-70 3z" fill="#f4efe6" />
      <rect x="262" y="256" width="26" height="36" rx="4" fill="#3f86ad" />
      <path d="M268 256 l-6 -26 M276 256 l2 -30 M283 256 l8 -22" stroke="#dfa63b" strokeWidth="4" strokeLinecap="round" />
      <path d="M318 292 L330 242 H420 L432 292 Z" fill="#cfd8dc" />
      <rect x="306" y="290" width="138" height="6" rx="3" fill="#b0bcc1" />
      <rect x="338" y="250" width="74" height="34" rx="2" fill="#e9f1f4" />
      {/* plant on floor */}
      <path d="M612 400 h44 l-5 40 h-34 z" fill="#c9714b" />
      <path d="M634 400 C 620 370, 604 366, 598 346 M634 400 C 632 366, 640 346, 636 324 M634 400 C 650 372, 664 368, 670 350" stroke="#6c9461" strokeWidth="8" fill="none" strokeLinecap="round" />
    </Scene>
  )
}

/** Reading Nook: armchair by the fire, shelves of books, evening. */
export function ReadingScene() {
  return (
    <Scene>
      <defs>
        <pattern id="rd-wall" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#6e4532" />
          <path d="M20 8 l5 8 -5 8 -5 -8z" fill="#77503b" />
        </pattern>
        <radialGradient id="rd-fire" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffb760" stopOpacity=".7" />
          <stop offset="1" stopColor="#ffb760" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="450" fill="url(#rd-wall)" />
      <Planks y={346} fill="#5a3a29" line="#4a2f21" />
      {/* bookshelves left */}
      <rect x="30" y="60" width="200" height="286" rx="4" fill="#4a2f21" />
      {[120, 190, 260, 330].map((y, i) => (
        <Shelf key={y} x={38} y={y} books={i % 2 ? [...BOOKS_B, ...BOOKS_A.slice(0, 3)] : [...BOOKS_A, ...BOOKS_B.slice(0, 2)]} />
      ))}
      {/* fireplace */}
      <ellipse cx="560" cy="330" rx="230" ry="150" fill="url(#rd-fire)" className="anim-flicker" />
      <rect x="450" y="170" width="220" height="176" rx="6" fill="#a5654a" />
      {Array.from({ length: 5 }, (_, r) =>
        Array.from({ length: 6 }, (_, c) => (
          <rect key={`${r}-${c}`} x={454 + c * 36 + (r % 2) * 18} y={176 + r * 26} width="32" height="22" rx="2" fill="#b47457" opacity=".6" />
        )),
      )}
      <rect x="436" y="160" width="248" height="16" rx="3" fill="#7a5233" />
      <path d="M500 346 V250 Q 560 206 620 250 V346 Z" fill="#2a1a14" />
      <g className="anim-flicker">
        <path d="M528 346 C 520 316, 540 300, 548 276 C 556 300, 566 290, 566 270 C 584 296, 596 316, 590 346 Z" fill="#e8833f" />
        <path d="M542 346 C 538 326, 552 314, 556 298 C 562 316, 574 318, 576 346 Z" fill="#f6c654" />
      </g>
      <rect x="520" y="338" width="80" height="10" rx="4" fill="#5e3d2b" />
      {/* mantel things */}
      <rect x="470" y="128" width="10" height="32" rx="2" fill="#fff3d6" />
      <path d="M475 128 q-4 -8 0 -12 q4 4 0 12" fill="#f6c654" />
      <rect x="640" y="134" width="22" height="26" rx="3" fill="#7d9b72" />
      <circle cx="651" cy="128" r="11" fill="#6c9461" />
      {/* armchair */}
      <path d="M250 346 V250 Q 250 214 290 214 H370 Q 410 214 410 250 V346 Z" fill="#c7802f" />
      <rect x="236" y="272" width="36" height="74" rx="14" fill="#b26f25" />
      <rect x="390" y="272" width="36" height="74" rx="14" fill="#b26f25" />
      <rect x="268" y="290" width="126" height="34" rx="10" fill="#d89443" />
      <rect x="300" y="236" width="60" height="44" rx="12" fill="#e9c27a" />
      {/* blanket + side table */}
      <path d="M268 324 h126 v22 h-126z" fill="#cf6440" />
      <path d="M278 324 v22 M298 324 v22 M318 324 v22 M338 324 v22 M358 324 v22 M378 324 v22" stroke="#e8946f" strokeWidth="3" />
      {/* rug */}
      <ellipse cx="400" cy="408" rx="230" ry="30" fill="#8c3f2c" />
      <ellipse cx="400" cy="408" rx="200" ry="22" fill="none" stroke="#d9a06b" strokeWidth="4" strokeDasharray="10 8" />
    </Scene>
  )
}

/** Quick Tasks: sunny kitchen counter with herbs and a fridge list. */
export function ChoresScene() {
  return (
    <Scene>
      <defs>
        <pattern id="ch-tile" width="34" height="22" patternUnits="userSpaceOnUse">
          <rect width="34" height="22" fill="#f7f3ea" />
          <path d="M0 21.5H34M33.5 0V22" stroke="#e2dccf" strokeWidth="1.5" />
        </pattern>
      </defs>
      <rect width="800" height="450" fill="#dfe6d3" />
      <rect y="170" width="800" height="120" fill="url(#ch-tile)" />
      <Planks y={380} fill="#c9a27a" line="#b28b63" />
      <Win id="ch-sky" x={300} y={54} w={200} h={150} sky={['#f6d3a8', '#fbecd0']} time="gold" curtain="#9cb98d" />
      {/* hanging pothos */}
      <path d="M150 0 V60" stroke="#7a5233" strokeWidth="2" />
      <path d="M130 60 h40 l-6 24 h-28z" fill="#c9714b" />
      <path d="M140 84 c-6 30 -2 60 -12 90 M160 84 c8 24 4 50 14 70" stroke="#6c9461" strokeWidth="5" fill="none" strokeLinecap="round" />
      {[110, 130, 150, 170].map((y, i) => (
        <ellipse key={y} cx={i % 2 ? 166 : 134} cy={y} rx="7" ry="5" fill="#7d9b72" />
      ))}
      {/* counter + cabinets */}
      <rect x="0" y="290" width="800" height="16" fill="#a2724c" />
      <rect x="0" y="306" width="800" height="78" fill="#9cb98d" />
      {[60, 220, 380, 540, 700].map((x) => (
        <g key={x}>
          <rect x={x - 70} y="314" width="140" height="62" rx="4" fill="#a9c49a" stroke="#88a77a" strokeWidth="2" />
          <rect x={x - 12} y="330" width="24" height="5" rx="2.5" fill="#7a5233" />
        </g>
      ))}
      {/* sink tap */}
      <path d="M402 290 V256 Q402 244 414 244 H426" stroke="#b0bcc1" strokeWidth="7" fill="none" strokeLinecap="round" />
      {/* herbs */}
      {[560, 600, 640].map((x, i) => (
        <g key={x}>
          <rect x={x} y="262" width="26" height="28" rx="4" fill={['#cf6440', '#dfa63b', '#3f86ad'][i]} />
          <circle cx={x + 8} cy="254" r="9" fill="#6c9461" />
          <circle cx={x + 18} cy="250" r="10" fill="#7d9b72" />
        </g>
      ))}
      {/* jars + cutting board */}
      <rect x="120" y="248" width="30" height="42" rx="6" fill="#f4e6cf" stroke="#d9c6a6" strokeWidth="2" />
      <rect x="160" y="256" width="26" height="34" rx="6" fill="#f4e6cf" stroke="#d9c6a6" strokeWidth="2" />
      <rect x="116" y="242" width="38" height="8" rx="3" fill="#a2724c" />
      <rect x="230" y="270" width="90" height="20" rx="6" fill="#c7915f" />
      {/* checklist note taped to the wall */}
      <g transform="rotate(-4 700 200)">
        <rect x="660" y="140" width="84" height="104" fill="#fffaf2" />
        <rect x="688" y="134" width="28" height="12" fill="#e9d8b8" opacity=".9" />
        {[164, 186, 208, 230].map((y, i) => (
          <g key={y}>
            <rect x="670" y={y - 7} width="10" height="10" rx="2" fill="none" stroke="#6c9461" strokeWidth="2" />
            {i < 2 && <path d={`M671 ${y - 2} l3 3 l6 -7`} stroke="#6c9461" strokeWidth="2.5" fill="none" />}
            <path d={`M686 ${y - 2} h${40 - i * 6}`} stroke="#cdbfa8" strokeWidth="3" strokeLinecap="round" />
          </g>
        ))}
      </g>
      {/* laundry basket */}
      <path d="M560 440 l-10 -52 h110 l-10 52z" fill="#d9b17e" />
      <path d="M560 388 h100 M556 404 h108 M558 420 h104" stroke="#b9925f" strokeWidth="3" />
      <path d="M566 388 q20 -22 40 -6 q16 -16 40 4" fill="#c9dcef" />
    </Scene>
  )
}

/** Relax Room: outside at golden hour. Literally away from the screen. */
export function RelaxScene() {
  return (
    <Scene>
      <defs>
        <linearGradient id="rx-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2b48a" />
          <stop offset=".6" stopColor="#f8d9a6" />
          <stop offset="1" stopColor="#fbe9c4" />
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#rx-sky)" />
      <circle cx="560" cy="250" r="56" fill="#ffe7b0" />
      <g fill="#fff6e6" opacity=".8" className="anim-drift">
        <ellipse cx="160" cy="90" rx="46" ry="14" />
        <ellipse cx="190" cy="78" rx="28" ry="14" />
        <ellipse cx="420" cy="60" rx="34" ry="10" />
      </g>
      <path d="M0 290 Q 160 230 330 270 T 800 250 V450 H0z" fill="#a9c18f" />
      <path d="M0 330 Q 200 280 420 320 T 800 300 V450 H0z" fill="#89a873" />
      <path d="M0 380 Q 260 340 520 372 T 800 360 V450 H0z" fill="#6f9160" />
      {/* trees */}
      {[
        [110, 300, 1],
        [180, 318, 0.8],
        [690, 296, 1.1],
      ].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <rect x="-5" y="-10" width="10" height="44" fill="#6e4a30" />
          <circle cx="0" cy="-30" r="34" fill="#5f8656" />
          <circle cx="-18" cy="-14" r="22" fill="#6c9461" />
          <circle cx="20" cy="-16" r="24" fill="#6c9461" />
        </g>
      ))}
      {/* picnic blanket */}
      <path d="M300 420 L360 376 L520 384 L500 432 Z" fill="#cf6440" />
      <path d="M330 398 L500 406 M345 386 L480 432 M420 380 L400 430" stroke="#f3c99f" strokeWidth="5" opacity=".8" />
      {/* flowers */}
      {[
        [60, 410, '#fffaf2'],
        [90, 424, '#f6c654'],
        [620, 420, '#fffaf2'],
        [660, 404, '#f6c1a7'],
        [740, 428, '#f6c654'],
        [250, 430, '#f6c1a7'],
      ].map(([x, y, c], i) => (
        <g key={i}>
          <line x1={x as number} y1={y as number} x2={x as number} y2={(y as number) + 14} stroke="#4f7046" strokeWidth="2" />
          <circle cx={x as number} cy={y as number} r="5" fill={c as string} />
        </g>
      ))}
      {/* birds */}
      <path d="M300 120 q8 -8 16 0 q8 -8 16 0 M360 96 q6 -6 12 0 q6 -6 12 0" stroke="#7a5a46" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </Scene>
  )
}
