import React from 'react'

// A small coloured button. Clicking it copies the hex code to clipboard
// and optionally calls an onClick handler (e.g. to open the colour modal).
export default function ColorSwatch({ hex, onClick, showToast, style = {}, size = 'small', className = '' }) {
  const handleClick = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard?.writeText(hex)
      showToast?.(`✅ ${hex} copied!`, 'success')
    } catch {
      showToast?.('⚠️ Copy failed', 'warning')
    }
    onClick?.(hex)
  }

  return (
    <button
      type="button"
      className={`color-swatch-button ${size} ${className}`.trim()}
      onClick={handleClick}
      data-tooltip={hex}
      aria-label={`Copy ${hex}`}
      style={{ background: hex, ...style }}
    />
  )
}
