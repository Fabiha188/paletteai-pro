import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function CommandPalette() {
  const {
    commandPaletteOpen: open,
    setCommandPaletteOpen: setOpen,
    toggleTheme,
    generatePalette,
    savedPalettes,
    openModal,
    showToastMessage,
  } = useApp()

  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  // Global Ctrl/Cmd+K to toggle, Escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setOpen])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  const staticCommands = useMemo(() => ([
    { id: 'home',      label: 'Go to Home',           icon: 'fa-house',              action: () => navigate('/') },
    { id: 'dashboard', label: 'Go to Dashboard',       icon: 'fa-table-columns',      action: () => navigate('/dashboard') },
    { id: 'studio',    label: 'Go to Studio Pro',      icon: 'fa-flask',              action: () => navigate('/studio') },
    { id: 'explore',   label: 'Go to Explore',         icon: 'fa-compass',            action: () => navigate('/explore') },
    { id: 'pricing',   label: 'Go to Pricing',         icon: 'fa-gem',                action: () => navigate('/pricing') },
    { id: 'gradient',  label: 'Open Gradient Maker',   icon: 'fa-fill-drip',          action: () => navigate('/gradient') },
    {
      id: 'generate', label: 'Generate a New AI Palette', icon: 'fa-robot',
      action: () => { navigate('/studio'); generatePalette(); showToastMessage('✨ New palette generated!') },
    },
    { id: 'theme', label: 'Toggle Light / Dark Theme', icon: 'fa-circle-half-stroke', action: toggleTheme },
    { id: 'help',  label: 'Open Help Center',          icon: 'fa-circle-question',    action: () => navigate('/help') },
  ]), [navigate, generatePalette, toggleTheme, showToastMessage])

  const paletteCommands = useMemo(() => savedPalettes.slice(0, 20).map((p) => ({
    id: `palette-${p.id}`,
    label: `Open saved palette "${p.name}"`,
    swatch: p.colors[0],
    action: () => { navigate('/dashboard'); openModal(p.colors[0]) },
  })), [savedPalettes, navigate, openModal])

  const allCommands = [...staticCommands, ...paletteCommands]
  const filtered = query.trim()
    ? allCommands.filter((c) => c.label.toLowerCase().includes(query.trim().toLowerCase()))
    : allCommands

  const runCommand = (cmd) => {
    cmd.action()
    setOpen(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && filtered[activeIndex]) runCommand(filtered[activeIndex])
  }

  if (!open) return null

  return (
    <div className="command-palette-overlay" onClick={() => setOpen(false)}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-palette-input-row">
          <i className="fas fa-magnifying-glass"></i>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, or search your saved palettes..."
          />
          <kbd>Esc</kbd>
        </div>

        <div className="command-palette-list">
          {filtered.length === 0 && (
            <div className="command-palette-empty">No matching commands.</div>
          )}
          {filtered.map((cmd, i) => (
            <div
              key={cmd.id}
              className={`command-palette-item ${i === activeIndex ? 'active' : ''}`}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => runCommand(cmd)}
            >
              {cmd.swatch
                ? <span className="command-swatch" style={{ background: cmd.swatch }} />
                : <i className={`fas ${cmd.icon}`}></i>}
              <span>{cmd.label}</span>
            </div>
          ))}
        </div>

        <div className="command-palette-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
          <span><kbd>Enter</kbd> Select</span>
          <span><kbd>Ctrl</kbd>+<kbd>K</kbd> Toggle</span>
        </div>
      </div>
    </div>
  )
}
