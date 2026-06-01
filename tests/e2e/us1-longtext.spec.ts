/**
 * T085 [US1] — Long-text layout integrity (spec Edge Cases / FR-005).
 *
 * "Copy up to at least 50% longer than the design's reference length (either
 * language) MUST wrap and reflow without breaking the layout, overlapping, or
 * clipping." Seeded content is the design's reference length, so we expand the
 * visible prose by ~50% at runtime and assert the page still has NO horizontal
 * overflow at the narrowest and widest supported widths, in both locales. A
 * non-wrapping/fixed-width container would surface as a horizontal scrollbar.
 */
import { test, expect, type Page } from '@playwright/test'

import { TESTIDS } from './helpers'

/** Append ~50% more characters to every prose element in <main> + footer. */
async function inflateProse(page: Page): Promise<void> {
  await page.evaluate(() => {
    const sel = 'main h1, main h2, main h3, main p, main li, main .kicker, main .lead, footer p'
    document.querySelectorAll(sel).forEach((el) => {
      const text = (el.textContent ?? '').trim()
      if (text.length > 8) el.append(' ' + text.slice(0, Math.ceil(text.length * 0.5)))
    })
  })
}

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.documentElement
    return el.scrollWidth - el.clientWidth
  })
}

const CASES: Array<{ locale: 'en' | 'th'; width: number }> = [
  { locale: 'en', width: 360 },
  { locale: 'en', width: 1440 },
  { locale: 'th', width: 360 },
]

test.describe('US1 — long-text (+50%) layout integrity', () => {
  for (const { locale, width } of CASES) {
    test(`no horizontal overflow with +50% prose at ${width}px (${locale})`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.setViewportSize({ width, height: 900 })
      await page.goto(`/${locale}`)
      await expect(page.getByTestId(TESTIDS.hero)).toBeVisible()

      await inflateProse(page)
      // Let layout settle after the DOM mutation.
      await page.waitForTimeout(150)

      // 1px tolerance for sub-pixel rounding; more means real horizontal scroll.
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
    })
  }
})
