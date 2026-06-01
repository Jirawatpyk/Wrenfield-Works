import { getTranslation } from '@payloadcms/translations'
import type { I18nClient } from '@payloadcms/translations'
import * as React from 'react'
import type { CollectionSlug, GlobalSlug, Payload } from 'payload'

import { adminCopy, fill } from '@/lib/admin/adminCopy'
import { collectLocaleStatus } from '@/lib/admin/completeness'
import { getContentTypes } from '@/lib/admin/contentTypes'

/**
 * Publish-readiness panel (beforeDashboard, T9). Server component: reads each
 * content type at `locale: 'all'` / `fallbackLocale: 'none'` / `draft: true` in
 * parallel and renders an EN/TH + status table. Same completeness logic as the
 * gate (previews exactly what publishing allows, FR-014). Distinguishes ready /
 * not ready / not started / error; `Published`/`Draft` stay English (FR-011).
 */
type Row = {
  label: string
  href: string
  state: 'ready' | 'notReady' | 'notStarted' | 'error'
  published: boolean
  count?: number
}

async function loadRow(
  payload: Payload,
  t: ReturnType<typeof getContentTypes>[number],
): Promise<Row> {
  try {
    if (t.kind === 'global') {
      // `t.slug` is a plain string from the config-derived registry; cast to the
      // generated slug union at the API boundary (the slug originates from the
      // sanitized config, so this is sound — mirrors the result casts in the gate).
      const doc = (await payload.findGlobal({
        slug: t.slug as GlobalSlug,
        locale: 'all',
        fallbackLocale: 'none',
        draft: true,
        depth: 0,
        overrideAccess: true,
      })) as unknown as Record<string, unknown>
      const s = collectLocaleStatus(t.fields, doc)
      const state = s.empty ? 'notStarted' : s.enComplete && s.thComplete ? 'ready' : 'notReady'
      return { label: t.label, href: t.href, state, published: doc._status === 'published' }
    }
    const res = await payload.find({
      collection: t.slug as CollectionSlug,
      locale: 'all',
      fallbackLocale: 'none',
      draft: true,
      depth: 0,
      // No limit: readiness must reflect EVERY doc, or it could show "ready" while
      // doc #101 is incomplete. Safe here — admin-only render over small editorial
      // collections (not a public/hot path).
      pagination: false,
      overrideAccess: true,
    })
    const docs = res.docs as unknown as Array<Record<string, unknown>>
    if (docs.length === 0) {
      return { label: t.label, href: t.href, state: 'notStarted', published: false, count: 0 }
    }
    const statuses = docs.map((d) => collectLocaleStatus(t.fields, d))
    const ready = statuses.every((s) => s.enComplete && s.thComplete)
    const published = docs.every((d) => d._status === 'published')
    return {
      label: t.label,
      href: t.href,
      state: ready ? 'ready' : 'notReady',
      published,
      count: docs.length,
    }
  } catch {
    return { label: t.label, href: t.href, state: 'error', published: false }
  }
}

const StateBadge: React.FC<{ state: Row['state']; i18n: I18nClient }> = ({ state, i18n }) => {
  const map = {
    ready: { cls: 'wf-badge--ok', copy: adminCopy.statusReady, glyph: '✓' },
    notReady: { cls: 'wf-badge--bad', copy: adminCopy.statusNotReady, glyph: '✗' },
    notStarted: { cls: 'wf-badge--neutral', copy: adminCopy.statusNotStarted, glyph: '–' },
    error: { cls: 'wf-badge--neutral', copy: adminCopy.readinessError, glyph: '!' },
  }[state]
  const text = getTranslation(map.copy, i18n)
  // No aria-label: the visible `text` already names the state and the glyph is
  // aria-hidden, so status is conveyed by text (not color/glyph alone).
  return (
    <span className={`wf-badge ${map.cls}`}>
      <span aria-hidden>{map.glyph}</span> {text}
    </span>
  )
}

const PublishReadiness: React.FC<{ payload: Payload; i18n: I18nClient }> = async ({
  payload,
  i18n,
}) => {
  const types = getContentTypes(payload)
  const rows = await Promise.all(types.map((t) => loadRow(payload, t)))
  const readyCount = rows.filter((r) => r.state === 'ready').length

  return (
    <section data-testid="wf-publish-readiness" className="wf-card">
      <h3 style={{ margin: '0 0 12px' }}>{getTranslation(adminCopy.readinessTitle, i18n)}</h3>
      <p data-testid="wf-readiness-summary" className="wf-readiness__summary">
        {fill(getTranslation(adminCopy.readinessProgress, i18n), {
          n: readyCount,
          total: rows.length,
        })}
      </p>
      <table className="wf-readiness">
        <thead>
          <tr>
            {/* `Status` / `Published` are intentionally English (FR-011 status labels). */}
            <th scope="col">{getTranslation(adminCopy.readinessColContent, i18n)}</th>
            <th scope="col">Status</th>
            <th scope="col">Published</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td>
                <a href={r.href}>
                  {r.label}
                  {typeof r.count === 'number' ? ` (${r.count})` : ''}
                </a>
              </td>
              <td>
                <StateBadge state={r.state} i18n={i18n} />
              </td>
              <td>{r.published ? 'Published' : 'Draft'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default PublishReadiness
