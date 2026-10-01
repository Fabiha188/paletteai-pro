import React, { useState, useEffect } from 'react'
import { hexToHsl, hexToRgbParts, getContrastRatio, getWCAGRating } from '../utils/colorHelpers'
import { fetchColorInfo } from '../utils/api'
import { simulateColorBlindness, VISION_TYPES } from '../utils/colorBlindness'

export default function ColorModal({ hex, onClose, openNameModal, savePalette, showToast }) {
  const [colorName, setColorName] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch the colour's name from The Color API whenever the hex changes
  useEffect(() => {
    if (!hex) return
    setLoading(true)
    fetchColorInfo(hex)
      .then(info => {
        setColorName(info.name)
        setLoading(false)
      })
      .catch(() => {
        setColorName('')
        setLoading(false)
      })
  }, [hex])

  // Esc closes the modal
  useEffect(() => {
    if (!hex) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [hex, onClose])

  if (!hex) return null

  const { r, g, b } = hexToRgbParts(hex)
  const { h, s, l } = hexToHsl(hex)

  const copyHex = () => {
    navigator.clipboard?.writeText(hex).then(() => showToast(`✅ ${hex} Copied!`, 'success'))
  }

  const handleSave = () => {
    openNameModal([hex], (name) => {
      savePalette([hex], name)
      showToast('✅ Saved!')
      onClose()
    })
  }

  return (
    <div className={`modal-overlay ${hex ? 'show' : ''}`} onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose} aria-label="Close">&times;</button>

        <div className="color-preview" style={{ background: hex }} onClick={copyHex} />

        <h3>{hex}</h3>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>🔍 Looking up color name...</p>
        ) : colorName ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>🏷️ {colorName}</p>
        ) : null}

        <div className="color-values">
          <div><strong>HEX</strong><br />{hex}</div>
          <div><strong>RGB</strong><br />({r}, {g}, {b})</div>
          <div><strong>HSL</strong><br />({Math.round(h)}°, {Math.round(s)}%, {Math.round(l)}%)</div>
        </div>

        <div className="contrast-check">
          <strong>Accessibility (WCAG contrast)</strong>
          {['#FFFFFF', '#000000'].map((bg) => {
            const ratio  = getContrastRatio(hex, bg)
            const rating = getWCAGRating(ratio)
            return (
              <div className="contrast-row" key={bg}>
                <span
                  className="contrast-sample"
                  style={{ background: bg, color: hex }}
                >Aa</span>
                <span className="contrast-ratio">{ratio.toFixed(2)}:1</span>
                <span className={`contrast-badge ${rating.pass ? 'pass' : 'fail'}`}>
                  {rating.label}
                </span>
              </div>
            )
          })}
        </div>

        <div className="colorblind-check">
          <strong>Color blindness preview</strong>
          <div className="colorblind-grid">
            {VISION_TYPES.map(({ id, label }) => (
              <div className="colorblind-item" key={id}>
                <span
                  className="colorblind-swatch"
                  style={{ background: simulateColorBlindness(hex, id) }}
                />
                <span className="colorblind-label">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="cta-primary" onClick={handleSave}>
          <i className="fas fa-heart"></i> Save to Dashboard
        </button>
        <button className="modal-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
