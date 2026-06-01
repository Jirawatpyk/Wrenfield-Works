/**
 * View Transitions helper (modernization).
 *
 * Runs a DOM-mutating callback inside the browser's View Transitions API when it is
 * available AND the visitor has not asked to reduce motion; otherwise it applies the
 * mutation immediately. Centralizing the support + reduced-motion guard here keeps the
 * theme swap (ThemeProvider) and the showcase tab switch (Showcase) consistent and means
 * the FR-006 reduced-motion rule is enforced in exactly one place.
 *
 * Returns the transition object (so callers can hook `.finished` for cleanup) or `null`
 * when no transition ran. Reduced motion is read from the `motion-off` body class, which
 * the theme boot script sets from the OS `prefers-reduced-motion` preference and the
 * explicit visitor toggle — the same signal the CSS animations gate on.
 */
type ViewTransition = { finished: Promise<void> }
type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => ViewTransition
}

export function startViewTransition(mutate: () => void): ViewTransition | null {
  if (typeof document === 'undefined') {
    mutate()
    return null
  }

  const doc = document as DocumentWithViewTransition
  // Honour reduced motion from BOTH the persisted `motion-off` body class and the live OS
  // media query — they can diverge if the OS preference changes mid-session (the class is
  // only set once, pre-paint).
  const reduceMotion =
    document.body.classList.contains('motion-off') ||
    (typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  if (typeof doc.startViewTransition !== 'function' || reduceMotion) {
    mutate()
    return null
  }

  return doc.startViewTransition(mutate)
}
