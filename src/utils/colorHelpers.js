import { registerPalette, freshnessScore, distanceToRecent, deltaE } from './colorMemory'

// Converts HSL values to a hex colour string
export function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360 // accept negative / >360 hues
  s /= 100
  l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  const toHex = (x) => Math.round(255 * f(x)).toString(16).padStart(2, '0')
  return `#${toHex(0)}${toHex(8)}${toHex(4)}`
}

// Converts a hex colour string to { h, s, l } values
export function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255
  let g = parseInt(hex.slice(3, 5), 16) / 255
  let b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s
  let l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

// Breaks a hex colour into its red, green, and blue parts
export function hexToRgbParts(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}

// Returns a colour string in the requested format (hex, rgb, or hsl)
export function formatColor(hex, format) {
  if (format === 'rgb') {
    const { r, g, b } = hexToRgbParts(hex)
    return `rgb(${r}, ${g}, ${b})`
  }
  if (format === 'hsl') {
    const { h, s, l } = hexToHsl(hex)
    return `hsl(${h}, ${s}%, ${l}%)`
  }
  return hex.toUpperCase()
}

// Saturation and lightness ranges for each named style. Lightness stays
// clear of the very top/bottom of the scale so every style still reads
// as an actual colour — not near-black or washed-out-to-white.
const STYLE_PRESETS = {
  pastel:  { s: [22, 60],   l: [64, 90] },
  vibrant: { s: [80, 100],  l: [45, 65] },
  dark:    { s: [50, 85],   l: [16, 38] },
  warm:    { h: [-20, 65],  s: [55, 92], l: [38, 72] },
  cool:    { h: [170, 300], s: [55, 92], l: [38, 72] },
  earthy:  { h: [8, 130],   s: [25, 62], l: [26, 54] },
  neon:    { s: [90, 100],  l: [50, 70] },
  muted:   { s: [15, 42],   l: [45, 70] },
}

function rand(min, max) {
  return min + Math.random() * (max - min)
}

// Looks at a palette's actual average saturation/lightness and picks
// the STYLE_PRESETS bucket it resembles most closely. Used to give
// externally-sourced palettes (e.g. live API results) a real style tag
// instead of a generic one, so they show up in style search/filtering
// and count toward variety in the Explore feed — pastel included.
export function classifyStyle(colors) {
  if (!colors || !colors.length) return 'vibrant'
  let totalS = 0, totalL = 0, vx = 0, vy = 0
  colors.forEach((hex) => {
    const { h, s, l } = hexToHsl(hex)
    totalS += s
    totalL += l
    // saturation-weighted circular mean of the hue
    vx += Math.cos((h * Math.PI) / 180) * s
    vy += Math.sin((h * Math.PI) / 180) * s
  })
  const avgS = totalS / colors.length
  const avgL = totalL / colors.length
  const avgH = ((Math.atan2(vy, vx) * 180) / Math.PI + 360) % 360

  // degrees between a hue and the nearest edge of a style's allowed hue range
  const hueGap = (range) =>
    Math.min(...[-360, 0, 360].map((shift) => {
      const h = avgH + shift
      return h >= range[0] && h <= range[1] ? 0 : Math.min(Math.abs(h - range[0]), Math.abs(h - range[1]))
    }))

  let best = 'vibrant'
  let bestDist = Infinity
  for (const [name, preset] of Object.entries(STYLE_PRESETS)) {
    const [sLo, sHi] = preset.s
    const [lLo, lHi] = preset.l
    let dist = Math.abs(avgS - (sLo + sHi) / 2) + Math.abs(avgL - (lLo + lHi) / 2)
    if (preset.h) dist += hueGap(preset.h) * 0.3 // warm must look warm, cool must look cool
    if (dist < bestDist) { bestDist = dist; best = name }
  }
  return best
}

// Picks a single hex colour, optionally constrained to a style preset
export function getVibrantHex(hueOverride, style) {
  let h = hueOverride !== undefined ? hueOverride : Math.floor(Math.random() * 360)
  let s, l

  const preset = style && STYLE_PRESETS[style]
  if (preset) {
    if (preset.h) h = ((rand(...preset.h) % 360) + 360) % 360
    s = rand(...preset.s)
    l = rand(...preset.l)
  } else {
    s = rand(75, 100)
    l = rand(45, 70)
  }

  return hslToHex(Math.round(h), Math.round(s), Math.round(l))
}

// Generates a palette of `count` colours that look good together —
// a thin wrapper around buildHarmonyPalette (defined below) for callers
// that only need the hex list, not which harmony rule produced it.
export function generateHarmoniousPalette(count = 5, style = null) {
  return buildHarmonyPalette(count, style).colors
}

// Relative luminance of a hex colour, per the WCAG 2.x definition
export function getLuminance(hex) {
  const { r, g, b } = hexToRgbParts(hex)
  const [rs, gs, bs] = [r, g, b].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

// WCAG contrast ratio between two hex colours (1 to 21)
export function getContrastRatio(hexA, hexB) {
  const l1 = getLuminance(hexA)
  const l2 = getLuminance(hexB)
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (lighter + 0.05) / (darker + 0.05)
}

// Maps a contrast ratio to a WCAG pass/fail rating for normal-size text
export function getWCAGRating(ratio) {
  if (ratio >= 7)   return { label: 'AAA', pass: true }
  if (ratio >= 4.5) return { label: 'AA',  pass: true }
  if (ratio >= 3)   return { label: 'AA Large', pass: true }
  return { label: 'Fail', pass: false }
}

// Validates a hex colour string (#abc, #aabbcc, with or without the hash)
export function isValidHex(value) {
  return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test((value || '').trim())
}

// Normalises a hex string to full 6-digit, uppercase, hash-prefixed form
export function normalizeHex(value) {
  let v = value.trim().replace(/^#/, '')
  if (v.length === 3) v = v.split('').map((c) => c + c).join('')
  return `#${v.toUpperCase()}`
}

// Buckets a hex colour into a broad human-readable hue category —
// used to power the Dashboard's colour-distribution chart.
const HUE_BUCKETS = [
  { name: 'Red',    max: 15,  color: '#EF4444' },
  { name: 'Orange', max: 45,  color: '#F97316' },
  { name: 'Yellow', max: 70,  color: '#EAB308' },
  { name: 'Green',  max: 165, color: '#22C55E' },
  { name: 'Cyan',   max: 195, color: '#06B6D4' },
  { name: 'Blue',   max: 255, color: '#3B82F6' },
  { name: 'Purple', max: 290, color: '#8B5CF6' },
  { name: 'Pink',   max: 345, color: '#EC4899' },
  { name: 'Red',    max: 361, color: '#EF4444' },
]
export function hueToCategory(hue) {
  return HUE_BUCKETS.find((b) => hue < b.max) || HUE_BUCKETS[HUE_BUCKETS.length - 1]
}

// Classic colour-theory relationships, expressed as hue offsets from a
// base hue. Powers the Color Wheel's harmony-rule picker in Studio Pro.
export const HARMONY_RULES = {
  complementary:      { label: 'Complementary',      offsets: [0, 180] },
  analogous:          { label: 'Analogous',           offsets: [-30, 0, 30] },
  triadic:            { label: 'Triadic',             offsets: [0, 120, 240] },
  splitComplementary: { label: 'Split-Complementary', offsets: [0, 150, 210] },
  square:             { label: 'Square',              offsets: [0, 90, 180, 270] },
  monochromatic:      { label: 'Monochromatic',       offsets: [0, 0, 0, 0, 0] },
}

// Lightness steps used to fan a single hue out into a monochromatic scale
const MONOCHROME_LIGHTS = [85, 70, 55, 40, 25]

// Turns a base HSL colour + a named harmony rule into an array of hex
// colours that follow that rule (e.g. 'triadic' -> 3 evenly-spaced hues).
export function getHarmonyColors(rule, hue, sat, light) {
  const def = HARMONY_RULES[rule]
  if (!def) return []
  if (rule === 'monochromatic') {
    return MONOCHROME_LIGHTS.map((l) => hslToHex(hue, Math.max(sat, 45), l))
  }
  return def.offsets.map((offset) => hslToHex((hue + offset + 360) % 360, sat, light))
}

// The hue positions a harmony rule lights up on the wheel (for drawing
// marker dots). Monochromatic shares one hue, so it has no distinct shape.
export function getHarmonyHues(rule, hue) {
  const def = HARMONY_RULES[rule]
  if (!def || rule === 'monochromatic') return []
  return def.offsets.map((offset) => (hue + offset + 360) % 360)
}

// Harmony rules used for *whole-palette* generation (unlimited Explore
// feed, "AI Suggest", etc). Monochromatic is excluded here — it's great
// for a single-hue scale, but too flat as a default surprise-me palette.
const PALETTE_RULES = ['complementary', 'analogous', 'triadic', 'splitComplementary', 'square']
// Extra, generator-only rules (kept out of HARMONY_RULES so the colour-wheel
// picker in Studio Pro is unchanged) — more shapes means less sameness.
const EXTRA_RULES = {
  tetradic:     { label: 'Tetradic',        offsets: [0, 60, 180, 240] },
  wideAnalogue: { label: 'Wide Analogous',  offsets: [-55, -28, 0, 28, 55] },
  splitWide:    { label: 'Split-Complementary', offsets: [0, 165, 195] },
}
const ALL_RULES = [...PALETTE_RULES, ...Object.keys(EXTRA_RULES)]
const ruleDef = (rule) => HARMONY_RULES[rule] || EXTRA_RULES[rule]

// A floor and ceiling on lightness that applies no matter what style
// produced a colour — keeps everything readable as an actual hue.
const MIN_READABLE_L = 12
const MAX_READABLE_L = 92
const CANDIDATES = 4  // whole palettes tried per request (structure variety); the freshest wins
const PER_COLOR = 24  // options tried for every single swatch; the most different one wins

// Walks around the colour wheel by the golden angle, so back-to-back
// palettes always start from clearly different hues.
let hueCursor = Math.random() * 360
function nextCursor() {
  hueCursor = (hueCursor + 137.508 + rand(-30, 30) + 360) % 360
  return hueCursor
}

function shuffled(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Shapes the lightness across a palette (0..1 per swatch): rising, falling,
// peak, valley or scattered — so palettes differ in *shade structure* too.
function lightnessPattern(count) {
  const asc = Array.from({ length: count }, (_, i) => (count > 1 ? i / (count - 1) : 0.5))
  const kind = Math.floor(Math.random() * 5)
  if (kind === 0) return asc
  if (kind === 1) return [...asc].reverse()
  if (kind === 2) return asc.map((t) => 1 - Math.abs(2 * t - 1))
  if (kind === 3) return asc.map((t) => Math.abs(2 * t - 1))
  return shuffled(asc)
}

function makeCandidate(count, style, forcedRule) {
  const preset = style && STYLE_PRESETS[style]
  let rule = forcedRule || ALL_RULES[Math.floor(Math.random() * ALL_RULES.length)]
  let hues

  let hueRoom // how far a swatch's hue may drift from its target
  if (preset && preset.h) {
    // Hue-limited style (warm / cool / earthy): give each swatch its own slice
    // of the allowed range, so palettes stay on-theme yet differ from each other.
    rule = 'analogous'
    const [a, b] = preset.h
    const width = b - a
    const slices = Array.from({ length: count }, (_, i) => a + ((i + 0.5) / count) * width)
    const order = Math.floor(Math.random() * 3)
    hues = order === 0 ? slices : order === 1 ? [...slices].reverse() : shuffled(slices)
    hueRoom = (width / count) * 0.6
  } else {
    const offsets = ruleDef(rule).offsets
    const base = nextCursor()
    hues = Array.from({ length: count }, (_, i) => base + offsets[i % offsets.length])
    hueRoom = 16
  }

  const [lo, hi] = preset ? preset.l : [28, 80]
  const span = hi - lo
  const winLo = lo + rand(0, span * 0.15)
  const winHi = hi - rand(0, span * 0.15)
  const pattern = lightnessPattern(count)
  const [sLo, sHi] = preset ? preset.s : [68, 100]
  const clampL = (l) => Math.max(MIN_READABLE_L, Math.min(MAX_READABLE_L, Math.max(lo, Math.min(hi, l))))

  // Pick each swatch from PER_COLOR options: whichever is farthest (as the
  // eye sees it) from recently shown colours and from this palette's others.
  const colors = []
  hues.forEach((hue, i) => {
    const targetL = winLo + pattern[i] * (winHi - winLo)
    let bestHex = null
    let bestScore = -Infinity
    for (let t = 0; t < PER_COLOR; t++) {
      let h = hue + rand(-hueRoom, hueRoom)
      if (preset && preset.h) h = Math.max(preset.h[0], Math.min(preset.h[1], h))
      const hex = hslToHex(
        h,
        Math.round(rand(sLo, sHi)),
        Math.round(clampL(targetL + rand(-7, 7)))
      )
      const nearest = colors.length ? Math.min(...colors.map((c) => deltaE(c, hex))) : Infinity
      const score = Math.min(Math.min(distanceToRecent(hex), 60), Math.min(nearest, 50) * 1.2)
      if (score > bestScore) { bestScore = score; bestHex = hex }
    }
    colors.push(bestHex)
  })

  return { colors, rule, label: ruleDef(rule)?.label || 'Custom' }
}

// Builds a palette whose hues follow a real colour-harmony rule (so the
// colours *combine* well) and which is chosen to look different from every
// palette generated recently: several candidates are made and the one whose
// colours are farthest from recent ones (and from each other) is kept.
// Returns which rule was used, for labelling.
export function buildHarmonyPalette(count = 5, style = null, forcedRule = null) {
  let best = null
  let bestScore = -Infinity
  for (let k = 0; k < CANDIDATES; k++) {
    const candidate = makeCandidate(count, style, forcedRule)
    const score = freshnessScore(candidate.colors)
    if (score > bestScore) { best = candidate; bestScore = score }
  }
  registerPalette(best.colors)
  return best
}
