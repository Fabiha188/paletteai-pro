import React, { useState, useEffect, useRef, useCallback } from 'react'
import PaletteStudio from './PaletteStudio'
import PaletteCard from './PaletteCard'
import SearchBar from './SearchBar'
import ColorSearch from './ColorSearch'
import ImageExtractor from './ImageExtractor'
import { buildHarmonyPalette, classifyStyle } from '../utils/colorHelpers'
import { fetchPalettes } from '../utils/fetchPalettes'
import { useApp } from '../context/AppContext'

const STYLES = ['pastel', 'vibrant', 'dark', 'warm', 'cool', 'earthy', 'neon', 'muted']
const BATCH_SIZE = 6 // how many new palettes to generate per scroll/click

// Generates one batch of palettes whose colours are built from a real
// harmony rule (complementary/triadic/etc — so they *combine* well) with
// a contrast pass between neighbours (so they stay visually distinct).
// If `lockStyle` is given (user searched a style name), every palette in
// the batch uses it; otherwise styles cycle for variety.
function generateBatch(startIndex, lockStyle) {
  return Array.from({ length: BATCH_SIZE }, (_, i) => {
    const style = lockStyle || STYLES[(startIndex + i) % STYLES.length]
    const { colors, label } = buildHarmonyPalette(5, style)
    return {
      id: `gen-${Date.now()}-${startIndex + i}-${Math.random().toString(36).slice(2, 7)}`,
      name: `${style.charAt(0).toUpperCase() + style.slice(1)} · ${label}`,
      style,
      ruleLabel: label,
      colors,
    }
  })
}

export default function Explore() {
  const {
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
    showToastMessage: showToast,
  } = useApp()

  const [searchTerm, setSearchTerm] = useState('')
  const [allPalettes, setAllPalettes] = useState([])
  const [filtered, setFiltered] = useState([])
  const [lockedStyle, setLockedStyle] = useState(null) // style the search term matched, if any
  const [isHexSearch, setIsHexSearch] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const genCountRef = useRef(0)
  const sentinelRef = useRef(null)


  useEffect(() => {
    let active = true

    async function load() {
      // Fetches real, live-generated palettes from The Color API, and
      // merges them with the bundled local set. Falls back gracefully
      // to local-only data if the live call fails.
      const [live, localModule] = await Promise.all([
        fetchPalettes(),
        import('../api/palettes.json'),
      ])
      if (!active) return

      const local = localModule.default || localModule
      const data = [...live, ...local]

      const base = data.map((p, i) => ({
        id:     p.id    || i,
        name:   p.name  || p.style || `Palette ${i + 1}`,
        // Live API results come back tagged 'live' — reclassify by their
        // actual saturation/lightness so they count as real pastel /
        // vibrant / dark / etc results instead of hiding behind a
        // generic label that never matches a style search.
        style:  (!p.style || p.style === 'live') ? classifyStyle(p.colors) : p.style,
        colors: p.colors || buildHarmonyPalette(5).colors,
      }))

      // Shuffle so palettes of every style are interleaved from the very
      // first screen, instead of all-live-then-all-local in a fixed
      // order that can bury an entire style (like pastel) below the fold.
      for (let i = base.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[base[i], base[j]] = [base[j], base[i]]
      }

      // Top the starting set up with one generated batch so the grid
      // never opens half-empty — after that, more load in as you scroll.
      const extra = generateBatch(0, null)
      genCountRef.current = BATCH_SIZE

      const combined = [...base, ...extra]
      setAllPalettes(combined)
      setFiltered(combined)
    }

    load()
    return () => { active = false }
  }, [])

  // Appends one more batch of freshly generated, harmony-based palettes.
  // Skipped while searching for an exact hex code, since a random palette
  // can't reliably be made to contain a specific colour on demand.
  const loadMore = useCallback(() => {
    if (loadingMore || isHexSearch) return
    setLoadingMore(true)
    setTimeout(() => {
      const batch = generateBatch(genCountRef.current, lockedStyle)
      genCountRef.current += BATCH_SIZE
      setAllPalettes((prev) => [...prev, ...batch])
      setFiltered((prev) => [...prev, ...batch])
      setLoadingMore(false)
    }, 250)
  }, [loadingMore, isHexSearch, lockedStyle])

  // Infinite scroll: load another batch whenever the sentinel at the
  // bottom of the grid comes into view.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  const handleSearch = (term) => {
    setSearchTerm(term)

    const q = term.trim().toLowerCase()
    if (!q) {
      setLockedStyle(null)
      setIsHexSearch(false)
      setFiltered(allPalettes)
      return
    }

    // Check if the user typed a hex code
    const hexMatch = q.match(/^#?([0-9a-f]{3,6})$/i)
    if (hexMatch) {
      let searchHex = hexMatch[0].startsWith('#') ? hexMatch[0] : '#' + hexMatch[0]
      // Expand shorthand hex (#abc → #aabbcc)
      if (searchHex.length === 4) {
        searchHex = '#' + searchHex[1].repeat(2) + searchHex[2].repeat(2) + searchHex[3].repeat(2)
      }
      const upper = searchHex.toUpperCase()
      setLockedStyle(null)
      setIsHexSearch(true)
      setFiltered(allPalettes.filter(p => p.colors.some(c => c.toUpperCase() === upper)))
      return
    }

    // Otherwise search by style name — and if it matches, lock the
    // infinite-scroll generator to that style too, so new palettes that
    // load in as you scroll keep matching the search.
    setIsHexSearch(false)
    const matchedStyles = STYLES.filter(s => s.includes(q))
    setLockedStyle(matchedStyles.length === 1 ? matchedStyles[0] : null)
    setFiltered(
      matchedStyles.length
        ? allPalettes.filter(p => matchedStyles.includes(p.style))
        : []
    )
  }

  return (
    <div className="explore-content" style={{ paddingTop: '60px' }}>
      {/* The live palette studio sits at the top of the Explore page */}
      <PaletteStudio
        generatePalette={generatePalette}
        currentColors={currentColors}
        setCurrentColors={setCurrentColors}
        colorFormat={colorFormat}
        setColorFormat={setColorFormat}
        history={history}
        restoreFromHistory={restoreFromHistory}
        clearHistory={clearHistory}
        savePalette={savePalette}
        openNameModal={openNameModal}
        openModal={openModal}
        showToast={showToast}
      />

      <hr className="explore-divider" />

      <ImageExtractor
        openModal={openModal}
        onSave={(colors) =>
          openNameModal(colors, (name) => {
            savePalette(colors, name)
            showToast('✅ Palette saved!')
          })
        }
        showToast={showToast}
      />

      <hr className="explore-divider" />

      <ColorSearch
        onOpenColor={openModal}
        onSave={(colors) =>
          openNameModal(colors, (name) => {
            savePalette(colors, name)
            showToast('✅ Color saved!')
          })
        }
        showToast={showToast}
      />

      <hr className="explore-divider" />

      <div className="section-header" style={{ marginTop: '60px' }}>
        <h2>🌍 <span className="gradient-text">Explore</span> Palettes</h2>
        <p className="section-subtitle">
          Unlimited, auto-generated palettes — every colour is built from a real harmony rule
          (complementary, triadic, analogous…) and checked for contrast against its neighbours.
          Search by style (pastel, vibrant, dark…) or by hex code.
        </p>
      </div>

      <div className="explore-search-wrap">
        <SearchBar
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Try: pastel, vibrant, #FF6B6B..."
        />
      </div>

      <div className="explore-grid">
        {filtered.length === 0 ? (
          <div className="explore-no-results">
            <i className="fas fa-search"></i>
            <p>No palettes match your search.</p>
          </div>
        ) : (
          filtered.map((pal, idx) => (
            <PaletteCard
              key={pal.id || idx}
              palette={pal}
              onOpenColor={openModal}
              onSave={(colors) =>
                openNameModal(colors, (name) => {
                  savePalette(colors, name)
                  showToast('✅ Palette saved!')
                })
              }
              showToast={showToast}
            />
          ))
        )}
      </div>

      {!isHexSearch && (
        <div className="explore-nav">
          <button
            className="nav-next"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>✨ Generating more…</>
            ) : (
              <><i className="fas fa-shuffle"></i> Load More Palettes</>
            )}
          </button>
          {/* Invisible trigger — scrolling this into view loads more automatically */}
          <div ref={sentinelRef} style={{ width: '100%', height: '1px' }} />
        </div>
      )}
    </div>
  )
}
