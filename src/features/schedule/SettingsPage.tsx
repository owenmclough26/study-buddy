import { useState } from 'react'
import { COATS } from '../../lib/types'
import { BuddySprite } from '../buddy/BuddySprite'
import { useData } from '../../lib/store'
import { ScheduleBuilder } from './ScheduleBuilder'
import { RemindersCard } from './RemindersCard'

export function SettingsPage() {
  const { state, actions } = useData()
  const p = state.profile!
  const b = state.buddy!
  const [name, setName] = useState(b.name)
  const hm = (t: string) => t.slice(0, 5)

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Settings</h1>

      <section className="card p-5">
        <h2 className="mb-1 font-display text-xl font-semibold">School schedule</h2>
        <p className="mb-4 text-sm text-ink/50">
          Set up each weekday once. Your to-dos get scheduled around these blocks automatically.
        </p>
        <ScheduleBuilder />
      </section>

      <section className="card p-5">
        <h2 className="mb-4 font-display text-xl font-semibold">Your day</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label" htmlFor="wake">Wake up</label>
            <input id="wake" type="time" className="input" value={hm(p.wake_time)} onChange={(e) => e.target.value && actions.saveProfile({ wake_time: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="nowork">No work after</label>
            <input id="nowork" type="time" className="input" value={hm(p.no_work_after)} onChange={(e) => e.target.value && actions.saveProfile({ no_work_after: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="sleep">Bedtime</label>
            <input id="sleep" type="time" className="input" value={hm(p.sleep_time)} onChange={(e) => e.target.value && actions.saveProfile({ sleep_time: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="sess">Session length</label>
            <select id="sess" className="input" value={p.session_minutes} onChange={(e) => actions.saveProfile({ session_minutes: Number(e.target.value) })}>
              {[20, 25, 30, 45, 60, 90].map((m) => (
                <option key={m} value={m}>{m} minutes</option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-3 text-xs text-ink/45">Long tasks get split into sessions of this length, with a 10-minute break between them.</p>
      </section>

      <RemindersCard />

      <section className="card p-5">
        <h2 className="mb-4 font-display text-xl font-semibold">Buddy</h2>
        <form
          className="flex max-w-sm gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim()) {
              actions.renameBuddy(name.trim())
              actions.toast('Name saved')
            }
          }}
        >
          <input aria-label="Buddy name" className="input" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} />
          <button className="btn-primary">Rename</button>
        </form>
        <div className="mt-5">
          <span className="label">Coat</span>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {COATS.map((c) => (
              <button
                key={c.key}
                onClick={() => actions.setCoat(c.key)}
                aria-pressed={b.species === c.key}
                className={`flex flex-col items-center rounded-xl pb-2 transition ${b.species === c.key ? 'bg-accent-soft ring-2 ring-accent' : 'hover:bg-ink/[.04]'}`}
              >
                <BuddySprite species={c.key} level={b.level} mood="neutral" size={76} animate={false} />
                <span className="text-xs font-bold">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
