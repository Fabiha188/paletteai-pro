import React, { useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'

// Two colour sets — vivid on the near-black dark background, deepened
// versions of the same hues so they still pop against a white one.
const PARTICLE_COLORS = {
  dark:  ['#8B5CF6', '#06B6D4', '#FBBF24', '#F472B6', '#34D399', '#A78BFA', '#67E8F9'],
  light: ['#7C3AED', '#0891B2', '#D97706', '#DB2777', '#059669', '#6D28D9', '#0E7490'],
}
// Connecting-line colour (as an "r, g, b" triplet) and glow strength per theme
const LINE_RGB    = { dark: '139, 92, 246', light: '124, 58, 237' }
const GLOW_BLUR    = { dark: 15, light: 8 }
const LINE_GLOW    = { dark: 10, light: 5 }

export default function Hero({ onGetStarted }) {
  const canvasRef = useRef(null)
  const { theme } = useApp()
  const themeRef = useRef(theme)

  // Keep the running animation aware of theme changes without restarting
  // it — particles just pick up the new palette on their next frame.
  useEffect(() => { themeRef.current = theme }, [theme])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let particles = []
    let ripples = []
    let animationId = null
    let resizeTimer = null

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      canvas.width  = rect.width
      canvas.height = rect.height
    }

    class Particle {
      constructor() {
        this.x      = Math.random() * canvas.width
        this.y      = Math.random() * canvas.height
        this.size   = Math.random() * 5 + 2
        this.speedX = (Math.random() - 0.5) * 2.5
        this.speedY = (Math.random() - 0.5) * 2.5
        // Store which colour slot this particle uses, not the hex itself,
        // so it can switch palettes live when the theme toggles.
        this.colorIndex = Math.floor(Math.random() * PARTICLE_COLORS.dark.length)
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY
        if (this.x > canvas.width  || this.x < 0) this.speedX = -this.speedX
        if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY
        this.x = Math.max(0, Math.min(canvas.width,  this.x))
        this.y = Math.max(0, Math.min(canvas.height, this.y))

        // Settle back toward a calm cruising speed after a click impulse
        const speed = Math.hypot(this.speedX, this.speedY)
        if (speed > 3) {
          this.speedX *= 0.96
          this.speedY *= 0.96
        }
      }

      draw() {
        const palette = PARTICLE_COLORS[themeRef.current] || PARTICLE_COLORS.dark
        const color = palette[this.colorIndex]
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle   = color
        ctx.shadowColor = color
        ctx.shadowBlur  = GLOW_BLUR[themeRef.current] || GLOW_BLUR.dark
        ctx.fill()
        ctx.shadowBlur  = 0
      }
    }

    const init = () => {
      const count = Math.min(60, Math.floor((canvas.width * canvas.height) / 6000))
      particles = Array.from({ length: count }, () => new Particle())
    }

    const drawLines = () => {
      const rgb  = LINE_RGB[themeRef.current] || LINE_RGB.dark
      const glow = LINE_GLOW[themeRef.current] || LINE_GLOW.dark
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx   = particles[a].x - particles[b].x
          const dy   = particles[a].y - particles[b].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 150) {
            const opacity = 1 - dist / 150
            ctx.beginPath()
            ctx.moveTo(particles[a].x, particles[a].y)
            ctx.lineTo(particles[b].x, particles[b].y)
            ctx.strokeStyle = `rgba(${rgb}, ${opacity * 0.6})`
            ctx.lineWidth   = 1.5
            ctx.shadowColor = `rgb(${rgb})`
            ctx.shadowBlur  = glow
            ctx.stroke()
            ctx.shadowBlur  = 0
          }
        }
      }
    }

    // Expanding, fading rings that mark where the user clicked
    const drawRipples = () => {
      const rgb = LINE_RGB[themeRef.current] || LINE_RGB.dark
      ripples = ripples.filter(r => r.alpha > 0)
      ripples.forEach(r => {
        r.radius += 6
        r.alpha  -= 0.025
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(${rgb}, ${Math.max(r.alpha, 0)})`
        ctx.lineWidth = 2
        ctx.stroke()
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => { p.update(); p.draw() })
      drawLines()
      drawRipples()
      animationId = requestAnimationFrame(animate)
    }

    // Click/tap: scatter nearby particles outward from the click point
    // and drop a ripple there so the interaction reads clearly.
    const handlePointerDown = (e) => {
      const rect = canvas.getBoundingClientRect()
      const clickX = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left
      const clickY = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top
      const radius = 200
      const strength = 10

      particles.forEach(p => {
        const dx = p.x - clickX
        const dy = p.y - clickY
        const dist = Math.hypot(dx, dy) || 1
        if (dist < radius) {
          const force = (1 - dist / radius) * strength
          const angle = Math.atan2(dy, dx)
          p.speedX += Math.cos(angle) * force
          p.speedY += Math.sin(angle) * force
          // Cap so repeated clicks can't send particles flying forever
          const speed = Math.hypot(p.speedX, p.speedY)
          if (speed > 9) {
            p.speedX = (p.speedX / speed) * 9
            p.speedY = (p.speedY / speed) * 9
          }
        }
      })

      ripples.push({ x: clickX, y: clickY, radius: 0, alpha: 0.6 })
    }

    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => { resize(); init() }, 150)
    }

    resize()
    init()
    animate()
    window.addEventListener('resize', handleResize)
    canvas.addEventListener('pointerdown', handlePointerDown)

    return () => {
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      if (animationId) cancelAnimationFrame(animationId)
      clearTimeout(resizeTimer)
    }
  }, [])

  const scrollToFeatures = (e) => {
    e.preventDefault()
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="hero">
      <div className="float-shape shape-circle"></div>
      <div className="float-shape shape-square"></div>
      <div className="float-shape shape-triangle"></div>

      <div className="hero-content">
        <div className="badge">
          <i className="fas fa-sparkles"></i> AI-Powered Design Tool
        </div>
        <h1>
          Generate Stunning <br />
          <span className="gradient-text">Color Palettes</span> in Seconds
        </h1>
        <p>
          PaletteAI uses advanced AI to suggest harmonious colors, generate smooth
          gradients, and ensure your designs are accessible for everyone.
        </p>
        <div className="hero-buttons">
          <button className="cta-primary" onClick={onGetStarted}>
            <i className="fas fa-wand-magic-sparkles"></i> Start Creating
          </button>
          <a href="#features" className="cta-secondary" onClick={scrollToFeatures}>
            <i className="fas fa-arrow-down"></i> Explore Features
          </a>
        </div>
        <div className="trust-badge">
          <span><i className="fas fa-check-circle"></i> 50K+ Designers Trust</span>
          <span><i className="fas fa-check-circle"></i> Free to Use</span>
        </div>
      </div>

      <div className="hero-visual">
        <canvas id="particleCanvas" ref={canvasRef}></canvas>
      </div>
    </div>
  )
}
