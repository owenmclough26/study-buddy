import { useState } from 'react'
import { useData } from '../../lib/store'
import type { Species } from '../../lib/types'
import { STAGE_NAMES } from '../../lib/rewards'
import { BuddySprite } from './BuddySprite'

const OPTIONS: { species: Species; blurb: string }[] = [
  { species: 'blob', blurb: 'Squishy, cheerful, and always up for a study session.' },
  { species: 'cat', blurb: 'Curious and clever. Grows into a glasses-wearing scholar.' },
  { species: 'dragon', blurb: 'Starts as an egg. Hatches and grows wings as you level up.' },
]

export function BuddyPicker() {
  const { actions } = useData()
  const [pick, setPick] = useState<Species>('blob')
  const [name, setName] = useState('')

  return (
    <div className="min-h-full bg-gradient-to-br from-accent-soft via-cream to-sage-soft px-4 py-10">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Choose your study buddy</h1>
        <p className="mt-2 text-ink/55">Your buddy grows when you get things done. Look after them!</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {OPTIONS.map((o) => (
            <button
              key={o.species}
              onClick={() => setPick(o.species)}
              className={`card flex flex-col items-center p-4 transition ${pick === o.species ? 'ring-4 ring-accent' : 'hover:-translate-y-0.5'}`}
            >
              <BuddySprite species={o.species} level={1} mood={pick === o.species ? 'happy' : 'neutral'} size={140} animate={pick === o.species} />
              <div className="mt-1 font-display text-xl font-semibold">{STAGE_NAMES[o.species][0]}</div>
              <p className="mt-1 text-sm text-ink/55">{o.blurb}</p>
              <p className="mt-2 text-xs font-semibold text-ink/35">→ {STAGE_NAMES[o.species].slice(1).join(' → ')}</p>
            </button>
          ))}
        </div>

        <form
          className="mx-auto mt-8 flex max-w-sm gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            actions.createBuddy(pick, name.trim() || 'Buddy')
          }}
        >
          <input aria-label="Name your buddy" className="input" placeholder="Name your buddy" maxLength={20} value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn-primary shrink-0">Let's go!</button>
        </form>
      </div>
    </div>
  )
}
