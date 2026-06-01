/**
 * Unit tests for the shared env-int parser (src/lib/env.ts), used by the inquiry
 * rate limiter, the SMTP port, and the retention window.
 */
import { describe, it, expect, afterEach } from 'vitest'

import { envInt } from '@/lib/env'

const KEY = 'WF_TEST_ENVINT'

afterEach(() => {
  delete process.env[KEY]
})

describe('envInt', () => {
  it('falls back when the var is unset', () => {
    expect(envInt(KEY, 5)).toBe(5)
  })

  it('falls back on an empty / whitespace value (Number("") would be 0)', () => {
    process.env[KEY] = ''
    expect(envInt(KEY, 5)).toBe(5)
    process.env[KEY] = '   '
    expect(envInt(KEY, 5)).toBe(5)
  })

  it('parses a valid integer', () => {
    process.env[KEY] = '12'
    expect(envInt(KEY, 5)).toBe(12)
  })

  it('honors an explicit 0 when min is 0', () => {
    process.env[KEY] = '0'
    expect(envInt(KEY, 5, 0)).toBe(0)
  })

  it('falls back when below min', () => {
    process.env[KEY] = '0'
    expect(envInt(KEY, 24, 1)).toBe(24)
    process.env[KEY] = '-3'
    expect(envInt(KEY, 24, 1)).toBe(24)
  })

  it('falls back on a fractional value below min (guards the retention 0.5 → 0 footgun)', () => {
    process.env[KEY] = '0.5'
    expect(envInt(KEY, 24, 1)).toBe(24)
  })

  it('floors a fractional value that clears min', () => {
    process.env[KEY] = '2.9'
    expect(envInt(KEY, 24, 1)).toBe(2)
  })

  it('falls back on a non-numeric value', () => {
    process.env[KEY] = '5x'
    expect(envInt(KEY, 587, 1)).toBe(587)
    process.env[KEY] = 'abc'
    expect(envInt(KEY, 587, 1)).toBe(587)
  })
})
