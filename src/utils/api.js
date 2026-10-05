const COLORMIND_URL = 'https://colormind.io/api/'
const COLOR_API_BASE = 'https://www.thecolorapi.com'

// Turns a [r, g, b] array into a hex string like "#A3F2BC"
function rgbToHex(r, g, b) {
  const toHex = (n) => Math.round(n).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

// Pulls the colour array out of a Colormind response object
function parseColormindResult(data) {
  if (!data || !Array.isArray(data.result)) {
    throw new Error('Invalid response from Colormind API')
  }
  return data.result.map(([r, g, b]) => rgbToHex(r, g, b))
}

/*
  Calls the Colormind AI to generate a 5-colour palette.
  Tries three routes in order so it works in dev, staging, and production:
    1. Vite dev proxy at /api/colormind  (configured in vite.config.js)
    2. Local Express proxy at port 3001  (npm run start-proxy)
    3. Direct request to colormind.io   (CORS-safe if no custom headers)
*/
export async function fetchAIPalette(model = 'default') {
  const payload = { model, input: ['N', 'N', 'N', 'N', 'N'] }
  const body = JSON.stringify(payload)

  // Try the Vite dev proxy first
  try {
    const res = await fetch('/api/colormind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    if (res.ok) {
      return parseColormindResult(JSON.parse(await res.text()))
    }
  } catch {
    // proxy not available, move on
  }

  // Try the local Express proxy
  try {
    const res = await fetch('http://localhost:3001/api/colormind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    if (res.ok) {
      return parseColormindResult(JSON.parse(await res.text()))
    }
  } catch {
    // proxy not running, fall through
  }

  // Last resort: call Colormind directly
  // Omit Content-Type here to avoid a CORS preflight request
  const res = await fetch(COLORMIND_URL, { method: 'POST', body })
  if (!res.ok) {
    throw new Error(`Colormind API error: ${res.status} ${res.statusText}`)
  }
  return parseColormindResult(await res.json())
}

/*
  Asks The Color API to generate a real colour scheme from a seed hex.
  This is a genuine live network call (no backend proxy needed — The Color
  API sends permissive CORS headers) used to populate "remote" palettes
  on the Explore page.
*/
export async function fetchColorScheme(hex, mode = 'analogic', count = 5) {
  const cleanHex = hex.replace('#', '')
  const res = await fetch(
    `${COLOR_API_BASE}/scheme?hex=${cleanHex}&mode=${mode}&count=${count}&format=json`
  )
  if (!res.ok) {
    throw new Error(`Color scheme API error: ${res.status}`)
  }
  const data = await res.json()
  if (!Array.isArray(data.colors)) {
    throw new Error('Unexpected scheme response shape')
  }
  return data.colors.map((c) => `#${c.hex.value.replace('#', '')}`)
}

/*
  Looks up a colour by hex code using The Color API.
  Returns the colour's name, hex, RGB, and HSL strings.
*/
export async function fetchColorInfo(hex) {
  const cleanHex = hex.replace('#', '')
  const res = await fetch(`${COLOR_API_BASE}/id?hex=${cleanHex}&format=json`)

  if (!res.ok) {
    throw new Error(`Color API error: ${res.status}`)
  }

  const data = await res.json()
  return {
    name:     data.name?.value     || cleanHex,
    hex:      data.hex?.value      || hex,
    rgb:      data.rgb?.value      || '',
    hsl:      data.hsl?.value      || '',
    contrast: data.contrast?.value || '',
  }
}
