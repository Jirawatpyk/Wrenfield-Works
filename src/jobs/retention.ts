/**
 * Retention job entry point (T076, FR-027/FR-027a).
 *
 * Run daily by an in-region scheduler (cron):
 *   pnpm retention   →   payload run src/jobs/retention.ts
 *
 * Permanently deletes inquiries older than 24 months and exits non-zero on failure
 * so the scheduler records a failed run + alerts; the next run catches up because
 * the underlying query is purely time-based (see src/lib/retention.ts).
 *
 * Like the seed, this is executed by `payload run`, which awaits TOP-LEVEL promises
 * only — so the work is awaited at module top level below.
 */
import { getPayload } from 'payload'
import config from '@payload-config'

import { childLogger } from '../lib/logging'
import { runRetention } from '../lib/retention'

const log = childLogger('retention-job')

try {
  const payload = await getPayload({ config })
  const result = await runRetention(payload)
  log.info({ deleted: result.deleted }, 'retention job finished')
  process.exit(0)
} catch (err) {
  log.error({ err }, 'retention job failed')
  process.exit(1)
}
