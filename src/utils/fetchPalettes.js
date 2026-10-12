import { fetchColorScheme } from './api'
import { hslToHex, hueToCategory } from './colorHelpers'

// The Color API schemes we rotate through (api value, label shown in the name).
const MODES = [
  ['analogic', 'Analogic'],
  ['triad', 'Triad'],
  ['analogic-complement', 'Accent'],
  ['complement', 'Contrast'],
  ['quad', 'Quad'],
  ['monochrome-light', 'Light Tones'],
  ['monochrome-dark', 'Deep Tones'],
]
const LIVE_COUNT = 8

// Fresh seeds on every visit: hues spread evenly round the wheel from a
// random starting point, each with its own random shade and scheme — so the
// live palettes are different each time instead of the same eight forever.
function randomSeeds() {
  const offset = Math.random() * 360
  return Array.from({ length: LIVE_COUNT }, (_, i) => {
    const hue = (offset + i * (360 / LIVE_COUNT) + (Math.random() - 0.5) * 25 + 360) % 360
    const [mode, modeLabel] = MODES[Math.floor(Math.random() * MODES.length)]
    const hex = hslToHex(hue, 50 + Math.random() * 45, 38 + Math.random() * 32).slice(1)
    return { hex, mode, name: `${hueToCategory(hue).name} ${modeLabel}` }
  })
}

/*
  Fetches a set of real, live-generated palettes from The Color API — one
  scheme per seed hue — so the Explore grid includes genuinely fetched
  data alongside the bundled local set, not just static JSON.
  Falls back to the local palettes.json bundle if the network call fails
  (offline, rate-limited, blocked, etc.) so the UI never breaks.
*/
export async function fetchPalettes() {
  try {
    const seeds = randomSeeds()
    const schemes = await Promise.all(
      seeds.map((seed) => fetchColorScheme(seed.hex, seed.mode, 5))
    )
    const data = schemes.map((colors, i) => ({
      id: `live-${i + 1}`,
      name: seeds[i].name,
      style: 'live',
      colors,
    }))
    if (!data.length) throw new Error('Empty live response')
    return data
  } catch {
    try {
      const local = await import('../api/palettes.json')
      return local.default || local
    } catch (err) {
      console.error('Could not load local palette fallback', err)
      return []
    }
  }
}
