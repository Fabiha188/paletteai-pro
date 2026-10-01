// Turns a palette's colours into a block of CSS custom properties,
// e.g. --color-1: #FF6B6B;
export function paletteToCSS(palette) {
  const name = (palette.name || 'palette').toLowerCase().replace(/\s+/g, '-')
  const lines = palette.colors.map((hex, i) => `  --${name}-${i + 1}: ${hex};`)
  return `:root {\n${lines.join('\n')}\n}`
}

// Turns a palette into a ready-to-paste Tailwind config, e.g. classes like
// `bg-sunset-vibes-1` / `text-sunset-vibes-2`.
export function tailwindSlug(name) {
  let slug = String(name || 'palette')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!slug) slug = 'palette'
  if (/^[0-9]/.test(slug)) slug = `palette-${slug}`
  return slug
}

export function paletteToTailwind(palette) {
  const slug = tailwindSlug(palette.name)
  const lines = palette.colors.map((hex, i) => `          '${i + 1}': '${hex}',`)
  return `// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        '${slug}': {
${lines.join('\n')}
        },
      },
    },
  },
}
`
}

// Triggers a browser download for a given filename + text content
function downloadText(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function downloadPaletteJSON(palette) {
  const name = (palette.name || 'palette').toLowerCase().replace(/\s+/g, '-')
  downloadText(`${name}.json`, JSON.stringify(palette, null, 2), 'application/json')
}

export function downloadPaletteTailwind(palette) {
  const name = tailwindSlug(palette.name)
  downloadText(`${name}.tailwind.config.js`, paletteToTailwind(palette), 'text/javascript')
}

export function downloadPaletteCSS(palette) {
  const name = (palette.name || 'palette').toLowerCase().replace(/\s+/g, '-')
  downloadText(`${name}.css`, paletteToCSS(palette), 'text/css')
}

// Draws the palette's swatches onto a canvas and downloads it as a PNG
export function downloadPalettePNG(palette) {
  const swatchWidth = 160
  const height = 220
  const colors = palette.colors
  const canvas = document.createElement('canvas')
  canvas.width  = swatchWidth * colors.length
  canvas.height = height
  const ctx = canvas.getContext('2d')

  colors.forEach((hex, i) => {
    ctx.fillStyle = hex
    ctx.fillRect(i * swatchWidth, 0, swatchWidth, height - 40)

    ctx.fillStyle = '#0F172A'
    ctx.fillRect(i * swatchWidth, height - 40, swatchWidth, 40)

    ctx.fillStyle = '#F1F5F9'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(hex.toUpperCase(), i * swatchWidth + swatchWidth / 2, height - 15)
  })

  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const name = (palette.name || 'palette').toLowerCase().replace(/\s+/g, '-')
    a.href = url
    a.download = `${name}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  })
}
