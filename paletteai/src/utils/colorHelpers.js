// Converts HSL values to a hex colour string
export function hslToHex(h, s, l) {
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
  pastel:  { s: [30, 50],   l: [68, 84] },
  vibrant: { s: [80, 100],  l: [45, 65] },
  dark:    { s: [55, 85],   l: [22, 36] },
  warm:    { h: [0, 60],    s: [60, 90], l: [40, 68] },
  cool:    { h: [180, 300], s: [60, 90], l: [40, 68] },
  earthy:  { s: [30, 60],   l: [32, 50] },
  neon:    { s: [90, 100],  l: [50, 68] },
  muted:   { s: [20, 40],   l: [48, 68] },
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
  let totalS = 0, totalL = 0
  colors.forEach((hex) => {
    const { s, l } = hexToHsl(hex)
    totalS += s
    totalL += l
  })
  const avgS = totalS / colors.length
  const avgL = totalL / colors.length

  let best = 'vibrant'
  let bestDist = Infinity
  for (const [name, preset] of Object.entries(STYLE_PRESETS)) {
    const [sLo, sHi] = preset.s
    const [lLo, lHi] = preset.l
    const dist = Math.abs(avgS - (sLo + sHi) / 2) + Math.abs(avgL - (lLo + lHi) / 2)
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
    if (preset.h) h = rand(...preset.h)
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

// Extends a harmony rule's hue offsets out to `count` hues by cycling
// through them again with a small random jitter, so a 5-swatch palette
// built from a 2-hue "complementary" rule still stays visually related.
function buildHueSequence(rule, baseHue, count) {
  const offsets = HARMONY_RULES[rule]?.offsets || [0]
  return Array.from({ length: count }, (_, i) => {
    const offset = offsets[i % offsets.length]
    const jitter = i >= offsets.length ? rand(-12, 12) : 0
    return Math.round((baseHue + offset + jitter + 360) % 360)
  })
}

// Builds a palette whose hues follow a real colour-harmony rule (so the
// colours *combine* well) and whose lightness ramps steadily from light
// to dark across the whole set — then gets a final contrast pass — so
// every swatch stays visually distinct from the others, even when a rule
// with few hues (e.g. 2-hue "complementary") has to repeat a hue to fill
// out the palette. Returns which rule was used, for labelling.
// A floor and ceiling on lightness that applies no matter what style or
// safety-nudge produced a colour — keeps everything readable as an
// actual hue instead of drifting to near-black or near-white.
const MIN_READABLE_L = 12
const MAX_READABLE_L = 90

export function buildHarmonyPalette(count = 5, style = null, forcedRule = null) {
  const rule = forcedRule || PALETTE_RULES[Math.floor(Math.random() * PALETTE_RULES.length)]
  const baseHue = Math.floor(Math.random() * 360)
  const hues = buildHueSequence(rule, baseHue, count)
  const preset = style && STYLE_PRESETS[style]
  const [lo, hi] = preset ? preset.l : [30, 78]
  // Even spacing across the full range, so no two indices can land on
  // the same lightness band the way a simple even/odd alternation could.
  const step = count > 1 ? (hi - lo) / (count - 1) : 0

  const colors = hues.map((h, i) => {
    const s = preset ? rand(...preset.s) : rand(75, 100)
    let l = lo + step * i + rand(-3, 3) // small jitter keeps it from looking mechanical
    l = Math.max(MIN_READABLE_L, Math.min(MAX_READABLE_L, l))
    return hslToHex(h, Math.round(s), Math.round(l))
  })

  // Safety pass: nudge any colour that's too close in contrast to the
  // one right before it (checked against every earlier colour too, so a
  // nudge can't accidentally land back on one from further up the list).
  for (let i = 1; i < colors.length; i++) {
    let guard = 0
    while (guard < 8 && colors.slice(0, i).some((c) => getContrastRatio(c, colors[i]) < 1.4)) {
      const hsl = hexToHsl(colors[i])
      const nudged = hsl.l > 50 ? hsl.l + (10 + guard * 4) : hsl.l - (10 + guard * 4)
      colors[i] = hslToHex(hsl.h, hsl.s, Math.max(MIN_READABLE_L, Math.min(MAX_READABLE_L, nudged)))
      guard++
    }
  }

  return { colors, rule, label: HARMONY_RULES[rule]?.label || 'Custom' }
}
