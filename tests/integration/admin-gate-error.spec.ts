import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'

import { getTestPayload } from './helpers'

/**
 * Bilingual, labelled publish-block error (T12). Blocking is unchanged; the
 * message now names the field label and *which locale* is still missing, in the
 * admin's language. The English phrase "Cannot publish: both English and Thai
 * are required." is preserved so the US2 gate regex keeps matching.
 *
 * Determinism over the PERSISTENT test DB: we create our OWN `stats` draft
 * (EN-only) with a unique suffix rather than depend on a shared global's state,
 * so this passes regardless of file run-order or leftover rows.
 */
describe('Admin — bilingual labelled publish-block error', () => {
  let payload: Payload
  let statId: string | number
  const RUN = Date.now()
  const enLabel = `Systems shipped ${RUN}`

  beforeAll(async () => {
    payload = await getTestPayload()
    // A complete EN draft, with NO Thai label written at all → publishing must block.
    const doc = await payload.create({
      collection: 'stats',
      locale: 'en',
      data: { order: 0, value: 60, unit: '+', label: enLabel, _status: 'draft' } as never,
      overrideAccess: true,
    })
    statId = (doc as { id: string | number }).id
  }, 120_000)

  afterAll(async () => {
    try {
      await payload.delete({ collection: 'stats', id: statId, overrideAccess: true })
    } catch {
      // already gone — ignore
    }
  })

  it('names which locale is missing in a structured, human-readable way', async () => {
    let message = ''
    try {
      await payload.update({
        collection: 'stats',
        id: statId,
        data: { _status: 'published' } as never,
        overrideAccess: true,
      })
    } catch (e) {
      message = (e as Error).message
    }
    // US2 regex compatibility: the English gate phrase is always present.
    expect(message).toMatch(/cannot publish/i)
    // The NEW behaviour: the message states the missing locale as a labelled,
    // structured clause ("Thai still needed: …" / "ยังขาดภาษาไทย: …"), which the
    // old flat "Missing or incomplete: <path>" message did not contain.
    expect(message).toMatch(/Thai still needed|ยังขาดภาษาไทย/)
  })
})
