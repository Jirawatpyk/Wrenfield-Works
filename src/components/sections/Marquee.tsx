'use client'

/**
 * Marquee (T034) — the bilingual logo marquee (design-extract §3.3).
 *
 * Client component: it owns a visitor-controlled pause toggle. The CSS pauses the
 * scrolling animation when the section carries `data-paused="true"`. Two identical tracks
 * are rendered for the seamless loop; the duplicate is `aria-hidden` so assistive tech only
 * announces the logos once. The toggle is a real <button> (keyboard accessible) whose
 * accessible label flips between pause/resume.
 */
import { useState } from 'react'

import type { MarqueeVM } from '@/lib/content'

export function Marquee({ marquee }: { marquee: MarqueeVM }) {
  const [paused, setPaused] = useState(false)
  const togglePaused = () => setPaused((p) => !p)

  return (
    <section
      data-testid="section-marquee"
      className="marquee-sec"
      data-paused={paused ? 'true' : 'false'}
    >
      <p className="marquee-head">{marquee.heading}</p>
      <button
        type="button"
        data-testid="marquee-toggle"
        className="marquee-toggle"
        aria-pressed={paused}
        aria-label={paused ? 'Resume logo marquee' : 'Pause logo marquee'}
        onClick={togglePaused}
      >
        {paused ? 'Resume logo marquee' : 'Pause logo marquee'}
      </button>
      <div className="marquee">
        <ul className="marquee-track">
          {marquee.logos.map((logo, i) => (
            <li className="logo-item" key={`a-${i}`}>
              {logo.name}
            </li>
          ))}
        </ul>
        <ul className="marquee-track" aria-hidden>
          {marquee.logos.map((logo, i) => (
            <li className="logo-item" key={`b-${i}`}>
              {logo.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
