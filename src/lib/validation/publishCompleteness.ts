import type { CollectionBeforeValidateHook, Field, GlobalBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

import {
  isBlank,
  walkLocalizedLeaves,
  VALUE_FIELD_TYPES,
  type AnyRecord,
  type LocaleMap,
} from './localeFields'

/**
 * Publish-completeness gate (FR-014, admin-auth contract). A document may not
 * reach `published` status while any localized field is missing its EN or TH
 * value. Drafts may be saved incomplete. Enforced — not advisory.
 *
 * Why `locale: 'all'` (and NOT a per-locale read): the project enables
 * `localization.fallback`, so reading `locale: 'th'` returns the EN value when
 * TH is missing — which would let incomplete content slip through the gate. A
 * `locale: 'all'` read does NOT fall back; it returns every localized leaf as a
 * `{ en, th }` map (verified to hold for fields nested inside arrays/blocks too),
 * so a blank locale is detectable.
 *
 * The incoming write (flat, active-locale) is overlaid onto the active side of
 * those maps so that clearing a value and publishing in the same save is caught.
 *
 * `isBlank`, `VALUE_FIELD_TYPES`, `LocaleMap`, and the schema walk live in
 * `./localeFields` so the readiness badge and the bilingual error share one
 * definition (T1).
 */

/** A localized leaf under `locale: 'all'` is `{ en, th }`; incomplete if either is blank. */
function localeMapIncomplete(value: unknown): boolean {
  if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
    return true
  }
  const map = value as LocaleMap
  return isBlank(map.en) || isBlank(map.th)
}

/** Walk the schema over a `locale: 'all'`-shaped doc, collecting incomplete localized leaves. */
function collectMissing(fields: Field[], data: AnyRecord, prefix: string): string[] {
  const missing: string[] = []
  walkLocalizedLeaves(fields, data, prefix, (path, value) => {
    if (localeMapIncomplete(value)) missing.push(path)
  })
  return missing
}

type MissingDetail = { label: string; path: string; enMissing: boolean; thMissing: boolean }

/** Walk the schema over a `locale: 'all'`-shaped doc, collecting incomplete leaves with detail. */
function collectMissingDetailed(fields: Field[], data: AnyRecord, prefix: string): MissingDetail[] {
  const out: MissingDetail[] = []
  walkLocalizedLeaves(fields, data, prefix, (path, value, label) => {
    const map = (
      value && typeof value === 'object' && !Array.isArray(value) ? (value as LocaleMap) : {}
    ) as LocaleMap
    const enMissing = isBlank(map.en)
    const thMissing = isBlank(map.th)
    if (enMissing || thMissing) out.push({ label: label || path, path, enMissing, thMissing })
  })
  return out
}

/**
 * Overlay the incoming active-locale write onto the active side of the stored
 * `{ en, th }` maps, so clearing-then-publishing in one save is detected. Only
 * top-level / group value fields are overlaid; arrays & blocks keep the stored
 * `locale: 'all'` shape (their localized rows were persisted on the draft save —
 * the only flow that reaches publish here).
 */
function overlayActiveLocale(
  fields: Field[],
  stored: AnyRecord,
  incoming: AnyRecord | undefined,
  active: 'en' | 'th',
): AnyRecord {
  if (!incoming) return stored
  const out: AnyRecord = { ...stored }

  for (const field of fields) {
    if (field.type === 'ui') continue

    if ((field.type === 'row' || field.type === 'collapsible') && 'fields' in field) {
      Object.assign(out, overlayActiveLocale(field.fields, out, incoming, active))
      continue
    }

    if (!('name' in field) || !field.name) continue
    const name = field.name
    if (!(name in incoming)) continue
    const localized = 'localized' in field && field.localized === true

    if (VALUE_FIELD_TYPES.has(field.type)) {
      if (localized) {
        const existing = (out[name] as LocaleMap) ?? {}
        out[name] = { ...existing, [active]: incoming[name] }
      } else {
        out[name] = incoming[name]
      }
      continue
    }

    if (field.type === 'group' && 'fields' in field) {
      out[name] = overlayActiveLocale(
        field.fields,
        (out[name] as AnyRecord) ?? {},
        incoming[name] as AnyRecord,
        active,
      )
    }
    // arrays/blocks: keep stored locale:'all' (see doc comment).
  }

  return out
}

function getFields(
  args: Parameters<CollectionBeforeValidateHook>[0] | Parameters<GlobalBeforeValidateHook>[0],
): Field[] {
  if ('collection' in args && args.collection) return args.collection.fields
  if ('global' in args && args.global) return args.global.fields
  return []
}

async function fetchAllLocales(
  args: Parameters<CollectionBeforeValidateHook>[0] | Parameters<GlobalBeforeValidateHook>[0],
): Promise<AnyRecord> {
  const { req } = args
  try {
    if ('collection' in args && args.collection) {
      const id =
        (args.originalDoc as AnyRecord | undefined)?.id ?? (args.data as AnyRecord | undefined)?.id
      if (!id) return {}
      return (await req.payload.findByID({
        collection: args.collection.slug,
        id: id as string | number,
        locale: 'all',
        // Disable locale fallback: with `localization.fallback` on, a blank locale
        // value is back-filled from the other locale even under `locale:'all'`
        // (verified empirically), which would let an EN-only document slip past the
        // gate. `'none'` disables read-time fallback so a never-written locale comes
        // back absent and is detectable (FR-014).
        fallbackLocale: 'none',
        draft: true,
        depth: 0,
        overrideAccess: true,
        req,
      })) as unknown as AnyRecord
    }
    if ('global' in args && args.global) {
      return (await req.payload.findGlobal({
        slug: args.global.slug,
        locale: 'all',
        fallbackLocale: 'none',
        draft: true,
        depth: 0,
        overrideAccess: true,
        req,
      })) as unknown as AnyRecord
    }
  } catch (err) {
    // Surface a degraded completeness check (transient DB error) instead of silently
    // proceeding on partial data — the gate only runs on the publish transition.
    req.payload?.logger?.error?.({ err }, 'publish-completeness: locale:all read failed')
    return {}
  }
  return {}
}

/**
 * Shared `beforeValidate` hook. Attach to every content collection and global
 * that has localized fields. No-op unless the write transitions to `published`.
 */
export const publishCompletenessHook: CollectionBeforeValidateHook &
  GlobalBeforeValidateHook = async (args) => {
  const { data, req } = args as { data?: AnyRecord; req: { locale?: string } }
  if (!data || data._status !== 'published') return data

  const fields = getFields(args)
  const stored = await fetchAllLocales(args)

  // Overlay the incoming active-locale write onto the stored {en,th} maps so a
  // clear-then-publish in one save is caught. Only the two known locales can be
  // "active"; for any other context (e.g. Payload's internal locale:'all'), skip the
  // overlay and validate the stored doc as-is rather than mis-overlaying onto EN.
  const rawLocale = (req as { locale?: string }).locale
  const merged =
    rawLocale === 'en' || rawLocale === 'th'
      ? overlayActiveLocale(fields, stored, data, rawLocale)
      : stored

  const missing = collectMissingDetailed(fields, merged, '')
  if (missing.length > 0) {
    const lang = (req as { i18n?: { language?: string } }).i18n?.language === 'th' ? 'th' : 'en'
    // Name each field by its human label, but keep the raw path token in
    // parentheses so editors can locate a field even when its label differs
    // from its machine name (e.g. Stats' `label` field is labelled "Label").
    const name = (m: MissingDetail) => (m.label === m.path ? m.label : `${m.label} (${m.path})`)
    const enList = missing.filter((m) => m.enMissing).map(name)
    const thList = missing.filter((m) => m.thMissing).map(name)

    const parts: string[] = []
    if (lang === 'th') {
      // The EN phrase MUST stay verbatim ("Cannot publish … both English and
      // Thai") for the US2 regression regex, so we prefix it even in TH-locale
      // builds, then append the Thai-language detail.
      parts.push('Cannot publish: both English and Thai are required.')
      if (enList.length) parts.push(`ยังขาดภาษาอังกฤษ: ${enList.join(', ')}.`)
      if (thList.length) parts.push(`ยังขาดภาษาไทย: ${thList.join(', ')}.`)
    } else {
      parts.push('Cannot publish: both English and Thai are required.')
      if (enList.length) parts.push(`English still needed: ${enList.join(', ')}.`)
      if (thList.length) parts.push(`Thai still needed: ${thList.join(', ')}.`)
    }

    throw new APIError(parts.join(' '), 400, undefined, true)
  }

  return data
}

// Exported for unit testing (T047).
export const __test = {
  isBlank,
  localeMapIncomplete,
  collectMissing,
  collectMissingDetailed,
  overlayActiveLocale,
}
