import type { CollectionBeforeValidateHook, GlobalBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

/**
 * Optimistic-concurrency guard (FR-020a, admin-auth contract §"Concurrency conflict").
 *
 * When an editor saves a document that ANOTHER editor changed after they loaded it,
 * reject the write instead of silently overwriting. The editor sends the `updatedAt`
 * they loaded as `data.updatedAt`; if that is older than the document's currently
 * stored `updatedAt`, someone saved in between — so we reject with a clear, recoverable
 * 409 and the editor can reload the latest version to re-apply their edits.
 *
 * A save that omits `updatedAt` (a brand-new create, the edit that legitimately
 * advances the timestamp, or any non-conflicting flow such as the seed) is never
 * blocked — so this is backward-compatible with existing writes.
 */
/** Normalize an ISO string or Date to epoch ms (NaN if unparseable). */
function toMs(value: unknown): number {
  if (value instanceof Date) return value.getTime()
  return new Date(value as string).getTime()
}

function isStaleSave(incoming: unknown, stored: unknown): boolean {
  if (incoming == null || stored == null) return false
  const i = toMs(incoming)
  const s = toMs(stored)
  if (Number.isNaN(i) || Number.isNaN(s)) return false
  return i < s
}

export const conflictDetectionHook: CollectionBeforeValidateHook & GlobalBeforeValidateHook = (
  args,
) => {
  const { data, originalDoc, operation } = args as {
    data?: Record<string, unknown>
    originalDoc?: Record<string, unknown>
    operation?: string
  }

  // Only an update against an existing document can conflict.
  if (operation && operation !== 'update') return data

  if (isStaleSave(data?.updatedAt, originalDoc?.updatedAt)) {
    throw new APIError(
      'This content changed since you opened it. Reload the latest version to review and re-apply ' +
        'your changes — nothing was overwritten.',
      409,
      undefined,
      true,
    )
  }

  return data
}
