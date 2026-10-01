import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchAIPalette, fetchColorInfo, fetchColorScheme } from '../src/utils/api'

// ─── fetchAIPalette ────────────────────────────────────────────────────────

describe('fetchAIPalette', () => {
  let originalFetch

  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(()  => { globalThis.fetch = originalFetch })

  it('returns 5 valid hex strings when Colormind responds correctly', async () => {
    const mockResult = { result: [[10,20,30],[40,50,60],[70,80,90],[100,110,120],[130,140,150]] }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok:   true,
      text: async () => JSON.stringify(mockResult),
      json: async () => mockResult,
    })

    const colors = await fetchAIPalette()
    expect(Array.isArray(colors)).toBe(true)
    expect(colors).toHaveLength(5)
    colors.forEach(c => expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/))
  })

  it('throws when Colormind returns a non-ok status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 503, statusText: 'Service Unavailable',
      text: async () => 'Service Unavailable',
    })
    await expect(fetchAIPalette()).rejects.toThrow()
  })

  it('throws when the network request fails completely', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    await expect(fetchAIPalette()).rejects.toThrow('Network error')
  })

  it('throws when the response is missing the result array', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok:   true,
      text: async () => JSON.stringify({ colors: [] }),
      json: async () => ({ colors: [] }),
    })
    await expect(fetchAIPalette()).rejects.toThrow()
  })
})

// ─── fetchColorInfo ────────────────────────────────────────────────────────

describe('fetchColorInfo', () => {
  let originalFetch

  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(()  => { globalThis.fetch = originalFetch })

  it('returns name, hex, rgb, and hsl from The Color API', async () => {
    const mockData = {
      name:     { value: 'Lavender Mist' },
      hex:      { value: '#0A141E' },
      rgb:      { value: 'rgb(10, 20, 30)' },
      hsl:      { value: 'hsl(210, 50%, 8%)' },
      contrast: { value: '#ffffff' },
    }
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockData })

    const info = await fetchColorInfo('#0A141E')
    expect(info.name).toBe('Lavender Mist')
    expect(info.hex).toBe('#0A141E')
    expect(typeof info.rgb).toBe('string')
    expect(typeof info.hsl).toBe('string')
  })

  it('throws when The Color API returns a non-ok status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' })
    await expect(fetchColorInfo('#FFFFFF')).rejects.toThrow('Color API error: 404')
  })

  it('throws when the network request fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    await expect(fetchColorInfo('#123456')).rejects.toThrow('Network error')
  })
})

// ─── fetchColorScheme ──────────────────────────────────────────────────────

describe('fetchColorScheme', () => {
  let originalFetch

  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(()  => { globalThis.fetch = originalFetch })

  it('returns an array of hex strings from The Color API scheme endpoint', async () => {
    const mockData = {
      colors: [
        { hex: { value: '#FF6B6B' } },
        { hex: { value: '#FFB86B' } },
        { hex: { value: '#FFD56B' } },
      ],
    }
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockData })

    const colors = await fetchColorScheme('FF6B6B', 'analogic', 3)
    expect(colors).toEqual(['#FF6B6B', '#FFB86B', '#FFD56B'])
  })

  it('throws when the scheme API returns a non-ok status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    await expect(fetchColorScheme('FF6B6B')).rejects.toThrow('Color scheme API error: 500')
  })

  it('throws when the response is missing a colors array', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    await expect(fetchColorScheme('FF6B6B')).rejects.toThrow()
  })
})
