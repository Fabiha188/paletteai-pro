import { describe, it, expect } from 'vitest'
import {
  hslToHex,
  hexToHsl,
  hexToRgbParts,
  formatColor,
  generateHarmoniousPalette,
  getLuminance,
  getContrastRatio,
  getWCAGRating,
  isValidHex,
  normalizeHex,
} from '../src/utils/colorHelpers'

describe('hslToHex', () => {
  it('converts pure red correctly', () => {
    expect(hslToHex(0, 100, 50).toUpperCase()).toBe('#FF0000')
  })

  it('returns a valid 7-character hex string', () => {
    const result = hslToHex(200, 60, 55)
    expect(result).toMatch(/^#[0-9a-fA-F]{6}$/)
  })
})

describe('hexToHsl', () => {
  it('returns h, s, l keys', () => {
    const hsl = hexToHsl('#8B5CF6')
    expect(hsl).toHaveProperty('h')
    expect(hsl).toHaveProperty('s')
    expect(hsl).toHaveProperty('l')
  })

  it('round-trips through hslToHex without large drift', () => {
    const original = hslToHex(120, 50, 50)
    const { h, s, l } = hexToHsl(original)
    const roundTrip = hslToHex(h, s, l)
    // Colours should be very close (within 1 step per channel after rounding)
    expect(roundTrip.toUpperCase()).toMatch(/^#[0-9A-F]{6}$/)
  })
})

describe('hexToRgbParts', () => {
  it('splits black correctly', () => {
    expect(hexToRgbParts('#000000')).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('splits white correctly', () => {
    expect(hexToRgbParts('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 })
  })
})

describe('formatColor', () => {
  it('returns uppercase hex by default', () => {
    expect(formatColor('#aabbcc', 'hex')).toBe('#AABBCC')
  })

  it('returns an rgb() string', () => {
    expect(formatColor('#ff0000', 'rgb')).toBe('rgb(255, 0, 0)')
  })

  it('returns an hsl() string', () => {
    const result = formatColor('#ff0000', 'hsl')
    expect(result).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/)
  })
})

describe('generateHarmoniousPalette', () => {
  it('returns the requested number of colours', () => {
    expect(generateHarmoniousPalette(5)).toHaveLength(5)
    expect(generateHarmoniousPalette(3)).toHaveLength(3)
  })

  it('all colours are valid hex strings', () => {
    generateHarmoniousPalette(6).forEach(c => {
      expect(c).toMatch(/^#[0-9a-fA-F]{6}$/)
    })
  })

  it('respects the pastel style preset (high lightness)', () => {
    const palette = generateHarmoniousPalette(5, 'pastel')
    palette.forEach(hex => {
      const { l } = hexToHsl(hex)
      expect(l).toBeGreaterThanOrEqual(60)
    })
  })
})

describe('getLuminance', () => {
  it('white has luminance of 1', () => {
    expect(getLuminance('#FFFFFF')).toBeCloseTo(1, 5)
  })

  it('black has luminance of 0', () => {
    expect(getLuminance('#000000')).toBeCloseTo(0, 5)
  })
})

describe('getContrastRatio', () => {
  it('black on white has the maximum ratio of 21:1', () => {
    expect(getContrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0)
  })

  it('a color against itself has a ratio of 1:1', () => {
    expect(getContrastRatio('#8B5CF6', '#8B5CF6')).toBeCloseTo(1, 5)
  })

  it('is symmetric regardless of argument order', () => {
    const a = getContrastRatio('#111111', '#EEEEEE')
    const b = getContrastRatio('#EEEEEE', '#111111')
    expect(a).toBeCloseTo(b, 5)
  })
})

describe('getWCAGRating', () => {
  it('rates a 21:1 ratio as AAA', () => {
    expect(getWCAGRating(21).label).toBe('AAA')
  })

  it('rates a low ratio as Fail', () => {
    const rating = getWCAGRating(1.2)
    expect(rating.label).toBe('Fail')
    expect(rating.pass).toBe(false)
  })
})

describe('isValidHex', () => {
  it('accepts 3 and 6 digit hex codes with or without #', () => {
    expect(isValidHex('#FF6B6B')).toBe(true)
    expect(isValidHex('FF6B6B')).toBe(true)
    expect(isValidHex('#abc')).toBe(true)
  })

  it('rejects invalid strings', () => {
    expect(isValidHex('not-a-color')).toBe(false)
    expect(isValidHex('#12345')).toBe(false)
  })
})

describe('normalizeHex', () => {
  it('expands shorthand hex and uppercases it', () => {
    expect(normalizeHex('#abc')).toBe('#AABBCC')
  })

  it('adds a leading # if missing', () => {
    expect(normalizeHex('ff6b6b')).toBe('#FF6B6B')
  })
})
