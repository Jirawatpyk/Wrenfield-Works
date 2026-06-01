/**
 * T050 [US2] — Edit the Hero global EN+TH, publish, and confirm the public site behavior:
 *   - FR-016: published changes are visible on the public site immediately.
 *   - FR-017: a subsequent draft (saved, not published) is NOT visible to the public.
 *   - FR-018: an editor can preview the unpublished draft as it will appear on the public site.
 *
 * This is an authenticated back-office journey. It assumes the seeded admin user
 * (ADMIN, from admin-helpers) and a draft-preview route exist — both land later in US2,
 * so this spec is expected RED until that implementation ships.
 *
 * The Hero `kicker` is a localized text field (#field-kicker in the Payload admin) and renders
 * as the `.kicker` paragraph inside the public hero section, so editing it gives a single,
 * unique, deterministic marker to assert on across the publish / draft / preview surfaces.
 */
import { test, expect, type Page } from '@playwright/test'

import { TESTIDS } from './helpers'
import { loginAsAdmin, gotoGlobal, localeUrl } from './admin-helpers'

// One run-unique suffix so reruns never collide and the public DOM never carries a stale marker.
const TS = Date.now()
const PUBLISHED_MARKER = `E2E-PUB-${TS}`
const DRAFT_MARKER = `E2E-DRAFT-${TS}`

/** Set the Hero kicker for the current admin edit locale and persist it as a draft. */
async function setKickerAndSaveDraft(page: Page, value: string): Promise<void> {
  const kicker = page.locator('#field-kicker')
  // A full page.goto to switch admin locale re-boots the Payload SPA, which can take a while
  // on a cold route — give the field generous time to appear before interacting.
  await expect(kicker).toBeVisible({ timeout: 30_000 })
  await kicker.fill(value)
  await page.getByRole('button', { name: /save draft/i }).click()
  // Payload surfaces a success toast on save; wait for the field to settle on our value.
  await expect(kicker).toHaveValue(value)
}

test.describe('US2 — edit hero EN+TH, publish, draft + preview hidden from public', () => {
  test('publishes EN+TH, hides a later draft from the public, and previews the draft', async ({
    page,
  }) => {
    // Multi-step back-office journey plus SSG on-publish revalidation propagation — give headroom.
    test.setTimeout(150_000)
    // 1. Sign in and open the Hero global editor.
    await loginAsAdmin(page)
    await gotoGlobal(page, 'hero')

    // 2a. Edit EN: set the kicker to the unique published marker, save as draft.
    const heroEnUrl = localeUrl('/admin/globals/hero', 'en')
    await page.goto(heroEnUrl)
    await setKickerAndSaveDraft(page, PUBLISHED_MARKER)

    // 2b. Edit TH: a TH value must exist or the publish-completeness gate blocks publish.
    await page.goto(localeUrl('/admin/globals/hero', 'th'))
    await setKickerAndSaveDraft(page, `${PUBLISHED_MARKER}-TH`)

    // 2c. Publish. Both locales now carry a value, so the gate allows it. Reload before each attempt
    // so the form holds the CURRENT updatedAt — a drafts-enabled doc's draft/published divergence
    // can otherwise trip optimistic-concurrency on the first try; reloading and retrying mirrors how
    // an editor recovers. On success "Publish changes" settles back to disabled (no pending changes).
    await expect(async () => {
      await page.goto(heroEnUrl)
      const publishBtn = page.getByRole('button', { name: /publish changes/i })
      await expect(publishBtn).toBeEnabled({ timeout: 10_000 })
      await publishBtn.click()
      await expect(publishBtn).toBeDisabled({ timeout: 10_000 })
    }).toPass({ timeout: 60_000 })

    // 3. FR-016: the published EN marker becomes visible on the public site. The locale pages are
    // statically generated with on-publish revalidation, so reload until it propagates.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(async () => {
      await page.goto('/en')
      await expect(page.getByTestId(TESTIDS.hero)).toBeVisible({ timeout: 5_000 })
      await expect(page.getByText(PUBLISHED_MARKER, { exact: false })).toBeVisible({
        timeout: 5_000,
      })
    }).toPass({ timeout: 60_000 })

    // 4. FR-017: change EN to a NEW draft-only marker and Save draft (do NOT publish).
    await page.goto(heroEnUrl)
    await setKickerAndSaveDraft(page, DRAFT_MARKER)

    // The public page must still show the PUBLISHED marker and must NOT show the draft marker.
    await expect(async () => {
      await page.goto('/en')
      await expect(page.getByText(PUBLISHED_MARKER, { exact: false })).toBeVisible({
        timeout: 5_000,
      })
    }).toPass({ timeout: 60_000 })
    await expect(page.getByText(DRAFT_MARKER, { exact: false })).toHaveCount(0)

    // 5. FR-018: the editor previews the unpublished draft as it will appear publicly.
    // Payload renders content via Next.js draft mode; the admin "Preview" control routes through
    // the draft-preview entry point (/next/preview by convention) which enables draft mode and
    // redirects to the public page rendering drafts. The draft-only marker MUST be visible there.
    await page.goto(heroEnUrl)
    const previewLink = page.getByRole('link', { name: /preview/i }).first()
    await expect(previewLink).toBeVisible({ timeout: 15_000 })

    const previewHref = await previewLink.getAttribute('href')
    expect(previewHref, 'admin Preview control should target a draft-preview route').toBeTruthy()
    expect(previewHref || '').toMatch(/preview/i)

    await page.goto(previewHref as string)
    await expect(page.getByTestId(TESTIDS.hero)).toBeVisible()
    await expect(page.getByText(DRAFT_MARKER, { exact: false })).toBeVisible()
  })
})
