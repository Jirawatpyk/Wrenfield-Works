import crypto from 'crypto'

import { DEFAULT_LOCALE, isLocale } from './i18n'
import { logger } from './logging'

/**
 * Draft-preview link signing (FR-018). The whole public site is one page per locale, so every
 * collection/global previews the same home route for the locale the editor is working in.
 *
 * Security: we do NOT put the raw PREVIEW_SECRET in the URL (it would leak via browser history,
 * server/CDN access logs, and Referer headers). Instead we embed a short-lived, path-bound HMAC
 * token; the /api/preview route re-derives and verifies it. A leaked URL is therefore useless
 * after expiry and only ever grants the one path it was minted for.
 */
const TOKEN_TTL_MS = 30 * 60 * 1000 // 30 minutes

/** HMAC-SHA256 over "path:expiry", keyed by PREVIEW_SECRET. */
export function signPreviewToken(path: string, expiry: number, secret: string): string {
  return crypto.createHmac('sha256', secret).update(`${path}:${expiry}`).digest('base64url')
}

/** Fail fast in production if the preview secret is missing/weak (deny-by-default posture). */
export function assertPreviewSecret(): void {
  const secret = process.env.PREVIEW_SECRET
  if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 16)) {
    throw new Error(
      'PREVIEW_SECRET must be set to a strong value (≥16 chars) in production — refusing to start.',
    )
  }
}

export function buildPreviewPath(locale?: string | null): string {
  const secret = process.env.PREVIEW_SECRET
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE
  const path = `/${loc}`

  if (!secret) {
    // Misconfiguration — the route will 403 regardless; surface it so ops can catch it at boot/click.
    logger.warn('PREVIEW_SECRET is not set; the admin Preview button will return 403')
    return `/api/preview?path=${encodeURIComponent(path)}`
  }

  const exp = Date.now() + TOKEN_TTL_MS
  const token = signPreviewToken(path, exp, secret)
  return `/api/preview?${new URLSearchParams({ path, exp: String(exp), token }).toString()}`
}
