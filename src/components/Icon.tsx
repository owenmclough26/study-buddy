import type { SVGProps } from 'react'

const PATHS = {
  home: 'M4 11.5 12 4.5l8 7V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z',
  calendar: 'M5 5.5h14a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1zM8 3.5v4M16 3.5v4M4 10.5h16',
  list: 'M10 6.5h10M10 12h10M10 17.5h10M3.8 6.4l1.2 1.2 2.2-2.4M3.8 11.9l1.2 1.2 2.2-2.4M4 17.5h2.8',
  door: 'M6.5 20.5V4.5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M3.5 20.5h17M14.3 12.3h.01',
  sliders: 'M4 7.5h9M17 7.5h3M4 16.5h3M11 16.5h9M15 5.5v4M9 14.5v4',
  study: 'M5 4.5h11.5a1 1 0 0 1 1 1v12H6.5A1.5 1.5 0 0 0 5 19zM5 19a1.5 1.5 0 0 0 1.5 1.5h11v-3M9 8.5h5',
  homework: 'M5 19.5l1-4.2L15.8 5.5a1.6 1.6 0 0 1 2.3 0l.4.4a1.6 1.6 0 0 1 0 2.3L8.7 18zM14 7.3l2.7 2.7M5 19.5h14',
  reading: 'M12 6.5C10 5 7 4.5 4 5v13.5c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5zM12 6.5V20',
  chores: 'M19.5 4.5 13 11M9.6 9.4l5 5-3.8 5.1c-1.5.9-4.4.9-5.8-.5S3.6 15.2 4.5 13.6z M7.5 15.5l1.5 1.5',
  relax: 'M5 19.5c0-8.5 6-14.5 15-14.5 0 9-6 15-14.5 15M5 19.5l7.5-7.5',
  play: 'M8 5.5v13l10.5-6.5z',
  pause: 'M8.5 5.5v13M15.5 5.5v13',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5',
  arrow: 'M5 12h13.5M13 6.5l5.5 5.5-5.5 5.5',
  back: 'M19 12H5.5M11 6.5 5.5 12l5.5 5.5',
  clock: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 7.5V12l3 2',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  heart: 'M12 19.5s-7.5-4.6-7.5-10a4 4 0 0 1 7.5-2 4 4 0 0 1 7.5 2c0 5.4-7.5 10-7.5 10z',
  bolt: 'M13 3 5.5 13.5h6l-1 7.5L18.5 10h-6z',
  bulb: 'M9.5 17.5h5M10.5 20.5h3M12 3.5a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3.5z',
  expand: 'M4.5 9V4.5H9M19.5 9V4.5H15M4.5 15v4.5H9M19.5 15v4.5H15',
  close: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  pin: 'M12 16.5v4.5M8.5 3.5h7l-1 5.5 3 3h-11l3-3z',
  sound: 'M4.5 10v4h3.5l4.5 4V6L8 10zM16 9a4.2 4.2 0 0 1 0 6M18.5 6.5a7.7 7.7 0 0 1 0 11',
  star: 'M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.8l-5.1 2.7 1-5.7-4.1-4 5.7-.8z',
  sprout: 'M12 20.5v-8M12 12.5C12 9 9.5 7 5.5 7c0 3.5 2.5 5.5 6.5 5.5zM12 11c0-3.5 2.5-5.5 6.5-5.5 0 3.5-2.5 5.5-6.5 5.5',
  dots: 'M6 12h.01M12 12h.01M18 12h.01',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, className = 'h-5 w-5', strokeWidth = 1.9, ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  const filled = name === 'play'
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={name === 'dots' ? 3.2 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}

export function Coin({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" fill="#e9b949" stroke="#b9852b" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="5.5" fill="none" stroke="#c99536" strokeWidth="1.4" />
      <path d="M9.2 8.8a4 4 0 0 1 2.3-1" stroke="#fff6dc" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function Flame({ className = 'h-4 w-4', lit = true }: { className?: string; lit?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 2.8c1 3 5.5 5.3 5.5 10.4a5.5 5.5 0 0 1-11 0c0-2.4 1.2-4 2.3-5 0 2 .9 3.2 2 3.4-.2-3.3-.6-5.8 1.2-8.8z"
        fill={lit ? '#e8833f' : '#d9cbb6'}
        stroke={lit ? '#b65a24' : '#b9a78e'}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {lit && <path d="M12 20a2.6 2.6 0 0 1-2.6-2.6c0-1.7 1.4-2.6 2.6-4.4 1.2 1.8 2.6 2.7 2.6 4.4A2.6 2.6 0 0 1 12 20z" fill="#f6c654" />}
    </svg>
  )
}
