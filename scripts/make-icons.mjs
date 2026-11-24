// Generates the app icons in public/ from the cat face in public/favicon.svg.
// Run: node scripts/make-icons.mjs
import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const face = readFileSync('public/favicon.svg', 'utf8')
  .replace(/^<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')

/** cat face (32x32 art) centered on a cream tile; `fill` = share of the tile the face takes up */
const tile = (size, fill, rounded) => {
  const s = (size * fill) / 32
  const off = (size - 32 * s) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${rounded ? size * 0.22 : 0}" fill="#f3eadc"/>
  <g transform="translate(${off} ${off + size * 0.02}) scale(${s})">${face}</g>
</svg>`
}

const out = [
  ['public/pwa-192.png', 192, 0.78, true],
  ['public/pwa-512.png', 512, 0.78, true],
  ['public/maskable-512.png', 512, 0.6, false], // Android crops to a circle/squircle: keep the face in the safe zone
  ['public/apple-touch-icon.png', 180, 0.72, false], // iOS rounds the corners itself
]
for (const [file, size, fill, rounded] of out) {
  await sharp(Buffer.from(tile(size, fill, rounded))).png().toFile(file)
  console.log('wrote', file)
}
