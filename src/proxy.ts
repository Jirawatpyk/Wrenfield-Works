import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  localeFromAcceptLanguage,
} from '@/lib/i18n'

/**
 * Locale routing (T017). Next.js 16 renamed `middleware.ts` → `proxy.ts`
 * (export `proxy`, Node runtime). Visitors land on `/en` or `/th`; a bare path
 * is redirected to the visitor's remembered language (FR-003), then their
 * Accept-Language, then EN (default for first-time visitors).
 *
 * Payload's own routes — admin UI, REST/GraphQL, the inquiry API, health, and
 * static/asset paths — are excluded so the CMS and APIs are never locale-prefixed.
 */
const PUBLIC_FILE = /\.[^/]+$/

function isExcluded(pathname: string): boolean {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/health') ||
    pathname === '/favicon.ico' ||
    PUBLIC_FILE.test(pathname)
  )
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl

  if (isExcluded(pathname)) return NextResponse.next()

  const segments = pathname.split('/')
  const first = segments[1]

  // Already locale-prefixed: pass through, refreshing the persistence cookie.
  if (isLocale(first)) {
    const res = NextResponse.next()
    if (request.cookies.get(LOCALE_COOKIE)?.value !== first) {
      res.cookies.set(LOCALE_COOKIE, first, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      })
    }
    return res
  }

  // No locale prefix → choose one and redirect.
  const remembered = request.cookies.get(LOCALE_COOKIE)?.value
  const chosen = isLocale(remembered)
    ? remembered
    : localeFromAcceptLanguage(request.headers.get('accept-language')) || DEFAULT_LOCALE

  const url = request.nextUrl.clone()
  url.pathname = `/${chosen}${pathname === '/' ? '' : pathname}`
  const res = NextResponse.redirect(url)
  res.cookies.set(LOCALE_COOKIE, chosen, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  return res
}

export const config = {
  // Run on everything except Next internals and files with extensions;
  // fine-grained exclusion is handled in `isExcluded`.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
