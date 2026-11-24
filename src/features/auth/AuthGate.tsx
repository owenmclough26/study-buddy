import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/repo'
import { identify, track } from '../../lib/analytics'
import { BuddySprite } from '../buddy/BuddySprite'
import { RoomScene, dayPart } from '../buddy/RoomScene'
import { Icon, type IconName } from '../../components/Icon'

export function AuthGate({ children }: { children: (userId: string) => ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) identify(session.user.id)
  }, [session])

  if (session === undefined) return null
  if (!session) return <Landing />
  return <>{children(session.user.id)}</>
}

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'calendar',
    title: 'It plans your week',
    body: 'Add your classes once. Every test, essay and chore gets slotted into your free time before it’s due.',
  },
  {
    icon: 'door',
    title: 'A room for every kind of work',
    body: 'A late-night study room, a reading nook by the fire, a quick-task kitchen. Each one built to help you lock in.',
  },
  {
    icon: 'heart',
    title: 'A cat that grows with you',
    body: 'Focus time and finished tasks feed your cat. It levels up from kitten to wise old cat as you do.',
  },
]

/** What a logged-out visitor sees: what the app does, and a way in. */
function Landing() {
  const formRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<'up' | 'in'>('up')
  const goToForm = (m: 'up' | 'in') => {
    setMode(m)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="min-h-full">
      <header className="mx-auto flex max-w-6xl items-center gap-2 px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-4">
        <img src="/favicon.svg" alt="" className="h-8 w-8" />
        <span className="font-display text-xl font-semibold tracking-tight">study buddy</span>
        <button className="btn-ghost ml-auto" onClick={() => goToForm('in')}>
          Sign in
        </button>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-6 lg:grid-cols-[1fr_1.1fr] lg:pt-12">
        <div>
          <p className="font-hand text-2xl text-accent">for students who are tired of planners</p>
          <h1 className="mt-1 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Your homework, planned around your classes.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink/65">
            Add your school schedule once. Study Buddy fits every assignment into your free time, and your cat grows every time you get something
            done.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button className="btn-primary px-6 py-3 text-base" onClick={() => goToForm('up')}>
              Adopt your cat, it's free
            </button>
          </div>
        </div>

        <div className="card p-2.5">
          <RoomScene part={dayPart(new Date())} notesToday={3}>
            <div className="absolute left-[47%] top-[41%] max-w-[40%] rounded-2xl border-2 border-ink/80 bg-paper px-3 py-1.5 font-hand text-lg leading-tight sm:text-2xl">
              chem review at 4:15!
              <span className="absolute -bottom-[9px] left-5 h-4 w-4 rotate-45 border-b-2 border-r-2 border-ink/80 bg-paper" />
            </div>
            <div className="absolute bottom-[5%] left-[41%] w-[27%] -translate-x-1/2">
              <BuddySprite species="ginger" level={6} mood="happy" size="fill" />
            </div>
          </RoomScene>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-14 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent-dark">
              <Icon name={f.icon} className="h-5 w-5" />
            </span>
            <h2 className="mt-3 font-display text-xl font-semibold">{f.title}</h2>
            <p className="mt-1 text-sm text-ink/60">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16" ref={formRef}>
        <AuthForm mode={mode} setMode={setMode} />
      </section>
    </div>
  )
}

function AuthForm({ mode, setMode }: { mode: 'in' | 'up'; setMode: (m: 'in' | 'up') => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setMsg(null)
    const { error, data } =
      mode === 'in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
    setBusy(false)
    if (!error && mode === 'up') track('signed_up')
    if (error) setMsg(error.message)
    else if (mode === 'up' && !data.session) setMsg('Check your email to confirm your account, then sign in here.')
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-md space-y-4 p-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <BuddySprite species="ginger" level={1} mood="happy" size={96} />
        <h2 className="font-display text-2xl font-semibold">{mode === 'up' ? 'Make your free account' : 'Welcome back'}</h2>
        <p className="text-sm text-ink/55">{mode === 'up' ? 'Your schedule and your cat, on every device.' : 'Your cat missed you.'}</p>
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="pw">Password</label>
        <input
          id="pw"
          className="input"
          type="password"
          autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {msg && <p className="rounded-xl bg-mustard-soft p-2 text-sm text-ink">{msg}</p>}
      <button className="btn-primary w-full py-2.5" disabled={busy}>
        {mode === 'in' ? 'Sign in' : 'Create account'}
      </button>
      <button type="button" className="w-full text-sm font-bold text-accent-dark" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
        {mode === 'in' ? 'New here? Make an account' : 'Already have an account? Sign in'}
      </button>
    </form>
  )
}
