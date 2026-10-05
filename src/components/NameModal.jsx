import React, { useState, useEffect, useRef } from 'react'
import ColorSwatch from './ColorSwatch'

export default function NameModal({ isOpen, colors = [], onClose, onConfirm, onRegenerate, regenerating, showToast }) {
  const [name, setName] = useState('')
  const inputRef = useRef(null)

  // Pre-fill the name field with a timestamp when the modal opens
  useEffect(() => {
    if (!isOpen) return
    setName(`Palette #${new Date().toLocaleTimeString()}`)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [isOpen])

  const handleConfirm = () => {
    onConfirm(name.trim() || `Palette #${Date.now().toString().slice(-4)}`)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose}>&times;</button>

        <h3><i className="fas fa-tag"></i> Name This Palette</h3>

        {colors.length > 0 && (
          <div className={`modal-color-preview ${regenerating ? 'is-regenerating' : ''}`}>
            {colors.map((hex, i) => (
              <ColorSwatch key={`${hex}-${i}`} hex={hex} showToast={showToast} size="small" />
            ))}
          </div>
        )}

        {onRegenerate && (
          <button
            type="button"
            className="try-another-btn"
            onClick={onRegenerate}
            disabled={regenerating}
          >
            <i className={`fas fa-shuffle ${regenerating ? 'fa-spin' : ''}`}></i>
            {regenerating ? 'Generating...' : 'Not feeling it? Try Another'}
          </button>
        )}

        <input
          ref={inputRef}
          type="text"
          className="name-input"
          placeholder="e.g. Sunset Vibes"
          maxLength="40"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirm()
            if (e.key === 'Escape') onClose()
          }}
        />

        <button className="cta-primary" onClick={handleConfirm}>
          <i className="fas fa-check"></i> Save Palette
        </button>
      </div>
    </div>
  )
}
