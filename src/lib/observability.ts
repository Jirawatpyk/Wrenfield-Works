import { childLogger } from './logging'

/**
 * Lightweight observability for critical paths (Constitution V, T016a):
 * publish, inquiry submission, retention job. Emits structured metric logs and
 * a timing helper; a real metrics/trace backend (OTel exporter) can subscribe to
 * these without changing call sites. Plus a health snapshot for the /health route.
 */
const log = childLogger('metrics')

type Tags = Record<string, string | number | boolean | undefined>

const counters = new Map<string, number>()

/** Increment a named counter and emit a metric log line. */
export function incr(metric: string, tags?: Tags, by = 1): void {
  const next = (counters.get(metric) ?? 0) + by
  counters.set(metric, next)
  log.info({ metric, value: next, type: 'counter', ...tags }, `metric ${metric}`)
}

/**
 * Time an async critical-path operation. Records duration, success/failure, and
 * re-throws so callers still handle errors (no silent failure — Constitution V).
 */
export async function trace<T>(
  span: string,
  fn: () => Promise<T>,
  tags?: Tags,
): Promise<T> {
  const start = performance.now()
  try {
    const result = await fn()
    const durationMs = Math.round(performance.now() - start)
    log.info({ span, durationMs, ok: true, type: 'timing', ...tags }, `trace ${span}`)
    return result
  } catch (err) {
    const durationMs = Math.round(performance.now() - start)
    log.error({ span, durationMs, ok: false, type: 'timing', err, ...tags }, `trace ${span} failed`)
    throw err
  }
}

/** Snapshot of in-process counters (exposed via the health endpoint). */
export function metricsSnapshot(): Record<string, number> {
  return Object.fromEntries(counters)
}
