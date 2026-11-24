import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useData } from '../../lib/store'
import type { Category, RoomKey, Task } from '../../lib/types'
import { AmbientPlayer, AMBIENTS, type Ambient } from '../../lib/ambient'
import { mood } from '../../lib/rewards'
import { fmtDuration } from '../../lib/time'
import { BuddySprite } from '../buddy/BuddySprite'
import { Icon, type IconName } from '../../components/Icon'

export interface RoomTheme {
  key: RoomKey
  title: string
  tagline: string
  icon: IconName
  /** CSS background for the room */
  bg: string
  dark: boolean
  defaultGoal: number
  defaultSound: Ambient
  pomodoro?: boolean
  /** illustrated backdrop + a wash over it so text stays readable */
  scene: ReactNode
  wash: string
}

const POMO_FOCUS = 25 * 60
const POMO_BREAK = 5 * 60

function chime() {
  try {
    const ctx = new AudioContext()
    const t = ctx.currentTime
    ;[880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, t + i * 0.18)
      g.gain.exponentialRampToValueAtTime(0.25, t + i * 0.18 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.18 + 0.6)
      o.connect(g).connect(ctx.destination)
      o.start(t + i * 0.18)
      o.stop(t + i * 0.18 + 0.7)
    })
    window.setTimeout(() => void ctx.close(), 1500)
  } catch {
    /* audio unavailable */
  }
}

const fmtClock = (sec: number) => {
  const s = Math.max(0, Math.round(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

export function RoomShell({ theme, children }: { theme: RoomTheme; children?: (task: Task | null) => ReactNode }) {
  const { state, actions } = useData()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const taskId = params.get('task')
  const chunkId = params.get('chunk')
  const task = state.tasks.find((t) => t.id === taskId) ?? null
  const chunk = state.chunks.find((c) => c.id === chunkId) ?? null
  const category = theme.key === 'relax' ? null : (theme.key as Category)
  const choices = state.tasks.filter((t) => t.status === 'open' && t.category === category)

  const initialGoal = chunk
    ? Math.round((new Date(chunk.end_at).getTime() - new Date(chunk.start_at).getTime()) / 60_000)
    : task
      ? Math.max(5, Math.min(theme.defaultGoal * 2, task.estimated_minutes - task.logged_minutes))
      : theme.defaultGoal
  const [goal, setGoal] = useState(initialGoal)
  useEffect(() => setGoal(initialGoal), [initialGoal])

  const [running, setRunning] = useState(false)
  const [focusSec, setFocusSec] = useState(0)
  const [pomodoro, setPomodoro] = useState(!!theme.pomodoro)
  const [phase, setPhase] = useState<'focus' | 'break'>('focus')
  const [phaseSec, setPhaseSec] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const [taskDone, setTaskDone] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [startedAt, setStartedAt] = useState<Date | null>(null)

  // Timer: measure real elapsed time so background tabs stay accurate
  const last = useRef(0)
  const st = useRef({ phase, phaseSec, focusSec, pomodoro, goal })
  st.current = { phase, phaseSec, focusSec, pomodoro, goal }
  useEffect(() => {
    if (!running) return
    last.current = performance.now()
    const t = window.setInterval(() => {
      const nowT = performance.now()
      const dt = (nowT - last.current) / 1000
      last.current = nowT
      const s = st.current
      if (s.phase === 'focus') {
        const f = s.focusSec + dt
        const ps = s.phaseSec + dt
        setFocusSec(f)
        if (f >= s.goal * 60) {
          setRunning(false)
          chime()
          setFinishing(true)
        } else if (s.pomodoro && ps >= POMO_FOCUS) {
          chime()
          setPhase('break')
          setPhaseSec(0)
        } else setPhaseSec(ps)
      } else {
        const ps = s.phaseSec + dt
        if (ps >= POMO_BREAK) {
          chime()
          setPhase('focus')
          setPhaseSec(0)
        } else setPhaseSec(ps)
      }
    }, 500)
    return () => window.clearInterval(t)
  }, [running])

  // Ambient sound
  const player = useRef<AmbientPlayer | null>(null)
  const [sound, setSound] = useState<Ambient>('off')
  const [volume, setVolume] = useState(0.5)
  useEffect(() => {
    player.current = new AmbientPlayer()
    return () => player.current?.dispose()
  }, [])
  useEffect(() => player.current?.setVolume(volume), [volume])
  const pickSound = (s: Ambient) => {
    setSound(s)
    player.current?.play(s)
  }

  // Warn before leaving with unsaved focus time
  const unsaved = focusSec >= 60
  useEffect(() => {
    if (!unsaved) return
    const h = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [unsaved])

  // Focus mode = fullscreen overlay
  useEffect(() => {
    if (!focusMode) return
    document.documentElement.requestFullscreen?.().catch(() => {})
    const onExit = () => !document.fullscreenElement && setFocusMode(false)
    document.addEventListener('fullscreenchange', onExit)
    return () => {
      document.removeEventListener('fullscreenchange', onExit)
      if (document.fullscreenElement) void document.exitFullscreen?.()
    }
  }, [focusMode])

  function start() {
    if (!startedAt) setStartedAt(new Date())
    if (sound === 'off' && theme.defaultSound !== 'off' && focusSec === 0) pickSound(theme.defaultSound)
    setRunning(true)
  }

  function save() {
    const minutes = Math.floor(focusSec / 60)
    actions.logFocus({ room: theme.key, taskId: task?.id ?? null, chunkId: chunk?.id ?? null, minutes, startedAt: startedAt ?? new Date() })
    if (task && taskDone) actions.completeTask(task.id)
    setFocusSec(0)
    setPhaseSec(0)
    setPhase('focus')
    setStartedAt(null)
    setFinishing(false)
    setTaskDone(false)
    setFocusMode(false)
    player.current?.stop()
    setSound('off')
    navigate(task && !taskDone ? '/todos' : '/')
  }

  const b = state.buddy!
  const text = theme.dark ? 'text-paper' : 'text-ink'
  const sub = theme.dark ? 'text-paper/70' : 'text-ink/60'
  const panel = theme.dark ? 'bg-[rgb(24_20_36/.45)] ring-white/15 backdrop-blur-md' : 'bg-paper/80 ring-line backdrop-blur-md'
  const remaining = goal * 60 - focusSec
  const pct = Math.min(100, (focusSec / (goal * 60)) * 100)

  return (
    <div
      className={`${focusMode ? 'fixed inset-0 z-[60] rounded-none' : 'relative min-h-[78vh] rounded-3xl'} overflow-hidden ${text}`}
      style={{ background: theme.bg }}
    >
      {theme.scene}
      <div className="pointer-events-none absolute inset-0" style={{ background: theme.wash }} />
      <div className="relative flex h-full flex-col p-5 sm:p-8">
        {!focusMode && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Link
              to="/rooms"
              onClick={(e) => {
                if (unsaved && !window.confirm('Leave without saving your focus time?')) e.preventDefault()
              }}
              className={`grid h-10 w-10 place-items-center rounded-xl ring-1 ${panel}`}
              aria-label="Back to rooms"
              title="Back to rooms"
            >
              <Icon name="back" className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Icon name={theme.icon} className="h-7 w-7 opacity-80" />
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{theme.title}</h1>
                <p className={`text-sm ${sub}`}>{theme.tagline}</p>
              </div>
            </div>
          </div>
        )}

        <div className={`grid flex-1 gap-6 ${children && !focusMode ? 'lg:grid-cols-[1fr_360px]' : ''}`}>
          <div className="flex flex-col items-center justify-center text-center">
            {/* task picker */}
            <div className="mb-4 w-full max-w-md">
              {task ? (
                <div className={`rounded-2xl px-4 py-2 ring-1 ${panel}`}>
                  <div className={`text-xs font-bold ${sub}`}>Working on</div>
                  <div className="truncate font-display text-xl font-semibold">{task.title}</div>
                  <div className={`text-xs ${sub}`}>
                    {fmtDuration(task.logged_minutes)} of {fmtDuration(task.estimated_minutes)} done
                  </div>
                </div>
              ) : (
                <select
                  aria-label="Choose a task"
                  disabled={running || focusSec > 0}
                  className={`w-full rounded-2xl px-4 py-2.5 text-sm font-bold ring-1 outline-none ${panel} ${text}`}
                  value=""
                  onChange={(e) => e.target.value && setParams({ task: e.target.value })}
                >
                  <option value="" className="text-ink">Just focusing (no task). Pick one?</option>
                  {choices.map((t) => (
                    <option key={t.id} value={t.id} className="text-ink">
                      {t.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* timer ring */}
            <div
              className={`relative grid h-64 w-64 place-items-center rounded-full backdrop-blur-md sm:h-72 sm:w-72 ${
                theme.dark ? 'bg-[rgb(24_20_36/.35)]' : 'bg-paper/70'
              }`}
            >
              <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="4" />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 289} 289`}
                  className="transition-all duration-500"
                />
              </svg>
              <div>
                <div className={`font-hand text-2xl leading-none ${sub}`}>
                  {phase === 'break' ? 'break time, stretch!' : running ? 'locked in' : focusSec > 0 ? 'paused' : 'ready when you are'}
                </div>
                <div className="mt-1 font-display text-6xl font-semibold tabular-nums tracking-tight sm:text-7xl">
                  {phase === 'break' ? fmtClock(POMO_BREAK - phaseSec) : fmtClock(remaining)}
                </div>
                <div className={`mt-1 text-xs font-semibold ${sub}`}>
                  {fmtDuration(Math.floor(focusSec / 60))} of {fmtDuration(goal)}
                  {pomodoro && phase === 'focus' && ` · break in ${fmtClock(POMO_FOCUS - phaseSec)}`}
                </div>
              </div>
            </div>

            {/* controls */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {!running ? (
                <button className="btn bg-paper px-7 py-3 text-base text-ink shadow-[0_3px_0_rgb(0_0_0/.18)]" onClick={start}>
                  <Icon name="play" className="h-4 w-4" />
                  {focusSec > 0 ? 'Resume' : 'Start'}
                </button>
              ) : (
                <button className="btn bg-paper px-7 py-3 text-base text-ink shadow-[0_3px_0_rgb(0_0_0/.18)]" onClick={() => setRunning(false)}>
                  <Icon name="pause" className="h-4 w-4" strokeWidth={2.6} />
                  Pause
                </button>
              )}
              {focusSec >= 60 && (
                <button className={`btn px-4 py-3 ring-1 ${panel}`} onClick={() => { setRunning(false); setFinishing(true) }}>
                  <Icon name="check" className="h-4 w-4" strokeWidth={2.6} />
                  Finish
                </button>
              )}
              <button className={`btn px-4 py-3 ring-1 ${panel}`} onClick={() => setFocusMode(!focusMode)}>
                <Icon name="expand" className="h-4 w-4" />
                {focusMode ? 'Exit focus mode' : 'Focus mode'}
              </button>
            </div>

            {/* settings */}
            {!focusMode && (
              <div className={`mt-6 flex flex-wrap items-center justify-center gap-3 rounded-2xl px-4 py-3 text-sm ring-1 ${panel}`}>
                <label className="flex items-center gap-2 font-bold">
                  Goal
                  <select
                    className="rounded-lg bg-transparent font-bold outline-none"
                    value={goal}
                    disabled={running}
                    onChange={(e) => setGoal(Number(e.target.value))}
                  >
                    {[...new Set([5, 10, 15, 25, 30, 45, 60, 90, 120, 180, goal])].sort((a, z) => a - z).map((m) => (
                      <option key={m} value={m} className="text-ink">{fmtDuration(m)}</option>
                    ))}
                  </select>
                </label>
                {theme.pomodoro && (
                  <label className="flex items-center gap-1.5 font-bold">
                    <input type="checkbox" checked={pomodoro} onChange={(e) => setPomodoro(e.target.checked)} /> Pomodoro 25/5
                  </label>
                )}
                <Icon name="sound" className="h-4 w-4 opacity-70" />
                <select aria-label="Background sound" className="-ml-2 rounded-lg bg-transparent font-bold outline-none" value={sound} onChange={(e) => pickSound(e.target.value as Ambient)}>
                  {AMBIENTS.map((a) => (
                    <option key={a.key} value={a.key} className="text-ink">{a.label}</option>
                  ))}
                </select>
                {sound !== 'off' && (
                  <input aria-label="Volume" type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-24" />
                )}
              </div>
            )}
          </div>

          {children && !focusMode && <div className={`h-fit rounded-3xl p-5 ring-1 ${panel}`}>{children(task)}</div>}
        </div>

        {/* buddy keeps you company */}
        <div className="pointer-events-none absolute bottom-3 right-4 hidden sm:block">
          <BuddySprite species={b.species} level={b.level} mood={running ? 'happy' : mood(b)} hat={b.equipped_hat} size={focusMode ? 130 : 110} />
        </div>
      </div>

      {finishing && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="anim-pop card w-full max-w-sm p-6 text-center text-ink">
            <BuddySprite species={b.species} level={b.level} mood="happy" hat={b.equipped_hat} size={120} />
            <h2 className="font-display text-2xl font-semibold">Nice work!</h2>
            <p className="mt-1 text-ink/60">You focused for {fmtDuration(Math.floor(focusSec / 60))}.</p>
            {task && (
              <label className="mt-4 flex items-center justify-center gap-2 text-sm font-bold">
                <input type="checkbox" checked={taskDone} onChange={(e) => setTaskDone(e.target.checked)} />
                I finished “{task.title}” completely
              </label>
            )}
            <div className="mt-5 flex justify-center gap-2">
              <button
                className="btn-ghost"
                onClick={() => {
                  if (focusSec >= goal * 60) setGoal(Math.ceil(focusSec / 60) + 15)
                  setFinishing(false)
                }}
              >
                Keep going
              </button>
              <button className="btn-primary" onClick={save}>Save & collect points</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
