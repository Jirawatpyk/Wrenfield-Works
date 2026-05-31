import { describe, it, expect } from 'vitest'
import type { Field } from 'payload'
import { collectLocaleStatus } from '@/lib/admin/completeness'

const fields: Field[] = [
  { name: 'kicker', type: 'text', localized: true, label: 'Kicker' },
  { name: 'unit', type: 'text' }, // non-localized → ignored
  { name: 'rows', type: 'array', fields: [{ name: 'label', type: 'text', localized: true, label: 'Row label' }] },
]

describe('collectLocaleStatus', () => {
  it('reports both complete when every localized leaf has en and th', () => {
    const doc = {
      kicker: { en: 'Hi', th: 'สวัสดี' },
      unit: { en: 'kg', th: 'kg' },
      rows: [{ label: { en: 'A', th: 'ก' } }],
    }
    const s = collectLocaleStatus(fields, doc)
    expect(s.enComplete).toBe(true)
    expect(s.thComplete).toBe(true)
    expect(s.empty).toBe(false)
    expect(s.missing).toEqual([])
  })

  it('flags TH gaps with labels when only English is filled', () => {
    const doc = { kicker: { en: 'Hi', th: '' }, rows: [{ label: { en: 'A', th: '' } }] }
    const s = collectLocaleStatus(fields, doc)
    expect(s.enComplete).toBe(true)
    expect(s.thComplete).toBe(false)
    expect(s.empty).toBe(false)
    expect(s.missing).toEqual([
      // en/th are TRUE when that locale is FILLED → EN filled, TH gap.
      { path: 'kicker', label: 'Kicker', en: true, th: false },
      { path: 'rows[0].label', label: 'Row label', en: true, th: false },
    ])
  })

  it('marks an entirely-empty doc as empty (not started) with both locales missing', () => {
    const s = collectLocaleStatus(fields, {})
    expect(s.enComplete).toBe(false)
    expect(s.thComplete).toBe(false)
    expect(s.empty).toBe(true)
  })

  it('handles a mix of complete and EN-only fields', () => {
    const doc = {
      kicker: { en: 'Hi', th: 'สวัสดี' },
      rows: [{ label: { en: 'A', th: '' } }],
    }
    const s = collectLocaleStatus(fields, doc)
    expect(s.enComplete).toBe(true)
    expect(s.thComplete).toBe(false)
    expect(s.empty).toBe(false)
    expect(s.missing).toEqual([{ path: 'rows[0].label', label: 'Row label', en: true, th: false }])
  })
})
