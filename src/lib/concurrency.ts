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
 *
 * FR-020a is enforced in TWO layers: (1) Payload's built-in DOCUMENT LOCKING (wired in
 * payload.config.ts) warns at OPEN time when another editor already holds the document; (2) this
 * OPTIMISTIC save-time check (the approach research.md chose over pessimistic locking) rejects a
 * write whose `updatedAt` predates the stored value. In normal single-editor use the form's
 * `updatedAt` matches stored, so this never false-positives; it can only trip on rapid scripted
 * save/publish sequences against a drafts-enabled doc (and even then it is a CONSERVATIVE failure —
 * nothing is overwritten; the editor reloads). Verified by tests/integration/us2-conflict.spec.ts.
 */
/** Normalize an ISO string or Date to epoch ms (NaN if unparseable). */
function toMs(value: unknown): number {
  if (value instanceof Date) return value.getTime()
  return new Date(value as string).getTime()
}

export function isStaleSave(incoming: unknown, stored: unknown): boolean {
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
