/**
 * T076 [US3] — Vercel Cron retention endpoint security gate + happy path
 * (FR-027/FR-027a). The endpoint permanently deletes personal data, so it MUST be
 * unreachable without the CRON_SECRET bearer token (fail-closed). Mirrors the
 * preview-route security-gate spec.
 *
 * Source of truth: src/app/api/cron/retention/route.ts.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { Payload } from 'payload'

import { getTestPayload } from './helpers'
import { GET } from '@/app/api/cron/retention/route'

const SECRET = 'integration-cron-secret-0123456789'
const RUN = Date.now()

const req = (auth?: string): Request =>
  new Request('http://localhost:3000/api/cron/retention', {
    headers: auth ? { authorization: auth } : {},
  })

describe('US3 — /api/cron/retention security gate', () => {
  let payload: Payload

  beforeAll(async () => {
    process.env.CRON_SECRET = SECRET
    payload = await getTestPayload()
  }, 120_000)

  it('401 when no Authorization header is present', async () => {
    const res = await GET(req())
    expect(res.status).toBe(401)
  })

  it('401 with a wrong bearer token', async () => {
    const res = await GET(req('Bearer not-the-secret'))
    expect(res.status).toBe(401)
  })

  it('401 with the secret but no Bearer scheme', async () => {
    const res = await GET(req(SECRET))
    expect(res.status).toBe(401)
  })

  it('runs retention with the correct bearer and deletes expired records', async () => {
    const email = `cron+${RUN}@example.com`
    await payload.create({
      collection: 'inquiries' as never,
      overrideAccess: true,
      data: {
        name: 'Cron Subject',
        email,
        message: 'old',
        locale: 'en',
        consent: true,
        consentAt: '2024-01-01T00:00:00.000Z',
        expiresAt: '2000-01-01T00:00:00.000Z', // long expired → must be deleted
        status: 'new',
      } as never,
    })

    const res = await GET(req(`Bearer ${SECRET}`))
    expect(res.status).toBe(200)
    const json = (await res.json()) as { ok: boolean; deleted: number }
    expect(json.ok).toBe(true)
    expect(json.deleted).toBeGreaterThanOrEqual(1)

    const after = await payload.find({
      collection: 'inquiries' as never,
      where: { email: { equals: email } } as never,
      overrideAccess: true,
    })
    expect(after.docs).toHaveLength(0)
  })

  it('401 again when CRON_SECRET is unset (fail-closed)', async () => {
    const prev = process.env.CRON_SECRET
    delete process.env.CRON_SECRET
    try {
      const res = await GET(req(`Bearer ${SECRET}`))
      expect(res.status).toBe(401)
    } finally {
      process.env.CRON_SECRET = prev
    }
  })
})
