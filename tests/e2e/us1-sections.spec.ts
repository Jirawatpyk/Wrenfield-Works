/**
 * T021 [US1] — Every section renders in EN with seeded content, in a single <main>,
 * with exactly one <h1> and proper landmarks.
 */
import { test, expect } from '@playwright/test'

import { TESTIDS, gotoHome } from './helpers'

test.describe('US1 — all sections render (EN)', () => {
  test('renders nav, every section, and the footer with seeded English content', async ({
    page,
  }) => {
    await gotoHome(page, 'en')

    for (const id of [
      TESTIDS.nav,
      TESTIDS.hero,
      TESTIDS.marquee,
      TESTIDS.stats,
      TESTIDS.capabilities,
      TESTIDS.showcase,
      TESTIDS.work,
      TESTIDS.process,
      TESTIDS.testimonial,
      TESTIDS.cta,
      TESTIDS.footer,
    ]) {
      await expect(page.getByTestId(id)).toBeVisible()
    }

    // Seeded EN copy from the approved design.
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Production systems')
    await expect(page.getByRole('heading', { name: 'What we build' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Selected work' })).toBeVisible()
    await expect(page.getByTestId(TESTIDS.testimonial)).toContainText('Meridian Freight')
  })

  test('has exactly one h1 and the core landmark regions', async ({ page }) => {
    await gotoHome(page, 'en')
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
  })
})
