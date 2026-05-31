/**
 * US2 — /api/preview security gates (FR-017 drafts-never-public, FR-018 preview).
 *
 * Exercises the route handler's rejection branches directly (the happy path that enables
 * draft mode + redirects needs a Next request context, so it is covered by the T050 E2E).
 * Each rejection is a concrete FR-017 enforcement point: an unsigned/expired/tampered token,
 * an open-redirect path, or a missing staff session must NEVER reach draft content.
 */
import { describe, it, expect, beforeAll } from 'vitest'

import { getTestPayload } from './helpers'
import { signPreviewToken } from '@/lib/preview'
import { GET } from '@/app/api/preview/route'

const SECRET = 'integration-preview-secret-0123456789'

const req = (qs: string): Request => new Request(`http://localhost:3000/api/preview${qs}`)

describe('US2 — /api/preview security gates', () => {
  beforeAll(async () => {
    process.env.PREVIEW_SECRET = SECRET
    // Boot Payload so the route's getPayload({config}) reuses the test instance.
    await getTestPayload()
  }, 120_000)

  it('403 when the token is missing', async () => {
    const res = await GET(req('?path=/en'))
    expect(res.status).toBe(403)
  })

  it('400 on a protocol-relative path (open-redirect attempt)', async () => {
    const exp = Date.now() + 60_000
    const token = signPreviewToken('//evil.com', exp, SECRET)
    const res = await GET(
      req(`?path=${encodeURIComponent('//evil.com')}&exp=${exp}&token=${token}`),
    )
    expect(res.status).toBe(400)
  })

  it('403 when the token is expired', async () => {
    const exp = Date.now() - 1_000
    const token = signPreviewToken('/en', exp, SECRET)
    const res = await GET(req(`?path=/en&exp=${exp}&token=${token}`))
    expect(res.status).toBe(403)
  })

  it('403 when the token is tampered / forged', async () => {
    const exp = Date.now() + 60_000
    const res = await GET(req(`?path=/en&exp=${exp}&token=not-a-valid-signature`))
    expect(res.status).toBe(403)
  })

  it('403 with a valid token but NO authenticated staff session (drafts never leak)', async () => {
    const exp = Date.now() + 60_000
    const token = signPreviewToken('/en', exp, SECRET)
    const res = await GET(req(`?path=/en&exp=${exp}&token=${token}`))
    expect(res.status).toBe(403)
  })
})
