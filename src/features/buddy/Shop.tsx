import { useState } from 'react'
import { useData } from '../../lib/store'
import { SHOP, type ShopItem } from '../../lib/rewards'
import { DECOR, SLOTS, ownsDecor, placedDecor, type DecorItem } from '../../lib/decor'
import { TRAITS, type TraitId } from '../../lib/journal'
import type { DecorSlot } from '../../lib/types'
import { Coin } from '../../components/Icon'

type Tab = 'food' | 'hat' | 'room'

export function Shop({
  earnedTraits,
  preview,
  onPreview,
}: {
  earnedTraits: Set<TraitId>
  preview: DecorItem | null
  onPreview: (item: DecorItem | null) => void
}) {
  const { state, actions } = useData()
  const b = state.buddy!
  const [tab, setTab] = useState<Tab>('food')
  const [slot, setSlot] = useState<DecorSlot>('wallpaper')
  const owned = new Set(state.inventory.map((i) => i.item_id))
  const placed = placedDecor(b)

  const switchTab = (t: Tab) => {
    setTab(t)
    onPreview(null)
  }

  const clickItem = (item: ShopItem) => {
    const have = item.kind === 'hat' && owned.has(item.id)
    if (have) actions.equipHat(b.equipped_hat === item.id ? null : item.id)
    else actions.buy(item)
  }

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center gap-1">
        {(
          [
            ['food', 'Snacks'],
            ['hat', 'Closet'],
            ['room', 'Room'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => switchTab(k)}
            className={`rounded-lg px-2.5 py-1 font-display text-lg font-semibold transition ${tab === k ? 'text-ink' : 'text-ink/35 hover:text-ink/60'}`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1 text-sm font-extrabold">
          <Coin /> {b.coins}
        </span>
      </div>

      {tab !== 'room' ? (
        <>
          <div className="relative">
            <div className={`grid gap-2 ${tab === 'food' ? 'grid-cols-4' : 'grid-cols-5'}`}>
              {SHOP.filter((s) => s.kind === tab).map((item) => {
                const have = item.kind === 'hat' && owned.has(item.id)
                const wearing = b.equipped_hat === item.id
                const broke = !have && b.coins < item.price
                const effect = item.effect
                  ? [item.effect.energy && `+${item.effect.energy} energy`, item.effect.happiness && `+${item.effect.happiness} happy`].filter(Boolean).join(', ')
                  : ''
                return (
                  <button
                    key={item.id}
                    disabled={broke}
                    onClick={() => clickItem(item)}
                    title={`${item.name}${effect ? `: ${effect}` : ''}`}
                    className="group flex flex-col items-center pb-1 disabled:cursor-not-allowed"
                  >
                    <span className={`text-3xl transition group-hover:-translate-y-1 ${broke ? 'opacity-35 grayscale' : ''} ${wearing ? 'drop-shadow-[0_0_6px_#dfa63b]' : ''}`}>
                      {item.emoji}
                    </span>
                    <span
                      className={`mt-1.5 flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-extrabold ${wearing ? 'bg-mustard text-paper' : have ? 'bg-sage-soft text-ink/70' : 'bg-ink/[.05] text-ink/70'}`}
                    >
                      {have ? (
                        wearing ? 'wearing' : 'wear'
                      ) : (
                        <>
                          <Coin className="h-3 w-3" />
                          {item.price}
                        </>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="mt-1 h-2.5 rounded-sm bg-wood shadow-[0_3px_0_#7d5434]" />
          </div>
          <p className="mt-3 text-xs font-semibold text-ink/45">
            {tab === 'food' ? 'Snacks give energy and happiness right away.' : 'Hats are yours forever. Tap one you own to put it on or take it off.'}
          </p>
        </>
      ) : (
        <div>
          <div className="mb-3 flex flex-wrap gap-1">
            {SLOTS.map((s) => (
              <button
                key={s.key}
                onClick={() => {
                  setSlot(s.key)
                  onPreview(null)
                }}
                className={`rounded-lg px-2.5 py-1 text-[13px] font-bold transition ${slot === s.key ? 'bg-ink text-paper' : 'bg-ink/[.05] text-ink/65 hover:bg-ink/10'}`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {DECOR.filter((d) => d.slot === slot).map((d) => {
              const have = ownsDecor(d, state.inventory, earnedTraits)
              const inUse = placed[slot] === d.id
              const previewing = preview?.id === d.id
              const trait = d.trait ? TRAITS.find((t) => t.id === d.trait) : null
              return (
                <button
                  key={d.id}
                  onClick={() => {
                    if (have) {
                      actions.placeDecor(slot, d.id)
                      onPreview(null)
                    } else onPreview(previewing ? null : d)
                  }}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2 text-center transition ${inUse ? 'bg-accent-soft ring-2 ring-accent' : previewing ? 'bg-mustard-soft ring-2 ring-mustard' : 'hover:bg-ink/[.04]'}`}
                >
                  <span
                    className={`h-10 w-full rounded-lg ring-1 ring-ink/10 ${!have ? 'opacity-70' : ''}`}
                    style={{ background: `linear-gradient(135deg, ${d.swatch[0]} 0 55%, ${d.swatch[1]} 55% 100%)` }}
                  />
                  <span className="text-xs font-bold leading-tight">{d.name}</span>
                  <span className="text-[11px] font-extrabold text-ink/50">
                    {inUse ? 'in your room' : have ? 'place it' : trait ? `earn: ${trait.name}` : (
                      <span className="inline-flex items-center gap-0.5">
                        <Coin className="h-3 w-3" />
                        {d.price}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>

          {preview && preview.slot === slot && (
            <div className="anim-pop mt-3 flex items-center gap-3 rounded-xl bg-mustard-soft p-3 text-sm">
              <span className="flex-1">
                <b>Previewing {preview.name}.</b>{' '}
                {preview.trait ? (
                  <>Earned by becoming a {TRAITS.find((t) => t.id === preview.trait)!.name}: {TRAITS.find((t) => t.id === preview.trait)!.how.toLowerCase()}.</>
                ) : (
                  'Like it?'
                )}
              </span>
              {preview.price ? (
                <button
                  className="btn-primary shrink-0 px-3 py-1.5"
                  disabled={b.coins < preview.price}
                  onClick={() => {
                    actions.buyDecor(preview)
                    onPreview(null)
                  }}
                >
                  Buy · <Coin className="h-3.5 w-3.5" /> {preview.price}
                </button>
              ) : null}
              <button className="text-xs font-bold text-ink/50 hover:text-ink" onClick={() => onPreview(null)}>
                Cancel
              </button>
            </div>
          )}
          {!preview && <p className="mt-3 text-xs font-semibold text-ink/45">Tap anything to see it in the room first. Some pieces can’t be bought: your cat earns them through its personality.</p>}
        </div>
      )}
    </section>
  )
}
