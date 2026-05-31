/**
 * US2 / T046 — Deny-by-default access control (FR-012, contracts/admin-auth.md).
 *
 * Characterizes the existing access foundation in `src/access/index.ts`:
 *   - content collections + globals: create/update/delete = isStaff (authenticated
 *     only); read = publishedOrStaff (anon sees ONLY _status:'published').
 *   - users: read/create/update/delete = isStaff (deny-by-default; no public read).
 *
 * "Anonymous" = overrideAccess:false and NO user. "Staff under real rules" =
 * overrideAccess:false AND user:(await asStaff(payload)).user. Fixtures bypass
 * access with overrideAccess:true.
 *
 * The test DB PERSISTS across runs, so every doc uses a unique millisecond-suffixed
 * marker and is cleaned up in afterAll. Expectation: GREEN (foundation in place).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { getTestPayload, asStaff } from './helpers'

import type { Payload } from 'payload'

// Unique per-run suffix so reruns against the persistent test DB never collide.
const RUN = Date.now()

describe('US2 T046 — deny-by-default access control (FR-012)', () => {
  let payload: Payload
  let staffUser: unknown

  // Tracked fixture ids for teardown.
  let draftStatId: string | number | undefined
  let staffStatId: string | number | undefined

  beforeAll(async () => {
    payload = await getTestPayload()
    staffUser = (await asStaff(payload)).user
  }, 120_000)

  afterAll(async () => {
    for (const id of [draftStatId, staffStatId]) {
      if (id === undefined) continue
      try {
        await payload.delete({ collection: 'stats', id, overrideAccess: true })
      } catch {
        // already gone / never created — ignore
      }
    }
  }, 120_000)

  it('denies ANONYMOUS create of a content doc (stats)', async () => {
    await expect(
      payload.create({
        collection: 'stats',
        locale: 'en',
        data: {
          value: 1,
          unit: '+',
          label: `anon-create-${RUN}`,
          _status: 'draft',
        },
        draft: true,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/forbidden|not allowed|permission/i)
  })

  it('denies ANONYMOUS update of a global (hero)', async () => {
    await expect(
      payload.updateGlobal({
        slug: 'hero',
        locale: 'en',
        data: { kicker: `anon-update-${RUN}` } as never,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/forbidden|not allowed|permission/i)
  })

  it('does NOT leak drafts to ANONYMOUS reads (published-only)', async () => {
    // Staff (fixture, overrideAccess:true) creates a DRAFT stat.
    const draftLabel = `draft-leak-${RUN}`
    const draft = await payload.create({
      collection: 'stats',
      locale: 'en',
      data: {
        value: 7,
        unit: '+',
        label: draftLabel,
        _status: 'draft',
      },
      draft: true,
      overrideAccess: true,
    })
    draftStatId = (draft as { id: string | number }).id

    // Anonymous read must NOT surface the draft.
    const anon = await payload.find({
      collection: 'stats',
      locale: 'en',
      overrideAccess: false,
      limit: 100,
    })
    const anonIds = anon.docs.map((d) => (d as { id: string | number }).id)
    expect(anonIds).not.toContain(draftStatId)

    // Sanity: staff (overrideAccess:true) DOES see the draft.
    const staffView = await payload.find({
      collection: 'stats',
      locale: 'en',
      overrideAccess: true,
      where: { id: { equals: draftStatId } },
      limit: 1,
    })
    expect(staffView.docs.length).toBe(1)
  })

  it('does NOT allow ANONYMOUS listing of users (deny-by-default)', async () => {
    // Users read = isStaff (boolean false for anon) → Forbidden under real rules.
    const listUsers = payload.find({
      collection: 'users',
      overrideAccess: false,
      limit: 100,
    })
    await expect(listUsers).rejects.toThrow(/forbidden|not allowed|permission/i)
  })

  it('ALLOWS STAFF to create + update a content doc under real access rules', async () => {
    const label = `staff-create-${RUN}`
    const created = await payload.create({
      collection: 'stats',
      locale: 'en',
      data: {
        value: 42,
        unit: '%',
        label,
        _status: 'draft',
      },
      draft: true,
      overrideAccess: false,
      user: staffUser,
    })
    staffStatId = (created as { id: string | number }).id
    expect(staffStatId).toBeDefined()

    const updatedLabel = `staff-update-${RUN}`
    const updated = await payload.update({
      collection: 'stats',
      id: staffStatId,
      locale: 'en',
      data: { label: updatedLabel },
      overrideAccess: false,
      user: staffUser,
    })
    expect((updated as { label?: string }).label).toBe(updatedLabel)
  })
})
