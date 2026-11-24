import { useState } from 'react'
import { useData } from '../../lib/store'
import { COATS, type Species } from '../../lib/types'
import { STAGE_NAMES } from '../../lib/rewards'
import { BuddySprite } from './BuddySprite'

export function BuddyPicker() {
  const { actions } = useData()
  const [pick, setPick] = useState<Species>('ginger')
  const [name, setName] = useState('')
  const chosen = COATS.find((c) => c.key === pick)!

  return (
    <div className="min-h-full px-4 py-10">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Adopt a study buddy</h1>
        <p className="mt-2 text-ink/60">Every buddy is a cat. Pick the one that feels like yours.</p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {COATS.map((c) => (
            <button
              key={c.key}
              onClick={() => setPick(c.key)}
              className={`card flex flex-col items-center px-3 pb-4 pt-2 transition ${pick === c.key ? 'ring-[3px] ring-accent' : 'hover:-translate-y-0.5'}`}
              aria-pressed={pick === c.key}
            >
              <BuddySprite species={c.key} level={1} mood={pick === c.key ? 'happy' : 'neutral'} size={120} animate={pick === c.key} />
              <div className="font-display text-xl font-semibold">{c.name}</div>
              <p className="mt-0.5 text-[13px] leading-snug text-ink/55">{c.blurb}</p>
            </button>
          ))}
        </div>

        <p className="mt-5 text-sm text-ink/50">
          {chosen.name} starts as a kitten, then grows into a {STAGE_NAMES.slice(1).map((s) => s.toLowerCase()).join(', then a ')}.
        </p>

        <form
          className="mx-auto mt-6 flex max-w-sm gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            actions.createBuddy(pick, name.trim() || chosen.name)
          }}
        >
          <input aria-label="Name your cat" className="input" placeholder={`Name your cat (or keep “${chosen.name}”)`} maxLength={20} value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn-primary shrink-0">Adopt</button>
        </form>
      </div>
    </div>
  )
}
