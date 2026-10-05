import React, { useEffect, useRef, useState } from 'react'
import ColorSwatch from './ColorSwatch'
import HistorySidebar from './HistorySidebar'
import { formatColor } from '../utils/colorHelpers'
import { fetchAIPalette } from '../utils/api'
import { useApp } from '../context/AppContext'

export default function PaletteStudio({
  generatePalette,
  currentColors,
  setCurrentColors,
  colorFormat,
  setColorFormat,
  history,
  restoreFromHistory,
  clearHistory,
  savePalette,
  openNameModal,
  openModal,
  showToast,
}) {
  const gridRef = useRef(null)
  const [apiLoading, setApiLoading] = useState(false)
  const { dismissToast } = useApp()

  // Keyboard shortcuts: G = generate, C = copy first colour, Esc = dismiss toast
  useEffect(() => {
    const handler = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return

      if (e.key.toLowerCase() === 'g') {
        e.preventDefault()
        generatePalette() // shows its own "New palette generated!" toast
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault()
        const firstHex = gridRef.current?.querySelector('.palette-hex')?.dataset.hex
        if (!firstHex) {
          showToast('⚠️ Generate a palette first', 'warning')
          return
        }
        if (!navigator.clipboard?.writeText) {
          showToast('⚠️ Clipboard not available in this browser', 'warning')
          return
        }
        navigator.clipboard.writeText(firstHex)
          .then(() => showToast(`✅ ${firstHex} Copied!`, 'success'))
          .catch(() => showToast('⚠️ Copy failed', 'warning'))
      } else if (e.key === 'Escape') {
        // Go through React state (not a raw DOM tweak) so the toast's
        // show/hide lifecycle always stays in sync and can't get stuck.
        dismissToast()
        showToast('👋 Dismissed', 'info')
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [generatePalette, showToast, dismissToast])

  const handleAPIGenerate = async () => {
    setApiLoading(true)
    try {
      const colors = await fetchAIPalette()
      setCurrentColors(colors)
      showToast('✅ Colormind palette loaded!', 'success')
    } catch (err) {
      showToast(`⚠️ API failed: ${err.message}. Using local palette instead.`, 'warning')
      generatePalette()
    } finally {
      setApiLoading(false)
    }
  }

  return (
    <div className="studio-section">
      <div className="section-header">
        <h2>🎨 Live <span className="gradient-text">Palette Studio</span></h2>
        <p className="section-subtitle">Generate random colors, copy hex codes, and get inspired!</p>
      </div>

      <div className="studio-layout">
        <div className="studio-main">
          <div className="studio-toolbar">
            <button
              className="cta-primary generate-btn"
              onClick={generatePalette}
              style={{ border: 'none', cursor: 'pointer' }}
            >
              <i className="fas fa-dice"></i> Generate Random Palette
            </button>

            <button
              className="cta-primary"
              onClick={handleAPIGenerate}
              disabled={apiLoading}
              style={{
                border: 'none',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #06B6D4, #8B5CF6)',
                padding: '16px 28px',
                borderRadius: '50px',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                color: 'white',
                fontSize: '0.95rem',
              }}
            >
              <i className="fas fa-cloud"></i>
              {apiLoading ? 'Loading API...' : 'Generate from API'}
            </button>

            <div className="format-toggle">
              {['hex', 'rgb', 'hsl'].map((f) => (
                <button
                  key={f}
                  className={`format-btn ${colorFormat === f ? 'active' : ''}`}
                  onClick={() => setColorFormat(f)}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="palette-grid" ref={gridRef}>
            {currentColors.length === 0 ? (
              <div className="palette-placeholder">
                <i className="fas fa-paint-brush"></i>
                <p>Click the button above to generate colors</p>
              </div>
            ) : (
              <div className="studio-preview-wrapper">
                <div className="palette-swatch-row">
                  {currentColors.map((hex, idx) => (
                    <div className="palette-color-item" key={idx}>
                      <ColorSwatch
                        hex={hex}
                        showToast={showToast}
                        size=""
                        className="preview-swatch"
                        onClick={() => openModal(hex)}
                      />
                      <span
                        className="palette-hex"
                        data-hex={hex}
                        onClick={() =>
                          navigator.clipboard?.writeText(hex).then(() =>
                            showToast(`✅ ${hex} Copied!`)
                          )
                        }
                      >
                        {formatColor(hex, colorFormat)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="kbd-hint">
            <span><kbd>G</kbd> Generate</span>
            <span><kbd>C</kbd> Copy first color</span>
            <span><kbd>Esc</kbd> Dismiss toast</span>
          </div>
        </div>

        <HistorySidebar
          history={history}
          restoreFromHistory={restoreFromHistory}
          clearHistory={clearHistory}
          showToast={showToast}
        />
      </div>
    </div>
  )
}
