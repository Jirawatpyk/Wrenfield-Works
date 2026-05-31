/**
 * T025 [US1] — prefers-reduced-motion disables decorative animation; the marquee is pausable.
 */
import { test, expect } from '@playwright/test'

import { TESTIDS, gotoHome } from './helpers'

test.describe('US1 — reduced motion + pausable marquee', () => {
  test('adds motion-off when the OS prefers reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoHome(page, 'en')
    await expect(page.locator('body')).toHaveClass(/motion-off/)
  })

  test('marquee has an accessible pause control that toggles its state', async ({ page }) => {
    await gotoHome(page, 'en')
    const toggle = page.getByTestId(TESTIDS.marqueeToggle)
    await expect(toggle).toBeVisible()

    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId(TESTIDS.marquee)).toHaveAttribute('data-paused', 'true')
  })
})
