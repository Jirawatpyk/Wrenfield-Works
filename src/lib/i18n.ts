/**
 * Locale primitives shared by the proxy router, layouts, and content layer (T017).
 * EN is the default for first-time visitors; TH is secondary (spec Assumptions).
 */
export const LOCALES = ['en', 'th'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

/** Cookie that remembers a visitor's chosen language across visits (FR-003). */
export const LOCALE_COOKIE = 'wf-locale'

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'en' || value === 'th'
}

/** Coerce any input to a supported locale, falling back to EN (stale-pref edge case). */
export function normalizeLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE
}

/**
 * Pick the best locale from an Accept-Language header. Thai only wins when it is
 * explicitly preferred; otherwise EN (default for first-time visitors).
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=')
      return { tag: (tag ?? '').toLowerCase(), q: q ? Number(q) : 1 }
    })
    .sort((a, b) => b.q - a.q)
  for (const { tag } of ranked) {
    if (tag.startsWith('th')) return 'th'
    if (tag.startsWith('en')) return 'en'
  }
  return DEFAULT_LOCALE
}
