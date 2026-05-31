import type { CollectionBeforeValidateHook, Field, GlobalBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

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
 */

type AnyRecord = Record<string, unknown>
type LocaleMap = { en?: unknown; th?: unknown }

const VALUE_FIELD_TYPES = new Set([
  'text',
  'textarea',
  'richText',
  'email',
  'number',
  'select',
  'code',
  'date',
])

function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') {
    // Lexical richText: empty when no text-bearing or upload children exist.
    const root = (value as AnyRecord).root as AnyRecord | undefined
    if (root && Array.isArray(root.children)) {
      const serialized = JSON.stringify(root.children)
      return !/"text":"\s*\S/.test(serialized) && !serialized.includes('"type":"upload"')
    }
  }
  return false
}

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

  for (const field of fields) {
    if (field.type === 'ui') continue

    if ((field.type === 'row' || field.type === 'collapsible') && 'fields' in field) {
      missing.push(...collectMissing(field.fields, data, prefix))
      continue
    }

    if (field.type === 'tabs' && 'tabs' in field) {
      for (const tab of field.tabs) {
        if ('name' in tab && tab.name) {
          missing.push(
            ...collectMissing(
              tab.fields,
              (data?.[tab.name] as AnyRecord) ?? {},
              `${prefix}${tab.name}.`,
            ),
          )
        } else {
          missing.push(...collectMissing(tab.fields, data, prefix))
        }
      }
      continue
    }

    if (!('name' in field) || !field.name) continue
    const path = `${prefix}${field.name}`
    const localized = 'localized' in field && field.localized === true
    const value = data?.[field.name]

    if (VALUE_FIELD_TYPES.has(field.type)) {
      if (localized && localeMapIncomplete(value)) missing.push(path)
      continue
    }

    if (field.type === 'group' && 'fields' in field) {
      missing.push(...collectMissing(field.fields, (value as AnyRecord) ?? {}, `${path}.`))
      continue
    }

    if (field.type === 'array' && 'fields' in field) {
      const rows = Array.isArray(value) ? (value as AnyRecord[]) : []
      rows.forEach((row, i) => {
        missing.push(...collectMissing(field.fields, row ?? {}, `${path}[${i}].`))
      })
      continue
    }

    if (field.type === 'blocks' && 'blocks' in field) {
      const rows = Array.isArray(value) ? (value as AnyRecord[]) : []
      rows.forEach((row, i) => {
        const block = field.blocks.find((b) => b.slug === row?.blockType)
        if (block) missing.push(...collectMissing(block.fields, row ?? {}, `${path}[${i}].`))
      })
      continue
    }
  }

  return missing
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

  const missing = collectMissing(fields, merged, '')
  if (missing.length > 0) {
    throw new APIError(
      `Cannot publish: both English and Thai are required. Missing or incomplete: ${missing.join(', ')}.`,
      400,
      undefined,
      true,
    )
  }

  return data
}

// Exported for unit testing (T047).
export const __test = { isBlank, localeMapIncomplete, collectMissing, overlayActiveLocale }
