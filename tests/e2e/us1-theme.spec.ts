/**
 * T023 [US1] — The dark↔paper theme toggle applies immediately and persists across reload.
 */
import { test, expect } from '@playwright/test'

import { TESTIDS, gotoHome } from './helpers'

test.describe('US1 — theme toggle persistence', () => {
  test('toggles dark→paper and persists across reload', async ({ page }) => {
    await gotoHome(page, 'en')
    const body = page.locator('body')
    await expect(body).not.toHaveClass(/paper/)

    await page.getByTestId(TESTIDS.themeToggle).click()
    await expect(body).toHaveClass(/paper/)

    await page.reload()
    await expect(page.locator('body')).toHaveClass(/paper/)
  })

  test('toggles paper→dark and persists across reload', async ({ page }) => {
    await gotoHome(page, 'en')
    const toggle = page.getByTestId(TESTIDS.themeToggle)

    await toggle.click() // → paper
    await expect(page.locator('body')).toHaveClass(/paper/)
    await toggle.click() // → dark
    await expect(page.locator('body')).not.toHaveClass(/paper/)

    await page.reload()
    await expect(page.locator('body')).not.toHaveClass(/paper/)
  })
})
