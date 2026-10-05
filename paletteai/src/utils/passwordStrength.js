// Rates a password as weak / medium / strong and says how to improve it.
const COMMON = [
  'password', 'passw0rd', '123456', '12345678', '123456789', 'qwerty', 'qwerty123',
  'abc123', '111111', '000000', 'iloveyou', 'admin', 'welcome', 'letmein', 'pakistan',
]

export function getPasswordStrength(password = '') {
  if (!password) return { level: 'none', score: 0, label: '', tips: [] }

  const hasLower  = /[a-z]/.test(password)
  const hasUpper  = /[A-Z]/.test(password)
  const hasDigit  = /[0-9]/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)

  const tips = []
  if (password.length < 8)  tips.push('Use at least 8 characters')
  if (!(hasLower && hasUpper)) tips.push('Mix UPPER and lower case letters')
  if (!hasDigit)  tips.push('Add a number')
  if (!hasSymbol) tips.push('Add a symbol like ! @ # $')
  if (password.length >= 8 && password.length < 12) tips.push('12+ characters is even better')

  const lower = password.toLowerCase()
  const isCommon = COMMON.some(w => lower === w || (lower.startsWith(w) && password.length <= w.length + 3))
  const isRepeated = /^(.)\1+$/.test(password)

  if (password.length < 6 || isCommon || isRepeated) {
    return {
      level: 'weak', score: 1, label: 'Weak',
      tips: isCommon ? ['This is a very common password — pick something unique'] : isRepeated ? ['Avoid repeating the same character'] : tips,
    }
  }

  let points = 0
  if (password.length >= 8)  points++
  if (password.length >= 12) points++
  if (hasLower && hasUpper)  points++
  if (hasDigit)  points++
  if (hasSymbol) points++

  if (points <= 1) return { level: 'weak',   score: 1, label: 'Weak',   tips }
  if (points <= 3) return { level: 'medium', score: 2, label: 'Medium', tips }
  return { level: 'strong', score: 3, label: 'Strong', tips: [] }
}
