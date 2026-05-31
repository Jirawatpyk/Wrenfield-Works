'use client'

import { useTheme } from '@/components/providers/ThemeProvider'

/**
 * Accessible dark/paper theme toggle (FR-005b, FR-007d). Exposes the active
 * theme via aria-pressed and a clear accessible name so screen-reader users
 * know the current state. Labels are localized by the caller.
 */
export function ThemeToggle({
  labels,
}: {
  labels: { toDark: string; toPaper: string; group: string }
}) {
  const { theme, toggleTheme } = useTheme()
  const isPaper = theme === 'paper'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isPaper}
      aria-label={isPaper ? labels.toDark : labels.toPaper}
      title={isPaper ? labels.toDark : labels.toPaper}
      className="theme-toggle"
    >
      <span aria-hidden="true">{isPaper ? '☾' : '☀'}</span>
    </button>
  )
}
