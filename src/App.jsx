import React, { useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import Tools from './components/Tools'
import Contact from './components/Contact'
import Dashboard from './components/Dashboard'
import StudioPro from './components/StudioPro'
import Explore from './components/Explore'
import Pricing from './components/Pricing'
import Footer from './components/Footer'
import ColorModal from './components/ColorModal'
import NameModal from './components/NameModal'
import NotFound from './components/NotFound'
import ErrorBoundary from './components/ErrorBoundary'
import ScrollManager from './components/ScrollManager'
import InfoPage from './components/InfoPage'
import GradientMaker from './components/GradientMaker'
import CommandPalette from './components/CommandPalette'
import { AppProvider, useApp } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { firebaseEnabled } from './firebase'
import AuthModal from './components/AuthModal'
import { decodePaletteFromQuery } from './utils/shareLink'

function HomePage() {
  const navigate = useNavigate()
  return (
    <div className="page">
      <Hero onGetStarted={() => navigate('/studio')} />
      <Features />
      <Tools />
      <Contact />
    </div>
  )
}

function AppShell() {
  const navigate = useNavigate()
  const {
    setCurrentColors, showToastMessage,
    modalColor, closeModal, openNameModal, savePalette,
    showNameModal, pendingColors, closeNameModal, confirmNameModal,
    pendingRegenerate, regeneratePending, regenerating,
    toastMsg, toastType, showToast,
  } = useApp()
  const { flash, clearFlash } = useAuth()

  // Sign-in/out re-mounts the app state, so toasts from those actions are shown here
  useEffect(() => {
    if (flash) { showToastMessage(flash, 'success'); clearFlash() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flash])

  // On first load, check for a shared palette in the URL (?palette=...)
  // and, if present, drop straight into the Studio with it pre-loaded.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shared = decodePaletteFromQuery(params.get('palette'))
    if (shared) {
      setCurrentColors(shared)
      showToastMessage('🔗 Loaded shared palette!')
      navigate('/studio', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="app">
      <Navbar />
      <ScrollManager />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<div className="page"><Dashboard /></div>} />
        <Route path="/studio" element={<div className="page"><StudioPro /></div>} />
        <Route path="/explore" element={<div className="page"><Explore /></div>} />
        <Route path="/pricing" element={<div className="page"><Pricing /></div>} />
        <Route path="/gradient" element={<div className="page"><GradientMaker /></div>} />
        <Route path="/:slug" element={<div className="page"><InfoPage /></div>} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Footer />
      <CommandPalette />
      <AuthModal />

      <ColorModal
        hex={modalColor}
        onClose={closeModal}
        openNameModal={openNameModal}
        savePalette={savePalette}
        showToast={showToastMessage}
      />

      <NameModal
        isOpen={showNameModal}
        colors={pendingColors}
        onClose={closeNameModal}
        onConfirm={confirmNameModal}
        onRegenerate={pendingRegenerate ? regeneratePending : null}
        regenerating={regenerating}
        showToast={showToastMessage}
      />

      <div className={`copy-toast ${toastType} ${showToast ? 'show' : ''}`}>
        {toastMsg}
      </div>

      <button
        id="scrollTopBtn"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <i className="fas fa-arrow-up"></i>
      </button>
    </div>
  )
}

// Re-mounts the app state when the user signs in/out so each account
// (and the guest) gets its own saved palettes and history.
function UserScopedApp() {
  const { user, authReady } = useAuth()
  if (!authReady) return <div className="auth-loading">Loading…</div>
  return (
    <AppProvider
      key={user?.id || 'guest'}
      storageSuffix={user ? `:${user.id}` : ''}
      cloudUid={firebaseEnabled && user ? user.id : null}
    >
      <AppShell />
    </AppProvider>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <UserScopedApp />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
