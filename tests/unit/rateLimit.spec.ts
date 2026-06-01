/**
 * T072 (unit) — Per-IP rate limiter for the inquiry endpoint (FR-025).
 *
 * The inquiry write path caps submissions per IP (default 5 / IP / hour). This is
 * one of the three layered spam defenses (challenge + honeypot + rate limit). The
 * limiter is a pure, in-memory sliding window with an INJECTED clock so the
 * time-window behavior is deterministic (no real timers / sleeps).
 *
 * Source of truth: src/lib/rateLimit.ts.
 */
import { describe, it, expect } from 'vitest'

import { createRateLimiter } from '@/lib/rateLimit'

describe('createRateLimiter', () => {
  it('allows up to `max` requests in the window, then blocks', () => {
    let t = 1_000
    const limiter = createRateLimiter({ max: 5, windowMs: 3_600_000, now: () => t })
    for (let i = 0; i < 5; i++) {
      expect(limiter.check('1.1.1.1').allowed).toBe(true)
    }
    expect(limiter.check('1.1.1.1').allowed).toBe(false)
  })

  it('reports the remaining allowance', () => {
    let t = 0
    const limiter = createRateLimiter({ max: 3, windowMs: 1000, now: () => t })
    expect(limiter.check('ip').remaining).toBe(2)
    expect(limiter.check('ip').remaining).toBe(1)
    expect(limiter.check('ip').remaining).toBe(0)
    const blocked = limiter.check('ip')
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('returns a positive retryAfterMs when blocked', () => {
    let t = 10_000
    const limiter = createRateLimiter({ max: 1, windowMs: 5_000, now: () => t })
    expect(limiter.check('ip').allowed).toBe(true)
    const blocked = limiter.check('ip')
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterMs).toBeGreaterThan(0)
    expect(blocked.retryAfterMs).toBeLessThanOrEqual(5_000)
  })

  it('allows again once the window has fully elapsed', () => {
    let t = 0
    const limiter = createRateLimiter({ max: 2, windowMs: 1_000, now: () => t })
    expect(limiter.check('ip').allowed).toBe(true)
    expect(limiter.check('ip').allowed).toBe(true)
    expect(limiter.check('ip').allowed).toBe(false)
    // Advance past the window — the earlier hits age out.
    t = 1_001
    expect(limiter.check('ip').allowed).toBe(true)
  })

  it('tracks each key (IP) independently', () => {
    let t = 0
    const limiter = createRateLimiter({ max: 1, windowMs: 1_000, now: () => t })
    expect(limiter.check('a').allowed).toBe(true)
    expect(limiter.check('a').allowed).toBe(false)
    // A different IP has its own bucket.
    expect(limiter.check('b').allowed).toBe(true)
  })

  it('partially refills as the oldest hit ages out (sliding window)', () => {
    let t = 0
    const limiter = createRateLimiter({ max: 2, windowMs: 1_000, now: () => t })
    expect(limiter.check('ip').allowed).toBe(true) // hit at t=0
    t = 500
    expect(limiter.check('ip').allowed).toBe(true) // hit at t=500
    expect(limiter.check('ip').allowed).toBe(false) // full
    t = 1_001 // the t=0 hit ages out; the t=500 hit remains
    expect(limiter.check('ip').allowed).toBe(true)
  })
})
