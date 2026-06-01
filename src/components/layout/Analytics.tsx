import Script from 'next/script'

import { analyticsConfig } from '@/lib/analytics'

/**
 * Cookieless analytics loader (T078, FR-011b). Injects the privacy-friendly
 * analytics script (Plausible/Umami) ONLY when an in-region endpoint is configured
 * — so dev/test and unconfigured deploys ship no tracking and need no consent banner.
 *
 * The init shim defines the `window.plausible` queue up front so the client
 * conversion emitter (`trackEvent`, src/lib/analytics.ts) works even if it fires
 * before the main script finishes loading.
 */
export function Analytics() {
  const cfg = analyticsConfig()
  if (!cfg) return null

  return (
    <>
      {/* Define the window.plausible queue FIRST (ordered before the vendor script;
          both afterInteractive) so a conversion fired on submit — always post-hydration —
          is buffered and then drained by the vendor script once it loads. */}
      <Script id="wf-analytics-init" strategy="afterInteractive">
        {`window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}`}
      </Script>
      <Script
        id="wf-analytics"
        src={cfg.scriptUrl}
        data-domain={cfg.domain}
        strategy="afterInteractive"
      />
    </>
  )
}
