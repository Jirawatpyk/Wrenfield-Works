/**
 * Capabilities (T036) — the "what we build" capability cards (design-extract §3.5).
 *
 * Server component. Section number/title/subtitle come from the SectionHeadingVM ("01"); the
 * heading title is rich text (may carry inline emphasis). Each card shows a decorative inline
 * line-icon chosen by `cap.icon`, a mono category tag, an h3 title, prose, and a mono tag row
 * (one span per tag so the `.meta` flex gap + separators render). The heading is an h2, cards
 * use h3. Each card is a <Reveal> with a 70ms-per-index stagger (prototype data-stagger).
 */
import type { ReactNode } from 'react'

import type { CapabilityVM, SectionHeadingVM } from '@/lib/content'
import { RichInline } from '@/lib/richtext'
import { Reveal } from '@/components/primitives/Reveal'

/** Decorative 46x46 line icons keyed by the capability's `icon` field. */
const ICONS: Record<string, ReactNode> = {
  automation: (
    <>
      <circle cx="18" cy="18" r="6" />
      <circle cx="32" cy="32" r="4" />
      <path d="M18 6v4M18 26v4M6 18h4M26 18h4M9.5 9.5l2.8 2.8M23.7 23.7l2.8 2.8" />
      <path d="M28 36h8M36 28v8" />
    </>
  ),
  tools: (
    <>
      <path d="M27 9a7 7 0 0 0-9 8.6L9 26.6a3 3 0 0 0 4.2 4.2l9-9A7 7 0 0 0 27 9z" />
      <path d="M22.5 21.5 33 32a3 3 0 0 0 4.2-4.2L26.5 17" />
    </>
  ),
  systems: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <rect x="28" y="28" width="12" height="12" rx="2" />
      <circle cx="34" cy="12" r="5" />
      <path d="M18 12h11M12 18v8a4 4 0 0 0 4 4h12" />
    </>
  ),
  leverage: (
    <>
      <path d="M8 32 20 20l6 6 12-14" />
      <path d="M30 12h8v8" />
      <path d="M8 38h32" />
    </>
  ),
}

function CapIcon({ name }: { name: string }) {
  const glyph = ICONS[name] ?? ICONS.systems
  return (
    <svg
      className="ic"
      viewBox="0 0 46 46"
      width="46"
      height="46"
      fill="none"
      stroke="var(--accent)"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {glyph}
    </svg>
  )
}

export function Capabilities({
  capabilities,
  heading,
}: {
  capabilities: CapabilityVM[]
  heading: SectionHeadingVM | null
}) {
  return (
    <section data-testid="section-capabilities" id="capabilities" className="blk">
      <div className="wrap">
        <Reveal className="sec-head">
          <span className="n">{heading?.number}</span>
          <div className="ht">
            <h2>
              <RichInline value={heading?.title ?? null} />
            </h2>
            <p className="sec-sub">{heading?.subtitle}</p>
          </div>
        </Reveal>
        <div className="cap-grid" data-stagger="">
          {capabilities.map((cap, i) => (
            <Reveal as="article" className="cap" delay={i * 70} key={i}>
              <CapIcon name={cap.icon} />
              <div className="cn">{cap.categoryLabel}</div>
              <h3>{cap.title}</h3>
              <p>{cap.description}</p>
              <div className="meta">
                {cap.tags.map((tag, ti) => (
                  <span key={ti}>{tag}</span>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
