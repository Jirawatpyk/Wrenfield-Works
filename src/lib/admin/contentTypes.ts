import type { Field, Payload, SanitizedConfig } from 'payload'

/** A content type the readiness panel reports on (T4). */
export type ContentType = {
  kind: 'global' | 'collection'
  slug: string
  label: string
  fields: Field[]
  /** Admin edit-view URL for this type (collections link to the list view). */
  href: string
}

/**
 * Non-editorial collections to exclude from the readiness panel.
 *
 * NOTE: the real exclusion net is the `hasDrafts` filter in getContentTypes —
 * editorial content opts into `versions.drafts`, while Payload-internal
 * collections (`payload-preferences`, `payload-migrations`, `payload-locked-documents`,
 * `payload-jobs`, …) and the auth/upload collections do NOT, so they're filtered
 * out regardless. This denylist is belt-and-suspenders: it names the well-known
 * infra collections explicitly so the intent is obvious and a future internal
 * collection that ever shipped with drafts still can't leak in.
 */
const NON_CONTENT_COLLECTIONS = new Set([
  'users',
  'media',
  'payload-preferences',
  'payload-migrations',
  'payload-locked-documents',
  'payload-jobs',
])

export function titleFromSlug(slug: string): string {
  return slug
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Derive editorial content types from the sanitized config: every global, plus
 * collections that opt into drafts and aren't infrastructure. Mirrors exactly the
 * set wired with the publish-completeness gate, so the readiness table can't list
 * the wrong things.
 */
export function getContentTypes(payload: Payload): ContentType[] {
  const config = payload.config as SanitizedConfig
  const out: ContentType[] = []

  for (const g of config.globals ?? []) {
    out.push({
      kind: 'global',
      slug: g.slug,
      label: g.label ? String(g.label) : titleFromSlug(g.slug),
      fields: g.fields,
      href: `/admin/globals/${g.slug}`,
    })
  }

  for (const c of config.collections ?? []) {
    if (NON_CONTENT_COLLECTIONS.has(c.slug)) continue
    const hasDrafts = Boolean((c.versions as { drafts?: unknown } | undefined)?.drafts)
    if (!hasDrafts) continue
    out.push({
      kind: 'collection',
      slug: c.slug,
      label: titleFromSlug(c.slug),
      fields: c.fields,
      href: `/admin/collections/${c.slug}`,
    })
  }

  return out
}
