import type { Field } from 'payload'

/**
 * Small field helpers so every collection/global declares localized vs. mono
 * fields consistently (UI Principle VI: one source of truth, no ad-hoc shapes).
 *
 * - `localized: true` fields carry separate EN/TH values and are covered by the
 *   publish-completeness gate (FR-014).
 * - `mono` fields are intentionally English-only brand/technical labels (FR-011)
 *   — section numbers, category tags, KPI units, status pills, brand names.
 */

type Common = {
  name: string
  label?: string
  required?: boolean
  /** Short editor hint shown under the field. */
  description?: string
}

export const localizedText = ({ name, label, required, description }: Common): Field => ({
  name,
  type: 'text',
  label,
  localized: true,
  required,
  ...(description ? { admin: { description } } : {}),
})

export const localizedTextarea = ({ name, label, required, description }: Common): Field => ({
  name,
  type: 'textarea',
  label,
  localized: true,
  required,
  ...(description ? { admin: { description } } : {}),
})

export const localizedRichText = ({ name, label, required, description }: Common): Field => ({
  name,
  type: 'richText',
  label,
  localized: true,
  required,
  ...(description ? { admin: { description } } : {}),
})

/** Intentionally non-localized brand/technical label (FR-011). */
export const monoText = ({ name, label, required, description }: Common): Field => ({
  name,
  type: 'text',
  label,
  required,
  admin: {
    description: description ?? 'Intentionally English-only (brand/technical label).',
  },
})

/** Ordering control for repeatable collections (FR-015). */
export const orderField: Field = {
  name: 'order',
  type: 'number',
  required: true,
  defaultValue: 0,
  admin: {
    step: 1,
    description: 'Display order on the public site (ascending). Shared across locales.',
  },
}
