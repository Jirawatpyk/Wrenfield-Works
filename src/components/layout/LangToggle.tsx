'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback } from 'react'

import { LOCALE_COOKIE, type Locale } from '@/lib/i18n'

/**
 * Language toggle EN ⇄ ไทย (FR-002, FR-007d). Swaps the leading locale segment
 * of the current path, persists the choice in a cookie (FR-003), and conveys the
 * active language to assistive tech via aria-pressed on each option.
 */
export function LangToggle({ current, label }: { current: Locale; label: string }) {
  const router = useRouter()
  const pathname = usePathname()

  const switchTo = useCallback(
    (next: Locale) => {
      if (next === current) return
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
      const segments = pathname.split('/')
      segments[1] = next
      router.push(segments.join('/') || `/${next}`)
    },
    [current, pathname, router],
  )

  return (
    <div className="lang-tog" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => switchTo('en')}
        aria-pressed={current === 'en'}
        className={current === 'en' ? 'on' : undefined}
      >
        EN
      </button>
      <span aria-hidden="true">·</span>
      <button
        type="button"
        onClick={() => switchTo('th')}
        aria-pressed={current === 'th'}
        className={current === 'th' ? 'on' : undefined}
        lang="th"
      >
        ไทย
      </button>
    </div>
  )
}
