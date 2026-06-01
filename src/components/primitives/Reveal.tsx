import type { CSSProperties, ReactNode } from 'react'

type RevealTag = 'div' | 'section' | 'li' | 'article' | 'span' | 'p' | 'h2' | 'h3' | 'h4'

/**
 * Reveal — scroll-into-view entrance (design-extract §4.4), implemented with native
 * CSS scroll-driven animations (`animation-timeline: view()`, components.css §15). It
 * ships ZERO JS — the old IntersectionObserver client component is gone — and runs on
 * the compositor.
 *
 * Safety / progressive enhancement (content must NEVER stay hidden):
 *   1. The hidden initial state + the reveal animation live inside
 *      `@supports (animation-timeline: view())`, so a browser without scroll-driven
 *      animations renders the content visible (no animation, never stuck at opacity 0).
 *   2. Reduced motion disables the animation entirely (§19), pinning the visible state —
 *      necessary because scroll-driven animations ignore `animation-duration`, so the
 *      global reduced-motion neutralizer in globals.css cannot stop them on its own.
 *   3. Above-the-fold elements are already past the reveal range on first paint, so they
 *      load fully visible.
 *
 * `delay` (ms — the prototype's index*70 stagger) becomes a small scroll-range offset via
 * the `--rv` custom property so grid items still cascade as they enter; `dataStagger`
 * emits `data-stagger` for grouped callers. This is a shared (non-client) component, so
 * it renders fine inside both server and client sections.
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
  const Tag = as

  return (
    <Tag
      className={['reveal', className].filter(Boolean).join(' ')}
      style={delay ? ({ '--rv': `${Math.min(60, delay / 7)}%` } as CSSProperties) : undefined}
      data-stagger={dataStagger ? '' : undefined}
    >
      {children}
    </Tag>
  )
}
