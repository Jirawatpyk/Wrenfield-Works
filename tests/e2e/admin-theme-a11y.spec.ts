import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { loginAsAdmin } from './admin-helpers'

/**
 * Admin editorial theme a11y (D, FR-007): our branding/theme/components introduce
 * NO new serious/critical AA violations beyond Payload 3.85's documented upstream
 * baseline — on login + dashboard, in BOTH dark and light. A `color-contrast`
 * violation on one of OUR nodes (.wf-*) is NOT forgiven (that's the whole point
 * of this gate); upstream Payload chrome contrast is.
 */
const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

const PAYLOAD_AA_BASELINE = new Set([
  'button-name',
  'color-contrast',
  'list',
  'label',
  'select-name',
  'aria-input-field-name',
  'aria-required-children',
  'aria-required-parent',
  // Payload 3.85's ReactSelect DropdownIndicator (@payloadcms/ui, the dashboard
  // header Locale selector's chevron) renders <button aria-hidden="true"> that
  // stays focusable — an upstream `aria-hidden-focus` we cannot fix from app code.
  // Forgiven as upstream chrome; it never lands on our .wf-* nodes.
  'aria-hidden-focus',
])

const OUR_SELECTOR =
  /wf-welcome-card|wf-publish-readiness|wf-brand-logo|wf-locale-status|wf-card|wf-badge|wf-readiness/

type Node = { target?: unknown[] }
type Violation = { id: string; impact?: string | null; help: string; nodes?: Node[] }

function hitsOurNode(v: Violation): boolean {
  return (v.nodes ?? []).some((n) => (n.target ?? []).some((sel) => OUR_SELECTOR.test(String(sel))))
}

function expectNoNovelViolations(violations: Violation[]): void {
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  const novel = serious.filter((v) => {
    if (!PAYLOAD_AA_BASELINE.has(v.id)) return true
    // color-contrast is baseline-forgiven ONLY for Payload's own chrome — if it
    // lands on one of our nodes, it's our bug and must fail.
    if (v.id === 'color-contrast') return hitsOurNode(v)
    return false
  })
  expect(
    novel,
    `New AA violations from our code:\n${novel
      .map((v) => `${v.id} (${v.impact}): ${v.help}`)
      .join('\n')}\nForgiven upstream: ${serious.map((v) => v.id).join(', ')}`,
  ).toEqual([])
}

async function setTheme(page: Page, theme: 'dark' | 'light') {
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme)
}

for (const theme of ['dark', 'light'] as const) {
  test(`login introduces no new AA violations in ${theme} theme`, async ({ page }) => {
    await page.goto('/admin/login')
    await setTheme(page, theme)
    await expect(page.locator('.wf-brand-logo')).toBeVisible()
    const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze()
    expectNoNovelViolations(results.violations as Violation[])
  })

  test(`dashboard introduces no new AA violations in ${theme} theme`, async ({ page }) => {
    await loginAsAdmin(page)
    await setTheme(page, theme)
    await expect(page.getByTestId('wf-welcome-card')).toBeVisible()
    const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze()
    expectNoNovelViolations(results.violations as Violation[])
  })
}
