import type { CSSProperties } from 'react'

import type { HeroVM } from '@/lib/content'
import { RichInline } from '@/lib/richtext'
import { Button } from '@/components/primitives/Button'
import { Reveal } from '@/components/primitives/Reveal'
import { LatticeCanvas } from '@/components/primitives/LatticeCanvas'

/**
 * Hero (T033) — full-bleed intro (design §3.2). The page's single <h1>.
 * Decorative lattice canvas + radial glow + draw-on brand mark sit behind/above the
 * content (all aria-hidden). A scroll hint anchors the bottom (hidden on short/narrow
 * viewports via CSS).
 *
 * The kicker/subhead/CTA/trust use the <Reveal> client primitive (scroll-into-view fade)
 * rather than a bare `reveal` class — the prototype relied on enterprise.js to add `.in`,
 * which we don't port, so a static class would stay at opacity:0 forever. Reveal honors
 * reduced motion (shows instantly).
 */
export function Hero({ hero }: { hero: HeroVM }) {
  return (
    <section data-testid="section-hero" id="top" className="hero">
      <LatticeCanvas variant="hero" className="hero-canvas" />
      <div className="hero-glow" aria-hidden />
      <div className="wrap">
        {/* Draw-on brand mark (prototype's `.hero-mk.draw`, --len:140). Decorative. */}
        <svg
          className="hero-mk draw"
          viewBox="0 0 100 100"
          width={62}
          height={62}
          fill="none"
          aria-hidden
          style={{ color: 'var(--accent-deep)', '--len': 140 } as CSSProperties}
        >
          <polyline
            points="24,34 38,66 50,44 62,66 76,34"
            stroke="currentColor"
            strokeWidth={3.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={24} cy={34} r={4} fill="currentColor" />
          <circle cx={38} cy={66} r={4} fill="currentColor" />
          <circle cx={50} cy={44} r={5.4} fill="none" stroke="currentColor" strokeWidth={2.6} />
          <circle cx={62} cy={66} r={4} fill="currentColor" />
          <circle cx={76} cy={34} r={4} fill="currentColor" />
        </svg>

        <Reveal as="p" className="kicker">
          {hero.kicker}
        </Reveal>
        <h1 className="hero-h1">
          <RichInline value={hero.headline} />
        </h1>
        <Reveal as="p" className="sub lead">
          <RichInline value={hero.subhead} />
        </Reveal>
        <Reveal className="cta">
          <Button href="#work" variant="solid" magnetic>
            {hero.primaryCtaLabel} <span className="arr">→</span>
          </Button>
          <Button href="#contact" magnetic>
            {hero.secondaryCtaLabel}
          </Button>
        </Reveal>
        <Reveal className="trust">
          <span className="dot" aria-hidden />
          <span>{hero.trustLabel}</span>
        </Reveal>
      </div>
      {/* Scroll cue (prototype's `.scroll-hint`). Decorative. */}
      <div className="scroll-hint" aria-hidden>
        <span>Scroll</span>
        <span className="ln" />
      </div>
    </section>
  )
}
