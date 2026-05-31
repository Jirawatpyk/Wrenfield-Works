/**
 * T052 [US2] — Back-office editing UI meets WCAG 2.1 AA (FR-007).
 *
 * The Payload admin is part of the product surface the constitution gates: WCAG 2.1 AA
 * applies to the back-office editing UI just as it does to the public site. This audits
 * a representative edit view (the Hero global) and a collection list view (Stats) with
 * @axe-core/playwright, and demonstrates keyboard reachability of the edit form.
 *
 * Mirrors the AxeBuilder pattern in us1-a11y.spec.ts. We do NOT pre-suppress any rule;
 * violations are allowed to surface. We assert specifically on impact 'serious' | 'critical'
 * so the failure message names exactly which blocking issues remain to be fixed.
 */
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

import { loginAsAdmin, gotoGlobal, gotoCollection } from './admin-helpers'

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

/** Keep only blocking violations and render them into a readable assertion message. */
function blocking(violations: { id: string; impact?: string | null; help: string }[]) {
  return violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
}

function describeViolations(
  violations: { id: string; impact?: string | null; help: string }[],
): string {
  if (violations.length === 0) return 'none'
  return violations.map((v) => `${v.id} (${v.impact}): ${v.help}`).join('\n')
}

test.describe('US2 — back-office WCAG 2.1 AA', () => {
  test('Hero global edit view has no serious/critical axe violations', async ({ page }) => {
    await loginAsAdmin(page)
    await gotoGlobal(page, 'hero')
    // Wait for the edit form to render before auditing.
    await expect(page.locator('#field-kicker')).toBeVisible({ timeout: 15_000 })

    const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze()
    const serious = blocking(results.violations)
    expect(serious, describeViolations(serious)).toEqual([])
  })

  test('Stats collection list view has no serious/critical axe violations', async ({ page }) => {
    await loginAsAdmin(page)
    await gotoCollection(page, 'stats')
    // The list view renders a table/list region once data loads.
    await expect(page.locator('.collection-list, .table, table').first()).toBeVisible({
      timeout: 15_000,
    })

    const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze()
    const serious = blocking(results.violations)
    expect(serious, describeViolations(serious)).toEqual([])
  })

  test('Hero edit form is keyboard reachable with focus moving between controls', async ({
    page,
  }) => {
    await loginAsAdmin(page)
    await gotoGlobal(page, 'hero')

    const firstField = page.locator('#field-kicker')
    await expect(firstField).toBeVisible({ timeout: 15_000 })

    // Focus the first field, then tab through a few controls. After each Tab the active
    // element must be a real focusable control (not the document body), proving the form is
    // reachable by keyboard alone with a managed, visible focus.
    await firstField.focus()
    await expect(firstField).toBeFocused()

    const FOCUSABLE = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A']
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab')
      const tag = await page.evaluate(() => document.activeElement?.tagName ?? null)
      expect(
        tag,
        `after Tab #${i + 1} focus landed on <${tag}>, expected a focusable control`,
      ).not.toBe('BODY')
      expect(
        tag,
        `after Tab #${i + 1} focus landed on <${tag}>, expected a focusable control`,
      ).not.toBeNull()
      expect(
        FOCUSABLE.includes(tag ?? ''),
        `after Tab #${i + 1} focus landed on <${tag}>, expected one of ${FOCUSABLE.join(', ')}`,
      ).toBe(true)
    }
  })
})
