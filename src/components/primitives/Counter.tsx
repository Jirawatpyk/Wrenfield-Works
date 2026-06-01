'use client'

import { useEffect, useRef, useState } from 'react'

import { decimalPlaces, formatCount } from '@/lib/format'

const DURATION_MS = 1400

/** ease-out cubic — design-extract §4.6: 1 - (1 - p)^3 */
function easeOut(p: number): number {
  return 1 - Math.pow(1 - p, 3)
}

/**
 * Counter — client primitive (design-extract §4.6 animated counters).
 *
 * The settled value is DERIVED from props (`final`), so the server-rendered output and any
 * later prop change always show the real number with no layout shift, and crawlers/no-JS
 * visitors see it too. State holds only the transient in-flight number during the count-up
 * (`animating`), which is null at rest — so the effect never calls setState synchronously
 * (avoids cascading renders): every update happens inside the IntersectionObserver callback,
 * an rAF step, or cleanup.
 *
 * Values render **as authored** (FR-011c): no locale thousands-grouping, and the authored
 * decimal precision is preserved (an explicit `decimals` prop wins, else it is inferred).
 * Under reduced motion (`motion-off`) the count-up is skipped entirely. rAF + observer are
 * torn down on unmount.
 */
export function Counter({
  value,
  unit,
  decimals = 0,
  className,
}: {
  value: number
  unit?: string
  decimals?: number
  className?: string
}) {
  const fractionDigits = decimals > 0 ? decimals : decimalPlaces(value)
  const final = formatCount(value, fractionDigits)
  // null = settled (render `final`); a string = the current count-up frame.
  const [animating, setAnimating] = useState<string | null>(null)
  const ref = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Reduced motion → no count-up; the derived `final` is already correct.
    if (document.body.classList.contains('motion-off')) return

    let rafId = 0
    let observer: IntersectionObserver | null = null
    let cancelled = false

    const animate = () => {
      const start = performance.now()
      const step = (now: number) => {
        if (cancelled) return
        const p = Math.min(1, (now - start) / DURATION_MS)
        if (p < 1) {
          setAnimating(formatCount(easeOut(p) * value, fractionDigits))
          rafId = requestAnimationFrame(step)
        } else {
          setAnimating(null) // settle back to the derived final value
        }
      }
      rafId = requestAnimationFrame(step)
    }

    const begin = () => {
      setAnimating(formatCount(0, fractionDigits)) // reset to 0, then ramp
      animate()
    }

    if (typeof IntersectionObserver === 'undefined') {
      begin()
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              begin()
              observer?.unobserve(entry.target)
            }
          }
        },
        { threshold: 0.6 },
      )
      observer.observe(el)
    }

    return () => {
      cancelled = true
      if (rafId) cancelAnimationFrame(rafId)
      observer?.disconnect()
    }
  }, [value, fractionDigits])

  return (
    <span ref={ref} className={['v', className].filter(Boolean).join(' ')}>
      <span>{animating ?? final}</span>
      {unit ? <span className="u">{unit}</span> : null}
    </span>
  )
}
