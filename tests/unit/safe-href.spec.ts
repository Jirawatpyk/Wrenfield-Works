/**
 * Unit tests for src/lib/safeHref.ts — the CMS-href scheme allow-list (Security,
 * NON-NEGOTIABLE). Covers the stored-XSS vectors (javascript:/data:/vbscript:) plus
 * case/whitespace bypass attempts, and confirms legitimate links pass through unchanged.
 */
import { describe, it, expect } from 'vitest'

import { safeHref } from '@/lib/safeHref'

describe('safeHref() — allow-listed schemes', () => {
  it('passes http(s), mailto and tel through unchanged', () => {
    expect(safeHref('https://example.com/path?q=1')).toBe('https://example.com/path?q=1')
    expect(safeHref('http://example.com')).toBe('http://example.com')
    expect(safeHref('mailto:hi@wrenfieldworks.com')).toBe('mailto:hi@wrenfieldworks.com')
    expect(safeHref('tel:+6620000000')).toBe('tel:+6620000000')
  })

  it('passes in-page anchors and relative/protocol-relative paths through', () => {
    expect(safeHref('#work')).toBe('#work')
    expect(safeHref('/en/contact')).toBe('/en/contact')
    expect(safeHref('//cdn.example.com/a.png')).toBe('//cdn.example.com/a.png')
  })
})

describe('safeHref() — denies dangerous / unknown schemes', () => {
  it('coerces javascript: (and case/whitespace variants) to #', () => {
    expect(safeHref('javascript:alert(document.cookie)')).toBe('#')
    expect(safeHref('JaVaScRiPt:alert(1)')).toBe('#')
    expect(safeHref('   javascript:alert(1)')).toBe('#')
    expect(safeHref('java\nscript:alert(1)')).toBe('#')
  })

  it('coerces data:/vbscript: and other unknown schemes to #', () => {
    expect(safeHref('data:text/html,<script>alert(1)</script>')).toBe('#')
    expect(safeHref('vbscript:msgbox(1)')).toBe('#')
    expect(safeHref('file:///etc/passwd')).toBe('#')
  })

  it('coerces empty / non-string / schemeless bare values to #', () => {
    expect(safeHref('')).toBe('#')
    expect(safeHref('   ')).toBe('#')
    expect(safeHref(null)).toBe('#')
    expect(safeHref(undefined)).toBe('#')
    expect(safeHref('www.example.com')).toBe('#')
  })
})
