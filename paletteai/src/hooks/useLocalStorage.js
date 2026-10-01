import { useState, useEffect } from 'react'

// Works exactly like useState but automatically syncs the value
// to localStorage so it persists across page refreshes.
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (err) {
      console.warn('localStorage write failed:', err)
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue]
}
