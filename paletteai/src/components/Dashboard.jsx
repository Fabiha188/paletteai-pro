import React, { useState, useMemo } from 'react'
import SearchBar from './SearchBar'
import ColorSwatch from './ColorSwatch'
import ColorDistributionChart from './ColorDistributionChart'
import { downloadPaletteJSON, downloadPalettePNG, paletteToCSS, paletteToTailwind } from '../utils/exportPalette'
import { buildShareUrl } from '../utils/shareLink'
import { useApp } from '../context/AppContext'

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
  { id: 'name',   label: 'Name (A–Z)' },
  { id: 'colors', label: 'Most colors' },
]

export default function Dashboard() {
  const {
    savedPalettes,
    deletePalette,
    renamePalette,
    clearAllPalettes,
    openModal,
    showToastMessage: showToast,
  } = useApp()

  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId]   = useState(null)
  const [editingName, setEditingName] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())

  const filtered = useMemo(() => {
    const list = savedPalettes.filter(p =>
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    // savedPalettes is stored oldest → newest (insertion order)
    const sorted = [...list]
    switch (sortBy) {
      case 'newest': sorted.reverse(); break
      case 'oldest': break // already oldest-first
      case 'name':   sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break
      case 'colors': sorted.sort((a, b) => b.colors.length - a.colors.length); break
      default: break
    }
    return sorted
  }, [savedPalettes, searchTerm, sortBy])

  const startRename = (p) => {
    setEditingId(p.id)
    setEditingName(p.name)
  }

  const confirmRename = (id) => {
    if (editingName.trim()) renamePalette(id, editingName.trim())
    setEditingId(null)
    setEditingName('')
  }

  const cancelRename = () => {
    setEditingId(null)
    setEditingName('')
  }

  const toggleSelectMode = () => {
    setSelectMode((v) => !v)
    setSelectedIds(new Set())
  }

  const toggleSelected = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const bulkDelete = () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} selected palette(s)?`)) return
    selectedIds.forEach((id) => deletePalette(id))
    setSelectedIds(new Set())
    setSelectMode(false)
  }

  const bulkExport = () => {
    if (selectedIds.size === 0) return
    const selected = savedPalettes.filter((p) => selectedIds.has(p.id))
    downloadPaletteJSON({ name: 'selected-palettes', palettes: selected })
    showToast(`⬇️ Exported ${selected.length} palette(s) as JSON!`)
  }

  return (
    <div className="dashboard-content" style={{ paddingTop: '60px' }}>
      <div className="section-header">
        <h2>Your <span className="gradient-text">Saved Palettes</span></h2>
        <p className="section-subtitle">All your favorite colors, stored in one place.</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="num">{savedPalettes.length}</div>
          <div className="label">Total Palettes</div>
        </div>
        <div className="stat-card">
          <div className="num">{savedPalettes.reduce((acc, p) => acc + p.colors.length, 0)}</div>
          <div className="label">Colors Saved</div>
        </div>
        <button className={`btn-clear-all ${selectMode ? 'active' : ''}`} onClick={toggleSelectMode}>
          <i className="fas fa-check-double"></i> {selectMode ? 'Cancel Select' : 'Select'}
        </button>
        <button className="btn-clear-all" onClick={clearAllPalettes}>
          <i className="fas fa-trash-alt"></i> Clear All
        </button>
      </div>

      <ColorDistributionChart palettes={savedPalettes} />

      {selectMode && (
        <div className="bulk-actions-bar">
          <span>{selectedIds.size} selected</span>
          <button className="export-btn" onClick={bulkExport} disabled={selectedIds.size === 0}>
            <i className="fas fa-file-code"></i> Export Selected
          </button>
          <button className="export-btn danger" onClick={bulkDelete} disabled={selectedIds.size === 0}>
            <i className="fas fa-trash-alt"></i> Delete Selected
          </button>
        </div>
      )}

      <div className="dashboard-toolbar">
        <div className="dashboard-search-wrap">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search saved palettes by name..."
          />
        </div>
        <div className="dashboard-sort">
          <label htmlFor="sortBy"><i className="fas fa-arrow-down-wide-short"></i></label>
          <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="explore-grid">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-heart"></i>
            <p>
              {savedPalettes.length === 0
                ? 'No saved palettes yet. Go to Explore and generate some!'
                : 'No palettes match your search.'}
            </p>
          </div>
        ) : (
          filtered.map((p) => (
            <div className={`explore-card visible ${selectedIds.has(p.id) ? 'selected' : ''}`} key={p.id}>

              {selectMode && (
                <label className="select-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleSelected(p.id)}
                  />
                </label>
              )}

              {/* Palette name sits above the swatches */}
              {editingId === p.id ? (
                <div style={{ marginBottom: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter')  confirmRename(p.id)
                      if (e.key === 'Escape') cancelRename()
                    }}
                    autoFocus
                    style={{
                      flex: 1, padding: '6px 10px', borderRadius: '8px',
                      border: '1px solid var(--primary)', background: 'var(--bg-card)',
                      color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => confirmRename(p.id)}
                    title="Save name"
                    style={{ background: 'var(--primary)', border: 'none', borderRadius: '8px', color: '#fff', padding: '6px 10px', cursor: 'pointer' }}
                  >
                    <i className="fas fa-check"></i>
                  </button>
                  <button
                    onClick={cancelRename}
                    title="Cancel"
                    style={{ background: 'transparent', border: '1px solid var(--border-dark)', borderRadius: '8px', color: 'var(--text-muted)', padding: '6px 10px', cursor: 'pointer' }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ) : (
                <div
                  style={{ fontWeight: 700, marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  title="Click to rename"
                  onClick={() => startRename(p)}
                >
                  {p.name}
                  <i className="fas fa-pencil-alt" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.7 }}></i>
                </div>
              )}

              {/* Colour swatches */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {p.colors.map((hex, i) => (
                  <ColorSwatch
                    key={i}
                    hex={hex}
                    showToast={showToast}
                    size="small"
                    onClick={() => openModal(hex)}
                  />
                ))}
              </div>

              {/* Export options */}
              <div className="export-row">
                <button
                  className="export-btn"
                  title="Copy as CSS variables"
                  onClick={() => {
                    navigator.clipboard?.writeText(paletteToCSS(p)).then(() =>
                      showToast('✅ CSS variables copied!')
                    )
                  }}
                >
                  <i className="fas fa-code"></i> CSS
                </button>
                <button
                  className="export-btn"
                  title="Copy as Tailwind config"
                  onClick={() => {
                    navigator.clipboard?.writeText(paletteToTailwind(p)).then(() =>
                      showToast('✅ Tailwind config copied!')
                    )
                  }}
                >
                  <i className="fas fa-wind"></i> Tailwind
                </button>
                <button
                  className="export-btn"
                  title="Download as JSON"
                  onClick={() => { downloadPaletteJSON(p); showToast('⬇️ JSON downloaded!') }}
                >
                  <i className="fas fa-file-code"></i> JSON
                </button>
                <button
                  className="export-btn"
                  title="Download as PNG image"
                  onClick={() => { downloadPalettePNG(p); showToast('⬇️ PNG downloaded!') }}
                >
                  <i className="fas fa-image"></i> PNG
                </button>
                <button
                  className="export-btn"
                  title="Copy a shareable link"
                  onClick={() => {
                    navigator.clipboard?.writeText(buildShareUrl(p.colors)).then(() =>
                      showToast('🔗 Share link copied!')
                    )
                  }}
                >
                  <i className="fas fa-link"></i> Share
                </button>
              </div>

              {/* Delete button */}
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}>
                <button
                  style={{ background: 'transparent', border: 'none', color: 'var(--pinkish)', cursor: 'pointer', fontSize: '1.2rem' }}
                  onClick={() => deletePalette(p.id)}
                  title="Delete palette"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  )
}
