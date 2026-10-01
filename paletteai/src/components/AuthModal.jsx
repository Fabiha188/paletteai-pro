import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AuthModal() {
  const { authModalOpen, authModalMode, closeAuthModal, signIn, signUp, cloudSync } = useAuth()

  const [mode, setMode]         = useState('signin')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [busy, setBusy]         = useState(false)

  useEffect(() => {
    if (authModalOpen) {
      setMode(authModalMode)
      setError('')
    } else {
      setName(''); setEmail(''); setPassword(''); setBusy(false)
    }
  }, [authModalOpen, authModalMode])

  useEffect(() => {
    if (!authModalOpen) return
    const onKey = (e) => { if (e.key === 'Escape') closeAuthModal() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [authModalOpen, closeAuthModal])

  if (!authModalOpen) return null

  const isSignUp = mode === 'signup'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (isSignUp && name.trim().length < 2) return setError('Please enter your name.')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please enter a valid email address.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')

    setBusy(true)
    try {
      if (isSignUp) await signUp({ name, email, password })
      else await signIn({ email, password })
      closeAuthModal()
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay show" onClick={closeAuthModal}>
      <div className="modal-box auth-box" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={closeAuthModal}>&times;</button>

        <h3>
          <i className={`fas ${isSignUp ? 'fa-user-plus' : 'fa-right-to-bracket'}`}></i>{' '}
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h3>
        <p className="auth-sub">
          {isSignUp
            ? (cloudSync ? 'Your saved palettes will sync across all your devices.' : 'Save palettes to your own account.')
            : (cloudSync ? 'Sign in to get your palettes on any device.' : 'Welcome back! Sign in to see your palettes.')}
        </p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {isSignUp && (
            <input
              type="text" className="name-input" placeholder="Your name"
              autoComplete="name" value={name} onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            type="email" className="name-input" placeholder="Email"
            autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password" className="name-input" placeholder="Password (min 6 characters)"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            value={password} onChange={(e) => setPassword(e.target.value)}
          />

          {error && <div className="auth-error" role="alert">⚠️ {error}</div>}

          <button type="submit" className="cta-primary auth-submit" disabled={busy}>
            {busy ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button" className="auth-link"
            onClick={() => { setMode(isSignUp ? 'signin' : 'signup'); setError('') }}
          >
            {isSignUp ? 'Sign In' : 'Create one'}
          </button>
        </p>
      </div>
    </div>
  )
}
