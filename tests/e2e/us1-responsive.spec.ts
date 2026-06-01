/**
 * T026 [US1] — 360→1440px: no horizontal overflow / clipping, sections still visible.
 */
import { test, expect } from '@playwright/test'

import { TESTIDS } from './helpers'

const WIDTHS = [360, 768, 1024, 1440]

test.describe('US1 — responsive integrity', () => {
  for (const width of WIDTHS) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/en')
      await expect(page.getByTestId(TESTIDS.hero)).toBeVisible()

      const overflow = await page.evaluate(() => {
        const el = document.documentElement
        return el.scrollWidth - el.clientWidth
      })
      // Allow 1px for sub-pixel rounding; anything more is a real horizontal scrollbar.
      expect(overflow).toBeLessThanOrEqual(1)
    })
  }
})
