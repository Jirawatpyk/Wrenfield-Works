/**
 * Theme system primitives (T018, FR-005b). Two themes ship: dark (default) and
 * paper/light, with a persistent visitor toggle. The choice persists across the
 * visit and on return. Both themes meet AA contrast (tokens.css).
 */
export const THEMES = ['dark', 'paper'] as const
export type Theme = (typeof THEMES)[number]
export const DEFAULT_THEME: Theme = 'dark'
export const THEME_STORAGE_KEY = 'wf-theme'

export function isTheme(value: string | null | undefined): value is Theme {
  return value === 'dark' || value === 'paper'
}

/**
 * Inline script (runs before paint) that applies the saved theme to <body> so
 * there is no flash of the wrong theme. Also honors the OS reduced-motion
 * preference by adding `motion-off` (FR-006). Kept dependency-free and tiny.
 */
export const themeBootScript = `
(function(){
  try {
    var t = localStorage.getItem('${THEME_STORAGE_KEY}');
    if (t === 'paper') document.body.classList.add('paper');
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.body.classList.add('motion-off');
    }
  } catch (e) {}
})();
`.trim()
