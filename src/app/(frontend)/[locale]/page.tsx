import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { Footer } from '@/components/layout/Footer'
import { Nav } from '@/components/layout/Nav'
import { SectionRules } from '@/components/layout/SectionRules'
import { Capabilities } from '@/components/sections/Capabilities'
import { CTA } from '@/components/sections/CTA'
import { Hero } from '@/components/sections/Hero'
import { Marquee } from '@/components/sections/Marquee'
import { Process } from '@/components/sections/Process'
import { Showcase } from '@/components/sections/Showcase'
import { Stats } from '@/components/sections/Stats'
import { Testimonial } from '@/components/sections/Testimonial'
import { Work } from '@/components/sections/Work'
import { getSeo, getSiteContent, headingByNumber } from '@/lib/content'
import { isLocale, type Locale } from '@/lib/i18n'

/**
 * Render per request so a publish appears IMMEDIATELY (FR-016). The public read is an in-process
 * Payload Local API call, so dynamic SSR stays fast for this low-traffic site; static prerendering
 * + on-publish `revalidatePath` did not reliably deliver instant visibility, and FR-016 is a hard
 * requirement. The `revalidate*` afterChange hooks remain as defense-in-depth if a CDN/edge cache
 * is introduced later. (Trade-off vs. the plan's static/ISR strategy — revisit if perf demands it.)
 */
export const dynamic = 'force-dynamic'

/**
 * Public home page (T042–T045) — composes every section from published CMS content for the
 * requested locale. Sections whose content is missing/empty are skipped entirely so the
 * layout collapses cleanly rather than rendering an empty frame (graceful empty, T045). The
 * content layer already degrades a failed section to null (T045) and falls back across
 * locales, so this component only has to decide what to render.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  // Mirror the page's own guard: an unsupported segment 404s, so it must not emit real
  // (English-fallback) SEO/OpenGraph metadata — and og:locale must never echo it.
  if (!isLocale(locale)) return {}
  const seo = await getSeo(locale)
  if (!seo) return {}
  const og = seo.ogImage ? { images: [{ url: seo.ogImage }] } : {}
  return {
    title: seo.title || undefined,
    description: seo.description || undefined,
    openGraph: {
      title: seo.title || undefined,
      description: seo.description || undefined,
      locale,
      ...og,
    },
  }
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale: Locale = raw

  // Draft mode (enabled by the /api/preview route for authenticated editors) renders
  // the latest unpublished draft so editors can preview before publishing (FR-018);
  // public visitors never have it enabled, so they only ever see published content.
  const { isEnabled: draft } = await draftMode()
  const c = await getSiteContent(locale, { draft })

  return (
    <>
      <SectionRules />
      {c.nav ? <Nav nav={c.nav} /> : null}
      <main id="main">
        {c.hero ? <Hero hero={c.hero} /> : null}
        {c.marquee ? <Marquee marquee={c.marquee} locale={locale} /> : null}
        {c.stats ? <Stats stats={c.stats} /> : null}
        {c.capabilities ? (
          <Capabilities
            capabilities={c.capabilities}
            heading={headingByNumber(c.sectionHeadings, '01')}
          />
        ) : null}
        {c.showcase ? (
          <Showcase showcase={c.showcase} heading={headingByNumber(c.sectionHeadings, '02')} />
        ) : null}
        {c.caseStudies ? (
          <Work caseStudies={c.caseStudies} heading={headingByNumber(c.sectionHeadings, '03')} />
        ) : null}
        {c.processSteps ? (
          <Process
            processSteps={c.processSteps}
            heading={headingByNumber(c.sectionHeadings, '04')}
          />
        ) : null}
        {c.testimonial ? <Testimonial testimonial={c.testimonial} /> : null}
        {c.cta ? <CTA cta={c.cta} locale={locale} /> : null}
      </main>
      {c.footer ? <Footer footer={c.footer} locale={locale} /> : null}
    </>
  )
}
