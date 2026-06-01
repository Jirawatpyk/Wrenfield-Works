import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'

import { getContentTypes } from '@/lib/admin/contentTypes'
import { publishCompletenessHook } from '@/lib/validation/publishCompleteness'

import { getTestPayload } from './helpers'

/**
 * Registry ↔ gate parity (code-review follow-up).
 *
 * The dashboard readiness panel derives its content set from `getContentTypes`
 * (globals + draft-enabled collections, minus an infra denylist), while the
 * EN/TH publish gate is wired separately via the `withCollectionContent` /
 * `withGlobalContent` config wrappers. Today they agree — but a future content
 * type added with drafts yet NOT wrapped (or wrapped without drafts) would make
 * the dashboard and the gate silently disagree.
 *
 * This test locks the invariant: every type the readiness panel reports on MUST
 * carry the `publishCompletenessHook`, and every gated content type MUST appear
 * in the registry. If they ever drift, this fails loudly instead of shipping a
 * dashboard that lies about what publishing will allow.
 */
describe('Admin — content registry matches the publish-gate set', () => {
  let payload: Payload

  beforeAll(async () => {
    payload = await getTestPayload()
  }, 120_000)

  /** True if a sanitized collection/global has the publish-completeness gate wired. */
  const hasGate = (entity: { hooks?: { beforeValidate?: unknown[] } }): boolean =>
    Array.isArray(entity.hooks?.beforeValidate) &&
    entity.hooks!.beforeValidate!.includes(publishCompletenessHook)

  it('every readiness-panel content type carries the publish gate', () => {
    const types = getContentTypes(payload)
    expect(types.length).toBeGreaterThan(0)

    const config = payload.config
    for (const t of types) {
      const entity =
        t.kind === 'global'
          ? config.globals?.find((g) => g.slug === t.slug)
          : config.collections?.find((c) => c.slug === t.slug)
      expect(
        entity,
        `registry lists ${t.kind} "${t.slug}" but it is not in the config`,
      ).toBeTruthy()
      expect(
        hasGate(entity as { hooks?: { beforeValidate?: unknown[] } }),
        `readiness lists ${t.kind} "${t.slug}" but it has no publishCompletenessHook (dashboard would disagree with the gate)`,
      ).toBe(true)
    }
  })

  it('every gated content type appears in the readiness registry', () => {
    const registrySlugs = new Set(getContentTypes(payload).map((t) => t.slug))
    const config = payload.config

    const gatedGlobals = (config.globals ?? []).filter(hasGate).map((g) => g.slug)
    const gatedCollections = (config.collections ?? []).filter(hasGate).map((c) => c.slug)

    for (const slug of [...gatedGlobals, ...gatedCollections]) {
      expect(
        registrySlugs.has(slug),
        `"${slug}" carries the publish gate but is missing from getContentTypes() (readiness panel would omit it)`,
      ).toBe(true)
    }
  })
})
