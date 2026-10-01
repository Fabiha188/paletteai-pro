import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Values come from Vite env vars (see .env.example). If they are missing,
// the app quietly falls back to browser-only accounts.
const config = {
  apiKey:     import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId:      import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseEnabled = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId
)

const app = firebaseEnabled ? initializeApp(config) : null
export const auth = app ? getAuth(app) : null
export const db   = app ? getFirestore(app) : null
