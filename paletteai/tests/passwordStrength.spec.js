import { describe, it, expect } from 'vitest'
import { getPasswordStrength } from '../src/utils/passwordStrength'

describe('getPasswordStrength', () => {
  it('returns none for an empty password', () => {
    expect(getPasswordStrength('').level).toBe('none')
  })
  it('rates short, common and repeated passwords as weak', () => {
    expect(getPasswordStrength('abc').level).toBe('weak')
    expect(getPasswordStrength('password').level).toBe('weak')
    expect(getPasswordStrength('123456').level).toBe('weak')
    expect(getPasswordStrength('aaaaaaaaaa').level).toBe('weak')
  })
  it('rates a plain 8-letter password as weak', () => {
    expect(getPasswordStrength('sunshine').level).toBe('weak')
  })
  it('rates decent passwords as medium', () => {
    expect(getPasswordStrength('sunshine1').level).toBe('medium')
    expect(getPasswordStrength('Sunshine1').level).toBe('medium')
  })
  it('rates long mixed passwords as strong', () => {
    const r = getPasswordStrength('Sunshine#Karachi2026')
    expect(r.level).toBe('strong')
    expect(r.tips).toEqual([])
  })
  it('gives an improvement tip for non-strong passwords', () => {
    expect(getPasswordStrength('sunshine1').tips.length).toBeGreaterThan(0)
  })
})
