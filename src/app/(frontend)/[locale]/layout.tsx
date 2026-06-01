import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Script from 'next/script'
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
  // Brand favicon (the lattice "W" mark). Served from public/favicon.svg — the same
  // asset the Payload admin uses. Target browsers (Chrome/Edge/FF 111+, Safari 16.4+)
  // all support SVG favicons, so no .ico fallback is needed. Per-page generateMetadata
  // (page.tsx) sets no `icons`, so this is inherited across the public site.
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: ['/favicon.svg'],
  },
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
    <html
      lang={locale}
      className={fontVariables}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className={locale === 'th' ? 'lang-th' : undefined} suppressHydrationWarning>
        {/*
          Apply the persisted theme + OS reduced-motion before hydration (no FOUC).
          Rendered via next/script `beforeInteractive`, NOT a raw <script>: Next hoists it
          ahead of hydration so React never reconciles a <script> element (which in React 19
          logs "Encountered a script tag while rendering React component"). It must sit inside
          <body> — the boot script sets classes on `document.body`, which does not exist yet
          if the script runs during <head> parsing. `suppressHydrationWarning` on <html>/<body>
          covers the body class the script adds before React hydrates (a benign mismatch).
        */}
        <Script
          id="wf-theme-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeBootScript }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
