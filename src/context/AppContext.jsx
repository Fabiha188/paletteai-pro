import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useCloudPalettes } from '../hooks/useCloudPalettes'
import { generateHarmoniousPalette } from '../utils/colorHelpers'

const AppContext = createContext(null)

/*
  Holds all app-wide state (theme, saved palettes, history, the shared
  colour-detail modal, the "name this palette" modal, and toasts) so
  pages can pull what they need with `useApp()` instead of receiving
  a long chain of props from the root component.
*/
export function AppProvider({ children, storageSuffix = '', cloudUid = null }) {
  // Persisted state
  const [theme, setTheme]                 = useLocalStorage('theme', 'dark')
  const [savedPalettes, setSavedPalettes]  = useLocalStorage(`paletteai_saved${storageSuffix}`, [])
  const [history, setHistory]              = useLocalStorage(`paletteai_history${storageSuffix}`, [])
  const [colorFormat, setColorFormat]      = useLocalStorage('paletteai_format', 'hex')

  // In-memory state
  const [currentColors, setCurrentColors]     = useState([])
  const [modalColor, setModalColor]           = useState(null)
  const [showNameModal, setShowNameModal]     = useState(false)
  const [pendingColors, setPendingColors]     = useState([])
  const [pendingCallback, setPendingCallback] = useState(null)
  const [pendingRegenerate, setPendingRegenerate] = useState(null)
  const [regenerating, setRegenerating]       = useState(false)
  const [toastMsg, setToastMsg]     = useState('')
  const [toastType, setToastType]   = useState('info')
  const [showToast, setShowToast]   = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  const showToastMessage = useCallback((msg, type = 'info') => {
    setToastMsg(msg)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }, [])

  // Signed-in users (with Firebase configured) get palettes synced across devices
  useCloudPalettes(cloudUid, savedPalettes, setSavedPalettes, (msg) => showToastMessage(msg, 'error'))

  // Lets any component (e.g. the Esc keyboard shortcut) dismiss the toast
  // immediately through React state, instead of poking the DOM directly —
  // which could leave it stuck since React wouldn't know it was hidden.
  const dismissToast = useCallback(() => setShowToast(false), [])

  const addToHistory = useCallback((colors) => {
    const entry = {
      id: Date.now() + Math.random(),
      colors,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setHistory(prev => [entry, ...prev].slice(0, 10))
  }, [setHistory])

  const generatePalette = useCallback(() => {
    const colors = generateHarmoniousPalette(4)
    setCurrentColors(colors)
    addToHistory(colors)
    showToastMessage('🎲 New palette generated!')
  }, [addToHistory, showToastMessage])

  const savePalette = useCallback((colors, name) => {
    const finalName = (name && name.trim()) || `Palette ${savedPalettes.length + 1}`
    setSavedPalettes(prev => [
      ...prev,
      { id: Date.now() + Math.random(), colors, name: finalName, date: new Date().toLocaleDateString() },
    ])
    showToastMessage(`✅ "${finalName}" saved!`)
  }, [savedPalettes.length, setSavedPalettes, showToastMessage])

  const deletePalette = useCallback((id) => {
    setSavedPalettes(prev => prev.filter(p => p.id !== id))
    showToastMessage('🗑️ Palette deleted!')
  }, [setSavedPalettes, showToastMessage])

  const clearAllPalettes = useCallback(() => {
    if (confirm('⚠️ Delete ALL saved palettes?')) {
      setSavedPalettes([])
      showToastMessage('🗑️ All palettes cleared!')
    }
  }, [setSavedPalettes, showToastMessage])

  const renamePalette = useCallback((id, newName) => {
    setSavedPalettes(prev => prev.map(p => (p.id === id ? { ...p, name: newName.trim() || p.name } : p)))
    showToastMessage('✏️ Palette renamed!')
  }, [setSavedPalettes, showToastMessage])

  const openModal  = (hex) => setModalColor(hex)
  const closeModal = ()    => setModalColor(null)

  // `regenerateFn` is optional: when provided, the naming modal shows a
  // "Try Another" button that calls it to swap in a fresh palette without
  // closing the modal — so a disliked result doesn't mean starting over.
  const openNameModal = (colors, callback, regenerateFn = null) => {
    setPendingColors(colors)
    setPendingCallback(() => callback)
    setPendingRegenerate(() => regenerateFn)
    setShowNameModal(true)
  }

  const closeNameModal = () => {
    setShowNameModal(false)
    setPendingColors([])
    setPendingCallback(null)
    setPendingRegenerate(null)
  }

  const confirmNameModal = (name) => {
    // Pass the *current* pendingColors, not whatever was captured when the
    // modal first opened — matters once "Try Another" has swapped them out.
    pendingCallback?.(name, pendingColors)
    closeNameModal()
  }

  // Called by the "Try Another" button in the naming modal. Supports an
  // async regenerateFn (e.g. hitting the Colormind API again).
  const regeneratePending = async () => {
    if (!pendingRegenerate) return
    setRegenerating(true)
    try {
      const next = await pendingRegenerate()
      if (next?.length) setPendingColors(next)
    } finally {
      setRegenerating(false)
    }
  }

  const restoreFromHistory = (entry) => {
    setCurrentColors(entry.colors)
    showToastMessage('🔁 Palette restored from history!')
  }

  const clearHistory = () => {
    setHistory([])
    showToastMessage('🗑️ History cleared!')
  }

  const value = {
    theme, toggleTheme,
    savedPalettes, savePalette, deletePalette, clearAllPalettes, renamePalette,
    history, addToHistory, restoreFromHistory, clearHistory,
    colorFormat, setColorFormat,
    currentColors, setCurrentColors, generatePalette,
    modalColor, openModal, closeModal,
    showNameModal, pendingColors, openNameModal, closeNameModal, confirmNameModal,
    pendingRegenerate, regeneratePending, regenerating,
    toastMsg, toastType, showToast, showToastMessage, dismissToast,
    commandPaletteOpen, setCommandPaletteOpen,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// Custom hook for consuming the app context — throws a clear error
// if used outside the provider, instead of failing silently.
export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within an <AppProvider>')
  return ctx
}
