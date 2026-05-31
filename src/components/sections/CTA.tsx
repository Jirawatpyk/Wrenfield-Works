import type { CtaVM } from '@/lib/content'
import { RichInline } from '@/lib/richtext'
import { Button } from '@/components/primitives/Button'
import { Reveal } from '@/components/primitives/Reveal'
import { LatticeCanvas } from '@/components/primitives/LatticeCanvas'

/**
 * CTA / contact section (T041, design §3.10). Centrepiece is a contact prompt over a
 * second lattice canvas. The kicker is bilingual-literal in the prototype but here it
 * comes from the CMS (cta.kicker). Buttons are magnetic; the email is a real mailto.
 *
 * Kicker/heading/body/CTA/links use the <Reveal> client primitive (scroll-into-view fade);
 * a bare `reveal` class would stay at opacity:0 because nothing adds `.in`.
 */
export function CTA({ cta }: { cta: CtaVM }) {
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
        <Reveal className="cta">
          <Button href={`mailto:${cta.email}`} variant="solid" magnetic>
            {cta.email} <span className="arr">→</span>
          </Button>
          <Button href="#" magnetic>
            {cta.bookCallLabel}
          </Button>
        </Reveal>
        <Reveal className="links">
          {cta.socialLinks.map((link, i) => (
            <a key={`${link.url}-${i}`} className="ghost" href={link.url}>
              {link.label}
            </a>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
