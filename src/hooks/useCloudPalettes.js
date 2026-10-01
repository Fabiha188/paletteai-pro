import { useEffect, useRef, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db, firebaseEnabled } from '../firebase'

/*
  Keeps the signed-in user's saved palettes in Firestore (users/{uid}) so they
  follow the account across devices. Changes made on another device arrive live.
  localStorage stays as the offline cache. Last write wins.
*/
export function useCloudPalettes(uid, saved, setSaved, onError) {
  const [synced, setSynced] = useState(false)
  const lastCloud = useRef(null)      // JSON of what we last saw in / sent to the cloud
  const initialSaved = useRef(saved)  // local copy at mount, used to seed a brand-new account
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  useEffect(() => {
    if (!uid || !firebaseEnabled) return
    const ref = doc(db, 'users', uid)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.metadata.hasPendingWrites) return // echo of our own write
        if (!snap.exists()) {
          // New account: start from local palettes, or the guest's ones.
          let seed = initialSaved.current
          if (!seed.length) {
            try { seed = JSON.parse(localStorage.getItem('paletteai_saved')) || [] } catch { seed = [] }
          }
          setSaved(seed)
        } else {
          const cloud = snap.data().savedPalettes || []
          lastCloud.current = JSON.stringify(cloud)
          setSaved((prev) => (JSON.stringify(prev) === lastCloud.current ? prev : cloud))
        }
        setSynced(true)
      },
      () => onErrorRef.current?.('Could not sync palettes. Showing saved copy from this device.')
    )
    return unsub
  }, [uid, setSaved])

  useEffect(() => {
    if (!uid || !synced || !firebaseEnabled) return
    const json = JSON.stringify(saved)
    if (json === lastCloud.current) return
    lastCloud.current = json
    setDoc(doc(db, 'users', uid), { savedPalettes: saved, updatedAt: Date.now() }, { merge: true })
      .catch(() => onErrorRef.current?.('Could not sync palettes to your account.'))
  }, [saved, synced, uid])
}
