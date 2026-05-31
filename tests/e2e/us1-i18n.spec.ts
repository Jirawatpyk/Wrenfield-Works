/**
 * T022 [US1] — Switching EN↔TH updates all prose and the choice persists on return.
 */
import { test, expect } from '@playwright/test'

import { gotoHome, switchLanguage } from './helpers'

test.describe('US1 — bilingual switch + persistence', () => {
  test('switches EN→TH and updates prose', async ({ page }) => {
    await gotoHome(page, 'en')
    await expect(page.getByText('What we build')).toBeVisible()

    await switchLanguage(page, 'th')
    await expect(page).toHaveURL(/\/th(\b|\/|$)/)
    await expect(page.getByText('สิ่งที่เราสร้าง')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('ระบบ production')
  })

  test('remembers the chosen language on a later bare-path visit', async ({ page }) => {
    await gotoHome(page, 'en')
    await switchLanguage(page, 'th')

    // Returning to the bare path should resolve to the remembered locale.
    await page.goto('/')
    await expect(page).toHaveURL(/\/th(\b|\/|$)/)
    await expect(page.getByText('สิ่งที่เราสร้าง')).toBeVisible()
  })

  test('serves Thai directly at /th', async ({ page }) => {
    await page.goto('/th')
    await expect(page.getByText('สิ่งที่เราสร้าง')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'th')
  })
})
