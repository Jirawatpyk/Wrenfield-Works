/**
 * Stats (T035) — the four-cell KPI strip (design-extract §3.4).
 *
 * Server component. No section heading by design. Each cell pairs an animated count-up
 * (Counter, which renders the `.v`/`.u` markup) with a mono label, and is a <Reveal> with a
 * 70ms-per-index stagger so cells fade in sequentially (prototype's data-stagger behavior).
 * Numeric values + units are mono labels and render as-is.
 */
import type { StatVM } from '@/lib/content'
import { Counter } from '@/components/primitives/Counter'
import { Reveal } from '@/components/primitives/Reveal'

export function Stats({ stats }: { stats: StatVM[] }) {
  return (
    <section data-testid="section-stats" id="stats" className="blk no-rule">
      <div className="wrap">
        <div className="stats" data-stagger="">
          {stats.map((s, i) => (
            <Reveal as="div" className="stat-cell" delay={i * 70} key={i}>
              <Counter value={s.value} unit={s.unit} />
              <div className="k">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
