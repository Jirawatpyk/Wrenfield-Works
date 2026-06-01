/**
 * Cookieless analytics (T078, FR-011b).
 *
 * Privacy-friendly, cookieless measurement (Plausible/Umami, self-hosted in-region):
 * aggregate page views + the `inquiry_submitted` conversion, with NO personal
 * identifiers and therefore NO cookie-consent banner. The tracking script is only
 * injected when an in-region endpoint is configured (`analyticsConfig()` non-null).
 *
 * `trackEvent` is the client-side conversion emitter; it MUST never throw —
 * analytics can never break the user-facing app (Constitution V, failure isolation).
 */

/** The single conversion event the marketing site cares about. */
export const INQUIRY_SUBMITTED_EVENT = 'inquiry_submitted'

export interface AnalyticsConfig {
  /** The site domain registered with the analytics tool. */
  domain: string
  /** Absolute URL of the analytics script (self-hosted, in-region). */
  scriptUrl: string
}

/** The analytics config from env, or null when not fully configured. */
export function analyticsConfig(): AnalyticsConfig | null {
  const domain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN
  const scriptUrl = process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_URL
  if (!domain || !scriptUrl) return null
  return { domain, scriptUrl }
}

export function isAnalyticsEnabled(): boolean {
  return analyticsConfig() !== null
}

/** Plausible's global takes `(eventName, { props })`; Umami is shimmed the same way. */
type AnalyticsGlobal = (name: string, options?: { props?: Record<string, unknown> }) => void

/**
 * Emit a cookieless analytics event from the client. No-op when the script has not
 * loaded (or analytics is disabled); swallows any error so a tracking hiccup never
 * surfaces to the visitor.
 */
export function trackEvent(name: string, props?: Record<string, unknown>): void {
  try {
    const plausible = (globalThis as { plausible?: AnalyticsGlobal }).plausible
    if (typeof plausible === 'function') {
      plausible(name, props ? { props } : undefined)
    }
  } catch {
    // Analytics must never break the app.
  }
}
