import React from 'react'
import ColorSwatch from './ColorSwatch'

export default function PaletteCard({ palette, onOpenColor = () => {}, onSave = () => {}, showToast }) {
  return (
    <div className="explore-card visible">
      <div className="explore-preview">
        {palette.colors.map((hex, i) => (
          <ColorSwatch
            key={i}
            hex={hex}
            showToast={showToast}
            size=""
            className="preview-swatch"
            onClick={() => onOpenColor(hex)}
          />
        ))}
      </div>
      <div className="explore-tags">
        <span className="explore-tag">{palette.style}</span>
        {palette.ruleLabel && (
          <span className="explore-tag explore-tag-rule">
            <i className="fas fa-compass"></i> {palette.ruleLabel}
          </span>
        )}
      </div>
      <div style={{ marginTop: 10 }}>
        <button className="cta-secondary" onClick={() => onSave(palette.colors)}>
          💾 Save All
        </button>
      </div>
    </div>
  )
}
