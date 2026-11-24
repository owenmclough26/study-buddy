import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/repo'
import { BuddySprite } from '../buddy/BuddySprite'

export function AuthGate({ children }: { children: (userId: string) => ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) return null
  if (!session) return <LoginPage />
  return <>{children(session.user.id)}</>
}

function LoginPage() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
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
        : await supabase.auth.signUp({ email, password })
    setBusy(false)
    if (error) setMsg(error.message)
    else if (mode === 'up' && !data.session) setMsg('Check your email to confirm your account, then sign in.')
  }

  return (
    <div className="grid min-h-full place-items-center bg-gradient-to-br from-accent-soft via-cream to-mustard-soft p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-6">
        <div className="flex flex-col items-center gap-1">
          <BuddySprite species="blob" level={6} mood="happy" size={110} />
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Study Buddy</h1>
          <p className="text-sm text-ink/50">Your schedule, your to-dos, your buddy.</p>
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="pw">Password</label>
          <input id="pw" className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {msg && <p className="rounded-xl bg-mustard-soft p-2 text-sm text-ink">{msg}</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {mode === 'in' ? 'Sign in' : 'Create account'}
        </button>
        <button type="button" className="w-full text-sm font-bold text-accent-dark" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
          {mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
