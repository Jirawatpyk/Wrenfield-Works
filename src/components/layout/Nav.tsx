'use client'

import { useEffect, useState } from 'react'

import { LangToggle } from '@/components/layout/LangToggle'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/primitives/Button'
import type { NavVM } from '@/lib/content'

type NavProps = {
  nav: NavVM
}

const SECTION_LINKS = [
  { href: '#capabilities', key: 'capabilities' },
  { href: '#platform', key: 'platform' },
  { href: '#work', key: 'work' },
  { href: '#process', key: 'process' },
] as const

/**
 * Brand mark: stylized "W" (design-extract §1.1). Decorative — aria-hidden.
 */
function BrandMark() {
  return (
    <svg
      viewBox="0 0 100 100"
      width={32}
      height={32}
      aria-hidden="true"
      style={{ color: 'var(--accent-deep)' }}
    >
      <polyline
        points="24,34 38,66 50,44 62,66 76,34"
        fill="none"
        stroke="currentColor"
        strokeWidth={3.4}
      />
      <circle cx={24} cy={34} r={4} fill="currentColor" />
      <circle cx={38} cy={66} r={4} fill="currentColor" />
      <circle cx={62} cy={66} r={4} fill="currentColor" />
      <circle cx={76} cy={34} r={4} fill="currentColor" />
      <circle cx={50} cy={44} r={5.4} fill="none" stroke="currentColor" strokeWidth={2.6} />
    </svg>
  )
}

/**
 * Masthead. The `<header>` is the banner landmark AND the fixed bar (carries `.nav`,
 * which is `position: fixed`), so it keeps a real box — a bare `<header>` whose only
 * child is fixed would collapse to 0 height and read as hidden. The inner `<nav>` is the
 * navigation landmark (`site-nav`); `.wrap` lays brand and links out as the 74px flex row.
 */
export function Nav({ nav }: NavProps) {
  const [scrolled, setScrolled] = useState(false)

  // Header gains `.scrolled` after window.scrollY > 24 (Ambiguity #9).
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={scrolled ? 'nav scrolled' : 'nav'}>
      <nav data-testid="site-nav" aria-label="Primary" className="wrap">
        <a href="#top" className="brand" aria-label="Wrenfield Works — home">
          <BrandMark />
          <span className="bn">
            Wrenfield <span className="accent">Works</span>
          </span>
        </a>

        <div className="nav-links">
          {SECTION_LINKS.map((link) => (
            <a key={link.key} href={link.href} className="lk">
              {nav[link.key]}
            </a>
          ))}

          <LangToggle />
          <ThemeToggle />

          <Button href="#contact" variant="solid" magnetic>
            {nav.ctaLabel} <span className="arr">→</span>
          </Button>
        </div>
      </nav>
    </header>
  )
}
