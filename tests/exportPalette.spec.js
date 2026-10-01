import { describe, it, expect } from 'vitest'
import { paletteToTailwind, tailwindSlug } from '../src/utils/exportPalette'

describe('tailwind export', () => {
  const palette = { name: 'Sunset Vibes!', colors: ['#FF6B6B', '#FFD93D'] }

  it('creates a safe slug from any palette name', () => {
    expect(tailwindSlug('Sunset Vibes!')).toBe('sunset-vibes')
    expect(tailwindSlug('123 go')).toBe('palette-123-go')
    expect(tailwindSlug('')).toBe('palette')
    expect(tailwindSlug('!!!')).toBe('palette')
  })

  it('includes every colour under theme.extend.colors', () => {
    const out = paletteToTailwind(palette)
    expect(out).toContain('extend')
    expect(out).toContain("'sunset-vibes'")
    expect(out).toContain("'1': '#FF6B6B'")
    expect(out).toContain("'2': '#FFD93D'")
  })

  it('produces valid JavaScript', () => {
    const out = paletteToTailwind(palette)
    const mod = { exports: null }
    new Function('module', out)(mod)
    expect(mod.exports.theme.extend.colors['sunset-vibes']['2']).toBe('#FFD93D')
  })
})
