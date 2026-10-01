import React, { useRef, useEffect, useCallback } from 'react'
import { hslToHex } from '../utils/colorHelpers'

const SIZE = 240 // CSS pixels — the wheel is always drawn square

// Maps a hue (0-360, 0 = top, clockwise) + saturation (0-100, 0 = centre)
// to an {x, y} point on the wheel, in canvas coordinates.
function hueSatToPoint(hue, sat, radius, center) {
  const angle = (hue * Math.PI) / 180
  const dist = (sat / 100) * radius
  return {
    x: center + Math.sin(angle) * dist,
    y: center - Math.cos(angle) * dist,
  }
}

// Inverse of the above — given a point relative to the wheel's centre,
// returns the hue/saturation it represents (saturation clamped to the disc).
function pointToHueSat(dx, dy, radius) {
  const dist = Math.min(Math.sqrt(dx * dx + dy * dy), radius)
  let hue = (Math.atan2(dx, -dy) * 180) / Math.PI
  if (hue < 0) hue += 360
  const sat = (dist / radius) * 100
  return { hue, sat }
}

/*
  A drag-to-pick HSL colour wheel: hue runs clockwise around the disc,
  saturation runs from the centre (grey) to the edge (fully saturated).
  Lightness isn't spatial here — it's controlled elsewhere and just changes
  how bright the whole disc renders, so the wheel always shows true colour.

  When `harmonyHues` is supplied, small connected marker dots are drawn at
  those hues (at the current saturation) so the selected harmony rule's
  shape — a line, triangle, square — is visible directly on the wheel.
*/
export default function ColorWheel({ hue, sat, light, harmonyHues = [], onChange }) {
  const canvasRef = useRef(null)
  const draggingRef = useRef(false)
  // Offscreen buffer, always exactly SIZE×SIZE CSS pixels — painted with
  // putImageData (which ignores canvas transforms), then blitted onto the
  // real canvas with drawImage (which *does* respect transforms). This
  // keeps the disc correctly scaled and centred on any devicePixelRatio,
  // instead of only filling the top-left corner on high-DPI screens.
  const bufferRef = useRef(null)

  const radius = SIZE / 2 - 6
  const center = SIZE / 2

  // Paint the wheel: one pass filling every pixel inside the disc with its
  // HSL colour at the current lightness, then the harmony shape, then the
  // selection puck on top.
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== SIZE * dpr) {
      canvas.width = SIZE * dpr
      canvas.height = SIZE * dpr
    }
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, SIZE, SIZE)

    if (!bufferRef.current) {
      bufferRef.current = document.createElement('canvas')
      bufferRef.current.width = SIZE
      bufferRef.current.height = SIZE
    }
    const bufCtx = bufferRef.current.getContext('2d')
    const imageData = bufCtx.createImageData(SIZE, SIZE)
    const data = imageData.data

    for (let py = 0; py < SIZE; py++) {
      for (let px = 0; px < SIZE; px++) {
        const dx = px - center
        const dy = py - center
        const dist = Math.sqrt(dx * dx + dy * dy)
        const idx = (py * SIZE + px) * 4
        if (dist > radius + 1) continue // leave transparent outside the disc

        const { hue: h, sat: s } = pointToHueSat(dx, dy, radius)
        const clampedS = Math.min(s, 100)
        const [r, g, b] = hslToRgbFast(h, clampedS, light)
        data[idx] = r
        data[idx + 1] = g
        data[idx + 2] = b
        // Anti-alias the outer edge so it doesn't look jagged
        data[idx + 3] = dist > radius - 1 ? Math.max(0, (radius + 1 - dist)) * 255 : 255
      }
    }
    bufCtx.putImageData(imageData, 0, 0)
    ctx.drawImage(bufferRef.current, 0, 0)

    // Subtle ring around the disc
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Harmony shape: connect the rule's hues to visualise it at a glance
    if (harmonyHues.length > 1) {
      const points = harmonyHues.map((h) => hueSatToPoint(h, Math.max(sat, 35), radius, center))
      ctx.beginPath()
      points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
      ctx.closePath()
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      points.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
        ctx.lineWidth = 2
        ctx.strokeStyle = 'rgba(10,11,20,0.6)'
        ctx.stroke()
      })
    }

    // Selection puck for the base colour
    const puck = hueSatToPoint(hue, Math.min(sat, 100), radius, center)
    ctx.beginPath()
    ctx.arc(puck.x, puck.y, 9, 0, Math.PI * 2)
    ctx.fillStyle = hslToHex(hue, sat, light)
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()
    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(10,11,20,0.5)'
    ctx.stroke()
  }, [hue, sat, light, harmonyHues])

  useEffect(() => {
    draw()
  }, [draw])

  const handlePoint = useCallback(
    (clientX, clientY) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const dx = clientX - (rect.left + rect.width / 2)
      const dy = clientY - (rect.top + rect.height / 2)
      const { hue: h, sat: s } = pointToHueSat(dx, dy, radius)
      onChange(Math.round(h), Math.round(s))
    },
    [radius, onChange]
  )

  const onPointerDown = (e) => {
    draggingRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    handlePoint(e.clientX, e.clientY)
  }
  const onPointerMove = (e) => {
    if (!draggingRef.current) return
    handlePoint(e.clientX, e.clientY)
  }
  const onPointerUp = () => {
    draggingRef.current = false
  }

  const onKeyDown = (e) => {
    const step = e.shiftKey ? 10 : 2
    if (e.key === 'ArrowLeft')  { onChange((hue - step + 360) % 360, sat); e.preventDefault() }
    if (e.key === 'ArrowRight') { onChange((hue + step) % 360, sat); e.preventDefault() }
    if (e.key === 'ArrowUp')    { onChange(hue, Math.min(100, sat + step)); e.preventDefault() }
    if (e.key === 'ArrowDown')  { onChange(hue, Math.max(0, sat - step)); e.preventDefault() }
  }

  return (
    <div className="color-wheel-wrap">
      <div className="wheel-live-preview" aria-live="polite">
        <span className="wheel-live-swatch" style={{ background: hslToHex(hue, sat, light) }} />
        <span className="wheel-live-hex">{hslToHex(hue, sat, light)}</span>
      </div>
      <canvas
        ref={canvasRef}
        className="color-wheel-canvas"
        style={{ width: SIZE, height: SIZE }}
        tabIndex={0}
        role="slider"
        aria-label="Color wheel — use arrow keys to adjust hue and saturation"
        aria-valuenow={hue}
        aria-valuetext={`Hue ${hue}, Saturation ${sat}%`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      />
    </div>
  )
}

// Fast-ish HSL -> [r,g,b] used only for per-pixel wheel painting
// (avoids the hex round-trip / string parsing of hslToHex in a hot loop).
function hslToRgbFast(h, s, l) {
  s /= 100
  l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))]
}
