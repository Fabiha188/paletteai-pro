import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, updateProfile, onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '../firebase'

export const toAppUser = (u) => u && ({
  id: u.uid,
  name: u.displayName || (u.email ? u.email.split('@')[0] : 'User'),
  email: u.email,
})

const MESSAGES = {
  'auth/email-already-in-use':   'An account with this email already exists. Try signing in.',
  'auth/invalid-credential':     'Incorrect email or password.',
  'auth/wrong-password':         'Incorrect email or password.',
  'auth/user-not-found':         'Incorrect email or password.',
  'auth/invalid-email':          'Please enter a valid email address.',
  'auth/weak-password':          'Password must be at least 6 characters.',
  'auth/too-many-requests':      'Too many attempts. Please wait a bit and try again.',
  'auth/network-request-failed': 'Network error. Check your internet connection.',
  'auth/operation-not-allowed':  'Email/Password sign-in is not enabled in Firebase yet.',
  'auth/unauthorized-domain':    'This website address is not authorised in Firebase (Authentication → Settings → Authorized domains).',
}

const friendly = (err) => new Error(MESSAGES[err?.code] || 'Something went wrong. Please try again.')

export async function fbSignUp({ name, email, password }) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
    await updateProfile(cred.user, { displayName: name.trim() })
    return toAppUser(cred.user)
  } catch (err) { throw friendly(err) }
}

export async function fbSignIn({ email, password }) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
    return toAppUser(cred.user)
  } catch (err) { throw friendly(err) }
}

export const fbSignOut = () => signOut(auth)
export const fbOnAuthChange = (cb) => onAuthStateChanged(auth, (u) => cb(toAppUser(u)))
