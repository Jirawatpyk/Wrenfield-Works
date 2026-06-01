'use client'

/**
 * Process (T039) — §3.8. Sticky pinned process narrative: a left "process-sticky"
 * panel mirrors the most-visible step on the right. Client component because the
 * active step is driven by scroll position via IntersectionObserver.
 */
import { useEffect, useRef, useState } from 'react'
import type { ProcessStepVM, SectionHeadingVM } from '@/lib/content'
import { RichInline } from '@/lib/richtext'

export function Process({
  processSteps,
  heading,
}: {
  processSteps: ProcessStepVM[]
  heading: SectionHeadingVM | null
}) {
  const [active, setActive] = useState(0)
  const stepRefs = useRef<Array<HTMLElement | null>>([])

  useEffect(() => {
    const nodes = stepRefs.current.filter((n): n is HTMLElement => n !== null)
    if (nodes.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        let best: { index: number; ratio: number } | null = null
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const idxAttr = entry.target.getAttribute('data-step-index')
          if (idxAttr === null) continue
          const index = Number(idxAttr)
          if (best === null || entry.intersectionRatio > best.ratio) {
            best = { index, ratio: entry.intersectionRatio }
          }
        }
        if (best !== null) setActive(best.index)
      },
      { threshold: 0.55 },
    )

    for (const node of nodes) observer.observe(node)
    return () => observer.disconnect()
  }, [processSteps.length])

  const activeStep = processSteps[active] ?? processSteps[0] ?? null

  return (
    <section data-testid="section-process" id="process" className="blk">
      <div className="wrap">
        <div className="sec-head">
          <span className="n">{heading?.number}</span>
          <div className="ht">
            <h2>
              <RichInline value={heading?.title ?? null} />
            </h2>
            <p className="sec-sub">{heading?.subtitle}</p>
          </div>
        </div>

        <div className="process-wrap">
          <div className="process-sticky">
            <div className="big-n">{activeStep?.number}</div>
            <h3>{activeStep?.name}</h3>
            <div className="pth">{activeStep?.title}</div>
          </div>

          <div className="process-steps">
            {processSteps.map((step, i) => (
              <article
                key={`pstep-${i}`}
                className={i === active ? 'pstep on' : 'pstep'}
                data-step-index={i}
                ref={(el) => {
                  stepRefs.current[i] = el
                }}
              >
                <div className="pn">
                  {step.number} — {step.name}
                </div>
                <h4>{step.title}</h4>
                <p>{step.description}</p>
                <div className="det">
                  {step.checklist.map((point, c) => (
                    <div key={`pstep-${i}-ck-${c}`}>
                      <span className="ck" aria-hidden>
                        ✓
                      </span>{' '}
                      {point}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
