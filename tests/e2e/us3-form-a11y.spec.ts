/**
 * T069 [US3] — Inquiry form accessibility (FR-007d, WCAG 2.1 AA).
 *
 * The form's validation errors MUST be programmatically associated with their
 * fields (aria-invalid + aria-describedby pointing at the visible message) and
 * announced (a live region), and the form must pass axe AA in both its initial
 * and error states.
 */
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

import { gotoHome, TESTIDS } from './helpers'

test.describe('US3 — inquiry form a11y', () => {
  test('errors are associated with fields and announced', async ({ page }) => {
    await gotoHome(page, 'en')
    await page.getByTestId(TESTIDS.cta).scrollIntoViewIfNeeded()

    // Submit with everything empty → client validation surfaces field errors.
    await page.getByTestId('inquiry-submit').click()

    const name = page.locator('#inquiry-name')
    await expect(name).toHaveAttribute('aria-invalid', 'true')

    // The field points at its error message via aria-describedby, and that node has text.
    const describedby = await name.getAttribute('aria-describedby')
    expect(describedby, 'name input should reference its error via aria-describedby').toBeTruthy()
    const errorNode = page.locator(`#${describedby}`)
    await expect(errorNode).toBeVisible()
    await expect(errorNode).not.toBeEmpty()

    // Consent is required (FR-026) and flagged when unchecked.
    await expect(page.locator('#inquiry-consent')).toHaveAttribute('aria-invalid', 'true')

    // An assertive live region inside the form announces that it has errors.
    // (Scope to the form — Next.js renders its own empty route-announcer alert.)
    await expect(page.getByTestId('inquiry-form').getByRole('alert')).toBeVisible()
  })

  test('the inquiry form region passes axe WCAG 2.1 AA in its error state', async ({ page }) => {
    await gotoHome(page, 'en')
    await page.getByTestId(TESTIDS.cta).scrollIntoViewIfNeeded()
    await page.getByTestId('inquiry-submit').click()
    await expect(page.locator('#inquiry-name')).toHaveAttribute('aria-invalid', 'true')

    const results = await new AxeBuilder({ page })
      .include('[data-testid="section-cta"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })

  test('the privacy-notice link is present on the consent control (FR-026)', async ({ page }) => {
    await gotoHome(page, 'en')
    await page.getByTestId(TESTIDS.cta).scrollIntoViewIfNeeded()
    const privacyLink = page.getByTestId('inquiry-privacy-link')
    await expect(privacyLink).toBeVisible()
    await expect(privacyLink).toHaveAttribute('href', /privacy/i)
  })
})
