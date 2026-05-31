import type { ReactNode } from 'react'

/**
 * Button — server primitive.
 *
 * Renders a styled anchor that maps to the prototype's `.btn` / `.btn.solid`
 * classes (already defined in `src/styles/components.css`). When `magnetic` is
 * set, it emits a `data-magnetic` attribute that the magnetic-cursor client
 * behaviour (design-extract §4.3) hooks into; the attribute is omitted entirely
 * when magnetism is off so reduced-motion users get a plain link.
 */
export function Button({
  href,
  variant = 'ghost',
  magnetic = false,
  className,
  children,
  ariaLabel,
}: {
  href: string
  variant?: 'solid' | 'ghost'
  magnetic?: boolean
  className?: string
  children: ReactNode
  ariaLabel?: string
}) {
  return (
    <a
      className={['btn', variant === 'solid' ? 'solid' : '', className].filter(Boolean).join(' ')}
      href={href}
      data-magnetic={magnetic ? '' : undefined}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  )
}
