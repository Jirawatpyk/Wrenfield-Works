import type { ReactNode } from 'react'

/**
 * Pill — server primitive.
 *
 * Small status/label chip mapping to the prototype's `.pill`, `.pill.ok`
 * (success/green) and `.pill.run` (active/running) classes already defined in
 * `src/styles/components.css`.
 */
export function Pill({
  kind,
  children,
  className,
}: {
  kind?: 'ok' | 'run'
  children: ReactNode
  className?: string
}) {
  return (
    <span className={['pill', kind ?? '', className].filter(Boolean).join(' ')}>{children}</span>
  )
}
