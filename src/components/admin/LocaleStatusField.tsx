import { getTranslation } from '@payloadcms/translations'
import type { I18nClient } from '@payloadcms/translations'
import * as React from 'react'
import type { CollectionSlug, GlobalSlug, Payload, PayloadRequest } from 'payload'

import { adminCopy } from '@/lib/admin/adminCopy'
import { collectLocaleStatus } from '@/lib/admin/completeness'
import { getContentTypes } from '@/lib/admin/contentTypes'

import { LocaleStatusClient } from './LocaleStatusClient'

/**
 * Inline EN/TH status banner for a document's edit view (ui field, T10). Server
 * component: re-reads the saved doc at `locale: 'all'` and reports per-locale
 * completeness as of the last save, including which fields each locale still
 * needs. The client wrapper adds the unsaved-edits warning. Authoritative
 * blocking stays with the publish gate; this is a heads-up.
 *
 * IDENTITY: Payload's field server-component props expose `collectionSlug` but NOT
 * `globalSlug` (see renderField.js / ServerComponentProps), so this component
 * cannot discover which GLOBAL it belongs to from the injected props. Instead the
 * config bakes `contentSlug` + `contentKind` into the field via the object-form
 * component's `serverProps` (makeLocaleStatusField in payload.config.ts), which
 * Payload spreads into this RSC. That is the reliable identity on both kinds.
 */
type Props = {
  payload: Payload
  i18n: I18nClient
  /** Baked-in identity from the field's `serverProps` (NOT a default Payload prop). */
  contentSlug?: string
  contentKind?: 'collection' | 'global'
  /** Default Payload field props, used for the collection re-read. */
  id?: string | number
  /**
   * The active authenticated request. Forwarded to the Local API reads so access
   * resolves against the signed-in editor (mirrors publishCompleteness.ts).
   */
  req?: PayloadRequest
}

const Badge: React.FC<{ label: string; ok: boolean; srLabel: string }> = ({
  label,
  ok,
  srLabel,
}) => (
  <span className={`wf-badge ${ok ? 'wf-badge--ok' : 'wf-badge--bad'}`} aria-label={srLabel}>
    <strong>{label}</strong>
    <span aria-hidden>{ok ? '✓' : '✗'}</span>
  </span>
)

const LocaleStatusField: React.FC<Props> = async ({
  payload,
  i18n,
  contentSlug,
  contentKind,
  id,
  req,
}) => {
  const type = getContentTypes(payload).find((t) => t.slug === contentSlug)
  if (!type) return null

  let doc: Record<string, unknown> = {}
  try {
    if (contentKind === 'global') {
      doc = (await payload.findGlobal({
        slug: type.slug as GlobalSlug,
        locale: 'all',
        fallbackLocale: 'none',
        draft: true,
        depth: 0,
        overrideAccess: true,
        req,
      })) as unknown as Record<string, unknown>
    } else if (id != null) {
      doc = (await payload.findByID({
        collection: type.slug as CollectionSlug,
        id,
        locale: 'all',
        fallbackLocale: 'none',
        draft: true,
        depth: 0,
        overrideAccess: true,
        req,
      })) as unknown as Record<string, unknown>
    } else {
      // New (unsaved) collection doc — no id yet, so nothing saved to report on.
      return null
    }
  } catch {
    return null
  }

  const status = collectLocaleStatus(type.fields, doc)
  const enNeeded = status.missing.filter((m) => !m.en).map((m) => m.label)
  const thNeeded = status.missing.filter((m) => !m.th).map((m) => m.label)
  const tr = (c: { en: string; th: string }) => getTranslation(c, i18n)

  return (
    <LocaleStatusClient>
      <strong>{tr(adminCopy.localeStatusTitle)}:</strong>
      <Badge
        label="EN"
        ok={status.enComplete}
        srLabel={`English ${status.enComplete ? tr(adminCopy.statusReady) : tr(adminCopy.statusNotReady)}`}
      />
      <Badge
        label="TH"
        ok={status.thComplete}
        srLabel={`Thai ${status.thComplete ? tr(adminCopy.statusReady) : tr(adminCopy.statusNotReady)}`}
      />
      {enNeeded.length > 0 ? (
        <span className="wf-locale-status__hint">
          {tr(adminCopy.missingEnLabel)} {enNeeded.join(', ')}
        </span>
      ) : null}
      {thNeeded.length > 0 ? (
        <span className="wf-locale-status__hint">
          {tr(adminCopy.missingThLabel)} {thNeeded.join(', ')}
        </span>
      ) : null}
    </LocaleStatusClient>
  )
}

export default LocaleStatusField
