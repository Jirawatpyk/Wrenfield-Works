/**
 * T048 — Optimistic-concurrency conflict on a stale save (FR-020a, admin-auth contract §"Concurrency conflict").
 *
 * NEW behavior (expect RED): when an editor saves a document that ANOTHER editor changed after
 * they loaded it, the write must be rejected with a "content changed since you opened it" style
 * message — never a silent overwrite.
 *
 * Mechanism encoded here: the implementation is expected to compare an incoming "last known
 * updated timestamp" against the stored `updatedAt`. The editor passes the timestamp they loaded
 * as `data.updatedAt` on update; if it is older than the stored value, the write is rejected.
 *
 * Today neither the comparison nor the rejection exists, so step 3 below currently SUCCEEDS where
 * it should THROW — this test is RED until FR-020a lands.
 *
 * Self-contained: a unique 'stats' row is created + published in beforeAll and deleted in afterAll.
 * The test DB persists across runs, so all marker values carry a millisecond-timestamp suffix.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { getTestPayload, asStaff } from './helpers'

import type { Payload } from 'payload'

// Unique suffix so reruns against the persistent test DB never collide.
const SUFFIX = Date.now()
const LABEL_EN = `Conflict stat EN ${SUFFIX}`
const LABEL_TH = `Conflict stat TH ${SUFFIX}`

let payload: Payload
let staffUser: unknown
let statId: string | number

describe('T048 — optimistic-concurrency conflict on stale save (FR-020a)', () => {
  beforeAll(async () => {
    payload = await getTestPayload()
    staffUser = (await asStaff(payload)).user

    // Create + publish a 'stats' row: EN draft → TH draft → publish (mirrors src/seed/seed.ts).
    const created = await payload.create({
      collection: 'stats',
      locale: 'en',
      data: {
        order: 0,
        value: 11,
        unit: '+',
        label: LABEL_EN,
        _status: 'draft',
      },
      overrideAccess: true,
    })
    statId = (created as { id: string | number }).id

    await payload.update({
      collection: 'stats',
      id: statId,
      locale: 'th',
      data: { label: LABEL_TH },
      overrideAccess: true,
    })

    await payload.update({
      collection: 'stats',
      id: statId,
      data: { _status: 'published' },
      overrideAccess: true,
    })
  }, 120_000)

  afterAll(async () => {
    if (statId !== undefined) {
      await payload.delete({ collection: 'stats', id: statId, overrideAccess: true })
    }
  })

  it('rejects a save carrying a STALE updatedAt after another editor changed the doc', async () => {
    // 1. First editor loads the doc and captures the timestamp they saw (u1).
    const loaded = await payload.findByID({
      collection: 'stats',
      id: statId,
      overrideAccess: false,
      user: staffUser,
    })
    const loadedUpdatedAt = (loaded as { updatedAt: string }).updatedAt
    expect(loadedUpdatedAt).toBeTruthy()

    // 2. Another editor changes the same row (no updatedAt passed) → stored updatedAt advances (u2).
    const afterOther = await payload.update({
      collection: 'stats',
      id: statId,
      data: { value: 22 },
      overrideAccess: false,
      user: staffUser,
    })
    const u2 = (afterOther as { updatedAt: string }).updatedAt
    // The other editor's write must have moved the stored timestamp forward.
    expect(new Date(u2).getTime()).toBeGreaterThan(new Date(loadedUpdatedAt).getTime())

    // 3. First editor saves with the STALE timestamp → MUST be rejected (no silent overwrite).
    await expect(
      payload.update({
        collection: 'stats',
        id: statId,
        data: { value: 33, updatedAt: loadedUpdatedAt },
        overrideAccess: false,
        user: staffUser,
      }),
    ).rejects.toThrow(/changed since|conflict|stale|modified/i)

    // The rejected write must not have changed the stored value (still the other editor's 22).
    const afterReject = await payload.findByID({
      collection: 'stats',
      id: statId,
      overrideAccess: true,
    })
    expect((afterReject as { value: number }).value).toBe(22)
  })

  it('allows a save carrying the CURRENT updatedAt (control — fresh edit succeeds)', async () => {
    // Re-read to obtain the up-to-date timestamp the editor would now hold.
    const fresh = await payload.findByID({
      collection: 'stats',
      id: statId,
      overrideAccess: false,
      user: staffUser,
    })
    const currentUpdatedAt = (fresh as { updatedAt: string }).updatedAt

    const saved = await payload.update({
      collection: 'stats',
      id: statId,
      data: { value: 44, updatedAt: currentUpdatedAt },
      overrideAccess: false,
      user: staffUser,
    })

    expect((saved as { value: number }).value).toBe(44)
  })
})
