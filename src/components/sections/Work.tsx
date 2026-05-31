/**
 * Work (T038) — the "selected work" case-study grid (design-extract §3.7).
 *
 * Server component. Section number/title/subtitle come from the SectionHeadingVM ("03").
 * Each card has a decorative lattice thumbnail with a serif glyph, then a mono tag, an h4
 * title, prose, and a mono metrics line (rich text, carries inline <b> emphasis). The
 * heading is an h2; cards use h4 (matching the prototype's heading hierarchy).
 */
import type { CaseStudyVM, SectionHeadingVM } from '@/lib/content'
import { RichInline } from '@/lib/richtext'
import { Reveal } from '@/components/primitives/Reveal'
import { LatticeCanvas } from '@/components/primitives/LatticeCanvas'

export function Work({
  caseStudies,
  heading,
}: {
  caseStudies: CaseStudyVM[]
  heading: SectionHeadingVM | null
}) {
  return (
    <section data-testid="section-work" id="work" className="blk">
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
        <div className="case-grid" data-stagger="">
          {caseStudies.map((c, i) => (
            <Reveal as="article" className="case" delay={i * 70} key={i}>
              <div className="thumb">
                <LatticeCanvas variant="thumb" />
                <span className="glyph" aria-hidden>
                  {c.glyph}
                </span>
              </div>
              <div className="body">
                <div className="tag">{c.tag}</div>
                <h4>{c.title}</h4>
                <p>{c.description}</p>
                <div className="stat">
                  <RichInline value={c.metricsLine} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
