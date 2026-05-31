/**
 * Content read layer (T028, T045) — the public site's locale-scoped, published-only,
 * ordered, fallback read path over the Payload Local API. See contracts/content-api.md.
 *
 * Field names mirror the generated Payload types (src/payload-types.ts) exactly. The
 * mapping/ordering/fallback logic is PURE (unit-tested in tests/unit/content.spec.ts) and
 * split from the Payload I/O orchestrator (`getSiteContent`), which lazy-imports Payload so
 * the pure layer needs no database or server-only deps. Every section load is wrapped in
 * `safeSection` so a single failure degrades gracefully instead of failing the whole page.
 */
import { logger } from './logging'
import { DEFAULT_LOCALE, type Locale } from './i18n'

// ---------------------------------------------------------------------------
// View models (the shapes section components consume)
// ---------------------------------------------------------------------------

/** Serialized Lexical rich-text value (rendered by src/lib/richtext.tsx). */
export type RichTextValue = { root?: unknown } | null

export interface StatVM {
  value: number
  unit: string
  label: string
}

export interface CapabilityVM {
  icon: string
  categoryLabel: string
  title: string
  description: string
  tags: string[]
}

export interface CaseStudyVM {
  glyph: string
  tag: string
  title: string
  description: string
  metricsLine: RichTextValue
}

export interface ProcessStepVM {
  number: string
  name: string
  title: string
  description: string
  checklist: string[]
}

export interface ClientLogoVM {
  name: string
}

export type ShowcasePanelBlock = Record<string, unknown> & { blockType?: string }

export interface ShowcaseSurfaceVM {
  tabName: string
  tabTitle: string
  tabDescription: string
  panel: ShowcasePanelBlock[]
}

export interface HeroVM {
  kicker: string
  headline: RichTextValue
  subhead: RichTextValue
  trustLabel: string
  primaryCtaLabel: string
  secondaryCtaLabel: string
}

export interface NavVM {
  capabilities: string
  platform: string
  work: string
  process: string
  ctaLabel: string
}

export interface MarqueeVM {
  heading: string
  logos: ClientLogoVM[]
}

export interface SectionHeadingVM {
  number: string
  title: RichTextValue
  subtitle: string
}

export interface TestimonialVM {
  quote: RichTextValue
  attribution: RichTextValue
}

export interface SocialLinkVM {
  label: string
  url: string
}

export interface StudioLinkVM {
  label: string
  anchor: string
}

export interface CtaVM {
  kicker: string
  heading: RichTextValue
  body: string
  email: string
  bookCallLabel: string
  socialLinks: SocialLinkVM[]
}

export interface FooterVM {
  blurb: string
  studioLinks: StudioLinkVM[]
  connectLinks: SocialLinkVM[]
  bottomNote: string
}

export interface SeoVM {
  title: string
  description: string
  ogImage: string | null
}

export interface SiteContent {
  hero: HeroVM | null
  nav: NavVM | null
  marquee: MarqueeVM | null
  sectionHeadings: SectionHeadingVM[]
  stats: StatVM[] | null
  capabilities: CapabilityVM[] | null
  showcase: ShowcaseSurfaceVM[] | null
  caseStudies: CaseStudyVM[] | null
  processSteps: ProcessStepVM[] | null
  testimonial: TestimonialVM | null
  cta: CtaVM | null
  footer: FooterVM | null
  seo: SeoVM | null
}

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested)
// ---------------------------------------------------------------------------

/** Sort by ascending `order`; items without an order sort last, stably. Does not mutate input. */
export function ordered<T extends { order?: number | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ao = a.order ?? Number.POSITIVE_INFINITY
    const bo = b.order ?? Number.POSITIVE_INFINITY
    return ao === bo ? 0 : ao - bo
  })
}

/** First non-empty (trimmed) candidate, else ''. Implements single-locale/empty-value fallback. */
export function pick(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) return trimmed
    }
  }
  return ''
}

/** Null for an empty/absent list so a section can be omitted; otherwise the list unchanged. */
export function omitIfEmpty<T>(items: T[] | null | undefined): T[] | null {
  if (!items || items.length === 0) return null
  return items
}

/** Flatten a Lexical rich-text value to plain text (for SEO, aria, fallbacks). Pure. */
export function lexicalToPlainText(value: RichTextValue | undefined): string {
  const root = value && typeof value === 'object' ? (value as { root?: unknown }).root : undefined
  const node = root as { children?: unknown[] } | undefined
  if (!node || !Array.isArray(node.children)) return ''
  const walk = (n: unknown): string => {
    const obj = n as { text?: unknown; children?: unknown[] }
    if (typeof obj?.text === 'string') return obj.text
    if (Array.isArray(obj?.children)) return obj.children.map(walk).join('')
    return ''
  }
  return node.children.map(walk).join(' ').replace(/\s+/g, ' ').trim()
}

/** Run a section loader, degrading to `fallback` (default null) and logging on failure (T045). */
export async function safeSection<T>(
  label: string,
  loader: () => Promise<T>,
  fallback: T | null = null,
): Promise<T | null> {
  try {
    return await loader()
  } catch (err) {
    logger.error({ err, section: label }, 'content load failed; section degraded')
    return fallback
  }
}

// ---------------------------------------------------------------------------
// Collection mappers (pure, unit-tested)
// ---------------------------------------------------------------------------

type Ordered = { order?: number | null }

export function mapStats(
  docs: Array<Ordered & { value?: number | null; unit?: string | null; label?: string | null }>,
): StatVM[] {
  return ordered(docs).map((d) => ({
    value: d.value ?? 0,
    unit: d.unit ?? '',
    label: d.label ?? '',
  }))
}

export function mapCapabilities(
  docs: Array<
    Ordered & {
      icon?: string | null
      categoryLabel?: string | null
      title?: string | null
      description?: string | null
      tags?: Array<{ value?: string | null }> | null
    }
  >,
): CapabilityVM[] {
  return ordered(docs).map((d) => ({
    icon: d.icon ?? '',
    categoryLabel: d.categoryLabel ?? '',
    title: d.title ?? '',
    description: d.description ?? '',
    tags: (d.tags ?? []).map((t) => t.value ?? ''),
  }))
}

export function mapCaseStudies(
  docs: Array<
    Ordered & {
      glyph?: string | null
      tag?: string | null
      title?: string | null
      description?: string | null
      metricsLine?: RichTextValue
    }
  >,
): CaseStudyVM[] {
  return ordered(docs).map((d) => ({
    glyph: d.glyph ?? '',
    tag: d.tag ?? '',
    title: d.title ?? '',
    description: d.description ?? '',
    metricsLine: d.metricsLine ?? null,
  }))
}

export function mapProcessSteps(
  docs: Array<
    Ordered & {
      number?: string | null
      name?: string | null
      title?: string | null
      description?: string | null
      checklist?: Array<{ point?: string | null }> | null
    }
  >,
): ProcessStepVM[] {
  return ordered(docs).map((d) => ({
    number: d.number ?? '',
    name: d.name ?? '',
    title: d.title ?? '',
    description: d.description ?? '',
    checklist: (d.checklist ?? []).map((c) => c.point ?? ''),
  }))
}

export function mapClientLogos(docs: Array<Ordered & { name?: string | null }>): ClientLogoVM[] {
  return ordered(docs).map((d) => ({ name: d.name ?? '' }))
}

export function mapShowcaseSurfaces(
  docs: Array<
    Ordered & {
      tabName?: string | null
      tabTitle?: string | null
      tabDescription?: string | null
      panel?: ShowcasePanelBlock[] | null
    }
  >,
): ShowcaseSurfaceVM[] {
  return ordered(docs).map((d) => ({
    tabName: d.tabName ?? '',
    tabTitle: d.tabTitle ?? '',
    tabDescription: d.tabDescription ?? '',
    panel: d.panel ?? [],
  }))
}

// ---------------------------------------------------------------------------
// Orchestrator (Payload Local API I/O) — lazy imports keep the pure layer test-light
// ---------------------------------------------------------------------------

async function getClient() {
  const { getPayload } = await import('payload')
  const config = (await import('@payload-config')).default
  return getPayload({ config })
}

export async function getSiteContent(locale: Locale): Promise<SiteContent> {
  const payload = await getClient()

  const global = (slug: string) =>
    payload.findGlobal({ slug: slug as never, locale, fallbackLocale: DEFAULT_LOCALE, depth: 1 })

  const collection = (slug: string) =>
    payload.find({
      collection: slug as never,
      where: { _status: { equals: 'published' } },
      sort: 'order',
      locale,
      fallbackLocale: DEFAULT_LOCALE,
      depth: 1,
      limit: 100,
      pagination: false,
    })

  const [
    heroDoc,
    navDoc,
    marqueeDoc,
    headingsDoc,
    testimonialDoc,
    ctaDoc,
    footerDoc,
    seoDoc,
    statsRes,
    capabilitiesRes,
    showcaseRes,
    caseStudiesRes,
    processStepsRes,
    clientLogosRes,
  ] = await Promise.all([
    safeSection('hero', () => global('hero')),
    safeSection('nav-labels', () => global('nav-labels')),
    safeSection('marquee', () => global('marquee')),
    safeSection('section-headings', () => global('section-headings')),
    safeSection('testimonial', () => global('testimonial')),
    safeSection('call-to-action', () => global('call-to-action')),
    safeSection('footer', () => global('footer')),
    safeSection('seo-metadata', () => global('seo-metadata')),
    safeSection('stats', () => collection('stats')),
    safeSection('capabilities', () => collection('capabilities')),
    safeSection('showcase-surfaces', () => collection('showcase-surfaces')),
    safeSection('case-studies', () => collection('case-studies')),
    safeSection('process-steps', () => collection('process-steps')),
    safeSection('client-logos', () => collection('client-logos')),
  ])

  const rows = <T>(res: { docs?: T[] } | null): T[] => res?.docs ?? []

  return {
    hero: heroDoc ? mapHero(heroDoc) : null,
    nav: navDoc ? mapNav(navDoc) : null,
    marquee: marqueeDoc ? mapMarquee(marqueeDoc, mapClientLogos(rows(clientLogosRes))) : null,
    sectionHeadings: mapSectionHeadings(headingsDoc),
    stats: omitIfEmpty(mapStats(rows(statsRes))),
    capabilities: omitIfEmpty(mapCapabilities(rows(capabilitiesRes))),
    showcase: omitIfEmpty(mapShowcaseSurfaces(rows(showcaseRes))),
    caseStudies: omitIfEmpty(mapCaseStudies(rows(caseStudiesRes))),
    processSteps: omitIfEmpty(mapProcessSteps(rows(processStepsRes))),
    testimonial: testimonialDoc ? mapTestimonial(testimonialDoc) : null,
    cta: ctaDoc ? mapCta(ctaDoc) : null,
    footer: footerDoc ? mapFooter(footerDoc) : null,
    seo: seoDoc ? mapSeo(seoDoc) : null,
  }
}

/**
 * Look up a section heading by its mono number ('01'..'04'); null if absent.
 *
 * The CMS `number` field is editor-controlled free text. Prefer an exact match, then fall
 * back to a numeric-equivalent match so a non-canonical authoring ('1' for '01') still
 * resolves instead of silently dropping the entire section header.
 */
export function headingByNumber(
  headings: SectionHeadingVM[],
  number: string,
): SectionHeadingVM | null {
  const exact = headings.find((h) => h.number === number)
  if (exact) return exact
  const target = Number.parseInt(number, 10)
  if (Number.isNaN(target)) return null
  return headings.find((h) => Number.parseInt(h.number, 10) === target) ?? null
}

/**
 * Lightweight SEO-only read for `generateMetadata` (T043) — avoids a full site fetch
 * just to build the per-locale <head>. Degrades to null on any failure.
 */
export async function getSeo(locale: Locale): Promise<SeoVM | null> {
  return safeSection('seo-metadata', async () => {
    const payload = await getClient()
    const doc = await payload.findGlobal({
      slug: 'seo-metadata' as never,
      locale,
      fallbackLocale: DEFAULT_LOCALE,
      depth: 1,
    })
    return mapSeo(doc)
  })
}

// ---------------------------------------------------------------------------
// Global mappers (pure; exercised end-to-end by the public page / E2E)
// ---------------------------------------------------------------------------

function mapHero(d: any): HeroVM {
  return {
    kicker: pick(d.kicker),
    headline: d.headline ?? null,
    subhead: d.subhead ?? null,
    trustLabel: pick(d.trustLabel),
    primaryCtaLabel: pick(d.primaryCtaLabel),
    secondaryCtaLabel: pick(d.secondaryCtaLabel),
  }
}

function mapNav(d: any): NavVM {
  return {
    capabilities: pick(d.capabilities),
    platform: pick(d.platform),
    work: pick(d.work),
    process: pick(d.process),
    ctaLabel: pick(d.ctaLabel),
  }
}

function mapMarquee(d: any, logos: ClientLogoVM[]): MarqueeVM {
  return { heading: pick(d.heading), logos }
}

function mapSectionHeadings(d: any): SectionHeadingVM[] {
  const rows: any[] = d?.headings ?? []
  return rows.map((row) => ({
    number: pick(row.number),
    title: row.title ?? null,
    subtitle: pick(row.subtitle),
  }))
}

function mapTestimonial(d: any): TestimonialVM {
  return { quote: d.quote ?? null, attribution: d.attribution ?? null }
}

function mapCta(d: any): CtaVM {
  return {
    kicker: pick(d.kicker),
    heading: d.heading ?? null,
    body: pick(d.body),
    email: pick(d.email),
    bookCallLabel: pick(d.bookCallLabel),
    socialLinks: (d.socialLinks ?? []).map((l: any) => ({
      label: pick(l.label),
      url: pick(l.url),
    })),
  }
}

function mapFooter(d: any): FooterVM {
  return {
    blurb: pick(d.blurb),
    studioLinks: (d.studioLinks ?? []).map((l: any) => ({
      label: pick(l.label),
      anchor: pick(l.anchor),
    })),
    connectLinks: (d.connectLinks ?? []).map((l: any) => ({
      label: pick(l.label),
      url: pick(l.url),
    })),
    bottomNote: pick(d.bottomNote),
  }
}

function mapSeo(d: any): SeoVM {
  const og = d?.ogImage
  const ogImage = og && typeof og === 'object' && typeof og.url === 'string' ? og.url : null
  return { title: pick(d.title), description: pick(d.description), ogImage }
}
