/**
 * T065 [US3] — Contract: POST /api/inquiries rejections (inquiry-api contract,
 * FR-023/FR-025/FR-026):
 *   - 400 with localized field errors on invalid/missing fields
 *   - 400 when consent !== true
 *   - 429 when the honeypot (`company`) is filled
 *   - 429 when the per-IP rate limit is exceeded
 *
 * Runs the real route handler against the test Postgres. Most tests use a unique
 * IP; the rate-limit test deliberately reuses ONE IP to trip the limiter.
 *
 * Source of truth: src/app/api/inquiries/route.ts.
 */
import { describe, it, expect, beforeAll } from 'vitest'

import { getTestPayload } from './helpers'
import { POST } from '@/app/api/inquiries/submit/route'

const RUN = Date.now()
let ipSeq = 0

function postFrom(ip: string, body: Record<string, unknown>): Promise<Response> {
  return POST(
    new Request('http://localhost:3000/api/inquiries/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    }),
  )
}

function uniqueIp(): string {
  ipSeq += 1
  return `10.65.${RUN % 250}.${ipSeq}`
}

const base = {
  name: 'Ada',
  email: `ada+${RUN}@example.com`,
  message: 'Hello there.',
  locale: 'en',
  consent: true,
  turnstileToken: 'test-token',
}

describe('T065 — POST /api/inquiries rejections', () => {
  beforeAll(async () => {
    await getTestPayload()
  }, 120_000)

  it('400 with a localized field error on a malformed email', async () => {
    const res = await postFrom(uniqueIp(), { ...base, email: 'not-an-email' })
    expect(res.status).toBe(400)
    const json = (await res.json()) as { ok: boolean; errors: Record<string, string> }
    expect(json.ok).toBe(false)
    expect(json.errors.email).toBeTruthy()
  })

  it('400 on missing name and message', async () => {
    const res = await postFrom(uniqueIp(), { ...base, name: '', message: '' })
    expect(res.status).toBe(400)
    const json = (await res.json()) as { errors: Record<string, string> }
    expect(json.errors.name).toBeTruthy()
    expect(json.errors.message).toBeTruthy()
  })

  it('400 when consent is not true (FR-026)', async () => {
    const res = await postFrom(uniqueIp(), { ...base, consent: false })
    expect(res.status).toBe(400)
    const json = (await res.json()) as { errors: Record<string, string> }
    expect(json.errors.consent).toBeTruthy()
  })

  it('returns Thai error copy when the submitted locale is th', async () => {
    const en = await postFrom(uniqueIp(), { ...base, email: 'bad' })
    const th = await postFrom(uniqueIp(), { ...base, locale: 'th', email: 'bad' })
    const enJson = (await en.json()) as { errors: Record<string, string> }
    const thJson = (await th.json()) as { errors: Record<string, string> }
    expect(thJson.errors.email).toBeTruthy()
    expect(thJson.errors.email).not.toBe(enJson.errors.email)
  })

  it('429 when the honeypot field is filled (FR-025)', async () => {
    const res = await postFrom(uniqueIp(), { ...base, company: 'Acme Bot Co.' })
    expect(res.status).toBe(429)
    const json = (await res.json()) as { ok: boolean; error: string }
    expect(json.ok).toBe(false)
    expect(json.error).toBeTruthy()
  })

  it('429 once the per-IP rate limit is exceeded (FR-025)', async () => {
    const ip = uniqueIp() // one fixed IP for this test
    // Default limit is 5 / IP / hour; the 6th valid submission must be blocked.
    const statuses: number[] = []
    for (let i = 0; i < 6; i++) {
      const res = await postFrom(ip, {
        ...base,
        email: `rl+${RUN}-${i}@example.com`,
        message: `Rate-limit probe ${i}`,
      })
      statuses.push(res.status)
    }
    expect(statuses.slice(0, 5).every((s) => s === 201)).toBe(true)
    expect(statuses[5]).toBe(429)
  })
})
