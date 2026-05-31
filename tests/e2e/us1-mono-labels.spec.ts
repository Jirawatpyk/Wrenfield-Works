/**
 * T027a [US1] — The enumerated English-only labels (FR-011) stay untranslated across EN/TH
 * while prose toggles, and numeric values render as authored per locale (FR-011c).
 */
import { test, expect } from '@playwright/test'

import { MONO_LABELS, gotoHome } from './helpers'

test.describe('US1 — English-only labels + numerics', () => {
  test('mono labels are present in EN', async ({ page }) => {
    await gotoHome(page, 'en')
    for (const label of MONO_LABELS) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible()
    }
    // Stat numerics render as authored.
    for (const value of ['60', '40', '10', '100']) {
      await expect(page.getByText(value, { exact: false }).first()).toBeVisible()
    }
  })

  test('mono labels stay identical in TH while prose translates', async ({ page }) => {
    await gotoHome(page, 'th')
    // Prose translated…
    await expect(page.getByText('สิ่งที่เราสร้าง')).toBeVisible()
    // …but the enumerated English-only labels are unchanged.
    for (const label of MONO_LABELS) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible()
    }
    // Client name stays English even in the Thai testimonial attribution.
    await expect(page.getByText('Meridian Freight', { exact: false }).first()).toBeVisible()
  })
})
