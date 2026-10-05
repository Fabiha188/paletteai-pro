import React, { useState, useEffect, useRef } from 'react'
import { fetchColorInfo } from '../utils/api'
import { isValidHex, normalizeHex } from '../utils/colorHelpers'

/*
  A universal colour search. Unlike the palette search above, this isn't
  limited to colours already in our dataset — paste ANY hex code (any colour
  that exists) and it live-looks-up the real-world name via The Color API.
*/
export default function ColorSearch({ onOpenColor, onSave, showToast }) {
  const [input, setInput]     = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const debounceRef = useRef(null)

  useEffect(() => {
    clearTimeout(debounceRef.current)
    setError('')

    if (!input.trim()) {
      setResult(null)
      return
    }

    if (!isValidHex(input)) {
      setResult(null)
      setError('Enter a valid hex code, e.g. #FF6B6B')
      return
    }

    const hex = normalizeHex(input)
    debounceRef.current = setTimeout(() => {
      setLoading(true)
      fetchColorInfo(hex)
        .then((info) => {
          setResult({ ...info, hex })
          setLoading(false)
        })
        .catch(() => {
          // Still show the swatch even if the naming API is unreachable
          setResult({ hex, name: hex, rgb: '', hsl: '', contrast: '' })
          setLoading(false)
        })
    }, 350)

    return () => clearTimeout(debounceRef.current)
  }, [input])

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text')
    if (pasted) setInput(pasted)
  }

  return (
    <div className="color-search-wrap">
      <div className="section-header" style={{ marginBottom: 18 }}>
        <h3>🔎 Find <span className="gradient-text">Any Color</span></h3>
        <p className="section-subtitle">Paste any hex code that exists — see its real-world name instantly.</p>
      </div>

      <div className="explore-search color-search-input">
        <i className="fas fa-hashtag"></i>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={handlePaste}
          placeholder="Paste a hex code, e.g. #FF6B6B"
          spellCheck={false}
        />
        {input && (
          <button className="clear-search" onClick={() => setInput('')}>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {error && <p className="color-search-error">{error}</p>}

      {loading && (
        <p className="color-search-status">🔍 Looking up that color...</p>
      )}

      {result && !loading && (
        <div className="color-search-result">
          <div
            className="color-search-swatch"
            style={{ background: result.hex }}
            onClick={() => onOpenColor?.(result.hex)}
            title="View full details"
          />
          <div className="color-search-info">
            <div className="color-search-name">{result.name || result.hex}</div>
            <div className="color-search-hex">{result.hex}</div>
            {(result.rgb || result.hsl) && (
              <div className="color-search-meta">
                {result.rgb && <span>{result.rgb}</span>}
                {result.hsl && <span>{result.hsl}</span>}
              </div>
            )}
          </div>
          <button
            className="cta-secondary color-search-save"
            onClick={() => onSave?.([result.hex])}
          >
            💾 Save
          </button>
        </div>
      )}
    </div>
  )
}
