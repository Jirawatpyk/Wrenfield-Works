/**
 * T080 [US1] — Public-site keyboard navigation (FR-007 / FR-007d, WCAG 2.1 AA).
 *
 * Complements the axe audits (us1-a11y) with the things automation-by-rules can't
 * see: that controls are REACHABLE by Tab, that keyboard focus is VISIBLE (the
 * token :focus-visible ring), and that the inquiry form has a logical tab order
 * with the honeypot excluded from the keyboard path. (Accessible-name coverage is
 * handled by the axe specs.)
 */
import { test, expect, type Page } from '@playwright/test'

import { TESTIDS, gotoHome } from './helpers'

/** A stable identifier for the focused element. */
async function focusedKey(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null
    if (!el || el === document.body) return null
    return el.id || el.getAttribute('data-testid') || el.tagName.toLowerCase()
  })
}

test.describe('US1 — public keyboard navigation', () => {
  test('Tab reaches multiple controls, each with a visible focus ring', async ({ page }) => {
    await gotoHome(page, 'en')

    const focused: Array<{ key: string; outlined: boolean; focusVisible: boolean }> = []
    for (let i = 0; i < 18; i++) {
      await page.keyboard.press('Tab')
      const r = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null
        if (!el || el === document.body) return null
        const cs = getComputedStyle(el)
        return {
          key: el.id || el.getAttribute('data-testid') || el.tagName.toLowerCase(),
          outlined: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
          focusVisible: el.matches(':focus-visible'),
        }
      })
      if (r) focused.push(r)
    }

    // Reached several distinct interactive controls by keyboard alone.
    expect(new Set(focused.map((f) => f.key)).size).toBeGreaterThan(3)

    // Keyboard focus is visibly indicated: every control matching :focus-visible
    // shows the token outline ring (FR-007 visible focus indicator).
    const keyboardFocused = focused.filter((f) => f.focusVisible)
    expect(keyboardFocused.length).toBeGreaterThan(0)
    expect(keyboardFocused.every((f) => f.outlined)).toBe(true)
  })

  test('inquiry form has a logical tab order and skips the honeypot', async ({ page }) => {
    await gotoHome(page, 'en')
    await page.getByTestId(TESTIDS.cta).scrollIntoViewIfNeeded()

    await page.locator('#inquiry-name').focus()
    expect(await focusedKey(page)).toBe('inquiry-name')

    const keys: Array<string | null> = ['inquiry-name']
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab')
      keys.push(await focusedKey(page))
    }

    // The offscreen honeypot (tabIndex=-1) is NEVER in the keyboard path.
    expect(keys).not.toContain('inquiry-company')

    // Real fields are reachable in document order, ending at the submit button.
    const idx = (k: string) => keys.indexOf(k)
    expect(idx('inquiry-email')).toBeGreaterThan(idx('inquiry-name'))
    expect(idx('inquiry-message')).toBeGreaterThan(idx('inquiry-email'))
    expect(idx('inquiry-consent')).toBeGreaterThan(idx('inquiry-message'))
    expect(idx('inquiry-submit')).toBeGreaterThan(idx('inquiry-consent'))
  })
})
