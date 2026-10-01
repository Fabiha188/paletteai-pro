// Encodes a list of hex colours into a URL-friendly query string
export function encodePaletteToQuery(colors) {
  return colors.map((c) => c.replace('#', '')).join('-')
}

// Decodes a "palette" query param back into an array of hex colours.
// Returns null if the param is missing or malformed.
export function decodePaletteFromQuery(param) {
  if (!param) return null
  const parts = param.split('-').filter(Boolean)
  const hexes = parts
    .map((p) => `#${p}`)
    .filter((h) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h))
  return hexes.length ? hexes : null
}

// Builds a full shareable URL for the given palette
export function buildShareUrl(colors) {
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.set('palette', encodePaletteToQuery(colors))
  return url.toString()
}
