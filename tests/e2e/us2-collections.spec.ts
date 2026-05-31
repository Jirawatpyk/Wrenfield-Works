/**
 * T051 [US2] — Manage a repeatable collection from the back office (FR-015):
 * add, reorder (explicit ordering control), and remove WITH a confirmation step.
 *
 * Exercises the Payload 3.85 admin against the `stats` collection (value:number,
 * unit:mono text, label:localized EN/TH). Selectors are Payload's real stable ids:
 *   #field-value/#field-unit/#field-label/#field-order, #action-save-draft,
 *   #action-save ("Publish changes"), the doc-actions popup `.doc-controls__dots`
 *   → #action-delete → the `.confirmation-modal.delete-document` with #confirm-action.
 * (Payload's admin form fields are disabled until the SPA hydrates; Playwright's
 * fill/click auto-wait for editable/enabled, so no explicit hydration wait is needed.)
 */
import { test, expect } from '@playwright/test'

import { gotoCollection, loginAsAdmin, localeUrl } from './admin-helpers'

test.describe('US2 — manage a repeatable collection (stats)', () => {
  test('add, reorder, then remove-with-confirmation a stat', async ({ page }) => {
    // Long back-office journey (create → TH → publish → list → reorder → delete), each step a
    // full admin SPA navigation — give it headroom beyond the 60s default.
    test.setTimeout(120_000)
    const marker = Date.now()
    const labelEn = `E2E Stat ${marker}`
    const labelTh = `สถิติ E2E ${marker}`
    const unit = `u${marker % 1000}`
    const value = String(marker % 1000)

    await loginAsAdmin(page)

    // ---- ADD ----------------------------------------------------------------
    await gotoCollection(page, 'stats')
    await page
      .getByRole('link', { name: /create new/i })
      .first()
      .click()
    // SPA soft-nav: wait for the create form to be ready, not a 'load' event.
    await expect(page.locator('#field-value')).toBeEditable({ timeout: 30_000 })

    // Fill the English (default-locale) fields.
    await page.locator('#field-value').fill(value)
    await page.locator('#field-unit').fill(unit)
    await page.locator('#field-label').fill(labelEn)
    await page.locator('#action-save-draft').click()

    // After the first save the doc gets a numeric id in the URL (poll the pathname; tolerate any
    // trailing query/slash and don't wait on a 'load' event for the SPA redirect).
    await page.waitForFunction(() => /\/admin\/collections\/stats\/\d+/.test(location.pathname), {
      timeout: 45_000,
    })
    const docUrl = `${new URL(page.url()).origin}${new URL(page.url()).pathname}`

    // Add the Thai label on the same doc, then publish (both locales now present).
    await page.goto(localeUrl(docUrl, 'th'))
    await page.locator('#field-label').fill(labelTh)
    await page.locator('#action-save-draft').click()

    await page.goto(localeUrl(docUrl, 'en'))
    const publish = page.locator('#action-save') // "Publish changes"
    await expect(publish).toBeEnabled({ timeout: 30_000 })
    await publish.click()
    await expect(publish).toBeDisabled({ timeout: 30_000 }) // settles to disabled on success

    // It appears in the list (force EN so the localized label column shows labelEn). The label
    // is a plain cell — the row's link is the first column — so assert on its text, not a link.
    await page.goto(localeUrl('/admin/collections/stats', 'en'))
    await expect(page.getByText(labelEn, { exact: false })).toBeVisible({ timeout: 30_000 })

    // ---- REORDER (explicit ordering control, FR-015) ------------------------
    // Reopen the doc directly (we kept its URL) rather than relying on a label link.
    await page.goto(localeUrl(docUrl, 'en'))
    const order = page.locator('#field-order')
    await expect(order).toBeEditable({ timeout: 30_000 })
    await order.fill(String(marker % 90))
    const republish = page.locator('#action-save')
    await expect(republish).toBeEnabled({ timeout: 30_000 })
    await republish.click()
    await expect(republish).toBeDisabled({ timeout: 30_000 }) // saved without error

    // ---- REMOVE (with confirmation, FR-015) ---------------------------------
    // Delete lives behind the doc-actions "..." popup; clicking it does NOT delete —
    // a confirmation modal must appear first, and only #confirm-action removes the row.
    await page.locator('.doc-controls__dots').click()
    await page.locator('#action-delete').click()

    const confirm = page.locator('.confirmation-modal.delete-document')
    await expect(confirm).toBeVisible({ timeout: 15_000 })
    await expect(confirm.locator('#confirm-cancel')).toBeVisible() // it is a real, cancelable step
    await confirm.locator('#confirm-action').click()

    // Back to the list; the row is gone (check the EN label-column text).
    await expect(page).toHaveURL(/\/admin\/collections\/stats(\?|$)/, { timeout: 15_000 })
    await page.goto(localeUrl('/admin/collections/stats', 'en'))
    await expect(page.getByText(labelEn, { exact: false })).toHaveCount(0)
  })
})
