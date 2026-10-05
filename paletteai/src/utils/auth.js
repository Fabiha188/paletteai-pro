// Demo-grade, browser-only auth. Accounts live in this browser's localStorage,
// so an account made on one device will NOT exist on another device.
const USERS_KEY = 'paletteai_users'
const SESSION_KEY = 'paletteai_session'

const readUsers = () => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || [] } catch { return [] }
}
const writeUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users))

const randomId = () =>
  (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)

// SHA-256 via Web Crypto (needs https or localhost). Falls back to a simple
// hash when it is unavailable, e.g. opening the site over plain http on a LAN IP.
async function hashPassword(password, salt) {
  const text = `${salt}:${password}`
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  }
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0
  return `weak-${h.toString(16)}`
}

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email })

export async function signUpUser({ name, email, password }) {
  const cleanEmail = email.trim().toLowerCase()
  const users = readUsers()
  if (users.some(u => u.email === cleanEmail)) {
    throw new Error('An account with this email already exists. Try signing in.')
  }
  const salt = randomId()
  const user = {
    id: randomId(),
    name: name.trim(),
    email: cleanEmail,
    salt,
    hash: await hashPassword(password, salt),
  }
  writeUsers([...users, user])
  localStorage.setItem(SESSION_KEY, user.id)
  return publicUser(user)
}

export async function signInUser({ email, password }) {
  const cleanEmail = email.trim().toLowerCase()
  const user = readUsers().find(u => u.email === cleanEmail)
  if (!user || (await hashPassword(password, user.salt)) !== user.hash) {
    throw new Error('Incorrect email or password.')
  }
  localStorage.setItem(SESSION_KEY, user.id)
  return publicUser(user)
}

export function signOutUser() {
  localStorage.removeItem(SESSION_KEY)
}

export function getSessionUser() {
  try {
    const id = localStorage.getItem(SESSION_KEY)
    const user = readUsers().find(u => u.id === id)
    return user ? publicUser(user) : null
  } catch {
    return null
  }
}

// When a guest creates an account, carry their already-saved palettes over.
export function migrateGuestData(userId) {
  ;['paletteai_saved', 'paletteai_history'].forEach((key) => {
    const guest = localStorage.getItem(key)
    if (guest && !localStorage.getItem(`${key}:${userId}`)) {
      localStorage.setItem(`${key}:${userId}`, guest)
    }
  })
}
