import { describe, it, expect } from 'vitest'
import { simulateColorBlindness, VISION_TYPES } from '../src/utils/colorBlindness'
import { encodePaletteToQuery, decodePaletteFromQuery } from '../src/utils/shareLink'

describe('simulateColorBlindness', () => {
  it('returns a valid hex string for every vision type', () => {
    VISION_TYPES.forEach(({ id }) => {
      const result = simulateColorBlindness('#FF6B6B', id)
      expect(result).toMatch(/^#[0-9A-F]{6}$/)
    })
  })

  it('achromatopsia produces a fully desaturated (greyscale) color', () => {
    const result = simulateColorBlindness('#FF0000', 'achromatopsia')
    const r = parseInt(result.slice(1, 3), 16)
    const g = parseInt(result.slice(3, 5), 16)
    const b = parseInt(result.slice(5, 7), 16)
    expect(r).toBe(g)
    expect(g).toBe(b)
  })

  it('returns the original hex for an unknown vision type', () => {
    expect(simulateColorBlindness('#ABCDEF', 'nonexistent')).toBe('#ABCDEF')
  })
})

describe('encodePaletteToQuery / decodePaletteFromQuery', () => {
  it('round-trips a palette through encode and decode', () => {
    const colors = ['#FF6B6B', '#38BDF8', '#34D399']
    const encoded = encodePaletteToQuery(colors)
    const decoded = decodePaletteFromQuery(encoded)
    expect(decoded).toEqual(colors.map((c) => c.toUpperCase()))
  })

  it('returns null for a missing param', () => {
    expect(decodePaletteFromQuery(null)).toBeNull()
    expect(decodePaletteFromQuery('')).toBeNull()
  })

  it('filters out malformed hex segments', () => {
    const decoded = decodePaletteFromQuery('FF6B6B-not-a-color-38BDF8')
    expect(decoded).toEqual(['#FF6B6B', '#38BDF8'])
  })
})
