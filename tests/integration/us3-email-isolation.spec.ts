/**
 * T066 [US3] — Email failure isolation (FR-029).
 *
 * When the studio notification email fails, the visitor's inquiry MUST still be
 * stored and the request MUST still succeed (the email is best-effort). We force
 * the transport to reject by stubbing `payload.sendEmail`, submit a valid inquiry
 * through the real route, and assert: (1) the response is 201 (not 500), (2) the
 * send was attempted and rejected, (3) the record persisted regardless.
 *
 * Source of truth: src/collections/Inquiries.ts (afterChange hook) + src/lib/email.ts.
 */
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import type { Payload } from 'payload'

import { getTestPayload } from './helpers'
import { POST } from '@/app/api/inquiries/submit/route'

const RUN = Date.now()

describe('T066 — email failure does not lose the stored inquiry', () => {
  let payload: Payload
  let originalSendEmail: Payload['sendEmail']

  beforeAll(async () => {
    payload = await getTestPayload()
    originalSendEmail = payload.sendEmail
  }, 120_000)

  afterEach(() => {
    payload.sendEmail = originalSendEmail
  })

  it('returns 201 and persists the inquiry even when sendEmail rejects', async () => {
    const sendSpy = vi.fn().mockRejectedValue(new Error('SMTP down'))
    // The collection's afterChange hook sends via req.payload.sendEmail.
    payload.sendEmail = sendSpy as unknown as Payload['sendEmail']

    const email = `isolated+${RUN}@example.com`
    const res = await POST(
      new Request('http://localhost:3000/api/inquiries/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.66.0.1' },
        body: JSON.stringify({
          name: 'Katherine Johnson',
          email,
          message: 'Need orbital-mechanics tooling.',
          locale: 'en',
          consent: true,
          turnstileToken: 'test-token',
        }),
      }),
    )

    // The request succeeds despite the email failure (no 500, no rollback).
    expect(res.status).toBe(201)

    // The email send WAS attempted (and rejected) — proving the wiring, not a skip.
    expect(sendSpy).toHaveBeenCalled()

    // The inquiry is in the inbox.
    const found = await payload.find({
      collection: 'inquiries' as never,
      where: { email: { equals: email } } as never,
      overrideAccess: true,
      limit: 1,
    })
    expect(found.docs).toHaveLength(1)
  })
})
