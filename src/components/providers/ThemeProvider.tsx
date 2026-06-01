'use client'

import { createContext, useCallback, useContext, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'

import { DEFAULT_THEME, THEME_STORAGE_KEY, isTheme, type Theme } from '@/lib/theme'

/**
 * Client theme controller (T018). The persisted theme lives in an EXTERNAL store
 * (localStorage + the `paper` class the pre-paint boot script already applied to <body>),
 * so it is read via `useSyncExternalStore` rather than `useState` + a mount effect — which
 * keeps SSR/hydration correct (server snapshot = DEFAULT_THEME, no flash because the boot
 * script set the class first) and avoids a synchronous setState in an effect. Writing the
 * theme updates localStorage + the body class and notifies subscribers; the `storage` event
 * keeps other tabs in sync.
 */
type ThemeContextValue = {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const subscribers = new Set<() => void>()

function notify() {
  for (const cb of subscribers) cb()
}

function subscribe(cb: () => void): () => void {
  subscribers.add(cb)
  window.addEventListener('storage', cb)
  return () => {
    subscribers.delete(cb)
    window.removeEventListener('storage', cb)
  }
}

/** Client snapshot: persisted choice wins, else whatever the boot script applied to <body>. */
function getThemeSnapshot(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isTheme(stored)) return stored
  } catch {
    /* storage unavailable — fall through to the body class */
  }
  return document.body.classList.contains('paper') ? 'paper' : DEFAULT_THEME
}

/** Server snapshot: the boot script hasn't run yet, so render the default. */
function getServerThemeSnapshot(): Theme {
  return DEFAULT_THEME
}

function persistTheme(next: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    /* storage unavailable — theme still applies for this session */
  }
  document.body.classList.toggle('paper', next === 'paper')
  notify()
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerThemeSnapshot)

  const setTheme = useCallback((next: Theme) => {
    persistTheme(next)
  }, [])

  const toggleTheme = useCallback(() => {
    persistTheme(theme === 'dark' ? 'paper' : 'dark')
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
