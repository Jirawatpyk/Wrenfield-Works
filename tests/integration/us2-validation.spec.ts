/**
 * US2 / T049 — Per-type content validation (FR-019).
 *
 * Two independent rules, exercised through the Payload Local API against the
 * isolated test Postgres:
 *
 *   1. Stat numeric (GREEN — already enforced by the `number` field type):
 *      creating a `stats` row whose `value` is a non-numeric string must reject;
 *      a real number succeeds.
 *
 *   2. Link URL validation (RED — NOT implemented yet): saving a
 *      `call-to-action` `socialLinks[].url` that is a clearly malformed URL must
 *      reject with a validation error, even on a DRAFT save (the URL rule must
 *      run regardless of `_status`). A well-formed URL saves fine.
 *
 * The URL save is kept on a DRAFT (`_status: 'draft'`) so the publish-completeness
 * gate (FR-014) never fires — this isolates the URL rule from the publish gate.
 *
 * Strict TDD: expectation is MIXED. (1) passes today; (2) is expected to FAIL
 * until per-type URL validation lands on the link fields. That is correct.
 *
 * The test DB persists across runs, so every fixture uses a unique numeric
 * suffix from the current millisecond timestamp and created `stats` rows are
 * deleted in afterAll. Globals are singletons and need no cleanup.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { Payload } from 'payload'

import { getTestPayload } from './helpers'

// Unique-per-run suffix so reruns against the persistent test DB never collide.
const RUN = Date.now()

/** Minimal valid Lexical richText value (mirrors src/seed/seed.ts `rt`). */
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

/**
 * A complete, valid `call-to-action` draft payload for the active (EN) locale,
 * EXCEPT the single `socialLinks[].url` under test. Every other field is filled
 * so a draft save passes field-level `required` validation and only the URL is
 * the variable.
 */
const ctaDraft = (url: string) => ({
  _status: 'draft' as const,
  kicker: `Let's build ${RUN}`,
  heading: rt(`Have something worth building? ${RUN}`),
  body: `Tell us what you're trying to ship — ${RUN}.`,
  email: `hello+${RUN}@wrenfieldworks.com`,
  bookCallLabel: 'Book a call',
  socialLinks: [{ label: 'LinkedIn', url }],
})

describe('US2 T049 — per-type content validation (FR-019)', () => {
  let payload: Payload
  const createdStatIds: Array<string | number> = []

  beforeAll(async () => {
    payload = await getTestPayload()
  }, 120_000)

  afterAll(async () => {
    for (const id of createdStatIds) {
      try {
        await payload.delete({ collection: 'stats', id, overrideAccess: true })
      } catch {
        // already gone / never persisted — ignore
      }
    }
  }, 120_000)

  // --- 1. Stat numeric (GREEN) ------------------------------------------------

  describe('stat value must be numeric', () => {
    it('rejects a non-numeric string for value', async () => {
      await expect(
        payload.create({
          collection: 'stats',
          locale: 'en',
          overrideAccess: true,
          data: {
            order: 900_000 + (RUN % 1000),
            // Malformed: a string that is not a number.
            value: 'not-a-number' as unknown as number,
            unit: '+',
            label: `Bad value ${RUN}`,
            _status: 'draft',
          },
        }),
      ).rejects.toThrow()
    })

    it('accepts a real number for value (control)', async () => {
      const doc = (await payload.create({
        collection: 'stats',
        locale: 'en',
        overrideAccess: true,
        data: {
          order: 901_000 + (RUN % 1000),
          value: 42,
          unit: '+',
          label: `Good value ${RUN}`,
          _status: 'draft',
        },
      })) as { id: string | number; value: number }

      createdStatIds.push(doc.id)
      expect(doc.value).toBe(42)
    })
  })

  // --- 2. Link URL validation (RED — not implemented yet) ---------------------

  describe('socialLinks url must be a valid URL', () => {
    it('rejects a clearly malformed URL on a draft save', async () => {
      await expect(
        payload.updateGlobal({
          slug: 'call-to-action',
          locale: 'en',
          overrideAccess: true,
          // Clearly malformed URL (contains a space, no scheme/anchor).
          data: ctaDraft('not a url') as never,
        }),
      ).rejects.toThrow(/url|link|valid/i)
    })

    it('accepts a well-formed URL on a draft save (control)', async () => {
      const result = (await payload.updateGlobal({
        slug: 'call-to-action',
        locale: 'en',
        overrideAccess: true,
        data: ctaDraft('https://example.com') as never,
      })) as { socialLinks?: Array<{ url?: string }> }

      expect(result.socialLinks?.[0]?.url).toBe('https://example.com')
    })

    // A field-level custom `validate` REPLACES Payload's built-in `required` check, so the
    // validator must enforce required itself — an empty URL on a required link must be rejected.
    it('rejects an EMPTY url on a required link field', async () => {
      await expect(
        payload.updateGlobal({
          slug: 'call-to-action',
          locale: 'en',
          overrideAccess: true,
          data: ctaDraft('') as never,
        }),
      ).rejects.toThrow(/required|valid|url|link/i)
    })
  })
})
