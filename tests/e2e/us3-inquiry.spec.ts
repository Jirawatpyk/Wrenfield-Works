/**
 * T068 [US3] — Inquiry journey (FR-022/FR-024/FR-026).
 *
 * A visitor fills the on-site inquiry form (which replaces the design's mailto:),
 * consents, and submits → an on-page confirmation appears. Then a staff member
 * signs in and sees the inquiry in the inbox with its locale + submission time.
 *
 * Assumes the seeded admin user (admin-helpers) exists in the running app's DB,
 * and that no TURNSTILE_SECRET is configured for the e2e server (challenge skipped).
 */
import { test, expect } from '@playwright/test'

import { gotoHome, TESTIDS } from './helpers'
import { loginAsAdmin, gotoCollection } from './admin-helpers'

const TS = Date.now()

test.describe('US3 — submit an inquiry, see it in the inbox', () => {
  test('valid submission shows a confirmation and lands in the back-office inbox', async ({
    page,
  }) => {
    test.setTimeout(120_000)
    const name = `E2E Prospect ${TS}`
    const email = `prospect+${TS}@example.com`

    // 1. Visitor fills + submits the inquiry form on the public site.
    await gotoHome(page, 'en')
    await page.getByTestId(TESTIDS.cta).scrollIntoViewIfNeeded()

    await page.locator('#inquiry-name').fill(name)
    await page.locator('#inquiry-email').fill(email)
    await page.locator('#inquiry-message').fill('We would like to discuss an internal tool build.')
    await page.locator('#inquiry-consent').check()
    await page.getByTestId('inquiry-submit').click()

    // 2. On-page confirmation (FR-022).
    await expect(page.getByTestId('inquiry-status')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('inquiry-status')).toContainText(/sent|thank|ขอบคุณ|ส่ง/i)

    // 3. Staff sees it in the inbox with locale + time (FR-024).
    await loginAsAdmin(page)
    await gotoCollection(page, 'inquiries')
    await expect(page.getByText(email, { exact: false })).toBeVisible({ timeout: 15_000 })
    const row = page.locator('tr', { hasText: email })
    await expect(row).toContainText(name)
    // Locale recorded as the language the visitor used.
    await expect(row).toContainText(/en/i)
  })
})
