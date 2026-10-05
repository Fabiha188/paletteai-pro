import React, { useState, useEffect, useMemo } from 'react'
import ColorSwatch from './ColorSwatch'
import ColorWheel from './ColorWheel'
import {
  hslToHex, hexToHsl, generateHarmoniousPalette,
  HARMONY_RULES, getHarmonyColors, getHarmonyHues,
  isValidHex, normalizeHex,
} from '../utils/colorHelpers'
import { fetchAIPalette } from '../utils/api'
import { useApp } from '../context/AppContext'

export default function StudioPro() {
  const {
    colorFormat,
    setColorFormat,
    savePalette,
    openNameModal,
    showToastMessage: showToast,
    addToHistory,
    currentColors,
    setCurrentColors,
  } = useApp()

  const [hue, setHue]     = useState(270)
  const [sat, setSat]     = useState(100)
  const [light, setLight] = useState(50)
  const [hex, setHex]     = useState('#8B5CF6')
  const [bgColor, setBgColor]   = useState('#0A0B14')
  const [textColor, setTextColor] = useState('#F1F5F9')
  const [contrastRatio, setContrastRatio] = useState('21:1 (AAA)')
  const [generatedColors, setGeneratedColors] = useState([])
  const [apiLoading, setApiLoading] = useState(false)
  const [dragIndex, setDragIndex] = useState(null)
  const [harmonyRule, setHarmonyRule] = useState('complementary')
  const [hexInput, setHexInput] = useState('#8B5CF6')
  const [hexInputError, setHexInputError] = useState(false)
  const [bgHexInput, setBgHexInput] = useState('#0A0B14')
  const [textHexInput, setTextHexInput] = useState('#F1F5F9')
  const [lastGenerator, setLastGenerator] = useState(null) // 'ai' | 'api' — powers the regenerate button

  // Colours + wheel markers for the currently selected harmony rule —
  // recomputed only when the base colour or rule actually changes.
  const harmonyColors = useMemo(
    () => getHarmonyColors(harmonyRule, hue, sat, light),
    [harmonyRule, hue, sat, light]
  )
  const harmonyHues = useMemo(
    () => getHarmonyHues(harmonyRule, hue),
    [harmonyRule, hue]
  )

  // Keep hex in sync whenever the sliders move
  useEffect(() => {
    const next = hslToHex(hue, sat, light)
    setHex(next)
    setHexInput(next)
  }, [hue, sat, light])

  // If a palette was loaded from a shared link (see App.jsx), pick it up
  // here and show it in the preview — without auto-triggering a save.
  useEffect(() => {
    if (currentColors.length) {
      setGeneratedColors(currentColors)
      setHue(hexToHsl(currentColors[0]).h)
      setSat(hexToHsl(currentColors[0]).s)
      setLight(hexToHsl(currentColors[0]).l)
      setHex(currentColors[0])
      setCurrentColors([]) // consume it so it doesn't reload on re-mount
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update the sliders when the user types a hex value directly
  const updateFromHex = (newHex) => {
    const hsl = hexToHsl(newHex)
    setHue(hsl.h)
    setSat(hsl.s)
    setLight(hsl.l)
    setHex(newHex)
    setHexInput(newHex)
  }

  // Commits whatever's in the hex text field — used on Enter/blur.
  // Invalid input just flashes an error state instead of crashing.
  const commitHexInput = () => {
    if (isValidHex(hexInput)) {
      setHexInputError(false)
      updateFromHex(normalizeHex(hexInput))
    } else {
      setHexInputError(true)
    }
  }

  // Same idea for the contrast checker's background/text hex fields —
  // invalid input just reverts to the last good colour, no error UI
  // needed since these are secondary controls.
  const commitBgHex = () => {
    if (isValidHex(bgHexInput)) { const h = normalizeHex(bgHexInput); setBgColor(h); setBgHexInput(h) }
    else setBgHexInput(bgColor)
  }
  const commitTextHex = () => {
    if (isValidHex(textHexInput)) { const h = normalizeHex(textHexInput); setTextColor(h); setTextHexInput(h) }
    else setTextHexInput(textColor)
  }

  // Calculate the WCAG relative luminance for a hex colour
  const getLuminance = (color) => {
    const r = parseInt(color.slice(1, 3), 16) / 255
    const g = parseInt(color.slice(3, 5), 16) / 255
    const b = parseInt(color.slice(5, 7), 16) / 255
    const lin = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  }

  // Recalculate the contrast ratio whenever bg or text colour changes
  useEffect(() => {
    const l1 = getLuminance(bgColor)
    const l2 = getLuminance(textColor)
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)

    let grade = 'Fail'
    if (ratio >= 7)        grade = 'AAA (Excellent)'
    else if (ratio >= 4.5) grade = 'AA (Good)'
    else if (ratio >= 3)   grade = 'AA Large (Pass)'

    setContrastRatio(`${ratio.toFixed(2)}:1 — ${grade}`)
  }, [bgColor, textColor])

  // Preview a generated palette, add it to history, then prompt for a name.
  // `regenerateFn`, if given, lets the naming modal swap in a fresh
  // palette (via its "Try Another" button) without closing.
  const applyColors = (colors, regenerateFn = null) => {
    setGeneratedColors(colors)
    setHex(colors[0])
    updateFromHex(colors[0])
    addToHistory(colors)
    openNameModal(colors, (name, finalColors) => {
      // finalColors reflects whatever's on screen *now* — matters once
      // "Try Another" has swapped the original colors out.
      savePalette(finalColors || colors, name)
      showToast('✅ Palette saved!', 'success')
    }, regenerateFn)
  }

  // Generates a fresh AI-style palette, updates the studio preview, and
  // returns the new colours — used both by the button and by the naming
  // modal's "Try Another" action.
  const regenerateAI = () => {
    const colors = generateHarmoniousPalette(5)
    setGeneratedColors(colors)
    setHex(colors[0])
    updateFromHex(colors[0])
    addToHistory(colors)
    return colors
  }

  const handleAISuggest = () => { setLastGenerator('ai'); applyColors(regenerateAI(), regenerateAI) }

  // Reorders the generated palette when a swatch is dragged onto another
  const handleReorder = (dropIndex) => {
    if (dragIndex === null || dragIndex === dropIndex) return
    setGeneratedColors((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(dropIndex, 0, moved)
      return next
    })
    setDragIndex(null)
  }

  // Same idea as regenerateAI, but hits the Colormind API — with a
  // graceful local fallback if the API call fails on a retry too.
  const regenerateAPI = async () => {
    try {
      const colors = await fetchAIPalette()
      setGeneratedColors(colors)
      setHex(colors[0])
      updateFromHex(colors[0])
      addToHistory(colors)
      return colors
    } catch (err) {
      showToast(`⚠️ API failed: ${err.message}. Using local instead.`, 'warning')
      return regenerateAI()
    }
  }

  const handleAPIGenerate = async () => {
    setLastGenerator('api')
    setApiLoading(true)
    try {
      const colors = await fetchAIPalette()
      applyColors(colors, regenerateAPI)
      showToast('✅ Colormind palette loaded!', 'success')
    } catch (err) {
      showToast(`⚠️ API failed: ${err.message}. Using local palette.`, 'warning')
      handleAISuggest()
    } finally {
      setApiLoading(false)
    }
  }

  return (
    <div className="studio-pro-content" style={{ paddingTop: '60px' }}>
      <div className="section-header">
        <h2>🔬 <span className="gradient-text">Studio Pro</span></h2>
        <p className="section-subtitle">Advanced color tools, HSL controls, and AI generation.</p>
      </div>

      <div className="studio-pro-grid">
        {/* Left — HSL colour picker */}
        <div className="color-picker-box">
          <h4>🎨 Color Picker</h4>

          <ColorWheel
            hue={hue}
            sat={sat}
            light={light}
            harmonyHues={harmonyHues}
            onChange={(h, s) => { setHue(h); setSat(s) }}
          />

          <input
            type="text"
            className={`hex-input-field ${hexInputError ? 'error' : ''}`}
            value={hexInput}
            spellCheck={false}
            onChange={(e) => { setHexInput(e.target.value); setHexInputError(false) }}
            onBlur={commitHexInput}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitHexInput() } }}
            placeholder="#8B5CF6"
            aria-label="Type an exact hex color code"
          />

          <div className="slider-group">
            <label>Hue <span>{hue}</span></label>
            <input type="range" min="0" max="360" value={hue}
              onChange={(e) => setHue(parseInt(e.target.value))} />

            <label>Saturation <span>{sat}%</span></label>
            <input type="range" min="0" max="100" value={sat}
              onChange={(e) => setSat(parseInt(e.target.value))} />

            <label>Lightness <span>{light}%</span></label>
            <input type="range" min="0" max="100" value={light}
              onChange={(e) => setLight(parseInt(e.target.value))} />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '10px' }}>
            <span style={{ background: 'var(--bg-input)', padding: '4px 12px', borderRadius: '30px', fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {hex}
            </span>
            <button
              className="cta-primary"
              style={{ padding: '8px 20px', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
              onClick={() =>
                openNameModal([hex], (name) => {
                  savePalette([hex], name)
                  showToast('✅ Palette saved!')
                })
              }
            >
              <i className="fas fa-heart"></i> Save Palette
            </button>
            <button
              className="cta-secondary"
              style={{ padding: '8px 20px', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
              onClick={handleAISuggest}
            >
              <i className="fas fa-robot"></i> AI Suggest
            </button>
            <button
              className="cta-primary"
              style={{ padding: '8px 20px', fontSize: '0.9rem', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #06B6D4, #8B5CF6)' }}
              onClick={handleAPIGenerate}
              disabled={apiLoading}
            >
              <i className="fas fa-cloud"></i> {apiLoading ? 'Loading...' : 'API Generate'}
            </button>
          </div>
        </div>

        {/* Right — generated palette preview + contrast checker */}
        <div className="color-picker-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', position: 'relative' }}>
            <h4 style={{ margin: 0 }}>🧪 Generated Palette</h4>
            {generatedColors.length > 0 && lastGenerator && (
              <button
                className="regenerate-btn"
                onClick={lastGenerator === 'api' ? handleAPIGenerate : handleAISuggest}
                disabled={apiLoading}
                title="Not feeling it? Generate another one"
                aria-label="Regenerate palette"
              >
                <i className={`fas fa-rotate ${apiLoading ? 'fa-spin' : ''}`}></i>
              </button>
            )}
          </div>

          {generatedColors.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Use the buttons above to generate a palette and preview it here.
            </p>
          ) : (
            <>
              <p className="drag-hint"><i className="fas fa-arrows-up-down-left-right"></i> Drag swatches to reorder</p>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {generatedColors.map((color, i) => (
                  <div
                    key={`${color}-${i}`}
                    draggable
                    className={`draggable-swatch-wrap ${dragIndex === i ? 'dragging' : ''}`}
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleReorder(i)}
                    onDragEnd={() => setDragIndex(null)}
                  >
                    <ColorSwatch hex={color} showToast={showToast} size="large" className="generated-swatch" />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {generatedColors.map((color, i) => (
                  <span key={i} style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '999px', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    {color}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Contrast checker */}
          <div className="contrast-box" style={{ marginTop: '24px' }}>
            <div style={{ background: bgColor, color: textColor, padding: '20px', borderRadius: '16px', border: '1px solid var(--border-dark)', flex: 1 }}>
              Background
            </div>
            <div style={{ background: textColor, color: bgColor, padding: '20px', borderRadius: '16px', border: '1px solid var(--border-dark)', flex: 1 }}>
              Text Color
            </div>
          </div>

          <div style={{ marginTop: '16px', fontWeight: '600' }}>{contrastRatio}</div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: bgColor, border: '1px solid var(--border-dark)', flexShrink: 0 }} />
              <input
                type="text"
                className="hex-input-field small"
                value={bgHexInput}
                spellCheck={false}
                onChange={(e) => setBgHexInput(e.target.value)}
                onBlur={commitBgHex}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitBgHex() } }}
                aria-label="Background hex color"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: textColor, border: '1px solid var(--border-dark)', flexShrink: 0 }} />
              <input
                type="text"
                className="hex-input-field small"
                value={textHexInput}
                spellCheck={false}
                onChange={(e) => setTextHexInput(e.target.value)}
                onBlur={commitTextHex}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitTextHex() } }}
                aria-label="Text hex color"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Harmony rules — turns the wheel's base colour into a colour-theory-backed scheme */}
      <div className="color-picker-box harmony-box">
        <h4>🧭 Harmony Rules</h4>
        <p className="section-subtitle" style={{ fontSize: '0.95rem', marginBottom: '20px' }}>
          Pick a rule and the wheel lights up the matching hues for <span style={{ fontFamily: 'monospace' }}>{hex}</span>.
        </p>

        <div className="harmony-rule-list">
          {Object.entries(HARMONY_RULES).map(([key, def]) => (
            <button
              key={key}
              type="button"
              className={`harmony-pill ${harmonyRule === key ? 'active' : ''}`}
              onClick={() => setHarmonyRule(key)}
            >
              {def.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', margin: '20px 0' }}>
          {harmonyColors.map((color, i) => (
            <ColorSwatch key={`${harmonyRule}-${color}-${i}`} hex={color} showToast={showToast} size="large" />
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px' }}>
          {harmonyColors.map((color, i) => (
            <span key={i} style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '999px', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-main)' }}>
              {color}
            </span>
          ))}
        </div>

        <button className="cta-primary" style={{ border: 'none', cursor: 'pointer' }} onClick={() => applyColors(harmonyColors)}>
          <i className="fas fa-layer-group"></i> Use as Palette
        </button>
      </div>
    </div>
  )
}
