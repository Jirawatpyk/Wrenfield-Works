'use client'

import { useEffect } from 'react'

/**
 * Draws the per-section hairline dividers (design-extract §3, `section.blk::before`).
 *
 * The prototype's enterprise.js added `.rule-in` to each `section.blk:not(.no-rule)` as it
 * scrolled into view, animating the divider from scaleX(0) → scaleX(1). That script wasn't
 * ported, so without this the dividers stayed at scaleX(0) — invisible ("section lines
 * missing"). Mounted once on the page, this reveals every divider with a scroll-based check
 * (robust under lattice-canvas CPU load) plus timer fallbacks. Honors reduced motion.
 */
export function SectionRules() {
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section.blk:not(.no-rule)'))
    if (sections.length === 0) return

    if (document.body.classList.contains('motion-off')) {
      sections.forEach((s) => s.classList.add('rule-in'))
      return
    }

    const pending = new Set(sections)
    const timers: ReturnType<typeof setTimeout>[] = []

    const cleanup = () => {
      window.removeEventListener('scroll', onChange)
      window.removeEventListener('resize', onChange)
      timers.forEach(clearTimeout)
    }

    const onChange = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight
      for (const s of pending) {
        const r = s.getBoundingClientRect()
        if (r.top < vh * 0.88 && r.bottom > 0) {
          s.classList.add('rule-in')
          pending.delete(s)
        }
      }
      if (pending.size === 0) cleanup()
    }

    // Hard guarantee: draw every remaining divider after ~1s regardless of scroll position
    // or callback health (the lattice rAF can starve scroll handlers — a line must never
    // stay invisible). This reveals all pending dividers, matching the Reveal fallback.
    const revealAll = () => {
      for (const s of pending) s.classList.add('rule-in')
      pending.clear()
      cleanup()
    }

    window.addEventListener('scroll', onChange, { passive: true })
    window.addEventListener('resize', onChange)
    timers.push(...[100, 400, 900].map((t) => setTimeout(onChange, t)))
    timers.push(setTimeout(revealAll, 1000))
    onChange()

    return cleanup
  }, [])

  return null
}
