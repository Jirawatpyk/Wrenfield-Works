import crypto from 'crypto'

import { getPayload } from 'payload'

import config from '@payload-config'
import { childLogger } from '@/lib/logging'
import { runRetention } from '@/lib/retention'

/**
 * PDPA retention cron endpoint (T076, FR-027/FR-027a) — the Vercel Cron entry point.
 *
 * Scheduled in `vercel.json` (`crons`); Vercel invokes it with GET daily. Because it
 * PERMANENTLY DELETES personal data, it is auth-gated and FAILS CLOSED: it runs only
 * when the request carries `Authorization: Bearer <CRON_SECRET>` (Vercel auto-adds this
 * header when the CRON_SECRET env var is set) — so the public internet can never trigger
 * a mass deletion. With no CRON_SECRET configured the endpoint is permanently 401.
 *
 * Runs on the Node runtime (Payload needs it) and is never cached. The shared
 * `runRetention` does the work and throws on a failed/partial run, which surfaces here
 * as a 500 so Vercel records a failed cron invocation (and the retention.run.failed
 * metric fires). The standalone `pnpm retention` CLI (src/jobs/retention.ts) remains
 * available for a host scheduler / manual runs.
 *
 * Mounted one segment deep under /api/cron so it never shadows Payload's collection REST.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Allow headroom for a large catch-up purge (capped to the deployment plan's max).
export const maxDuration = 60

const log = childLogger('retention-cron')

/** Constant-time check that the request bears the configured CRON_SECRET (fail-closed). */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const provided = request.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret}`
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    const result = await runRetention(payload)
    return Response.json({ ok: true, deleted: result.deleted })
  } catch (err) {
    // runRetention already counted/logged + re-threw; surface a 500 so Vercel marks the
    // cron run failed. The next run catches up (time-based query is idempotent — FR-027a).
    log.error({ err }, 'retention cron run failed')
    return Response.json({ ok: false, error: 'retention failed' }, { status: 500 })
  }
}
