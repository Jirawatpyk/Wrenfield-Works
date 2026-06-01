/**
 * T074 (unit) — Studio inquiry-notification email (FR-029).
 *
 * Two concerns, both unit-testable without a real SMTP server:
 *   1. `buildInquiryNotification` is PURE — it composes the message and MUST
 *      neutralize attacker-controlled content (HTML-escape the body, strip CR/LF
 *      from the subject) so an inquiry can't inject markup or email headers.
 *   2. `sendInquiryNotification` is FAILURE-ISOLATED — it wraps the injected
 *      transport so a send error is swallowed (logged) and NEVER throws, which is
 *      what lets the route keep the stored inquiry even when delivery fails.
 *
 * Source of truth: src/lib/email.ts. The end-to-end "record survives a failed
 * send" guarantee is also proven through Payload in tests/integration/us3-email-isolation.spec.ts.
 */
import { describe, it, expect, vi } from 'vitest'

import { buildInquiryNotification, sendInquiryNotification } from '@/lib/email'

const inquiry = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'We need an internal tool.',
  locale: 'en' as const,
  submittedAt: '2026-06-01T08:00:00.000Z',
}

describe('buildInquiryNotification (pure)', () => {
  it('addresses the studio and includes the sender details', () => {
    const msg = buildInquiryNotification(inquiry, {
      to: 'studio@wrenfieldworks.com',
      from: 'Site <noreply@wrenfieldworks.com>',
    })
    expect(msg.to).toBe('studio@wrenfieldworks.com')
    expect(msg.from).toBe('Site <noreply@wrenfieldworks.com>')
    expect(msg.subject).toContain('Ada Lovelace')
    expect(msg.text).toContain('ada@example.com')
    expect(msg.text).toContain('We need an internal tool.')
  })

  it('HTML-escapes attacker-controlled content in the html body', () => {
    const msg = buildInquiryNotification(
      { ...inquiry, message: '<script>alert(1)</script> & "quotes"' },
      { to: 'studio@x.com', from: 'a@x.com' },
    )
    expect(msg.html).not.toContain('<script>')
    expect(msg.html).toContain('&lt;script&gt;')
    expect(msg.html).toContain('&amp;')
  })

  it('strips CR/LF from the subject (header-injection defense)', () => {
    const msg = buildInquiryNotification(
      { ...inquiry, name: 'Evil\r\nBcc: victim@x.com' },
      { to: 'studio@x.com', from: 'a@x.com' },
    )
    expect(msg.subject).not.toMatch(/[\r\n]/)
  })

  it('falls back to env addresses when not provided', () => {
    const prevTo = process.env.INQUIRY_NOTIFY_TO
    const prevFrom = process.env.EMAIL_FROM
    process.env.INQUIRY_NOTIFY_TO = 'env-to@x.com'
    process.env.EMAIL_FROM = 'env-from@x.com'
    try {
      const msg = buildInquiryNotification(inquiry)
      expect(msg.to).toBe('env-to@x.com')
      expect(msg.from).toBe('env-from@x.com')
    } finally {
      process.env.INQUIRY_NOTIFY_TO = prevTo
      process.env.EMAIL_FROM = prevFrom
    }
  })
})

describe('sendInquiryNotification (failure-isolated, FR-029)', () => {
  it('sends the built message and reports success', async () => {
    const send = vi.fn().mockResolvedValue({ messageId: 'x' })
    const r = await sendInquiryNotification(inquiry, send, { to: 's@x.com', from: 'a@x.com' })
    expect(r.sent).toBe(true)
    expect(send).toHaveBeenCalledOnce()
    const passed = send.mock.calls[0]![0]
    expect(passed.to).toBe('s@x.com')
    expect(passed.subject).toContain('Ada Lovelace')
  })

  it('does NOT throw and reports {sent:false} when the transport rejects', async () => {
    const send = vi.fn().mockRejectedValue(new Error('SMTP down'))
    const r = await sendInquiryNotification(inquiry, send, { to: 's@x.com', from: 'a@x.com' })
    expect(r.sent).toBe(false)
  })

  it('does NOT throw when the transport throws synchronously', async () => {
    const send = vi.fn(() => {
      throw new Error('boom')
    })
    const r = await sendInquiryNotification(inquiry, send, { to: 's@x.com', from: 'a@x.com' })
    expect(r.sent).toBe(false)
  })
})
