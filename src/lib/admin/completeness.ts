import type { Field } from 'payload'

import { isBlank, walkLocalizedLeaves, type AnyRecord } from '@/lib/validation/localeFields'

/** One missing localized leaf: which locales are present. `en`/`th` are TRUE when that locale is FILLED. */
export type MissingLeaf = { path: string; label: string; en: boolean; th: boolean }

/** Per-locale completeness of one content document (admin readiness, T2). */
export type LocaleStatus = {
  enComplete: boolean
  thComplete: boolean
  /** True when the document has NO localized value in either locale — "not started". */
  empty: boolean
  /** Leaves missing at least one locale, each with its label and per-locale presence. */
  missing: MissingLeaf[]
}

type LocaleMap = { en?: unknown; th?: unknown }

/**
 * Compute per-locale status by walking the schema over a `locale: 'all'`-shaped
 * doc. Uses the same `isBlank` + walker as the publish gate, so the badge can
 * never disagree with what the gate allows (FR-014). `empty` lets the UI show a
 * neutral "not started" state instead of an alarming all-red row.
 */
export function collectLocaleStatus(fields: Field[], doc: AnyRecord): LocaleStatus {
  const missing: MissingLeaf[] = []
  let anyLeaf = false
  let anyValue = false

  walkLocalizedLeaves(fields, doc, '', (path, value, label) => {
    anyLeaf = true
    const map = (
      value && typeof value === 'object' && !Array.isArray(value) ? (value as LocaleMap) : {}
    ) as LocaleMap
    const enFilled = !isBlank(map.en)
    const thFilled = !isBlank(map.th)
    if (enFilled || thFilled) anyValue = true
    if (!enFilled || !thFilled) missing.push({ path, label, en: enFilled, th: thFilled })
  })

  const enComplete = missing.every((m) => m.en)
  const thComplete = missing.every((m) => m.th)
  return {
    enComplete,
    thComplete,
    empty: anyLeaf && !anyValue,
    missing,
  }
}
