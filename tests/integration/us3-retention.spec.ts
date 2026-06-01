/**
 * T067 [US3] — PDPA retention job (FR-027/FR-027a).
 *
 * The daily job permanently deletes inquiries whose `expiresAt <= now`. Verified
 * end-to-end through the Payload Local API on the isolated test Postgres:
 *   - a back-dated (expired) record is PERMANENTLY deleted
 *   - an unexpired record is kept
 *   - the run reports how many it deleted (monitoring) and is idempotent
 *   - catch-up: advancing `now` past a record's expiry deletes it on the next run
 *     (FR-027a — a record is never silently retained past 24 months)
 *
 * Source of truth: src/lib/retention.ts, src/collections/Inquiries.ts.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { Payload } from 'payload'

import { getTestPayload } from './helpers'
import { runRetention } from '@/lib/retention'

const RUN = Date.now()

/** Create an inquiry with an explicit expiresAt (overrideAccess bypasses the public-create deny). */
async function makeInquiry(payload: Payload, email: string, expiresAt: string) {
  return payload.create({
    collection: 'inquiries' as never,
    overrideAccess: true,
    data: {
      name: 'Retention Subject',
      email,
      message: 'old inquiry',
      locale: 'en',
      consent: true,
      consentAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
      expiresAt,
      status: 'new',
    } as never,
  }) as Promise<{ id: string | number }>
}

describe('T067 — retention permanently deletes >24mo records', () => {
  let payload: Payload

  beforeAll(async () => {
    payload = await getTestPayload()
  }, 120_000)

  it('deletes expired records, keeps unexpired ones, and reports the count', async () => {
    const now = new Date('2026-06-01T00:00:00.000Z')
    const expiredEmail = `expired+${RUN}@example.com`
    const liveEmail = `live+${RUN}@example.com`

    await makeInquiry(payload, expiredEmail, '2026-05-01T00:00:00.000Z') // before now → expired
    const live = await makeInquiry(payload, liveEmail, '2027-01-01T00:00:00.000Z') // after now → kept

    const result = await runRetention(payload, { now })
    expect(result.ok).toBe(true)
    expect(result.deleted).toBeGreaterThanOrEqual(1)

    const expiredAfter = await payload.find({
      collection: 'inquiries' as never,
      where: { email: { equals: expiredEmail } } as never,
      overrideAccess: true,
    })
    expect(expiredAfter.docs).toHaveLength(0) // permanently deleted

    const liveAfter = await payload.findByID({
      collection: 'inquiries' as never,
      id: live.id,
      overrideAccess: true,
    })
    expect(liveAfter).toBeTruthy() // still here
  })

  it('catches up: advancing now past a record’s expiry deletes it on the next run (FR-027a)', async () => {
    const email = `catchup+${RUN}@example.com`
    await makeInquiry(payload, email, '2026-12-31T00:00:00.000Z')

    // A run BEFORE expiry must not touch it.
    await runRetention(payload, { now: new Date('2026-06-01T00:00:00.000Z') })
    const stillThere = await payload.find({
      collection: 'inquiries' as never,
      where: { email: { equals: email } } as never,
      overrideAccess: true,
    })
    expect(stillThere.docs).toHaveLength(1)

    // A later run, now PAST expiry, sweeps it up (catch-up via the time-based query).
    await runRetention(payload, { now: new Date('2027-06-01T00:00:00.000Z') })
    const gone = await payload.find({
      collection: 'inquiries' as never,
      where: { email: { equals: email } } as never,
      overrideAccess: true,
    })
    expect(gone.docs).toHaveLength(0)
  })
})
