import { describe, it, expect } from 'vitest'

import { isStaleSave } from '../../src/lib/concurrency'
import { isNoStoreInvariant } from '../../src/lib/revalidate'

describe('isStaleSave (optimistic-concurrency, FR-020a)', () => {
  it('returns false when either timestamp is absent (no conflict possible)', () => {
    expect(isStaleSave(null, '2021-01-01')).toBe(false)
    expect(isStaleSave('2021-01-01', null)).toBe(false)
    expect(isStaleSave(undefined, undefined)).toBe(false)
  })

  it('flags an incoming timestamp OLDER than the stored one as stale', () => {
    expect(isStaleSave('2020-01-01T00:00:00Z', '2021-01-01T00:00:00Z')).toBe(true)
  })

  it('does not flag equal or newer incoming timestamps', () => {
    expect(isStaleSave('2021-01-01T00:00:00Z', '2021-01-01T00:00:00Z')).toBe(false)
    expect(isStaleSave('2022-01-01T00:00:00Z', '2021-01-01T00:00:00Z')).toBe(false)
  })

  it('accepts Date objects as well as ISO strings', () => {
    expect(isStaleSave(new Date(1000), new Date(2000))).toBe(true)
    expect(isStaleSave(new Date(2000), new Date(1000))).toBe(false)
  })

  it('returns false on an unparseable timestamp (skip rather than misfire)', () => {
    expect(isStaleSave('not-a-date', '2021-01-01T00:00:00Z')).toBe(false)
  })
})

describe('isNoStoreInvariant (revalidate FR-016)', () => {
  it('treats the Next "no request store" invariant as benign', () => {
    expect(isNoStoreInvariant({ __NEXT_ERROR_CODE: 'E263' })).toBe(true)
    expect(isNoStoreInvariant(new Error('static generation store missing'))).toBe(true)
    expect(isNoStoreInvariant(new Error('Invariant: something'))).toBe(true)
    expect(isNoStoreInvariant(new Error('called outside a request'))).toBe(true)
  })

  it('treats any other error as a real (loggable) revalidation failure', () => {
    expect(isNoStoreInvariant(new Error('ECONNREFUSED'))).toBe(false)
    expect(isNoStoreInvariant('some string')).toBe(false)
    expect(isNoStoreInvariant(null)).toBe(false)
  })
})
