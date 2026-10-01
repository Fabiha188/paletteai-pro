import React, { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

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

  // Add a shadow to the navbar once the user starts scrolling
  useEffect(() => {
    const handleScroll = () => {
      const nav = document.querySelector('nav')
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav>
      <div className="logo">
        <i className="fas fa-palette"></i> PaletteAI
      </div>

      <div
        className="hamburger"
        onClick={() => document.querySelector('.nav-links')?.classList.toggle('active')}
      >
        <i className="fas fa-bars"></i>
      </div>

      <ul className="nav-links">
        {NAV_ITEMS.map(({ path, label }) => (
          <li key={path}>
            <NavLink
              to={path}
              end={path === '/'}
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={() => document.querySelector('.nav-links')?.classList.remove('active')}
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="nav-actions">
        <button
          className="cmdk-trigger"
          onClick={() => setCommandPaletteOpen(true)}
          title="Quick actions"
        >
          <i className="fas fa-magnifying-glass"></i>
          <span>Quick actions</span>
          <kbd>Ctrl K</kbd>
        </button>
        <button className="theme-toggle" onClick={toggleTheme}>
          <i className={theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun'}></i>
        </button>
        {user ? (
          <div className="nav-user">
            <div className="nav-avatar" title={user.email}>{user.name.charAt(0)}</div>
            <span className="nav-username">{user.name}</span>
            <button
              className="btn-outline"
              onClick={signOut}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button className="btn-outline" onClick={() => openAuthModal('signin')}>Sign In</button>
        )}
      </div>
    </nav>
  )
}
