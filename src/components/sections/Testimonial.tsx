/**
 * Testimonial (T040) — §3.9. Centered pull-quote with the brass brand mark.
 * Server component (no interactivity). The mark SVG is decorative (aria-hidden) and uses
 * the full 5-circle geometry (4 filled endpoints + 1 hollow centre) matching the prototype.
 */
import type { TestimonialVM } from '@/lib/content'
import { RichInline } from '@/lib/richtext'
import { Reveal } from '@/components/primitives/Reveal'

export function Testimonial({ testimonial }: { testimonial: TestimonialVM }) {
  return (
    <section data-testid="section-testimonial" id="words" className="blk">
      <div className="wrap-tight">
        <Reveal className="quote-blk">
          <svg
            className="mk"
            width="48"
            height="48"
            viewBox="0 0 100 100"
            fill="none"
            aria-hidden
            style={{ color: 'var(--accent)' }}
          >
            <polyline
              points="24,34 38,66 50,44 62,66 76,34"
              stroke="currentColor"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="24" cy="34" r="4" fill="currentColor" />
            <circle cx="38" cy="66" r="4" fill="currentColor" />
            <circle cx="50" cy="44" r="5.4" stroke="currentColor" strokeWidth="2.6" fill="none" />
            <circle cx="62" cy="66" r="4" fill="currentColor" />
            <circle cx="76" cy="34" r="4" fill="currentColor" />
          </svg>
          <blockquote>
            <RichInline value={testimonial.quote} />
          </blockquote>
          <div className="by">
            <RichInline value={testimonial.attribution} />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
