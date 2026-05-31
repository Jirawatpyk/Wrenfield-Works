import { describe, it, expect } from 'vitest'

import {
  DEFAULT_LOCALE,
  isLocale,
  localeFromAcceptLanguage,
  normalizeLocale,
} from '../../src/lib/i18n'

describe('isLocale', () => {
  it('accepts the two supported locales and rejects everything else', () => {
    expect(isLocale('en')).toBe(true)
    expect(isLocale('th')).toBe(true)
    expect(isLocale('xx')).toBe(false)
    expect(isLocale(undefined)).toBe(false)
    expect(isLocale(null)).toBe(false)
  })
})

describe('normalizeLocale', () => {
  it('passes supported locales through and falls back to the default otherwise', () => {
    expect(normalizeLocale('th')).toBe('th')
    expect(normalizeLocale('en')).toBe('en')
    expect(normalizeLocale('zz')).toBe(DEFAULT_LOCALE)
    expect(normalizeLocale(null)).toBe(DEFAULT_LOCALE)
  })
})

describe('localeFromAcceptLanguage', () => {
  it('defaults to EN when the header is missing or empty', () => {
    expect(localeFromAcceptLanguage(null)).toBe('en')
    expect(localeFromAcceptLanguage('')).toBe('en')
  })

  it('returns TH only when Thai is present/preferred', () => {
    expect(localeFromAcceptLanguage('th')).toBe('th')
    expect(localeFromAcceptLanguage('th-TH,en;q=0.8')).toBe('th')
    expect(localeFromAcceptLanguage('en;q=0.5,th;q=0.9')).toBe('th') // higher q wins
  })

  it('returns EN for English or unsupported-language headers', () => {
    expect(localeFromAcceptLanguage('en-US,en;q=0.9')).toBe('en')
    expect(localeFromAcceptLanguage('fr,de;q=0.8')).toBe('en')
  })
})
