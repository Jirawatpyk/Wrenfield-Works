/**
 * T064 [US3] — Contract: POST /api/inquiries (valid) → 201 + localized confirmation,
 * and the inquiry is persisted with consent + a server-set 24-month expiry
 * (inquiry-api contract, FR-022/FR-026/FR-027).
 *
 * Exercises the real route handler against the isolated test Postgres via the
 * Payload Local API (the route's getPayload({config}) reuses the booted test
 * instance, as in the preview-route spec). No TURNSTILE_SECRET is set, so the
 * challenge is skipped (dev/test). Each request uses a unique IP so the per-IP
 * rate limiter never bleeds across tests.
 *
 * Source of truth: src/app/api/inquiries/route.ts, src/collections/Inquiries.ts.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { Payload } from 'payload'

import { getTestPayload } from './helpers'
import { POST } from '@/app/api/inquiries/submit/route'
import { RESPONSE_MESSAGES } from '@/lib/validation/inquiry'

const RUN = Date.now()

let ipSeq = 0
function postInquiry(body: Record<string, unknown>): Promise<Response> {
  ipSeq += 1
  return POST(
    new Request('http://localhost:3000/api/inquiries/submit', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': `10.64.${RUN % 250}.${ipSeq}`,
      },
      body: JSON.stringify(body),
    }),
  )
}

describe('T064 — POST /api/inquiries (valid) → 201', () => {
  let payload: Payload

  beforeAll(async () => {
    payload = await getTestPayload()
  }, 120_000)

  it('stores the inquiry and returns 201 with the EN confirmation', async () => {
    const email = `ada+${RUN}@example.com`
    const res = await postInquiry({
      name: 'Ada Lovelace',
      email,
      message: 'We need an internal tool to track shipments.',
      locale: 'en',
      consent: true,
      turnstileToken: 'test-token',
    })
    expect(res.status).toBe(201)
    const json = (await res.json()) as { ok: boolean; message: string }
    expect(json.ok).toBe(true)
    expect(json.message).toBe(RESPONSE_MESSAGES.en.confirmation)

    // The record landed in the inbox with the right shape.
    const found = await payload.find({
      collection: 'inquiries' as never,
      where: { email: { equals: email } } as never,
      overrideAccess: true,
      limit: 1,
    })
    expect(found.docs).toHaveLength(1)
    const doc = found.docs[0] as unknown as Record<string, unknown>
    expect(doc.name).toBe('Ada Lovelace')
    expect(doc.locale).toBe('en')
    expect(doc.consent).toBe(true)
    expect(doc.status).toBe('new')
    expect(doc.consentAt).toBeTruthy()
    expect(doc.expiresAt).toBeTruthy()
  })

  it('sets expiresAt ~24 months after submission (FR-027)', async () => {
    const email = `grace+${RUN}@example.com`
    const res = await postInquiry({
      name: 'Grace Hopper',
      email,
      message: 'Looking for a dashboard.',
      locale: 'th',
      consent: true,
      turnstileToken: 'test-token',
    })
    expect(res.status).toBe(201)
    const json = (await res.json()) as { message: string }
    // Confirmation is localized to the submitted locale (TH here).
    expect(json.message).toBe(RESPONSE_MESSAGES.th.confirmation)

    const found = await payload.find({
      collection: 'inquiries' as never,
      where: { email: { equals: email } } as never,
      overrideAccess: true,
      limit: 1,
    })
    const doc = found.docs[0] as unknown as { createdAt: string; expiresAt: string }
    const created = new Date(doc.createdAt)
    const expires = new Date(doc.expiresAt)
    // ~24 months ≈ 730 days; allow a generous window for month-length variation.
    const days = (expires.getTime() - created.getTime()) / 86_400_000
    expect(days).toBeGreaterThan(720)
    expect(days).toBeLessThan(740)
  })
})
