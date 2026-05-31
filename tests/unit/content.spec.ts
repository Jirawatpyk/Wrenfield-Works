/**
 * T027 — Unit tests for the content read/mapping layer (`src/lib/content.ts`).
 *
 * Covers locale-scoped mapping, single-locale/empty-value fallback, ordered output,
 * empty-collection handling, rich-text plain-text extraction, and graceful content-load
 * failure (T045). All pure functions — no DB. Field names mirror the generated Payload
 * types (src/payload-types.ts), which are the source of truth.
 */
import { describe, it, expect } from 'vitest'
import {
  ordered,
  pick,
  omitIfEmpty,
  lexicalToPlainText,
  mapStats,
  mapCapabilities,
  mapCaseStudies,
  mapProcessSteps,
  mapClientLogos,
  mapShowcaseSurfaces,
  safeSection,
} from '@/lib/content'

const lex = (text: string) => ({
  root: {
    type: 'root',
    children: [{ type: 'paragraph', children: [{ type: 'text', text, format: 0 }] }],
  },
})

describe('ordered()', () => {
  it('sorts items ascending by their numeric order', () => {
    const items = [
      { order: 3, id: 'c' },
      { order: 1, id: 'a' },
      { order: 2, id: 'b' },
    ]
    expect(ordered(items).map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })

  it('places items without an order after ordered ones, preserving input order among them', () => {
    const items = [
      { order: null, id: 'x' },
      { order: 2, id: 'b' },
      { order: undefined, id: 'y' },
      { order: 1, id: 'a' },
    ]
    expect(ordered(items).map((i) => i.id)).toEqual(['a', 'b', 'x', 'y'])
  })

  it('does not mutate the input array', () => {
    const items = [{ order: 2 }, { order: 1 }]
    const copy = [...items]
    ordered(items)
    expect(items).toEqual(copy)
  })
})

describe('pick() — single-locale / empty-value fallback', () => {
  it('returns the first non-empty value', () => {
    expect(pick('hello', 'fallback')).toBe('hello')
  })

  it('falls back when the primary value is missing or empty', () => {
    expect(pick('', 'fallback')).toBe('fallback')
    expect(pick(null, 'fallback')).toBe('fallback')
    expect(pick(undefined, 'fallback')).toBe('fallback')
  })

  it('treats whitespace-only as empty and trims the chosen value', () => {
    expect(pick('   ', 'fallback')).toBe('fallback')
    expect(pick('  spaced  ')).toBe('spaced')
  })

  it('returns an empty string when every candidate is empty', () => {
    expect(pick(null, undefined, '')).toBe('')
  })
})

describe('omitIfEmpty() — empty-collection handling', () => {
  it('returns null for an empty array (so the section is omitted)', () => {
    expect(omitIfEmpty([])).toBeNull()
  })

  it('returns null for null/undefined input', () => {
    expect(omitIfEmpty(null)).toBeNull()
    expect(omitIfEmpty(undefined)).toBeNull()
  })

  it('returns the array unchanged when it has items', () => {
    const arr = [1, 2]
    expect(omitIfEmpty(arr)).toBe(arr)
  })
})

describe('lexicalToPlainText()', () => {
  it('extracts concatenated text from a Lexical value', () => {
    expect(lexicalToPlainText(lex("Production systems that can't break"))).toBe(
      "Production systems that can't break",
    )
  })

  it('joins multiple paragraphs with a space and collapses whitespace', () => {
    const value = {
      root: {
        type: 'root',
        children: [
          { type: 'paragraph', children: [{ type: 'text', text: 'One' }] },
          { type: 'paragraph', children: [{ type: 'text', text: 'Two' }] },
        ],
      },
    }
    expect(lexicalToPlainText(value)).toBe('One Two')
  })

  it('returns an empty string for null/empty input', () => {
    expect(lexicalToPlainText(null)).toBe('')
    expect(lexicalToPlainText(undefined)).toBe('')
    expect(lexicalToPlainText({})).toBe('')
  })
})

describe('mapStats()', () => {
  it('maps stat docs to view models in order', () => {
    const docs = [
      { order: 2, value: 40, unit: '%', label: 'cut' },
      { order: 1, value: 60, unit: '+', label: 'shipped' },
    ]
    expect(mapStats(docs)).toEqual([
      { value: 60, unit: '+', label: 'shipped' },
      { value: 40, unit: '%', label: 'cut' },
    ])
  })

  it('returns an empty array for no docs', () => {
    expect(mapStats([])).toEqual([])
  })
})

describe('mapCapabilities()', () => {
  it('uses categoryLabel + icon and flattens tags[].value, preserving order', () => {
    const docs = [
      {
        order: 1,
        icon: 'automation',
        categoryLabel: 'Automation',
        title: 'Workflows',
        description: 'desc',
        tags: [{ value: 'Integrations' }, { value: 'Reporting bots' }],
      },
    ]
    expect(mapCapabilities(docs)).toEqual([
      {
        icon: 'automation',
        categoryLabel: 'Automation',
        title: 'Workflows',
        description: 'desc',
        tags: ['Integrations', 'Reporting bots'],
      },
    ])
  })

  it('tolerates a missing tags array', () => {
    const docs = [{ order: 1, icon: 'tools', categoryLabel: 'Tools', title: 't', description: 'd' }]
    expect(mapCapabilities(docs)[0]!.tags).toEqual([])
  })
})

describe('mapCaseStudies()', () => {
  it('keeps mono glyph/tag, localized title/description, and passes metricsLine rich-text through', () => {
    const metricsLine = lex('182 accounts live')
    const docs = [
      { order: 1, glyph: 'C', tag: 'CRM · Platform', title: 'CRM', description: 'd', metricsLine },
    ]
    expect(mapCaseStudies(docs)).toEqual([
      { glyph: 'C', tag: 'CRM · Platform', title: 'CRM', description: 'd', metricsLine },
    ])
  })

  it('maps missing metricsLine to null', () => {
    const docs = [{ order: 1, glyph: 'A', tag: 'Automation', title: 't', description: 'd' }]
    expect(mapCaseStudies(docs)[0]!.metricsLine).toBeNull()
  })
})

describe('mapProcessSteps()', () => {
  it('keeps mono number, localized name/title/description, and flattens checklist[].point', () => {
    const docs = [
      {
        order: 1,
        number: '01',
        name: 'Scope',
        title: 'Define done',
        description: 'd',
        checklist: [{ point: 'Mapped' }, { point: 'Dated' }],
      },
    ]
    expect(mapProcessSteps(docs)).toEqual([
      {
        number: '01',
        name: 'Scope',
        title: 'Define done',
        description: 'd',
        checklist: ['Mapped', 'Dated'],
      },
    ])
  })
})

describe('mapClientLogos()', () => {
  it('maps logo names in order', () => {
    const docs = [
      { order: 2, name: 'Siriphan Group' },
      { order: 1, name: 'Northbound®' },
    ]
    expect(mapClientLogos(docs)).toEqual([{ name: 'Northbound®' }, { name: 'Siriphan Group' }])
  })
})

describe('mapShowcaseSurfaces()', () => {
  it('uses tabName/tabTitle/tabDescription and passes the panel blocks through, in order', () => {
    const panel = [{ blockType: 'mockRow', name: 'Inbox → data' }]
    const docs = [
      { order: 1, tabName: 'A · Automation', tabTitle: 'Pipelines', tabDescription: 'd', panel },
    ]
    expect(mapShowcaseSurfaces(docs)).toEqual([
      { tabName: 'A · Automation', tabTitle: 'Pipelines', tabDescription: 'd', panel },
    ])
  })

  it('maps a missing panel to an empty array', () => {
    const docs = [{ order: 1, tabName: 'B', tabTitle: 't', tabDescription: 'd' }]
    expect(mapShowcaseSurfaces(docs)[0]!.panel).toEqual([])
  })
})

describe('safeSection() — graceful content-load failure (T045)', () => {
  it('returns the resolved value on success', async () => {
    await expect(safeSection('hero', async () => ({ ok: true }))).resolves.toEqual({ ok: true })
  })

  it('returns null (default) and does not throw when the loader rejects', async () => {
    const result = await safeSection('hero', async () => {
      throw new Error('db down')
    })
    expect(result).toBeNull()
  })

  it('returns the provided fallback when the loader rejects', async () => {
    const result = await safeSection(
      'stats',
      async () => {
        throw new Error('db down')
      },
      [],
    )
    expect(result).toEqual([])
  })
})
