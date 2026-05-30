import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { fontVariables } from '@/lib/fonts'
import '@/styles/globals.css'

/**
 * Root layout for the public (frontend) route group. Because the app uses two
 * route groups — (frontend) and (payload) — without a shared root, this is the
 * topmost layout for the public branch and therefore renders <html>/<body>.
 *
 * Theme (dark default + paper) and locale providers are wired in T018/T019;
 * this Phase-1 version establishes the document shell, fonts, and locale lang.
 */
export const metadata: Metadata = {
  title: 'Wrenfield Works — Enterprise systems, built right.',
  description: 'AI-assisted systems, built right.',
}

const SUPPORTED_LOCALES = ['en', 'th'] as const

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export default async function FrontendLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const lang = SUPPORTED_LOCALES.includes(locale as (typeof SUPPORTED_LOCALES)[number])
    ? locale
    : 'en'

  return (
    <html lang={lang} className={fontVariables}>
      {/* dark theme is the default; the paper theme toggles `paper` on <body> (T018) */}
      <body className={lang === 'th' ? 'lang-th' : undefined}>{children}</body>
    </html>
  )
}
