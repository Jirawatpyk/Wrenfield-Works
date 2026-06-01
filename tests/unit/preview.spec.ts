import { afterEach, describe, it, expect, vi } from 'vitest'

import { assertPreviewSecret, buildPreviewPath, signPreviewToken } from '../../src/lib/preview'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('signPreviewToken', () => {
  it('is deterministic for identical inputs', () => {
    expect(signPreviewToken('/en', 123, 'secret')).toBe(signPreviewToken('/en', 123, 'secret'))
  })

  it('changes when path, expiry, or secret changes', () => {
    const base = signPreviewToken('/en', 123, 'secret')
    expect(signPreviewToken('/th', 123, 'secret')).not.toBe(base)
    expect(signPreviewToken('/en', 124, 'secret')).not.toBe(base)
    expect(signPreviewToken('/en', 123, 'other')).not.toBe(base)
  })
})

describe('buildPreviewPath', () => {
  it('builds a signed, expiring URL for the locale when a secret is set', () => {
    vi.stubEnv('PREVIEW_SECRET', 'a-sufficiently-long-secret')
    const url = buildPreviewPath('th')
    const params = new URLSearchParams(url.split('?')[1])
    expect(url.startsWith('/api/preview?')).toBe(true)
    expect(params.get('path')).toBe('/th')
    expect(Number(params.get('exp'))).toBeGreaterThan(0)
    expect(params.get('token')).toBeTruthy()
    // The raw secret must NEVER appear in the URL.
    expect(url).not.toContain('a-sufficiently-long-secret')
  })

  it('defaults an unknown/empty locale to the default locale (en)', () => {
    vi.stubEnv('PREVIEW_SECRET', 'a-sufficiently-long-secret')
    expect(new URLSearchParams(buildPreviewPath('xx').split('?')[1]).get('path')).toBe('/en')
    expect(new URLSearchParams(buildPreviewPath(null).split('?')[1]).get('path')).toBe('/en')
  })

  it('omits the token when no secret is configured (route will 403)', () => {
    vi.stubEnv('PREVIEW_SECRET', '')
    const url = buildPreviewPath('en')
    expect(url).toContain('path=%2Fen')
    expect(url).not.toContain('token=')
  })
})

describe('assertPreviewSecret', () => {
  it('throws in production when the secret is missing or too short', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('PREVIEW_SECRET', '')
    expect(() => assertPreviewSecret()).toThrow(/PREVIEW_SECRET/)
    vi.stubEnv('PREVIEW_SECRET', 'short')
    expect(() => assertPreviewSecret()).toThrow(/PREVIEW_SECRET/)
  })

  it('passes in production with a strong secret', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('PREVIEW_SECRET', 'a-sufficiently-long-secret-value')
    expect(() => assertPreviewSecret()).not.toThrow()
  })

  it('never throws outside production', () => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('PREVIEW_SECRET', '')
    expect(() => assertPreviewSecret()).not.toThrow()
  })
})
