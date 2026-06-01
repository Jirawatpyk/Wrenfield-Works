'use client'

import { useTheme } from '@/components/providers/ThemeProvider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isPaper = theme === 'paper'

  return (
    <button
      type="button"
      className="btn"
      data-testid="theme-toggle"
      onClick={toggleTheme}
      aria-pressed={isPaper}
      aria-label={isPaper ? 'Switch to dark theme' : 'Switch to light theme'}
    >
      {isPaper ? 'Dark' : 'Light'}
    </button>
  )
}
