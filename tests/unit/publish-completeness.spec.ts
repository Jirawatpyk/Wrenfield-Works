import type { Field } from 'payload'
import { describe, it, expect } from 'vitest'

import { __test } from '../../src/lib/validation/publishCompleteness'

const { isBlank, localeMapIncomplete, collectMissing, overlayActiveLocale } = __test

const richText = (text: string) => ({ root: { children: [{ children: [{ text }] }] } })
const emptyRichText = { root: { children: [] } }

describe('isBlank', () => {
  it('treats empty/whitespace strings, null, undefined and empty arrays as blank', () => {
    expect(isBlank('')).toBe(true)
    expect(isBlank('   ')).toBe(true)
    expect(isBlank(null)).toBe(true)
    expect(isBlank(undefined)).toBe(true)
    expect(isBlank([])).toBe(true)
  })

  it('treats non-empty strings and arrays as present', () => {
    expect(isBlank('x')).toBe(false)
    expect(isBlank(['a'])).toBe(false)
  })

  it('detects empty vs non-empty Lexical richText', () => {
    expect(isBlank(emptyRichText)).toBe(true)
    expect(isBlank(richText('hello'))).toBe(false)
  })
})

describe('localeMapIncomplete', () => {
  it('is complete only when BOTH en and th are present', () => {
    expect(localeMapIncomplete({ en: 'a', th: 'b' })).toBe(false)
    expect(localeMapIncomplete({ en: 'a' })).toBe(true)
    expect(localeMapIncomplete({ en: '', th: 'b' })).toBe(true)
    expect(localeMapIncomplete(null)).toBe(true)
    expect(localeMapIncomplete('not-a-map')).toBe(true)
  })
})

describe('collectMissing', () => {
  it('flags a localized field missing a locale, ignores non-localized fields', () => {
    const fields: Field[] = [
      { name: 'label', type: 'text', localized: true },
      { name: 'unit', type: 'text' },
      { name: 'order', type: 'number' },
    ]
    expect(collectMissing(fields, { label: { en: 'L', th: '' }, unit: '+', order: 0 }, '')).toEqual(
      ['label'],
    )
    expect(
      collectMissing(fields, { label: { en: 'L', th: 'T' }, unit: '+', order: 0 }, ''),
    ).toEqual([])
  })

  it('recurses into groups and arrays with path notation', () => {
    const grouped: Field[] = [
      { name: 'g', type: 'group', fields: [{ name: 't', type: 'text', localized: true }] },
    ]
    expect(collectMissing(grouped, { g: { t: { en: 'a' } } }, '')).toEqual(['g.t'])

    const arrayed: Field[] = [
      { name: 'links', type: 'array', fields: [{ name: 'text', type: 'text', localized: true }] },
    ]
    expect(collectMissing(arrayed, { links: [{ text: { en: 'a', th: '' } }] }, '')).toEqual([
      'links[0].text',
    ])
    // An empty array has no rows to be incomplete.
    expect(collectMissing(arrayed, { links: [] }, '')).toEqual([])
  })

  it('recurses into blocks, named/unnamed tabs, rows and collapsibles', () => {
    const blocks: Field[] = [
      {
        name: 'panel',
        type: 'blocks',
        blocks: [{ slug: 'mockRow', fields: [{ name: 'label', type: 'text', localized: true }] }],
      } as unknown as Field,
    ]
    expect(
      collectMissing(blocks, { panel: [{ blockType: 'mockRow', label: { en: 'a', th: '' } }] }, ''),
    ).toEqual(['panel[0].label'])

    const namedTab: Field[] = [
      {
        type: 'tabs',
        tabs: [{ name: 'meta', fields: [{ name: 't', type: 'text', localized: true }] }],
      },
    ] as unknown as Field[]
    expect(collectMissing(namedTab, { meta: { t: { en: 'a' } } }, '')).toEqual(['meta.t'])

    const unnamedTab: Field[] = [
      { type: 'tabs', tabs: [{ fields: [{ name: 'u', type: 'text', localized: true }] }] },
    ] as unknown as Field[]
    expect(collectMissing(unnamedTab, { u: { en: 'a' } }, '')).toEqual(['u'])

    const row: Field[] = [
      { type: 'row', fields: [{ name: 'r', type: 'text', localized: true }] },
    ] as unknown as Field[]
    expect(collectMissing(row, { r: { en: 'a' } }, '')).toEqual(['r'])
  })
})

describe('overlayActiveLocale', () => {
  it('overlays the active-locale incoming value onto the stored {en,th} map', () => {
    const fields: Field[] = [{ name: 'kicker', type: 'text', localized: true }]
    const merged = overlayActiveLocale(
      fields,
      { kicker: { en: 'OLD-EN', th: 'TH' } },
      { kicker: 'NEW-EN' },
      'en',
    )
    expect(merged.kicker).toEqual({ en: 'NEW-EN', th: 'TH' })
  })

  it('returns the stored doc unchanged when there is no incoming data', () => {
    const fields: Field[] = [{ name: 'kicker', type: 'text', localized: true }]
    const stored = { kicker: { en: 'A', th: 'B' } }
    expect(overlayActiveLocale(fields, stored, undefined, 'th')).toBe(stored)
  })
})
