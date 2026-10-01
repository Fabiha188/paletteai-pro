import React, { useState, useEffect } from 'react'
import { generateHarmoniousPalette, isValidHex, normalizeHex } from '../utils/colorHelpers'
import { useApp } from '../context/AppContext'

export default function GradientMaker() {
  const { showToastMessage: showToast } = useApp()
  const [colors, setColors] = useState(['#8B5CF6', '#06B6D4'])
  const [angle, setAngle]   = useState(135)
  const [type, setType]     = useState('linear')
  const [hexInputs, setHexInputs] = useState(colors)

  // Keep the editable text fields in sync whenever colors change from
  // elsewhere (add/remove/randomize), without clobbering active typing.
  useEffect(() => { setHexInputs(colors) }, [colors])

  const gradientCss = type === 'linear'
    ? `linear-gradient(${angle}deg, ${colors.join(', ')})`
    : `radial-gradient(circle, ${colors.join(', ')})`

  const fullCss = `background: ${gradientCss};`

  const updateColor = (i, hex) => {
    setColors((prev) => prev.map((c, idx) => (idx === i ? hex : c)))
  }

  const addStop = () => {
    if (colors.length >= 5) return
    setColors((prev) => [...prev, generateHarmoniousPalette(1)[0]])
  }

  const removeStop = (i) => {
    if (colors.length <= 2) return
    setColors((prev) => prev.filter((_, idx) => idx !== i))
  }

  const randomize = () => setColors(generateHarmoniousPalette(colors.length))

  const setHexInputAt = (i, value) => {
    setHexInputs((prev) => prev.map((v, idx) => (idx === i ? value : v)))
  }
  const commitHexAt = (i) => {
    const value = hexInputs[i]
    if (isValidHex(value)) {
      updateColor(i, normalizeHex(value))
    } else {
      setHexInputAt(i, colors[i]) // revert to last good colour
    }
  }

  const copyCSS = () => {
    navigator.clipboard?.writeText(fullCss).then(() => showToast('✅ Gradient CSS copied!'))
  }

  return (
    <div className="gradient-maker-content" style={{ paddingTop: '60px' }}>
      <div className="section-header">
        <h2>🎨 Gradient <span className="gradient-text">Maker</span></h2>
        <p className="section-subtitle">Create smooth, beautiful gradients — then copy the CSS.</p>
      </div>

      <div className="gradient-preview" style={{ background: gradientCss }} />

      <div className="gradient-controls">
        <div className="gradient-stops">
          {colors.map((c, i) => (
            <div className="gradient-stop" key={i}>
              <span className="gradient-stop-swatch" style={{ background: c }} aria-hidden="true" />
              <input
                type="text"
                className="hex-input-field small"
                value={hexInputs[i] ?? c}
                spellCheck={false}
                onChange={(e) => setHexInputAt(i, e.target.value)}
                onBlur={() => commitHexAt(i)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitHexAt(i) } }}
                aria-label={`Gradient stop ${i + 1} hex color`}
              />
              {colors.length > 2 && (
                <button onClick={() => removeStop(i)} title="Remove this color">
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          ))}
          {colors.length < 5 && (
            <button className="export-btn" onClick={addStop}>
              <i className="fas fa-plus"></i> Add Color
            </button>
          )}
        </div>

        <div className="gradient-options">
          <div className="gradient-type-toggle">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="linear">Linear</option>
              <option value="radial">Radial</option>
            </select>
          </div>

          {type === 'linear' && (
            <div className="gradient-angle">
              <label>Angle: {angle}°</label>
              <input
                type="range"
                min="0"
                max="360"
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
              />
            </div>
          )}

          <button className="cta-secondary" onClick={randomize}>
            <i className="fas fa-shuffle"></i> Randomize Colors
          </button>
        </div>

        <div className="gradient-css-output">
          <code>{fullCss}</code>
          <button className="cta-primary" onClick={copyCSS}>
            <i className="fas fa-copy"></i> Copy CSS
          </button>
        </div>
      </div>
    </div>
  )
}
