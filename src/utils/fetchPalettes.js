import { fetchColorScheme } from './api'

// Curated seed hues used to ask The Color API for real, live-generated
// colour schemes (analogic harmonies) each time the Explore page loads.
const SEED_HUES = ['FF6B6B', '38BDF8', '34D399', 'F472B6', 'FBBF24', '8B5CF6', '06B6D4', 'F97316']
const STYLE_NAMES = ['Analogic Glow', 'Ocean Scheme', 'Fresh Mint', 'Rose Quartz', 'Golden Hour', 'Violet Dream', 'Cyan Wave', 'Ember Set']

/*
  Fetches a set of real, live-generated palettes from The Color API — one
  scheme per seed hue — so the Explore grid includes genuinely fetched
  data alongside the bundled local set, not just static JSON.
  Falls back to the local palettes.json bundle if the network call fails
  (offline, rate-limited, blocked, etc.) so the UI never breaks.
*/
export async function fetchPalettes() {
  try {
    const schemes = await Promise.all(
      SEED_HUES.map((hex) => fetchColorScheme(hex, 'analogic', 5))
    )
    const data = schemes.map((colors, i) => ({
      id: `live-${i + 1}`,
      name: STYLE_NAMES[i] || `Live Palette ${i + 1}`,
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
