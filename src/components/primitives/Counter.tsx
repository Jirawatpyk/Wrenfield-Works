'use client'

import { useEffect, useRef, useState } from 'react'

const DURATION_MS = 1400

/** ease-out cubic — design-extract §4.6: 1 - (1 - p)^3 */
function easeOut(p: number): number {
  return 1 - Math.pow(1 - p, 3)
}

function format(n: number, decimals: number): string {
  return decimals > 0 ? n.toFixed(decimals) : Math.round(n).toLocaleString('en-US')
}

/**
 * Counter — client primitive (design-extract §4.6 animated counters).
 *
 * The initial server-rendered output is the FINAL formatted value so crawlers
 * and no-JS visitors always see the real number (and there is no layout shift).
 * After mount:
 *   - If `motion-off` (reduced motion) the final value is kept as-is.
 *   - Otherwise, when the element scrolls into view (IntersectionObserver,
 *     threshold .6) it animates 0 → value over 1400ms using the §4.6 ease-out,
 *     formatting each frame with `toFixed(decimals)` when decimals > 0, else
 *     `Math.round(n).toLocaleString('en-US')`.
 *
 * rAF and the observer are torn down on unmount.
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
  // Start (and SSR) at the final value.
  const [display, setDisplay] = useState<string>(() => format(value, decimals))
  const ref = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Reduced motion → keep the final value, no animation.
    if (document.body.classList.contains('motion-off')) {
      setDisplay(format(value, decimals))
      return
    }

    let rafId = 0
    let observer: IntersectionObserver | null = null
    let cancelled = false

    const animate = () => {
      const start = performance.now()
      const step = (now: number) => {
        if (cancelled) return
        const p = Math.min(1, (now - start) / DURATION_MS)
        const current = easeOut(p) * value
        setDisplay(format(current, decimals))
        if (p < 1) {
          rafId = requestAnimationFrame(step)
        } else {
          setDisplay(format(value, decimals))
        }
      }
      rafId = requestAnimationFrame(step)
    }

    const begin = () => {
      // Reset to 0 then ramp to the target.
      setDisplay(format(0, decimals))
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
    // value/decimals are stable per render of a given stat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimals])

  return (
    <span className={['v', className].filter(Boolean).join(' ')}>
      <span>{display}</span>
      {unit ? <span className="u">{unit}</span> : null}
    </span>
  )
}
