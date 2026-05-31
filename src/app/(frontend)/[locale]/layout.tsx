import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { fontVariables } from '@/lib/fonts'
import { LOCALES, isLocale } from '@/lib/i18n'
import { themeBootScript } from '@/lib/theme'
import '@/styles/globals.css'

/**
 * Root layout for the public (frontend) route group. Because the app uses two
 * route groups — (frontend) and (payload) — without a shared root layout, this
 * is the topmost layout for the public branch and renders <html>/<body>.
 *
 * The theme boot script runs before paint to apply the saved theme + OS
 * reduced-motion class with no flash (FR-005b, FR-006). ThemeProvider keeps the
 * toggle's state in sync. SEO/social metadata per locale is added in T043.
 */
export const metadata: Metadata = {
  title: 'Wrenfield Works — Enterprise systems, built right.',
  description: 'AI-assisted systems, built right.',
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default async function FrontendLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  return (
    <html lang={locale} className={fontVariables}>
      <body className={locale === 'th' ? 'lang-th' : undefined}>
        {/* Apply persisted theme + reduced-motion before first paint (no FOUC). */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
