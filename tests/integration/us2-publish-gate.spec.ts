/**
 * T047 — Publish-completeness gate (FR-014, admin-auth contract).
 *
 * A document may NOT reach `_status: 'published'` while any localized field is
 * missing its EN or TH value; drafts may be saved incomplete. The
 * `publishCompletenessHook` (a `beforeValidate` hook on every content
 * collection/global) throws an `APIError` whose message names the offending
 * field(s):
 *   "Cannot publish: both English and Thai are required. Missing or incomplete: <field>, <field>."
 *
 * This exercises the gate end-to-end through the real Payload Local API against
 * the isolated test Postgres — both a COLLECTION (`stats`) and a GLOBAL (`hero`).
 * It mirrors the publish lifecycle in `src/seed/seed.ts`:
 *   1. write EN as draft  (locale 'en', `_status: 'draft'`)
 *   2. write TH as draft  (locale 'th', same doc)
 *   3. publish            (`_status: 'published'`)
 *
 * Source of truth: `src/lib/validation/publishCompleteness.ts`, `src/seed/seed.ts`.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'

import { getTestPayload } from './helpers'

// Unique suffix so reruns against the PERSISTENT test DB never collide.
const RUN = Date.now()

/** Minimal valid Lexical richText value holding a single plain-text paragraph. */
const rt = (text: string) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          {
            type: 'text',
            format: 0,
            style: '',
            mode: 'normal',
            detail: 0,
            text,
            version: 1,
          },
        ],
      },
    ],
  },
})

describe('T047 — publish-completeness gate (FR-014)', () => {
  let payload: Payload
  // Track every collection row we create so afterAll can purge them.
  const statRowIds: Array<string | number> = []

  beforeAll(async () => {
    payload = await getTestPayload()
  }, 120_000)

  afterAll(async () => {
    for (const id of statRowIds) {
      try {
        await payload.delete({ collection: 'stats', id, overrideAccess: true })
      } catch {
        // already gone — ignore
      }
    }
  })

  // ---------------------------------------------------------------------------
  // 1 + 2. Collection (`stats`): EN-only draft is blocked from publishing, then
  //        succeeds once the TH label is supplied.
  // ---------------------------------------------------------------------------
  describe('collection: stats', () => {
    let statId: string | number
    const enLabel = `Systems shipped ${RUN}`
    const thLabel = `ระบบที่ส่งมอบ ${RUN}`

    beforeAll(async () => {
      // Create as a DRAFT with EN label only (value + unit are mono / non-localized).
      const doc = await payload.create({
        collection: 'stats',
        locale: 'en',
        data: {
          order: 0,
          value: 60,
          unit: '+',
          label: enLabel,
          _status: 'draft',
        } as never,
        overrideAccess: true,
      })
      statId = (doc as { id: string | number }).id
      statRowIds.push(statId)
    }, 120_000)

    it('saves an incomplete (TH-missing) draft without complaint', async () => {
      const doc = await payload.findByID({
        collection: 'stats',
        id: statId,
        overrideAccess: true,
      })
      expect((doc as { _status?: string })._status).toBe('draft')
      expect((doc as { label?: string }).label).toBe(enLabel)
    })

    it('rejects publishing while the TH label is missing, naming the field', async () => {
      const attempt = payload.update({
        collection: 'stats',
        id: statId,
        data: { _status: 'published' } as never,
        overrideAccess: true,
      })
      await expect(attempt).rejects.toThrow(/both English and Thai are required/)
      await expect(attempt).rejects.toThrow(/label/)
    })

    it('leaves the doc unpublished after a blocked publish', async () => {
      const doc = await payload.findByID({
        collection: 'stats',
        id: statId,
        overrideAccess: true,
      })
      expect((doc as { _status?: string })._status).toBe('draft')
    })

    it('publishes successfully once the TH label is supplied', async () => {
      // Write the Thai locale as a draft, then publish.
      await payload.update({
        collection: 'stats',
        id: statId,
        locale: 'th',
        data: { label: thLabel } as never,
        overrideAccess: true,
      })
      const published = await payload.update({
        collection: 'stats',
        id: statId,
        data: { _status: 'published' } as never,
        overrideAccess: true,
      })
      expect((published as { _status?: string })._status).toBe('published')

      // Both locales survived the publish.
      const en = await payload.findByID({
        collection: 'stats',
        id: statId,
        locale: 'en',
        overrideAccess: true,
      })
      const th = await payload.findByID({
        collection: 'stats',
        id: statId,
        locale: 'th',
        overrideAccess: true,
      })
      expect((en as { label?: string }).label).toBe(enLabel)
      expect((th as { label?: string }).label).toBe(thLabel)
    })
  })

  // ---------------------------------------------------------------------------
  // 3. Global (`hero`): an EN-only draft (no Thai provided at all) is blocked from
  //    publishing, then succeeds once the full Thai side is supplied.
  //
  //    NOTE — why EN-only rather than "all-TH-except-one-field": for a global,
  //    writing the TH locale while OMITTING a field makes Payload back-fill that
  //    field's TH column from the EN fallback at write time, so a partial-TH write
  //    can never produce a genuinely-blank TH field. The real FR-014 scenario a
  //    global must guard is "editor never provided Thai", which an EN-only draft
  //    reproduces faithfully. Relies on a clean test DB (`pnpm test:integration`
  //    truncates first) so no prior TH values linger.
  // ---------------------------------------------------------------------------
  describe('global: hero', () => {
    const thKicker = `สร้างอย่างถูกต้อง ${RUN}`

    beforeAll(async () => {
      // A complete EN draft, with NO Thai written at all.
      await payload.updateGlobal({
        slug: 'hero',
        locale: 'en',
        data: {
          kicker: `Built right ${RUN}`,
          headline: rt(`Headline EN ${RUN}`),
          subhead: rt(`Subhead EN ${RUN}`),
          trustLabel: `Trust EN ${RUN}`,
          primaryCtaLabel: `Primary EN ${RUN}`,
          secondaryCtaLabel: `Secondary EN ${RUN}`,
          _status: 'draft',
        } as never,
        overrideAccess: true,
      })
    }, 120_000)

    it('rejects publishing an EN-only global, naming a missing Thai field', async () => {
      const attempt = payload.updateGlobal({
        slug: 'hero',
        data: { _status: 'published' } as never,
        overrideAccess: true,
      })
      await expect(attempt).rejects.toThrow(/both English and Thai are required/)
      await expect(attempt).rejects.toThrow(/kicker/)
    })

    it('publishes successfully once the full Thai side is supplied', async () => {
      await payload.updateGlobal({
        slug: 'hero',
        locale: 'th',
        data: {
          kicker: thKicker,
          headline: rt(`Headline TH ${RUN}`),
          subhead: rt(`Subhead TH ${RUN}`),
          trustLabel: `Trust TH ${RUN}`,
          primaryCtaLabel: `Primary TH ${RUN}`,
          secondaryCtaLabel: `Secondary TH ${RUN}`,
        } as never,
        overrideAccess: true,
      })
      const published = await payload.updateGlobal({
        slug: 'hero',
        data: { _status: 'published' } as never,
        overrideAccess: true,
      })
      expect((published as { _status?: string })._status).toBe('published')

      const th = await payload.findGlobal({
        slug: 'hero',
        locale: 'th',
        overrideAccess: true,
      })
      expect((th as { kicker?: string }).kicker).toBe(thKicker)
    })
  })
})
