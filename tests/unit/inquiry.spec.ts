/**
 * T071 (unit) — Inquiry validation schema (Zod), inquiry-api contract + FR-023/FR-026.
 *
 * Pure, locale-aware validation of the public inquiry payload. The schema is the
 * server-side gate for the only public WRITE path, so every rule the contract
 * names is exercised here before the route is wired:
 *   - name 1..120, email well-formed, message 1..5000 (FR-023)
 *   - locale ∈ {en, th}
 *   - consent === true (FR-026)
 *   - field errors are LOCALIZED to the visitor's language (FR-023)
 *   - whitespace is trimmed; the honeypot (`company`) is NOT a 400 field error
 *     (it is a spam signal handled by the route → 429)
 *
 * Source of truth: src/lib/validation/inquiry.ts.
 */
import { describe, it, expect } from 'vitest'

import { parseInquiry, MAX_NAME, MAX_MESSAGE } from '@/lib/validation/inquiry'

const valid = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'We need an internal tool to track shipments.',
  locale: 'en' as const,
  consent: true,
  turnstileToken: 'tok_abc',
}

describe('parseInquiry — happy path', () => {
  it('accepts a complete, valid EN submission and returns normalized data', () => {
    const r = parseInquiry(valid, 'en')
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.name).toBe('Ada Lovelace')
      expect(r.data.email).toBe('ada@example.com')
      expect(r.data.locale).toBe('en')
      expect(r.data.consent).toBe(true)
      expect(r.data.turnstileToken).toBe('tok_abc')
    }
  })

  it('trims surrounding whitespace on name/email/message', () => {
    const r = parseInquiry(
      { ...valid, name: '  Ada  ', email: '  ada@example.com ', message: '  hi there  ' },
      'en',
    )
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.name).toBe('Ada')
      expect(r.data.email).toBe('ada@example.com')
      expect(r.data.message).toBe('hi there')
    }
  })

  it('accepts a valid TH submission', () => {
    const r = parseInquiry({ ...valid, locale: 'th' }, 'th')
    expect(r.success).toBe(true)
  })

  it('ignores the honeypot field for validity (empty company is fine)', () => {
    const r = parseInquiry({ ...valid, company: '' }, 'en')
    expect(r.success).toBe(true)
  })
})

describe('parseInquiry — field validation (FR-023)', () => {
  it('rejects a missing/blank name', () => {
    const r = parseInquiry({ ...valid, name: '   ' }, 'en')
    expect(r.success).toBe(false)
    if (!r.success) expect(r.errors.name).toBeTruthy()
  })

  it('rejects a name longer than the max', () => {
    const r = parseInquiry({ ...valid, name: 'x'.repeat(MAX_NAME + 1) }, 'en')
    expect(r.success).toBe(false)
    if (!r.success) expect(r.errors.name).toBeTruthy()
  })

  it('rejects a malformed email', () => {
    const r = parseInquiry({ ...valid, email: 'not-an-email' }, 'en')
    expect(r.success).toBe(false)
    if (!r.success) expect(r.errors.email).toBeTruthy()
  })

  it('rejects an empty message', () => {
    const r = parseInquiry({ ...valid, message: '' }, 'en')
    expect(r.success).toBe(false)
    if (!r.success) expect(r.errors.message).toBeTruthy()
  })

  it('rejects a message longer than the max', () => {
    const r = parseInquiry({ ...valid, message: 'x'.repeat(MAX_MESSAGE + 1) }, 'en')
    expect(r.success).toBe(false)
    if (!r.success) expect(r.errors.message).toBeTruthy()
  })

  it('reports multiple field errors at once', () => {
    const r = parseInquiry({ name: '', email: 'bad', message: '', consent: false }, 'en')
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.errors.name).toBeTruthy()
      expect(r.errors.email).toBeTruthy()
      expect(r.errors.message).toBeTruthy()
      expect(r.errors.consent).toBeTruthy()
    }
  })
})

describe('parseInquiry — consent gate (FR-026)', () => {
  it('rejects consent === false', () => {
    const r = parseInquiry({ ...valid, consent: false }, 'en')
    expect(r.success).toBe(false)
    if (!r.success) expect(r.errors.consent).toBeTruthy()
  })

  it('rejects a missing consent field', () => {
    const { consent: _omit, ...withoutConsent } = valid
    const r = parseInquiry(withoutConsent, 'en')
    expect(r.success).toBe(false)
    if (!r.success) expect(r.errors.consent).toBeTruthy()
  })
})

describe('parseInquiry — localized error messages (FR-023)', () => {
  it('returns Thai messages when the message-locale is th', () => {
    const en = parseInquiry({ ...valid, name: '' }, 'en')
    const th = parseInquiry({ ...valid, name: '' }, 'th')
    expect(en.success).toBe(false)
    expect(th.success).toBe(false)
    if (!en.success && !th.success) {
      // Both flag the same field, but with different (localized) copy.
      expect(en.errors.name).toBeTruthy()
      expect(th.errors.name).toBeTruthy()
      expect(th.errors.name).not.toBe(en.errors.name)
    }
  })
})
