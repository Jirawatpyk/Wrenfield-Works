/**
 * Unit tests for src/lib/format.ts — numeric rendering "as authored" (FR-011c).
 * Guards against the two Counter defects: en-US thousands-grouping on integers >= 1000,
 * and silent integer rounding of authored non-integer values.
 */
import { describe, it, expect } from 'vitest'

import { decimalPlaces, formatCount } from '@/lib/format'

describe('decimalPlaces()', () => {
  it('returns 0 for integers and non-finite input', () => {
    expect(decimalPlaces(1400)).toBe(0)
    expect(decimalPlaces(0)).toBe(0)
    expect(decimalPlaces(Number.NaN)).toBe(0)
    expect(decimalPlaces(Number.POSITIVE_INFINITY)).toBe(0)
  })

  it('counts fraction digits for non-integers', () => {
    expect(decimalPlaces(99.9)).toBe(1)
    expect(decimalPlaces(4.85)).toBe(2)
  })
})

describe('formatCount()', () => {
  it('renders large integers with no thousands separator (not "1,400")', () => {
    expect(formatCount(1400, 0)).toBe('1400')
    expect(formatCount(1234567, 0)).toBe('1234567')
  })

  it('preserves authored decimals instead of rounding to an integer', () => {
    expect(formatCount(99.9, 1)).toBe('99.9')
    expect(formatCount(4.8, 1)).toBe('4.8')
  })

  it('rounds in-flight frame values to the target precision', () => {
    expect(formatCount(743.2, 0)).toBe('743')
    expect(formatCount(743.7, 0)).toBe('744')
  })

  it('treats a missing/invalid precision as 0', () => {
    expect(formatCount(12.34, 0)).toBe('12')
    expect(formatCount(12.34, Number.NaN)).toBe('12')
  })
})
