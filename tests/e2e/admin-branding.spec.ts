import { test, expect } from '@playwright/test'

test.describe('admin branding', () => {
  test('login screen shows the Wrenfield Works lockup and branded title', async ({ page }) => {
    await page.goto('/admin/login')

    // The brand lockup renders (BrandLogo → .wf-brand-logo)
    await expect(page.locator('.wf-brand-logo').first()).toBeVisible()

    // The document title carries the brand suffix from admin.meta.titleSuffix
    await expect(page).toHaveTitle(/Wrenfield Works/)
  })
})
