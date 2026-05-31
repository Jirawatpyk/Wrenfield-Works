import config from '@payload-config'
import { getPayload } from 'payload'

import { metricsSnapshot } from '@/lib/observability'

/**
 * Health endpoint (T016a, Constitution V). Reports process liveness, DB
 * reachability, and in-process metric counters. Not locale-prefixed (excluded
 * in proxy.ts). Returns 503 if the database is unreachable so uptime monitors
 * and the platform can react.
 */
export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  let db: 'ok' | 'down' = 'down'
  try {
    const payload = await getPayload({ config })
    // Cheap connectivity probe against an always-present collection.
    await payload.count({ collection: 'users', overrideAccess: true })
    db = 'ok'
  } catch {
    db = 'down'
  }

  const healthy = db === 'ok'
  return Response.json(
    {
      status: healthy ? 'ok' : 'degraded',
      db,
      metrics: metricsSnapshot(),
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  )
}
