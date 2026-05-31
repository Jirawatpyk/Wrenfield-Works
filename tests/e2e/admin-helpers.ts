import { type Page, expect } from '@playwright/test'

/**
 * Back-office (Payload admin) E2E helpers for User Story 2.
 *
 * The admin user is seeded into the dev DB by `pnpm seed` (T053 bootstrap), so
 * these journeys assume it exists. Credentials are overridable by env for CI.
 */
export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL || 'admin@wrenfield.test',
  password: process.env.E2E_ADMIN_PASSWORD || 'Admin1234!pw',
} as const

/** Sign in to the Payload admin and wait for the dashboard to be ready. */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/admin/login')
  await page.locator('#field-email').fill(ADMIN.email)
  await page.locator('#field-password').fill(ADMIN.password)
  await page.getByRole('button', { name: /log ?in|sign ?in/i }).click()
  // Payload redirects to the dashboard (/admin) after a successful login.
  await page.waitForURL(/\/admin(\/|$)(?!login)/)
  await expect(page.locator('.dashboard, .template-default').first()).toBeVisible({
    timeout: 15_000,
  })
}

/** Navigate to a global's edit view (e.g. 'hero'). */
export async function gotoGlobal(page: Page, slug: string): Promise<void> {
  await page.goto(`/admin/globals/${slug}`)
}

/** Navigate to a collection list view (e.g. 'stats'). */
export async function gotoCollection(page: Page, slug: string): Promise<void> {
  await page.goto(`/admin/collections/${slug}`)
}

/** Switch the admin edit locale via the ?locale= query param Payload honors. */
export function localeUrl(url: string, locale: 'en' | 'th'): string {
  const u = new URL(url, 'http://localhost:3000')
  u.searchParams.set('locale', locale)
  return u.pathname + u.search
}
