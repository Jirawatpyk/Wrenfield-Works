/**
 * T085 [US1] — Long-text layout integrity (spec Edge Cases / FR-005).
 *
 * "Copy up to at least 50% longer than the design's reference length (either
 * language) MUST wrap and reflow without breaking the layout, overlapping, or
 * clipping." We expand the visible PROSE by ~50% at runtime, then assert — per
 * element — that nothing overflows horizontally.
 *
 * Why per-element, not document scrollWidth: `body { overflow-x: hidden }`
 * (src/styles/globals.css) clamps the document's scroll width, so a document-level
 * `scrollWidth - clientWidth` check can NEVER fail and would be a false-pass. Instead
 * we measure each prose element directly:
 *   - getBoundingClientRect().right must stay within the viewport (no element pushed
 *     off-screen — clip-independent, since layout position is reported even when the
 *     overflow is hidden), and
 *   - scrollWidth <= clientWidth (the element's own content wraps within its box;
 *     scrollWidth reflects the full content width even under overflow:hidden, so this
 *     catches clipped/non-wrapping text).
 *
 * Scope: translatable prose (headings, paragraphs, kicker/lead). The intentionally
 * English-only mono labels / KPI units / code lines (FR-011) are excluded — they are
 * not required to wrap.
 */
import { test, expect, type Page } from '@playwright/test'

import { TESTIDS } from './helpers'

// Prose that MUST wrap/reflow. Deliberately excludes mono/code/marquee/showcase chrome.
const PROSE = [
  'main h1',
  'main h2',
  'main h3',
  'main h4',
  'main p',
  'main blockquote',
  'main .kicker',
  'main .lead',
  'footer p',
].join(', ')

/** Append ~50% more characters to every matched prose element. */
async function inflateProse(page: Page): Promise<void> {
  await page.evaluate((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      const text = (el.textContent ?? '').trim()
      if (text.length > 8) el.append(' ' + text.slice(0, Math.ceil(text.length * 0.5)))
    })
  }, PROSE)
}

/** Worst horizontal overflow across prose elements (reading rects forces a fresh layout). */
async function worstOverflow(page: Page) {
  return page.evaluate((sel) => {
    const vw = document.documentElement.clientWidth
    let pastViewport = 0
    let pastBox = 0
    let offender = ''
    const els = Array.from(document.querySelectorAll(sel))
    for (const el of els) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue // not rendered
      const beyondViewport = Math.round(r.right - vw)
      const beyondBox = el.scrollWidth - el.clientWidth
      if (beyondViewport > pastViewport) {
        pastViewport = beyondViewport
        offender = (el.textContent ?? '').slice(0, 60)
      }
      if (beyondBox > pastBox) {
        pastBox = beyondBox
        offender = (el.textContent ?? '').slice(0, 60)
      }
    }
    return { pastViewport, pastBox, offender, count: els.length }
  }, PROSE)
}

const CASES: Array<{ locale: 'en' | 'th'; width: number }> = [
  { locale: 'en', width: 360 },
  { locale: 'en', width: 1440 },
  { locale: 'th', width: 360 },
  { locale: 'th', width: 1440 },
]

test.describe('US1 — long-text (+50%) layout integrity', () => {
  for (const { locale, width } of CASES) {
    test(`prose reflows without overflow at ${width}px (${locale})`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.setViewportSize({ width, height: 900 })
      await page.goto(`/${locale}`)
      await expect(page.getByTestId(TESTIDS.hero)).toBeVisible()

      await inflateProse(page)
      const w = await worstOverflow(page)

      // Guard against a vacuous pass: the selector must actually match prose.
      expect(w.count, 'prose selector should match elements').toBeGreaterThan(5)
      // 1px tolerance for sub-pixel rounding.
      expect(
        w.pastViewport,
        `prose extends past the viewport: "${w.offender}"`,
      ).toBeLessThanOrEqual(1)
      expect(w.pastBox, `prose clips/overflows its own box: "${w.offender}"`).toBeLessThanOrEqual(1)
    })
  }
})
