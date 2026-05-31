'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'

import { LOCALE_COOKIE, LOCALES, type Locale, normalizeLocale } from '@/lib/i18n'

const LABELS: Record<Locale, { short: string; accessible: string }> = {
  en: { short: 'EN', accessible: 'English' },
  th: { short: 'ไทย', accessible: 'ไทย' },
}

/**
 * Build the equivalent path for a target locale by swapping the leading
 * `/en` | `/th` segment. Falls back to `/${target}` when no locale segment
 * is present (the URL path is the source of truth — Ambiguity #1).
 */
function swapLocaleInPath(pathname: string, target: Locale): string {
  const segments = pathname.split('/')
  // segments[0] is '' (leading slash). segments[1] is the locale segment.
  const first = segments[1]
  if (first === 'en' || first === 'th') {
    segments[1] = target
    return segments.join('/') || `/${target}`
  }
  // No locale prefix: prepend the target locale.
  const rest = pathname === '/' ? '' : pathname
  return `/${target}${rest}`
}

/**
 * Persist the chosen locale client-side so a later bare-root visit ("/") resolves to it
 * (Ambiguity #1, FR-003). The `<Link>` is a soft navigation, on which the proxy's Set-Cookie
 * is not reliably committed by the browser, so we write it here too. Defined at module scope
 * (not in the component) so the React Compiler does not flag the `document.cookie` write as a
 * render-time global mutation.
 */
function persistLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`
}

export function LangToggle() {
  const pathname = usePathname() ?? '/'
  const params = useParams<{ locale?: string }>()
  const current = normalizeLocale(params?.locale ?? null)

  return (
    <div className="lang-tog" role="group" aria-label="Language">
      {LOCALES.map((locale) => {
        const isActive = locale === current
        const label = LABELS[locale]
        return (
          <Link
            key={locale}
            href={swapLocaleInPath(pathname, locale)}
            data-testid={`lang-${locale}`}
            className={isActive ? 'lk active' : 'lk'}
            aria-current={isActive ? 'true' : undefined}
            aria-label={label.accessible}
            onClick={() => persistLocale(locale)}
          >
            {label.short}
          </Link>
        )
      })}
    </div>
  )
}
