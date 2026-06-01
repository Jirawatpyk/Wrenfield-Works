'use client'

import { useEffect, useRef, type ReactNode } from 'react'

type RevealTag = 'div' | 'section' | 'li' | 'article' | 'span' | 'p' | 'h2' | 'h3' | 'h4'

/**
 * Reveal — scroll-into-view fade primitive (design-extract §4.4).
 *
 * Renders children starting WITHOUT `.in` (stable SSR markup), then adds `.in` to fade them in.
 *
 * CRITICAL correctness rule: content must NEVER stay hidden. The decorative lattice canvases
 * run a continuous rAF loop that saturates the main thread, and under that load an
 * IntersectionObserver/scroll callback can be delayed or dropped — which previously left
 * revealed-once elements stuck at opacity:0 (content silently missing). So this is layered:
 *   1. reduced motion → reveal instantly.
 *   2. IntersectionObserver (threshold 0) reveals as each element scrolls in — the nice path.
 *   3. A hard timeout reveals EVERY remaining element after ~1s regardless of scroll position
 *      or observer health. This guarantees content is visible even if the observer never fires.
 * Whichever fires first wins; we reveal at most once, then disconnect.
 *
 * `delay` drives `transition-delay` (callers use it for the §4.4 stagger, e.g. index*70).
 * `dataStagger` emits `data-stagger`.
 */
export function Reveal({
  children,
  className,
  as = 'div',
  delay,
  dataStagger,
}: {
  children: ReactNode
  className?: string
  as?: RevealTag
  delay?: number
  dataStagger?: boolean
}) {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let revealed = false
    let observer: IntersectionObserver | null = null
    let timer: ReturnType<typeof setTimeout> | null = null

    const reveal = () => {
      if (revealed) return
      revealed = true
      el.classList.add('in')
      observer?.disconnect()
      if (timer) clearTimeout(timer)
    }

    // 1. Reduced motion: reveal immediately, no animation.
    if (document.body.classList.contains('motion-off')) {
      el.classList.add('in')
      return
    }

    // 2. Reveal on scroll-in (threshold 0 = the moment any edge enters the viewport).
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) if (entry.isIntersecting) reveal()
        },
        { threshold: 0, rootMargin: '0px 0px -8% 0px' },
      )
      observer.observe(el)
    } else {
      reveal()
    }

    // 3. Hard guarantee: reveal no matter what within ~1s (covers dropped observer callbacks
    //    under canvas CPU load, and any element the user never scrolls to).
    timer = setTimeout(reveal, 1000)

    return () => {
      observer?.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [])

  const Tag = as

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={['reveal', className].filter(Boolean).join(' ')}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined }}
      data-stagger={dataStagger ? '' : undefined}
    >
      {children}
    </Tag>
  )
}
