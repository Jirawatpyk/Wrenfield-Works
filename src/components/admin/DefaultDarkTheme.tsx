'use client'

import * as React from 'react'

/**
 * Default the admin to the dark theme on first visit (T13). Payload persists the
 * user's theme choice; when an editor has never chosen, this nudges the default
 * to dark (the brand default) without removing the switcher (admin.theme stays
 * 'all'). Acts only when no explicit Payload theme preference cookie is present.
 */
export const DefaultDarkTheme: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  React.useEffect(() => {
    try {
      if (!document.cookie.includes('payload-theme=')) {
        document.documentElement.setAttribute('data-theme', 'dark')
      }
    } catch {
      /* no-op: falls back to Payload's default */
    }
  }, [])
  return <>{children}</>
}

export default DefaultDarkTheme
