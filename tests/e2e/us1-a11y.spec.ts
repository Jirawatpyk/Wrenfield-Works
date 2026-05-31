/**
 * T024 [US1] — axe WCAG 2.1 AA on every section, both themes and both locales.
 */
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

import { TESTIDS, gotoHome } from './helpers'

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

// The audit runs under reduced motion (applied in gotoHome): the decorative lattice
// canvases (aria-hidden) otherwise animate continuously, which (a) lets axe composite their
// pixels into the page background and mis-measure text contrast, and (b) saturates CPU enough
// to time out axe.run under parallel workers. Reduced motion is a real, supported user
// condition and changes no text colour, so the contrast audit stays valid and deterministic.
test.describe('US1 — WCAG 2.1 AA', () => {
  test('EN dark theme has no violations', async ({ page }) => {
    await gotoHome(page, 'en')
    const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze()
    expect(results.violations).toEqual([])
  })

  test('EN paper theme has no violations', async ({ page }) => {
    await gotoHome(page, 'en')
    await page.getByTestId(TESTIDS.themeToggle).click()
    await expect(page.locator('body')).toHaveClass(/paper/)
    const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze()
    expect(results.violations).toEqual([])
  })

  test('TH dark theme has no violations', async ({ page }) => {
    await gotoHome(page, 'th')
    const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze()
    expect(results.violations).toEqual([])
  })
})
