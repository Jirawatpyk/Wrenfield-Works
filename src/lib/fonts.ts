/**
 * Web fonts (T007). Latin + Thai families loaded via `next/font/google` with
 * `display: swap` so text is never blocked and there is no layout shift (CLS budget).
 * Each family is exposed as a CSS variable consumed by `src/styles/tokens.css`,
 * which lists the Thai family as a fallback after its Latin counterpart so Thai
 * glyphs render correctly (FR-004) without a separate stack.
 */
import {
  Anuphan,
  Fraunces,
  Hanken_Grotesk,
  IBM_Plex_Sans_Thai,
  JetBrains_Mono,
  Trirong,
} from 'next/font/google'

// Display serif — variable optical size (opsz) drives the design's weight/opsz transitions.
export const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-serif',
})

export const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
})

export const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono',
})

// Thai families (fallbacks inside the serif/sans/mono stacks).
export const trirong = Trirong({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-serif-th',
})

export const anuphan = Anuphan({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-sans-th',
})

export const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono-th',
})

/** Space-separated CSS variable class names to apply on the document root. */
export const fontVariables = [
  fraunces.variable,
  hankenGrotesk.variable,
  jetBrainsMono.variable,
  trirong.variable,
  anuphan.variable,
  ibmPlexSansThai.variable,
].join(' ')
