import { describe, it, expect } from 'vitest'
import type { Field } from 'payload'
import { isBlank, walkLocalizedLeaves } from '@/lib/validation/localeFields'

describe('isBlank', () => {
  it('treats null/undefined/empty-string/whitespace/empty-array as blank', () => {
    expect(isBlank(null)).toBe(true)
    expect(isBlank(undefined)).toBe(true)
    expect(isBlank('')).toBe(true)
    expect(isBlank('   ')).toBe(true)
    expect(isBlank([])).toBe(true)
  })

  it('treats non-empty strings/arrays as present', () => {
    expect(isBlank('hi')).toBe(false)
    expect(isBlank([1])).toBe(false)
  })

  it('treats a Lexical richText with text as present and empty as blank', () => {
    const empty = { root: { children: [{ type: 'paragraph', children: [] }] } }
    const full = { root: { children: [{ type: 'paragraph', children: [{ text: 'hello' }] }] } }
    expect(isBlank(empty)).toBe(true)
    expect(isBlank(full)).toBe(false)
  })
})

describe('walkLocalizedLeaves', () => {
  it('visits every localized value leaf with path, {en,th} value, and label', () => {
    const fields: Field[] = [
      { name: 'kicker', type: 'text', localized: true, label: 'Kicker' },
      { name: 'unit', type: 'text' }, // not localized → skipped
      {
        name: 'rows',
        type: 'array',
        fields: [{ name: 'label', type: 'text', localized: true }],
      },
    ]
    const data = {
      kicker: { en: 'A', th: '' },
      unit: { en: 'kg', th: 'kg' },
      rows: [{ label: { en: 'r0', th: 'r0' } }],
    }
    const seen: Array<{ path: string; value: unknown; label: string }> = []
    walkLocalizedLeaves(fields, data, '', (path, value, label) => seen.push({ path, value, label }))
    expect(seen).toEqual([
      { path: 'kicker', value: { en: 'A', th: '' }, label: 'Kicker' },
      { path: 'rows[0].label', value: { en: 'r0', th: 'r0' }, label: 'label' },
    ])
  })

  it('descends through row, group, named tabs, and blocks', () => {
    const fields: Field[] = [
      { type: 'row', fields: [{ name: 'a', type: 'text', localized: true }] },
      { name: 'grp', type: 'group', fields: [{ name: 'b', type: 'text', localized: true }] },
      {
        type: 'tabs',
        tabs: [{ name: 'tab1', fields: [{ name: 'c', type: 'text', localized: true }] }],
      },
      {
        name: 'blk',
        type: 'blocks',
        blocks: [{ slug: 'quote', fields: [{ name: 'd', type: 'text', localized: true }] }],
      },
    ]
    const data = {
      a: { en: 'a', th: 'a' },
      grp: { b: { en: 'b', th: 'b' } },
      tab1: { c: { en: 'c', th: 'c' } },
      blk: [{ blockType: 'quote', d: { en: 'd', th: 'd' } }],
    }
    const paths: string[] = []
    walkLocalizedLeaves(fields, data, '', (p) => paths.push(p))
    expect(paths).toEqual(['a', 'grp.b', 'tab1.c', 'blk[0].d'])
  })
})
