'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { DEFAULT_THEME, THEME_STORAGE_KEY, isTheme, type Theme } from '@/lib/theme'

/**
 * Client theme controller (T018). Reads/writes the persisted theme, toggles the
 * `paper` class on <body>, and exposes a hook the ThemeToggle consumes. The
 * pre-paint boot script (src/lib/theme.ts) sets the initial class to avoid FOUC;
 * this provider keeps React state in sync for the toggle's accessible label.
 */
type ThemeContextValue = {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME)

  // Sync from what the boot script already applied (and storage) on mount.
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isTheme(stored)) setThemeState(stored)
    else if (document.body.classList.contains('paper')) setThemeState('paper')
  }, [])

  const apply = useCallback((next: Theme) => {
    setThemeState(next)
    document.body.classList.toggle('paper', next === 'paper')
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
  }, [])

  const toggleTheme = useCallback(() => {
    apply(theme === 'dark' ? 'paper' : 'dark')
  }, [theme, apply])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: apply }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
