import { expect, test } from '@playwright/test'

import { loginAsAdmin, gotoGlobal } from './admin-helpers'

/**
 * Editor guidance (C): after login the dashboard shows the welcome card (with the
 * publish rule), the readiness panel with a progress summary and content types,
 * and each edit view shows the per-document EN/TH status banner.
 */
test.describe('Admin editor guidance', () => {
  test('dashboard shows welcome card and readiness panel', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page.getByTestId('wf-welcome-card')).toBeVisible()
    await expect(page.getByTestId('wf-publish-readiness')).toBeVisible()
    await expect(page.getByTestId('wf-publish-readiness')).toContainText(/Hero/i)
    await expect(page.getByTestId('wf-readiness-summary')).toBeVisible()
  })

  test('edit view shows the per-document EN/TH status banner', async ({ page }) => {
    await loginAsAdmin(page)
    await gotoGlobal(page, 'hero')
    await expect(page.getByTestId('wf-locale-status')).toBeVisible({ timeout: 30_000 })
  })
})
