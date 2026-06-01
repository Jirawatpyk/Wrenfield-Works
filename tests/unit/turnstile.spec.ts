/**
 * T072 (unit) — Cloudflare Turnstile verification (FR-025, privacy-friendly challenge).
 *
 * The challenge layer of the inquiry spam defense. Rules:
 *   - SKIP (ok) when no secret is configured, so local dev / the test DB work
 *     without a live Cloudflare key.
 *   - When configured, POST the token to siteverify and honor `success`.
 *   - FAIL CLOSED on a network/parse error (treat as not-verified), so an outage
 *     can't be used to bypass the challenge.
 *
 * Source of truth: src/lib/turnstile.ts. `fetch` is injected for testing.
 */
import { describe, it, expect, vi } from 'vitest'

import { verifyTurnstile } from '@/lib/turnstile'

const okResponse = (body: unknown) => ({ ok: true, json: async () => body }) as unknown as Response

describe('verifyTurnstile', () => {
  it('skips (ok) when no secret is configured', async () => {
    const fetchImpl = vi.fn()
    const r = await verifyTurnstile('any', { secret: undefined, fetchImpl })
    expect(r.ok).toBe(true)
    expect(r.skipped).toBe(true)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('verifies the token via siteverify and honors success:true', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({ success: true }))
    const r = await verifyTurnstile('tok', { secret: 's3cr3t', fetchImpl, remoteIp: '1.2.3.4' })
    expect(r.ok).toBe(true)
    expect(fetchImpl).toHaveBeenCalledOnce()
  })

  it('returns ok:false when siteverify reports success:false', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({ success: false }))
    const r = await verifyTurnstile('tok', { secret: 's3cr3t', fetchImpl })
    expect(r.ok).toBe(false)
  })

  it('fails closed (ok:false) when fetch rejects', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network down'))
    const r = await verifyTurnstile('tok', { secret: 's3cr3t', fetchImpl })
    expect(r.ok).toBe(false)
  })

  it('fails closed when the response is not ok / unparseable', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error('bad json')
      },
    } as unknown as Response)
    const r = await verifyTurnstile('tok', { secret: 's3cr3t', fetchImpl })
    expect(r.ok).toBe(false)
  })

  it('fails closed when the token is empty but a secret is configured', async () => {
    const fetchImpl = vi.fn()
    const r = await verifyTurnstile('', { secret: 's3cr3t', fetchImpl })
    expect(r.ok).toBe(false)
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
