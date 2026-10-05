import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  signUpUser, signInUser, signOutUser, getSessionUser, migrateGuestData,
} from '../utils/auth'
import { fbSignUp, fbSignIn, fbSignOut, fbOnAuthChange } from '../utils/firebaseAuth'
import { firebaseEnabled } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // With Firebase the session is restored asynchronously; locally it's instant.
  const [user, setUser] = useState(() => (firebaseEnabled ? null : getSessionUser()))
  const [authReady, setAuthReady] = useState(!firebaseEnabled)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState('signin')
  // A toast message to show once the app has re-mounted for the new user.
  const [flash, setFlash] = useState(null)

  useEffect(() => {
    if (!firebaseEnabled) return
    return fbOnAuthChange((u) => { setUser(u); setAuthReady(true) })
  }, [])

  const openAuthModal = useCallback((mode = 'signin') => {
    setAuthModalMode(mode)
    setAuthModalOpen(true)
  }, [])
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), [])
  const clearFlash = useCallback(() => setFlash(null), [])

  const signUp = useCallback(async (details) => {
    const u = firebaseEnabled ? await fbSignUp(details) : await signUpUser(details)
    if (!firebaseEnabled) migrateGuestData(u.id)
    setUser(u) // also picks up the display name Firebase set after creation
    setFlash(`🎉 Welcome, ${u.name}!`)
    return u
  }, [])

  const signIn = useCallback(async (details) => {
    const u = firebaseEnabled ? await fbSignIn(details) : await signInUser(details)
    setUser(u)
    setFlash(`👋 Welcome back, ${u.name}!`)
    return u
  }, [])

  const signOut = useCallback(async () => {
    if (firebaseEnabled) await fbSignOut()
    else signOutUser()
    setUser(null)
    setFlash('👋 Signed out')
  }, [])

  return (
    <AuthContext.Provider value={{
      user, authReady, signUp, signIn, signOut,
      authModalOpen, authModalMode, openAuthModal, closeAuthModal,
      flash, clearFlash, cloudSync: firebaseEnabled,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>')
  return ctx
}
