import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/*
  React Router doesn't manage scroll position on its own — without this,
  navigating to a new page keeps whatever scroll position you were at on
  the last one. This scrolls to the top on every route change, unless the
  URL includes a hash (e.g. "/#contact"), in which case it scrolls that
  section into view instead.
*/
export default function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      // Give the new page a moment to render before we look for the element
      const id = hash.replace('#', '')
      const scrollToHash = () => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          return true
        }
        return false
      }
      if (!scrollToHash()) {
        const timeout = setTimeout(scrollToHash, 100)
        return () => clearTimeout(timeout)
      }
      return
    }

    // Instant, not smooth — the global `scroll-behavior: smooth` is meant
    // for in-page anchor links. Letting it animate this too meant the
    // scroll-to-top and the new page's fade-in were both animating at
    // once, which is what read as a jarring "blink" between pages.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])

  return null
}
