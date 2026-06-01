'use client'

import type { MouseEvent } from 'react'

import { useTheme } from '@/components/providers/ThemeProvider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isPaper = theme === 'paper'

  // Seed the circular-reveal origin (globals.css `vt-theme-reveal`) with the button's
  // centre, so the incoming theme wipes out from the control the visitor pressed.
  function onClick(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const root = document.documentElement
    root.style.setProperty('--vt-x', `${Math.round(rect.left + rect.width / 2)}px`)
    root.style.setProperty('--vt-y', `${Math.round(rect.top + rect.height / 2)}px`)
    toggleTheme()
  }

  return (
    <button
      type="button"
      className="btn"
      data-testid="theme-toggle"
      onClick={onClick}
      aria-pressed={isPaper}
      aria-label={isPaper ? 'Switch to dark theme' : 'Switch to light theme'}
    >
      {isPaper ? 'Dark' : 'Light'}
    </button>
  )
}
