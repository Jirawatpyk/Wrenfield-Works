import { childLogger } from './logging'

/**
 * Cloudflare Turnstile verification (T072, FR-025).
 *
 * The privacy-friendly challenge in the inquiry spam defense (no cookies, no
 * personal tracking — consistent with the cookieless/PDPA posture). Behavior:
 *   - SKIP (ok) when no secret is configured (local dev / tests run without a key).
 *   - When configured, verify the token server-side via siteverify.
 *   - FAIL CLOSED on any error or a missing token (an outage must not open a bypass).
 *
 * `fetch` is injected so the network call is unit-testable.
 */
const log = childLogger('turnstile')

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export interface TurnstileResult {
  /** Whether the request may proceed past the challenge. */
  ok: boolean
  /** True when verification was skipped because no secret is configured. */
  skipped?: boolean
}

export async function verifyTurnstile(
  token: string,
  opts: { secret?: string; remoteIp?: string; fetchImpl?: typeof fetch } = {},
): Promise<TurnstileResult> {
  const secret = 'secret' in opts ? opts.secret : process.env.TURNSTILE_SECRET
  const doFetch = opts.fetchImpl ?? fetch

  // No secret → challenge not enforced (dev/test). Configured deployments set it.
  if (!secret) return { ok: true, skipped: true }

  // A configured challenge with no token is an automatic fail (fail closed).
  if (!token) return { ok: false }

  try {
    const body = new URLSearchParams({ secret, response: token })
    if (opts.remoteIp) body.set('remoteip', opts.remoteIp)

    const res = await doFetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) return { ok: false }
    const data = (await res.json()) as { success?: boolean }
    return { ok: data.success === true }
  } catch (err) {
    // Fail closed: a verification outage must never become a spam bypass.
    log.warn({ err }, 'turnstile verification failed; rejecting (fail closed)')
    return { ok: false }
  }
}
