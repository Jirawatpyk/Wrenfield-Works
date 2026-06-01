'use client'

/**
 * Marquee (T034) — the bilingual logo marquee (design-extract §3.3).
 *
 * Client component: it owns a visitor-controlled pause toggle. The CSS pauses the
 * scrolling animation when the section carries `data-paused="true"`. Two identical tracks
 * are rendered for the seamless loop; the duplicate is `aria-hidden` so assistive tech only
 * announces the logos once. The toggle is a real <button> (keyboard accessible) whose
 * accessible label flips between pause/resume — localized for EN/TH (FR-014).
 */
import { useState } from 'react'

import type { MarqueeVM } from '@/lib/content'
import type { Locale } from '@/lib/i18n'

const PAUSE_LABEL = { en: 'Pause logo marquee', th: 'หยุดแถบโลโก้ชั่วคราว' }
const RESUME_LABEL = { en: 'Resume logo marquee', th: 'เล่นแถบโลโก้ต่อ' }

export function Marquee({ marquee, locale }: { marquee: MarqueeVM; locale: Locale }) {
  const [paused, setPaused] = useState(false)
  const togglePaused = () => setPaused((p) => !p)
  const label = paused ? RESUME_LABEL[locale] : PAUSE_LABEL[locale]

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
        aria-label={label}
        onClick={togglePaused}
      >
        {label}
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
