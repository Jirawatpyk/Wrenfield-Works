/**
 * Unit tests for headingByNumber (src/lib/content.ts).
 *
 * Section headers are looked up by their mono number ('01'..'04'). The CMS `number` field
 * is editor-controlled free text, so the lookup must tolerate non-canonical-but-equivalent
 * authoring ('1' for '01') instead of silently dropping the whole section header.
 */
import { describe, it, expect } from 'vitest'

import { headingByNumber, type SectionHeadingVM } from '@/lib/content'

const h = (number: string): SectionHeadingVM => ({ number, title: null, subtitle: '' })

describe('headingByNumber()', () => {
  it('finds an exact canonical match', () => {
    const headings = [h('01'), h('02')]
    expect(headingByNumber(headings, '02')).toBe(headings[1])
  })

  it('matches a numerically-equivalent authored number ("1" === "01")', () => {
    const headings = [h('1'), h('2')]
    expect(headingByNumber(headings, '01')).toBe(headings[0])
    expect(headingByNumber(headings, '02')).toBe(headings[1])
  })

  it('prefers an exact string match over a numeric one when both exist', () => {
    const headings = [h('1'), h('01')]
    expect(headingByNumber(headings, '01')).toBe(headings[1])
  })

  it('returns null when nothing matches', () => {
    expect(headingByNumber([h('01')], '09')).toBeNull()
    expect(headingByNumber([], '01')).toBeNull()
  })
})
