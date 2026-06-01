import type { Field } from 'payload'

/**
 * Shared localized-field utilities (T1). The publish gate
 * (`publishCompleteness.ts`), the admin readiness badge (`lib/admin/
 * completeness.ts`), and the bilingual publish-block error all walk a
 * `locale: 'all'`-shaped document the same way, so "what counts as complete"
 * and "what is this field called" are defined exactly once here.
 */

export type AnyRecord = Record<string, unknown>

/**
 * A localized value leaf under a `locale: 'all'` read — `{ en, th }`. Defined once
 * here (the shared home) and imported by the gate + the readiness badge so the
 * leaf shape can't drift between the two consumers.
 */
export type LocaleMap = { en?: unknown; th?: unknown }

/** Localized value field types whose leaves carry an `{ en, th }` map under `locale: 'all'`. */
export const VALUE_FIELD_TYPES = new Set([
  'text',
  'textarea',
  'richText',
  'email',
  'number',
  'select',
  'code',
  'date',
])

/** True when a value is missing/empty (string, array, or empty Lexical richText). */
export function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') {
    const root = (value as AnyRecord).root as AnyRecord | undefined
    if (root && Array.isArray(root.children)) {
      const serialized = JSON.stringify(root.children)
      return !/"text":"\s*\S/.test(serialized) && !serialized.includes('"type":"upload"')
    }
  }
  return false
}

/** Human label for a field: explicit string label, else the field name. */
function labelOf(field: Field): string {
  if ('label' in field && typeof field.label === 'string' && field.label) return field.label
  if ('name' in field && field.name) return field.name
  return ''
}

/**
 * Walk the schema over a `locale: 'all'`-shaped doc and invoke
 * `visit(path, value, label)` for every localized value-field leaf. `value` is
 * the stored leaf (an `{ en, th }` map when present); `label` is the leaf field's
 * human label. Descends through row/collapsible, group, named/unnamed tabs,
 * array, and blocks.
 */
export function walkLocalizedLeaves(
  fields: Field[],
  data: AnyRecord,
  prefix: string,
  visit: (path: string, value: unknown, label: string) => void,
): void {
  for (const field of fields) {
    if (field.type === 'ui') continue

    if ((field.type === 'row' || field.type === 'collapsible') && 'fields' in field) {
      walkLocalizedLeaves(field.fields, data, prefix, visit)
      continue
    }

    if (field.type === 'tabs' && 'tabs' in field) {
      for (const tab of field.tabs) {
        if ('name' in tab && tab.name) {
          walkLocalizedLeaves(
            tab.fields,
            (data?.[tab.name] as AnyRecord) ?? {},
            `${prefix}${tab.name}.`,
            visit,
          )
        } else {
          walkLocalizedLeaves(tab.fields, data, prefix, visit)
        }
      }
      continue
    }

    if (!('name' in field) || !field.name) continue
    const path = `${prefix}${field.name}`
    const localized = 'localized' in field && field.localized === true
    const value = data?.[field.name]

    if (VALUE_FIELD_TYPES.has(field.type)) {
      if (localized) visit(path, value, labelOf(field))
      continue
    }

    if (field.type === 'group' && 'fields' in field) {
      walkLocalizedLeaves(field.fields, (value as AnyRecord) ?? {}, `${path}.`, visit)
      continue
    }

    if (field.type === 'array' && 'fields' in field) {
      const rows = Array.isArray(value) ? (value as AnyRecord[]) : []
      rows.forEach((row, i) => {
        walkLocalizedLeaves(field.fields, row ?? {}, `${path}[${i}].`, visit)
      })
      continue
    }

    if (field.type === 'blocks' && 'blocks' in field) {
      const rows = Array.isArray(value) ? (value as AnyRecord[]) : []
      rows.forEach((row, i) => {
        const block = field.blocks.find((b) => b.slug === row?.blockType)
        if (block) walkLocalizedLeaves(block.fields, row ?? {}, `${path}[${i}].`, visit)
      })
    }
  }
}
