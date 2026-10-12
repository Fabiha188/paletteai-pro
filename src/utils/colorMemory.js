/*
  Remembers the colours generated recently so new palettes can avoid them.
  Distances use CIE Lab (ΔE) — a measure of how different two colours
  actually *look* to the eye, unlike raw RGB numbers.
*/
const MAX_REMEMBERED = 450 // ~90 palettes of 5 colours

const toLab = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))]
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

let recent = [] // Lab triples, oldest first

export function deltaE(hexA, hexB) {
  return dist(toLab(hexA), toLab(hexB))
}

// Call with any palette that has been shown/generated so future ones steer clear of it.
export function registerPalette(colors) {
  ;(colors || []).forEach((hex) => {
    if (typeof hex === 'string' && /^#[0-9a-f]{6}$/i.test(hex)) recent.push(toLab(hex))
  })
  if (recent.length > MAX_REMEMBERED) recent = recent.slice(recent.length - MAX_REMEMBERED)
}

export function resetColorMemory() {
  recent = []
}

// How different `hex` is from the closest remembered colour (Infinity if none).
export function distanceToRecent(hex) {
  const lab = toLab(hex)
  let min = Infinity
  for (let i = 0; i < recent.length; i++) {
    const d = dist(lab, recent[i])
    if (d < min) min = d
  }
  return min
}

// Smallest difference between any two colours inside one palette.
export function internalMinDistance(colors) {
  const labs = colors.map(toLab)
  let min = Infinity
  for (let i = 0; i < labs.length; i++)
    for (let j = i + 1; j < labs.length; j++) min = Math.min(min, dist(labs[i], labs[j]))
  return min
}

// Higher = better: every colour is far from recent ones AND from its neighbours.
export function freshnessScore(colors) {
  const recentMin = Math.min(...colors.map(distanceToRecent))
  const inner = internalMinDistance(colors)
  return Math.min(Math.min(recentMin, 60), Math.min(inner, 60) * 1.2)
}

// True when a palette mostly repeats colours we've already produced.
export function isTooSimilar(colors, threshold = 9, minClose = 2) {
  return colors.filter((c) => distanceToRecent(c) < threshold).length >= minClose
}
