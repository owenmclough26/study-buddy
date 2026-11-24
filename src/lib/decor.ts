import type { Buddy, DecorSlot, InventoryItem } from './types'
import type { TraitId } from './journal'

export interface DecorItem {
  id: string
  slot: DecorSlot
  name: string
  /** coins; 0 = free starter; null = can't be bought, earned through a personality trait */
  price: number | null
  trait?: TraitId
  /** colors for the little shop swatch */
  swatch: [string, string]
}

export const SLOTS: { key: DecorSlot; label: string }[] = [
  { key: 'wallpaper', label: 'Wallpaper' },
  { key: 'rug', label: 'Rug' },
  { key: 'bed', label: 'Cat bed' },
  { key: 'art', label: 'Wall art' },
  { key: 'plant', label: 'Plant' },
  { key: 'lamp', label: 'Lamp' },
]

export const DECOR: DecorItem[] = [
  // wallpaper
  { id: 'wp_cream', slot: 'wallpaper', name: 'Cream dots', price: 0, swatch: ['#efe1cc', '#e5d2b8'] },
  { id: 'wp_sage', slot: 'wallpaper', name: 'Sage stripes', price: 40, swatch: ['#dfe6d3', '#cbd8bb'] },
  { id: 'wp_gingham', slot: 'wallpaper', name: 'Blue gingham', price: 60, swatch: ['#e6edf2', '#c9d9e6'] },
  { id: 'wp_floral', slot: 'wallpaper', name: 'Rose floral', price: 80, swatch: ['#f4e1dc', '#e3a9a0'] },
  { id: 'wp_grid', slot: 'wallpaper', name: 'Planner grid', price: null, trait: 'planner', swatch: ['#f6f0e4', '#c9d6e3'] },
  { id: 'wp_stars', slot: 'wallpaper', name: 'Gold stars', price: null, trait: 'closer', swatch: ['#34406a', '#e3b04b'] },
  // rug
  { id: 'rug_terracotta', slot: 'rug', name: 'Terracotta', price: 0, swatch: ['#cf6440', '#f3c99f'] },
  { id: 'rug_sage', slot: 'rug', name: 'Moss round', price: 35, swatch: ['#7d9b72', '#e9e2c9'] },
  { id: 'rug_navy', slot: 'rug', name: 'Navy stripes', price: 50, swatch: ['#3f5a86', '#f3ead8'] },
  { id: 'rug_rainbow', slot: 'rug', name: 'Rainbow', price: 90, swatch: ['#cf6440', '#7fa7c9'] },
  { id: 'rug_track', slot: 'rug', name: 'Running track', price: null, trait: 'marathoner', swatch: ['#c4553f', '#ffffff'] },
  // bed
  { id: 'bed_basket', slot: 'bed', name: 'Wicker basket', price: 0, swatch: ['#c99a6a', '#fbf3e4'] },
  { id: 'bed_cloud', slot: 'bed', name: 'Cloud cushion', price: 60, swatch: ['#ffffff', '#d9e6f0'] },
  { id: 'bed_tent', slot: 'bed', name: 'Cozy tent', price: 100, swatch: ['#e3b04b', '#cf6440'] },
  { id: 'bed_royal', slot: 'bed', name: 'Royal cushion', price: null, trait: 'steady', swatch: ['#6f63a6', '#e3b04b'] },
  // art
  { id: 'art_none', slot: 'art', name: 'Bare wall', price: 0, swatch: ['#efe1cc', '#efe1cc'] },
  { id: 'art_mountains', slot: 'art', name: 'Mountains', price: 30, swatch: ['#9dbd8e', '#7fa7c9'] },
  { id: 'art_cat', slot: 'art', name: 'Cat portrait', price: 45, swatch: ['#e39a62', '#fffaf2'] },
  { id: 'art_sunrise', slot: 'art', name: 'Sunrise', price: null, trait: 'early_bird', swatch: ['#f6c98d', '#e98a5c'] },
  { id: 'art_tomato', slot: 'art', name: 'Tomato timer', price: null, trait: 'sprinter', swatch: ['#d9483b', '#6c9461'] },
  // plant
  { id: 'plant_snake', slot: 'plant', name: 'Snake plant', price: 0, swatch: ['#6c9461', '#c9714b'] },
  { id: 'plant_cactus', slot: 'plant', name: 'Cactus', price: 25, swatch: ['#7d9b72', '#d9a06b'] },
  { id: 'plant_monstera', slot: 'plant', name: 'Monstera', price: 40, swatch: ['#4f8a5b', '#f1e4cf'] },
  { id: 'plant_books', slot: 'plant', name: 'Book tower', price: null, trait: 'bookworm', swatch: ['#6f63a6', '#dfa63b'] },
  // lamp
  { id: 'lamp_floor', slot: 'lamp', name: 'Floor lamp', price: 0, swatch: ['#f1dcb5', '#6b4a2e'] },
  { id: 'lamp_mushroom', slot: 'lamp', name: 'Mushroom lamp', price: 50, swatch: ['#cf6440', '#fffaf2'] },
  { id: 'lamp_string', slot: 'lamp', name: 'String lights', price: 70, swatch: ['#ffd98a', '#6c9461'] },
  { id: 'lamp_owl', slot: 'lamp', name: 'Owl lamp', price: null, trait: 'night_owl', swatch: ['#8c5f3d', '#ffd98a'] },
]

export const DEFAULT_DECOR: Record<DecorSlot, string> = {
  wallpaper: 'wp_cream',
  rug: 'rug_terracotta',
  bed: 'bed_basket',
  art: 'art_none',
  plant: 'plant_snake',
  lamp: 'lamp_floor',
}

export const decorItem = (id: string) => DECOR.find((d) => d.id === id)

/** What's actually placed, with defaults filled in. */
export function placedDecor(b: Pick<Buddy, 'decor'> | null | undefined): Record<DecorSlot, string> {
  return { ...DEFAULT_DECOR, ...(b?.decor ?? {}) }
}

/** Free starters, things you bought, and things your personality earned. */
export function ownsDecor(item: DecorItem, inventory: InventoryItem[], earnedTraits: Set<TraitId>): boolean {
  if (item.price === 0) return true
  if (item.trait) return earnedTraits.has(item.trait)
  return inventory.some((i) => i.item_id === item.id)
}
