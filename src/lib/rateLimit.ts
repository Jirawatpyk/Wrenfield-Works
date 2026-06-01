/**
 * In-memory per-key sliding-window rate limiter (T072, FR-025).
 *
 * One of the inquiry form's three layered spam defenses (privacy-friendly challenge
 * + honeypot + this per-IP limit). The deployment is a single in-region Node process
 * with low write volume, so an in-process store is sufficient and avoids hosting a
 * shared cache (Redis) in-region — keep the data footprint minimal and PDPA-clean.
 *
 * The clock is INJECTABLE so the window behavior is deterministically unit-testable.
 * Pure data structure; no Payload/DB/network deps.
 */
export interface RateLimitResult {
  /** Whether this request is within the allowance. */
  allowed: boolean
  /** Requests still permitted in the current window after this one. */
  remaining: number
  /** Milliseconds until the oldest counted hit ages out (0 when allowed/empty). */
  retryAfterMs: number
}

export interface RateLimiterOptions {
  /** Max requests permitted per key within `windowMs`. */
  max: number
  /** Sliding window length in milliseconds. */
  windowMs: number
  /** Clock injection (defaults to wall-clock). */
  now?: () => number
}

export interface RateLimiter {
  /** Record + evaluate a hit for `key` (e.g. an IP). */
  check(key: string): RateLimitResult
  /** Clear all buckets (test isolation / manual reset). */
  reset(): void
}

export function createRateLimiter({ max, windowMs, now }: RateLimiterOptions): RateLimiter {
  const clock = now ?? (() => Date.now())
  // key -> ascending list of hit timestamps still inside the window.
  const hits = new Map<string, number[]>()

  return {
    check(key: string): RateLimitResult {
      const t = clock()
      const cutoff = t - windowMs
      const recent = (hits.get(key) ?? []).filter((ts) => ts > cutoff)

      if (recent.length >= max) {
        // Blocked: oldest hit must age out before another is allowed.
        hits.set(key, recent)
        const oldest = recent[0] ?? t // recent.length >= max >= 1, so [0] exists
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: Math.max(0, oldest + windowMs - t),
        }
      }

      recent.push(t)
      hits.set(key, recent)
      return {
        allowed: true,
        remaining: Math.max(0, max - recent.length),
        retryAfterMs: 0,
      }
    },
    reset() {
      hits.clear()
    },
  }
}
