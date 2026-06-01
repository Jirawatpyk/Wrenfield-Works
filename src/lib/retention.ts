import type { Payload } from 'payload'

import { childLogger } from './logging'
import { incr, trace } from './observability'

/**
 * PDPA inquiry retention (T076, FR-027/FR-027a).
 *
 * Inquiry personal data is kept no longer than 24 months from submission, then the
 * WHOLE record is PERMANENTLY DELETED (deletion, not anonymization — clarification).
 * Each inquiry stores a server-set `expiresAt = submittedAt + 24mo`; the daily job
 * deletes everything whose `expiresAt <= now`.
 *
 * Monitoring + catch-up (FR-027a): the run is traced and a failure increments an
 * alert counter and logs an error. Because the query is purely time-based and
 * idempotent, any record a failed run misses is still `<= now` on the next run, so
 * nothing is ever silently retained past 24 months — the catch-up is automatic.
 *
 * The date math is pure (unit-tested in tests/unit/retention.spec.ts); the delete
 * pass runs through the Payload Local API (integration-tested in
 * tests/integration/us3-retention.spec.ts).
 */
const log = childLogger('retention')

/** Default retention horizon in months (env-overridable via INQUIRY_RETENTION_MONTHS). */
export const RETENTION_MONTHS = 24

/** Read the configured retention window, falling back to 24 months. */
export function retentionMonths(): number {
  const raw = Number(process.env.INQUIRY_RETENTION_MONTHS)
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : RETENTION_MONTHS
}

/**
 * Add `months` to a date, clamping end-of-month overflow so e.g. Feb 29 + 24mo is
 * Feb 28 (not Mar 1). Operates in UTC. Pure (returns a new Date).
 */
export function addMonths(date: Date | string, months: number): Date {
  const d = date instanceof Date ? date : new Date(date)
  const year = d.getUTCFullYear()
  const month = d.getUTCMonth() + months
  const day = d.getUTCDate()
  // Last day of the target month (day 0 of the following month).
  const lastDayOfTarget = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const clampedDay = Math.min(day, lastDayOfTarget)
  return new Date(
    Date.UTC(
      year,
      month,
      clampedDay,
      d.getUTCHours(),
      d.getUTCMinutes(),
      d.getUTCSeconds(),
      d.getUTCMilliseconds(),
    ),
  )
}

/**
 * The retention expiry for a submission: submittedAt + `months` (default 24). Kept PURE
 * — the default is the constant, NOT the env-reading retentionMonths(), so the helper has
 * no hidden process.env dependency. Callers that want the configured window pass it
 * explicitly (the inquiry route calls `computeExpiresAt(now, retentionMonths())`).
 */
export function computeExpiresAt(submittedAt: Date | string, months = RETENTION_MONTHS): Date {
  return addMonths(submittedAt, months)
}

/** Whether a record with `expiresAt` is due for deletion at `now` (boundary inclusive). */
export function isExpired(expiresAt: Date | string, now: Date = new Date()): boolean {
  const exp = expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime()
  return exp <= now.getTime()
}

export interface RetentionResult {
  ok: boolean
  deleted: number
}

/**
 * Permanently delete every inquiry whose `expiresAt <= now` (FR-027). Monitored:
 * traced + counted; on failure it alerts (counter + error log) and re-throws so the
 * scheduler records a failed run — the next run catches up automatically (FR-027a).
 */
export async function runRetention(
  payload: Payload,
  opts: { now?: Date } = {},
): Promise<RetentionResult> {
  const now = opts.now ?? new Date()
  return trace('retention.run', async () => {
    try {
      const result = (await payload.delete({
        collection: 'inquiries' as never,
        where: { expiresAt: { less_than_equal: now.toISOString() } } as never,
        overrideAccess: true,
      })) as { docs?: unknown[]; errors?: Array<{ id?: unknown; message?: string }> }

      const deleted = Array.isArray(result.docs) ? result.docs.length : 0
      incr('retention.deleted', undefined, deleted)

      // Payload's bulk delete RESOLVES even when some documents fail, collecting
      // per-record failures in `errors`. Treat any as a failed run so the scheduler
      // alerts and the next run retries them (FR-027a) — never silently retain.
      const errors = Array.isArray(result.errors) ? result.errors : []
      if (errors.length > 0) {
        incr('retention.delete_errors', undefined, errors.length)
        log.error(
          { deleted, failed: errors.length, ids: errors.map((e) => e?.id) },
          'retention: some records failed to delete; next run will retry (FR-027a)',
        )
        throw new Error(`retention: ${errors.length} record(s) failed to delete`)
      }

      log.info({ deleted }, 'retention run complete')
      return { ok: true, deleted }
    } catch (err) {
      // Alert + re-throw so the scheduler marks this run failed; next run catches up.
      incr('retention.run.failed')
      log.error({ err }, 'retention run FAILED — will catch up on next run (FR-027a)')
      throw err
    }
  })
}
