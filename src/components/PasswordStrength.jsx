import React from 'react'
import { getPasswordStrength } from '../utils/passwordStrength'

export default function PasswordStrength({ password }) {
  const { level, score, label, tips } = getPasswordStrength(password)
  if (level === 'none') return null

  return (
    <div className={`pw-strength pw-${level}`} aria-live="polite">
      <div className="pw-bars" aria-hidden="true">
        {[1, 2, 3].map(n => <span key={n} className={n <= score ? 'on' : ''} />)}
      </div>
      <div className="pw-label">
        Password strength: <strong>{label}</strong>
      </div>
      {tips.length > 0 && <div className="pw-tip">💡 {tips[0]}</div>}
    </div>
  )
}
