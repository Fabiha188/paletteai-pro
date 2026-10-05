// Extracts a small set of dominant colours from an image element using
// simple colour-bucket quantization on a downscaled canvas. No external
// API needed — everything runs client-side.
export function extractColorsFromImage(imageEl, count = 5) {
  const MAX_DIMENSION = 120 // downscale for speed; colour distribution barely changes
  const scale = Math.min(1, MAX_DIMENSION / Math.max(imageEl.width, imageEl.height))
  const w = Math.max(1, Math.round(imageEl.width * scale))
  const h = Math.max(1, Math.round(imageEl.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(imageEl, 0, 0, w, h)

  const { data } = ctx.getImageData(0, 0, w, h)

  // Quantize each channel into 8 buckets (so 8*8*8 = 512 possible colour bins),
  // tally frequency, then average the true pixel values within the most
  // common bins for a cleaner representative colour.
  const BUCKET = 32
  const bins = new Map()

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
    if (a < 128) continue // skip transparent pixels

    const key = [
      Math.floor(r / BUCKET),
      Math.floor(g / BUCKET),
      Math.floor(b / BUCKET),
    ].join(',')

    if (!bins.has(key)) bins.set(key, { r: 0, g: 0, b: 0, n: 0 })
    const bin = bins.get(key)
    bin.r += r; bin.g += g; bin.b += b; bin.n += 1
  }

  const sorted = [...bins.values()].sort((a, b) => b.n - a.n)

  const toHex = (n) => Math.round(n).toString(16).padStart(2, '0')
  const colors = sorted.slice(0, count).map(
    (bin) => `#${toHex(bin.r / bin.n)}${toHex(bin.g / bin.n)}${toHex(bin.b / bin.n)}`.toUpperCase()
  )

  // Pad with the last colour if the image was very low-variance / tiny
  while (colors.length < count && colors.length > 0) {
    colors.push(colors[colors.length - 1])
  }

  return colors
}

// Loads a File (from an <input type="file"> or drop event) into an
// HTMLImageElement, resolving once it's ready to draw to canvas.
export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve(img)
      URL.revokeObjectURL(url)
    }
    img.onerror = reject
    img.src = url
  })
}
