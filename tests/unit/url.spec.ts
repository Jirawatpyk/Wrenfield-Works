import { describe, it, expect } from 'vitest'

import { validateLinkUrl } from '../../src/lib/validation/url'

describe('validateLinkUrl (FR-019)', () => {
  it('accepts absolute http(s) URLs', () => {
    expect(validateLinkUrl('https://example.com')).toBe(true)
    expect(validateLinkUrl('http://wrenfieldworks.com/path?q=1')).toBe(true)
  })

  it('accepts in-page anchors', () => {
    expect(validateLinkUrl('#')).toBe(true)
    expect(validateLinkUrl('#work')).toBe(true)
  })

  it('accepts mailto: and tel: links with a payload', () => {
    expect(validateLinkUrl('mailto:hello@wrenfieldworks.com')).toBe(true)
    expect(validateLinkUrl('tel:+6620000000')).toBe(true)
  })

  it('rejects an empty mailto:/tel: with no address', () => {
    expect(validateLinkUrl('mailto:')).not.toBe(true)
    expect(validateLinkUrl('tel:')).not.toBe(true)
  })

  it('rejects clearly malformed values', () => {
    expect(validateLinkUrl('not a url')).not.toBe(true)
    expect(validateLinkUrl('ftp://example.com')).not.toBe(true) // non-http(s) scheme
    expect(validateLinkUrl('javascript:alert(1)')).not.toBe(true)
  })

  it('allows empty when the field is optional', () => {
    expect(validateLinkUrl('')).toBe(true)
    expect(validateLinkUrl(null)).toBe(true)
    expect(validateLinkUrl(undefined)).toBe(true)
  })

  it('rejects empty when the field is required (custom validate replaces built-in required)', () => {
    expect(validateLinkUrl('', { required: true })).not.toBe(true)
    expect(validateLinkUrl(null, { required: true })).not.toBe(true)
    expect(validateLinkUrl('   ', { required: true })).not.toBe(true)
  })

  it('still accepts a valid value on a required field', () => {
    expect(validateLinkUrl('https://example.com', { required: true })).toBe(true)
    expect(validateLinkUrl('#work', { required: true })).toBe(true)
  })
})
