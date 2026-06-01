import { getPayload } from 'payload'

import config from '@payload-config'
import { normalizeLocale } from '@/lib/i18n'
import { childLogger } from '@/lib/logging'
import { incr, trace } from '@/lib/observability'
import { createRateLimiter } from '@/lib/rateLimit'
import { computeExpiresAt, retentionMonths } from '@/lib/retention'
import { verifyTurnstile } from '@/lib/turnstile'
import { parseInquiry, responseMessages } from '@/lib/validation/inquiry'

/**
 * Public inquiry submission (T072, inquiry-api contract) — the ONLY public WRITE path.
 *
 * Pipeline (deny-by-default, layered spam defense — FR-025):
 *   1. per-IP rate limit          → 429
 *   2. Zod validation             → 400 with localized field errors (FR-023)
 *   3. honeypot (`company`)       → 429 (non-revealing)
 *   4. Turnstile challenge        → 429 (skipped if unconfigured; fail-closed if not)
 *   5. persist with consent + a server-set 24-month `expiresAt` (FR-026/FR-027),
 *      then return 201 with a localized confirmation (FR-022).
 *
 * The studio email is fired by the collection's afterChange hook and is failure-
 * isolated, so a delivery problem never fails this request or loses the record
 * (FR-029). Lives at `/api/inquiries` (excluded from the locale proxy); it shadows
 * Payload's generic REST create for this slug on purpose — the collection's
 * `create: denyAll` plus this validated route are the only way in.
 */
export const runtime = 'nodejs'

const log = childLogger('inquiry')

// In-memory per-IP limiter (FR-025). Single in-region instance; low write volume.
const limiter = createRateLimiter({
  max: Number(process.env.INQUIRY_RATE_LIMIT_MAX) || 5,
  windowMs: Number(process.env.INQUIRY_RATE_LIMIT_WINDOW_MS) || 3_600_000,
})

/** Best-effort client IP from the proxy headers; 'unknown' buckets together if absent. */
function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]?.trim() || 'unknown'
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

export async function POST(request: Request): Promise<Response> {
  // Parse defensively — a non-JSON body becomes an empty object and fails validation.
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    raw = {}
  }

  const submittedLocale = normalizeLocale((raw as { locale?: string } | null)?.locale)
  const msgs = responseMessages(submittedLocale)

  // 1. Rate limit (FR-025).
  const ip = clientIp(request)
  if (!limiter.check(ip).allowed) {
    incr('inquiry.rate_limited')
    return Response.json({ ok: false, error: msgs.rateLimited }, { status: 429 })
  }

  // 2. Validate (FR-023) → localized field errors.
  const parsed = parseInquiry(raw, submittedLocale)
  if (!parsed.success) {
    incr('inquiry.invalid')
    return Response.json({ ok: false, errors: parsed.errors }, { status: 400 })
  }
  const data = parsed.data

  // 3. Honeypot (FR-025) — a filled `company` is a bot. 429 + non-revealing copy.
  if (data.company.trim() !== '') {
    incr('inquiry.spam.honeypot')
    log.warn({ ip }, 'inquiry honeypot tripped')
    return Response.json({ ok: false, error: msgs.unavailable }, { status: 429 })
  }

  // 4. Turnstile challenge (FR-025) — skipped if unconfigured, fail-closed otherwise.
  const turnstile = await verifyTurnstile(data.turnstileToken, { remoteIp: ip })
  if (!turnstile.ok) {
    incr('inquiry.spam.turnstile')
    return Response.json({ ok: false, error: msgs.unavailable }, { status: 429 })
  }

  // 5. Persist with consent + 24-month expiry (FR-026/FR-027). overrideAccess: the
  // public create is gated by THIS route (validation + spam), not by Payload REST.
  try {
    const payload = await getPayload({ config })
    const now = new Date()
    await trace('inquiry.create', () =>
      payload.create({
        collection: 'inquiries' as never,
        overrideAccess: true,
        data: {
          name: data.name,
          email: data.email,
          message: data.message,
          locale: data.locale,
          consent: true,
          consentAt: now.toISOString(),
          expiresAt: computeExpiresAt(now, retentionMonths()).toISOString(),
          status: 'new',
        } as never,
      }),
    )
    incr('inquiry.created', { locale: data.locale })
    return Response.json({ ok: true, message: msgs.confirmation }, { status: 201 })
  } catch (err) {
    incr('inquiry.error')
    log.error({ err }, 'failed to store inquiry')
    return Response.json({ ok: false, error: msgs.serverError }, { status: 500 })
  }
}
