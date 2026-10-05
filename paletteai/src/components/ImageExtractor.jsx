import React, { useState, useRef } from 'react'
import { extractColorsFromImage, loadImageFile } from '../utils/extractColors'
import ColorSwatch from './ColorSwatch'

export default function ImageExtractor({ onSave, openModal, showToast }) {
  const [preview, setPreview]   = useState(null)
  const [colors, setColors]     = useState([])
  const [loading, setLoading]   = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const processFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      showToast?.('⚠️ Please choose an image file', 'warning')
      return
    }
    setLoading(true)
    try {
      const img = await loadImageFile(file)
      setPreview(img.src)
      const extracted = extractColorsFromImage(img, 6)
      setColors(extracted)
    } catch {
      showToast?.('⚠️ Could not read that image', 'warning')
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    processFile(e.dataTransfer.files?.[0])
  }

  return (
    <div className="image-extractor-wrap">
      <div className="section-header" style={{ marginBottom: 18 }}>
        <h3>🖼️ Extract a Palette from <span className="gradient-text">Any Photo</span></h3>
        <p className="section-subtitle">Upload an image and pull its dominant colors automatically.</p>
      </div>

      <div
        className={`image-drop-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Uploaded preview" className="image-drop-preview" />
        ) : (
          <>
            <i className="fas fa-cloud-upload-alt"></i>
            <p>Click or drag an image here</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => processFile(e.target.files?.[0])}
        />
      </div>

      {loading && <p className="color-search-status">🎨 Extracting colors...</p>}

      {colors.length > 0 && !loading && (
        <div className="extracted-palette">
          <div className="extracted-swatches">
            {colors.map((hex, i) => (
              <ColorSwatch
                key={i}
                hex={hex}
                showToast={showToast}
                size=""
                className="preview-swatch"
                onClick={() => openModal?.(hex)}
              />
            ))}
          </div>
          <button className="cta-secondary" onClick={() => onSave?.(colors)}>
            💾 Save This Palette
          </button>
        </div>
      )}
    </div>
  )
}
