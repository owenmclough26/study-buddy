import { useEffect, useState } from 'react'
import { useData } from '../../lib/store'
import { deviceSubscribed, disablePush, enablePush, pushSupport, testNotification } from '../../lib/push'
import { track } from '../../lib/analytics'
import { Icon } from '../../components/Icon'

const LEADS = [5, 10, 15, 30]

export function RemindersCard() {
  const { state, actions, mode } = useData()
  const p = state.profile!
  const b = state.buddy!
  const support = pushSupport()
  const [subscribed, setSubscribed] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    void deviceSubscribed().then(setSubscribed)
  }, [])

  const on = !!p.reminders_enabled && !!subscribed

  async function turnOn() {
    setBusy(true)
    setMsg(null)
    const res = await enablePush()
    setBusy(false)
    if (!res.ok) return setMsg(res.reason)
    setSubscribed(true)
    actions.saveProfile({ reminders_enabled: true, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
    actions.toast(`Reminders on. ${b.name} will ping you before each session.`)
    track('reminders_enabled')
  }

  async function turnOff() {
    setBusy(true)
    await disablePush()
    setBusy(false)
    setSubscribed(false)
    actions.saveProfile({ reminders_enabled: false })
    actions.toast('Reminders off')
  }

  return (
    <section className="card p-5">
      <div className="mb-1 flex items-center gap-2">
        <Icon name="clock" className="h-5 w-5 text-accent" />
        <h2 className="font-display text-xl font-semibold">Reminders</h2>
        {on && <span className="rounded-md bg-sage-soft px-1.5 text-xs font-extrabold text-ink/70">on</span>}
      </div>
      <p className="mb-4 text-sm text-ink/55">A notification before each planned session, so you never have to remember to open the app.</p>

      {mode === 'local' ? (
        <p className="rounded-xl bg-mustard-soft p-3 text-sm">Reminders need an account, because they’re sent from the server. Sign in to use them.</p>
      ) : support === 'needs-install' ? (
        <div className="rounded-xl bg-mustard-soft p-3 text-sm">
          <p className="font-bold">On iPhone, reminders only work in the installed app.</p>
          <p className="mt-1 text-ink/70">In Safari, tap Share → Add to Home Screen, open Study Buddy from your home screen, then come back here.</p>
        </div>
      ) : support === 'unsupported' ? (
        <p className="rounded-xl bg-mustard-soft p-3 text-sm">This browser can’t show notifications. Try Chrome, Edge, or the installed app on your phone.</p>
      ) : subscribed === null ? (
        <p className="text-sm text-ink/45">Checking this device…</p>
      ) : !on ? (
        <div className="space-y-2">
          <button className="btn-primary" onClick={turnOn} disabled={busy}>
            {busy ? 'Turning on…' : p.reminders_enabled ? 'Turn on for this device too' : 'Turn on reminders'}
          </button>
          {p.reminders_enabled && !subscribed && <p className="text-xs text-ink/50">Reminders are on for another device. Each phone or computer needs its own yes.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-40 text-sm font-bold text-ink/65">Remind me</span>
            {LEADS.map((m) => (
              <button
                key={m}
                onClick={() => actions.saveProfile({ remind_minutes_before: m })}
                className={`rounded-lg px-2.5 py-1 text-[13px] font-bold transition ${(p.remind_minutes_before ?? 10) === m ? 'bg-ink text-paper' : 'bg-ink/[.05] text-ink/65 hover:bg-ink/10'}`}
              >
                {m} min before
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="w-40 font-bold text-ink/65">Evening heads-up</span>
            <input type="checkbox" checked={p.nightly_summary ?? true} onChange={(e) => actions.saveProfile({ nightly_summary: e.target.checked })} />
            <span className="text-ink/60">At 8pm, what’s planned for tomorrow</span>
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              className="btn-ghost"
              onClick={async () => {
                const ok = await testNotification(b.name)
                if (!ok) setMsg('Couldn’t show a test here. Reload the page and try again.')
              }}
            >
              Send a test
            </button>
            <button className="btn-danger" onClick={turnOff} disabled={busy}>
              Turn off
            </button>
          </div>
        </div>
      )}

      {msg && <p className="mt-3 rounded-xl bg-accent-soft p-2.5 text-sm text-accent-dark">{msg}</p>}
    </section>
  )
}
