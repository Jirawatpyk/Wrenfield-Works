/**
 * T076 (unit) — PDPA retention date logic (FR-027).
 *
 * The retention job permanently deletes inquiries older than 24 months. Its date
 * math is pure and unit-tested here; the end-to-end "permanently deletes >24mo
 * records, monitored + catch-up" behavior runs through Payload in
 * tests/integration/us3-retention.spec.ts (T067).
 *
 * Source of truth: src/lib/retention.ts.
 */
import { describe, it, expect, vi } from 'vitest'
import type { Payload } from 'payload'

import {
  addMonths,
  computeExpiresAt,
  isExpired,
  runRetention,
  RETENTION_MONTHS,
} from '@/lib/retention'

describe('addMonths', () => {
  it('adds whole months', () => {
    expect(addMonths(new Date('2024-06-01T00:00:00.000Z'), 24).toISOString()).toBe(
      '2026-06-01T00:00:00.000Z',
    )
  })

  it('clamps end-of-month overflow (Feb 29 + 24mo → Feb 28)', () => {
    // 2024 is a leap year; 2026 is not, so day 29 clamps to 28.
    const r = addMonths(new Date('2024-02-29T00:00:00.000Z'), 24)
    expect(r.getUTCFullYear()).toBe(2026)
    expect(r.getUTCMonth()).toBe(1) // February (0-indexed)
    expect(r.getUTCDate()).toBe(28)
  })

  it('rolls the year over correctly', () => {
    expect(addMonths(new Date('2025-11-15T00:00:00.000Z'), 3).toISOString()).toBe(
      '2026-02-15T00:00:00.000Z',
    )
  })
})

describe('computeExpiresAt', () => {
  it('defaults to a 24-month retention horizon', () => {
    expect(RETENTION_MONTHS).toBe(24)
    const submitted = new Date('2026-06-01T08:00:00.000Z')
    expect(computeExpiresAt(submitted).toISOString()).toBe('2028-06-01T08:00:00.000Z')
  })

  it('accepts a custom retention window', () => {
    const submitted = new Date('2026-06-01T00:00:00.000Z')
    expect(computeExpiresAt(submitted, 12).toISOString()).toBe('2027-06-01T00:00:00.000Z')
  })

  it('accepts an ISO string input', () => {
    expect(computeExpiresAt('2026-01-01T00:00:00.000Z', 24).toISOString()).toBe(
      '2028-01-01T00:00:00.000Z',
    )
  })
})

describe('isExpired', () => {
  const now = new Date('2026-06-01T00:00:00.000Z')

  it('is true when expiresAt is in the past', () => {
    expect(isExpired('2026-05-31T23:59:59.000Z', now)).toBe(true)
  })

  it('is true at exactly the boundary (<=)', () => {
    expect(isExpired('2026-06-01T00:00:00.000Z', now)).toBe(true)
  })

  it('is false when expiresAt is still in the future', () => {
    expect(isExpired('2026-06-01T00:00:01.000Z', now)).toBe(false)
  })
})

describe('runRetention (monitored delete, FR-027/FR-027a)', () => {
  /** Minimal fake Payload whose delete() returns a canned bulk-delete result. */
  const fakePayload = (result: unknown) =>
    ({ delete: vi.fn().mockResolvedValue(result) }) as unknown as Payload

  it('reports the deleted count when the bulk delete fully succeeds', async () => {
    const payload = fakePayload({ docs: [{ id: 1 }, { id: 2 }], errors: [] })
    await expect(
      runRetention(payload, { now: new Date('2026-06-01T00:00:00.000Z') }),
    ).resolves.toEqual({ ok: true, deleted: 2 })
  })

  it('queries by expiresAt <= now', async () => {
    const payload = fakePayload({ docs: [], errors: [] })
    await runRetention(payload, { now: new Date('2026-06-01T00:00:00.000Z') })
    const call = (payload.delete as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(call.collection).toBe('inquiries')
    expect(call.where.expiresAt.less_than_equal).toBe('2026-06-01T00:00:00.000Z')
  })

  it('THROWS when Payload reports per-record delete errors (run marked failed → FR-027a catch-up)', async () => {
    // Payload bulk delete RESOLVES even on partial failure, collecting failures in `errors`.
    const payload = fakePayload({
      docs: [{ id: 1 }],
      errors: [{ id: 2, message: 'fk constraint' }],
    })
    await expect(runRetention(payload)).rejects.toThrow(/failed to delete/i)
  })

  it('propagates an outright delete rejection (so the scheduler records a failed run)', async () => {
    const payload = {
      delete: vi.fn().mockRejectedValue(new Error('db down')),
    } as unknown as Payload
    await expect(runRetention(payload)).rejects.toThrow('db down')
  })
})
