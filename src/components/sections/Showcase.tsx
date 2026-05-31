'use client'

/**
 * Showcase (T037) — PLATFORM section (§3.6). Tabbed surface picker with a faux app
 * "stage" rendering mock UI panels (mockRow / kpiGrid / chart / codeLines). Client
 * component for tab switching; tabs follow the WAI-ARIA tablist pattern.
 */
import { useEffect, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { ShowcaseSurfaceVM, SectionHeadingVM, ShowcasePanelBlock } from '@/lib/content'
import { RichInline } from '@/lib/richtext'
import { Pill } from '@/components/primitives/Pill'

// --- Panel block renderer --------------------------------------------------

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function codeLineClass(kind: string): string {
  switch (kind) {
    case 'cm':
      return 'code-line cm'
    case 'kw':
      return 'code-line kw'
    case 'st':
      return 'code-line st'
    default:
      return 'code-line plain'
  }
}

/**
 * Bar chart that grows from 0 → each bar's target height whenever its panel becomes the
 * active tab (parity with the prototype's selTab animation, which reset bars to 0 then to
 * data-h over two rAFs). Heights animate via the CSS transition on `.mock-bar`.
 */
function Chart({ bars, active }: { bars: Array<Record<string, unknown>>; active: boolean }) {
  const [grown, setGrown] = useState(false)

  useEffect(() => {
    if (!active) {
      setGrown(false)
      return
    }
    setGrown(false)
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setGrown(true))
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [active])

  return (
    <div className="mock-chart">
      {bars.map((bar, i) => (
        <div
          className="mock-bar"
          key={`bar-${i}`}
          style={{ height: grown ? `${asNumber(bar.height)}%` : '0%' }}
          aria-hidden
        />
      ))}
    </div>
  )
}

function PanelBlock({
  block,
  active,
  panelIndex,
  blockIndex,
}: {
  block: ShowcasePanelBlock
  active: boolean
  panelIndex: number
  blockIndex: number
}) {
  const type = asString(block.blockType)

  if (type === 'mockRow') {
    const pillKind = asString(block.pillKind) === 'run' ? 'run' : 'ok'
    return (
      <div className="mock-row">
        <div className="lhs">
          <div className="mi" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 7h16M4 12h16M4 17h10" />
            </svg>
          </div>
          <div>
            <div className="nm">{asString(block.name)}</div>
            <div className="sub">{asString(block.sub)}</div>
          </div>
        </div>
        <Pill kind={pillKind}>{asString(block.pillLabel)}</Pill>
      </div>
    )
  }

  if (type === 'kpiGrid') {
    const items = Array.isArray(block.items) ? (block.items as Array<Record<string, unknown>>) : []
    return (
      <div className="mock-grid">
        {items.map((item, i) => (
          <div className="mock-kpi" key={`p${panelIndex}-b${blockIndex}-kpi${i}`}>
            <div className="mv">{asString(item.value)}</div>
            <div className="mk2">{asString(item.label)}</div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'chart') {
    const bars = Array.isArray(block.bars) ? (block.bars as Array<Record<string, unknown>>) : []
    return <Chart bars={bars} active={active} />
  }

  if (type === 'codeLines') {
    const lines = Array.isArray(block.lines) ? (block.lines as Array<Record<string, unknown>>) : []
    return (
      <div className="code-block">
        {lines.map((line, i) => (
          <div
            className={codeLineClass(asString(line.kind, 'plain'))}
            key={`p${panelIndex}-b${blockIndex}-line${i}`}
          >
            {asString(line.text)}
          </div>
        ))}
      </div>
    )
  }

  return null
}

// --- Section ---------------------------------------------------------------

export function Showcase({
  showcase,
  heading,
}: {
  showcase: ShowcaseSurfaceVM[]
  heading: SectionHeadingVM | null
}) {
  const [active, setActive] = useState(0)

  function onTabKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = showcase.length - 1
    let next: number | null = null
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = index >= last ? 0 : index + 1
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        next = index <= 0 ? last : index - 1
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = last
        break
      default:
        next = null
    }
    if (next !== null) {
      e.preventDefault()
      setActive(next)
      const el = document.getElementById(`sc-tab-${next}`)
      if (el) el.focus()
    }
  }

  return (
    <section data-testid="section-showcase" id="platform" className="blk">
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

        <div className="showcase">
          <div className="sc-tabs" role="tablist" aria-label="Platform surfaces">
            {showcase.map((s, i) => (
              <button
                key={`sc-tab-${i}`}
                type="button"
                className={i === active ? 'sc-tab active' : 'sc-tab'}
                role="tab"
                aria-selected={i === active}
                id={`sc-tab-${i}`}
                aria-controls={`sc-panel-${i}`}
                tabIndex={i === active ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(e) => onTabKeyDown(e, i)}
              >
                <span className="bar" aria-hidden />
                <div className="tn">{s.tabName}</div>
                <h4>{s.tabTitle}</h4>
                <p>{s.tabDescription}</p>
              </button>
            ))}
          </div>

          <div className="sc-stage">
            <div className="sc-topbar">
              <span className="sc-dot" aria-hidden />
              <span className="sc-dot" aria-hidden />
              <span className="sc-dot" aria-hidden />
              <span className="sc-url">app.wrenfieldworks.com / live</span>
            </div>
            {showcase.map((s, i) => (
              <div
                key={`sc-panel-${i}`}
                className={i === active ? 'sc-panel show' : 'sc-panel'}
                role="tabpanel"
                id={`sc-panel-${i}`}
                aria-labelledby={`sc-tab-${i}`}
                hidden={i !== active}
                tabIndex={0}
              >
                {s.panel.map((block, b) => (
                  <PanelBlock
                    block={block}
                    active={i === active}
                    panelIndex={i}
                    blockIndex={b}
                    key={`p${i}-b${b}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
