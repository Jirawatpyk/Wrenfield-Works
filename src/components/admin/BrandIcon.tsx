import * as React from 'react'

/**
 * Wrenfield Works mark — the 5-node "lattice peak" (graphics.Icon, T6). Dots and
 * strokes use `currentColor` so the admin theme recolors them; the center ring
 * uses the brass accent (echoing mark-ink's two-tone look on the light theme).
 * Standalone it carries an accessible name; inside the lockup pass title="".
 */
export const BrandIcon: React.FC<{ className?: string; title?: string }> = ({
  className,
  title = 'Wrenfield Works',
}) => (
  <svg
    className={className}
    width="28"
    height="28"
    viewBox="0 0 100 100"
    fill="none"
    role="img"
    aria-label={title || undefined}
    aria-hidden={title ? undefined : true}
    xmlns="http://www.w3.org/2000/svg"
  >
    <polyline
      points="24,34 38,66 50,44 62,66 76,34"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="24" cy="34" r="4" fill="currentColor" />
    <circle cx="38" cy="66" r="4" fill="currentColor" />
    <circle
      cx="50"
      cy="44"
      r="5.4"
      fill="none"
      stroke="var(--theme-brand-accent, currentColor)"
      strokeWidth="2.6"
    />
    <circle cx="62" cy="66" r="4" fill="currentColor" />
    <circle cx="76" cy="34" r="4" fill="currentColor" />
  </svg>
)

export default BrandIcon
