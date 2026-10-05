import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import ConfirmModal from './ConfirmModal'

const NAV_ITEMS = [
  { path: '/',          label: 'Home' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/studio',    label: 'Studio Pro' },
  { path: '/explore',   label: 'Explore' },
  { path: '/pricing',   label: 'Pricing' },
]

export default function Navbar() {
  const { theme, toggleTheme, setCommandPaletteOpen } = useApp()
  const { user, signOut, openAuthModal } = useAuth()
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Add a shadow to the navbar once the user starts scrolling
  useEffect(() => {
    const handleScroll = () => {
      const nav = document.querySelector('nav')
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <nav>
      <div className="logo">
        <i className="fas fa-palette"></i> PaletteAI
      </div>

      <button
        type="button"
        className="hamburger"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <i className={`fas ${menuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
      </button>

      <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
        {NAV_ITEMS.map(({ path, label }) => (
          <li key={path}>
            <NavLink
              to={path}
              end={path === '/'}
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          </li>
        ))}
        <li className="nav-mobile-only">
          <a
            href="#quick-actions"
            onClick={(e) => { e.preventDefault(); setMenuOpen(false); setCommandPaletteOpen(true) }}
          >
            <i className="fas fa-bolt"></i> Quick Actions
          </a>
        </li>
      </ul>

      <div className="nav-actions">
        <button
          className="cmdk-trigger"
          onClick={() => setCommandPaletteOpen(true)}
          title="Quick actions"
          aria-label="Quick actions"
        >
          <i className="fas fa-magnifying-glass"></i>
          <span>Quick actions</span>
          <kbd>Ctrl K</kbd>
        </button>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          <i className={theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun'}></i>
        </button>
        {user ? (
          <div className="nav-user">
            <div className="nav-avatar" title={user.email}>{user.name.charAt(0)}</div>
            <span className="nav-username">{user.name}</span>
            <button
              className="btn-outline"
              onClick={() => setConfirmSignOut(true)}
              aria-label="Sign Out"
            >
              <i className="fas fa-right-from-bracket nav-signout-icon"></i>
              <span className="nav-signout-text">Sign Out</span>
            </button>
          </div>
        ) : (
          <button className="btn-outline" onClick={() => openAuthModal('signin')}>Sign In</button>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmSignOut}
        icon="fa-right-from-bracket"
        title="Sign out?"
        message={user ? `You are signed in as ${user.name}. Are you sure you want to sign out?` : ''}
        confirmLabel="Yes, Sign Out"
        cancelLabel="Stay Signed In"
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={() => { setConfirmSignOut(false); signOut() }}
      />
    </nav>
  )
}
