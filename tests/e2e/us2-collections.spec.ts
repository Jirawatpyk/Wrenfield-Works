/**
 * T051 [US2] — Manage a repeatable collection from the back office (FR-015):
 * add, reorder (explicit ordering control), and remove WITH a confirmation step.
 *
 * Exercises the Payload admin against the seeded `stats` collection
 * (value:number, unit:mono text, label:localized EN/TH). The journey mirrors
 * what a non-technical editor does: create a draft in both locales, publish it,
 * adjust its display order, then delete it through the confirm dialog.
 *
 * A unique numeric suffix (millisecond timestamp) makes the created row findable
 * and keeps reruns from colliding on the same label.
 */
import { test, expect } from '@playwright/test'

import { gotoCollection, loginAsAdmin, localeUrl } from './admin-helpers'

test.describe('US2 — manage a repeatable collection (stats)', () => {
  test('add, reorder, then remove-with-confirmation a stat', async ({ page }) => {
    const marker = Date.now()
    const labelEn = `E2E Stat ${marker}`
    const labelTh = `สถิติ E2E ${marker}`
    const unit = `u${marker}`
    const value = String(marker % 1000)

    await loginAsAdmin(page)

    // ---- ADD ---------------------------------------------------------------
    await gotoCollection(page, 'stats')

    // Open the create form (Payload exposes a "Create new" link/button on the list view).
    await page
      .getByRole('link', { name: /create new/i })
      .first()
      .click()
    await page.waitForURL(/\/admin\/collections\/stats\/create/)

    // Fill the English (default-locale) fields.
    await page.locator('#field-value').fill(value)
    await page.locator('#field-unit').fill(unit)
    await page.locator('#field-label').fill(labelEn)

    // Save as a draft first (drafts may be incomplete; we add TH before publishing).
    await page.getByRole('button', { name: /save draft/i }).click()
    await expect(page.getByRole('button', { name: /publish changes/i })).toBeVisible({
      timeout: 15_000,
    })

    // The doc now has an id in the URL; switch to the Thai locale on the same doc.
    await page.waitForURL(/\/admin\/collections\/stats\/[^/]+$/)
    const docUrl = page.url()
    await page.goto(localeUrl(docUrl, 'th'))
    await expect(page.locator('#field-label')).toBeVisible({ timeout: 15_000 })
    await page.locator('#field-label').fill(labelTh)
    await page.getByRole('button', { name: /save draft/i }).click()

    // Both locales present -> publishing must succeed (publish-completeness gate satisfied).
    await page.getByRole('button', { name: /publish changes/i }).click()
    await expect(page.getByRole('button', { name: /published/i }).first()).toBeVisible({
      timeout: 15_000,
    })

    // It appears in the list view.
    await gotoCollection(page, 'stats')
    await expect(page.getByRole('link', { name: new RegExp(labelEn) })).toBeVisible({
      timeout: 15_000,
    })

    // ---- REORDER -----------------------------------------------------------
    // FR-015 requires an explicit ordering control. The `order` number field is
    // editable on the doc; change it and re-save with no error.
    await page.getByRole('link', { name: new RegExp(labelEn) }).click()
    await page.waitForURL(/\/admin\/collections\/stats\/[^/]+$/)

    const orderField = page.locator('#field-order')
    await expect(orderField).toBeVisible({ timeout: 15_000 })
    await expect(orderField).toBeEditable()

    await orderField.fill(String(marker % 100))
    await page
      .getByRole('button', { name: /publish changes|save/i })
      .first()
      .click()

    // No validation/API error surfaces after re-saving the new order.
    await expect(
      page.locator('.payload-toast-container .toast-error, .Toastify__toast--error'),
    ).toHaveCount(0)

    // ---- REMOVE (with confirmation, FR-015) --------------------------------
    // Trigger delete from the doc-controls menu; Payload requires confirmation
    // BEFORE the record is removed.
    await page
      .getByRole('button', { name: /^delete$/i })
      .first()
      .click()

    // A confirmation step (modal/dialog) appears with a confirming action — the
    // record must NOT be gone yet.
    const confirmDialog = page.getByRole('dialog')
    await expect(confirmDialog).toBeVisible({ timeout: 15_000 })
    const confirmButton = confirmDialog.getByRole('button', { name: /confirm|delete/i })
    await expect(confirmButton.first()).toBeVisible()

    // Confirm the deletion.
    await confirmButton.first().click()

    // After confirming, Payload returns to the list and the row is gone.
    await page.waitForURL(/\/admin\/collections\/stats(\?|$)/, { timeout: 15_000 })
    await expect(page.getByRole('link', { name: new RegExp(labelEn) })).toHaveCount(0)
  })
})
