import type { CtaVM } from '@/lib/content'
import type { Locale } from '@/lib/i18n'
import { RichInline } from '@/lib/richtext'
import { safeHref } from '@/lib/safeHref'
import { Button } from '@/components/primitives/Button'
import { Reveal } from '@/components/primitives/Reveal'
import { LatticeCanvas } from '@/components/primitives/LatticeCanvas'
import { InquiryForm } from '@/components/sections/InquiryForm'

/**
 * CTA / contact section (T041, design §3.10; US3 T073). Centrepiece is a contact
 * prompt over a second lattice canvas. The kicker/heading/body come from the CMS.
 *
 * US3 replaces the design's `mailto:` link with the on-site inquiry form (the only
 * public write path — submissions are stored + viewable in the CMS, FR-010/FR-022).
 * The studio email + "book a call" remain available as secondary contact routes.
 *
 * Kicker/heading/body use the <Reveal> client primitive (scroll-into-view fade).
 * Social link hrefs are CMS-authored, so they pass through `safeHref` (scheme
 * allow-list) to prevent a stored `javascript:`/`data:` URI from becoming an XSS vector.
 */
export function CTA({ cta, locale }: { cta: CtaVM; locale: Locale }) {
  return (
    <section data-testid="section-cta" id="contact" className="blk cta-sec">
      <LatticeCanvas variant="cta" className="cta-canvas" />
      <div className="wrap">
        <Reveal as="p" className="kicker">
          {cta.kicker}
        </Reveal>
        <Reveal as="h2">
          <RichInline value={cta.heading} />
        </Reveal>
        <Reveal as="p">{cta.body}</Reveal>
        <Reveal className="cta-form-wrap">
          <InquiryForm locale={locale} />
        </Reveal>
        {/* Secondary contact routes alongside the form: the studio email (primary
            magnetic button) and the "book a call" link (cta.bookCallLabel). */}
        <Reveal className="cta">
          {cta.email ? (
            <Button href={`mailto:${cta.email}`} variant="solid" magnetic>
              {cta.email} <span className="arr">→</span>
            </Button>
          ) : null}
          {cta.bookCallLabel ? (
            <Button href="#" magnetic>
              {cta.bookCallLabel}
            </Button>
          ) : null}
        </Reveal>
        <Reveal className="links">
          {cta.socialLinks.map((link, i) => (
            <a key={`${link.url}-${i}`} className="ghost" href={safeHref(link.url)}>
              {link.label}
            </a>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
