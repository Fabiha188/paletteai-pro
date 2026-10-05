import { hexToRgbParts } from './colorHelpers'

// Simplified simulation matrices (Brettel/Vienot-derived approximations)
// commonly used for client-side colour-blindness previews.
const MATRICES = {
  protanopia: [
    [0.567, 0.433, 0],
    [0.558, 0.442, 0],
    [0, 0.242, 0.758],
  ],
  deuteranopia: [
    [0.625, 0.375, 0],
    [0.7, 0.3, 0],
    [0, 0.3, 0.7],
  ],
  tritanopia: [
    [0.95, 0.05, 0],
    [0, 0.433, 0.567],
    [0, 0.475, 0.525],
  ],
  achromatopsia: [
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114],
  ],
}

export const VISION_TYPES = [
  { id: 'protanopia',    label: 'Protanopia (red-blind)' },
  { id: 'deuteranopia',  label: 'Deuteranopia (green-blind)' },
  { id: 'tritanopia',    label: 'Tritanopia (blue-blind)' },
  { id: 'achromatopsia', label: 'Achromatopsia (no color)' },
]

// Applies a colour-blindness simulation matrix to a hex colour
export function simulateColorBlindness(hex, type) {
  const matrix = MATRICES[type]
  if (!matrix) return hex

  const { r, g, b } = hexToRgbParts(hex)
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)))

  const nr = clamp(matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b)
  const ng = clamp(matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b)
  const nb = clamp(matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b)

  const toHex = (n) => n.toString(16).padStart(2, '0')
  return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`.toUpperCase()
}
