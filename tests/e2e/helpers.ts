import { type Page, expect } from '@playwright/test'

/** All section/control hooks the public page exposes for testing (kept in one place). */
export const TESTIDS = {
  nav: 'site-nav',
  langEn: 'lang-en',
  langTh: 'lang-th',
  themeToggle: 'theme-toggle',
  hero: 'section-hero',
  marquee: 'section-marquee',
  marqueeToggle: 'marquee-toggle',
  stats: 'section-stats',
  capabilities: 'section-capabilities',
  showcase: 'section-showcase',
  work: 'section-work',
  process: 'section-process',
  testimonial: 'section-testimonial',
  cta: 'section-cta',
  footer: 'site-footer',
} as const

/** The English-only labels that must NOT translate across locales (FR-011). */
export const MONO_LABELS = ['Automation', 'Tools', 'Systems', 'Leverage', 'Northbound®'] as const

export async function gotoHome(page: Page, locale: 'en' | 'th' = 'en'): Promise<void> {
  // Keep the decorative lattice canvases static so the suite is CPU-light and deterministic
  // (the suite tests content/i18n/theme/a11y/responsiveness, not animation fidelity).
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`/${locale}`)
  await expect(page.getByTestId(TESTIDS.hero)).toBeVisible()
}

export async function switchLanguage(page: Page, lang: 'en' | 'th'): Promise<void> {
  await page.getByTestId(`lang-${lang}`).click()
  await page.waitForURL(new RegExp(`/${lang}(\\b|/|$)`))
}
