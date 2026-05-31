import { describe, it, expect } from 'vitest'

import {
  mapHero,
  mapNav,
  mapMarquee,
  mapSectionHeadings,
  mapTestimonial,
  mapCta,
  mapFooter,
  mapSeo,
} from '../../src/lib/content'

/** Minimal Lexical richText value (the mappers pass these through untouched). */
const rt = (text: string) => ({ root: { children: [{ children: [{ text }] }] } })

describe('content global mappers (pure)', () => {
  it('mapHero maps text via pick and passes richText through', () => {
    const vm = mapHero({
      kicker: 'Kick',
      headline: rt('H'),
      subhead: rt('S'),
      trustLabel: 'Trust',
      primaryCtaLabel: 'P',
      secondaryCtaLabel: 'Sec',
    })
    expect(vm).toMatchObject({
      kicker: 'Kick',
      trustLabel: 'Trust',
      primaryCtaLabel: 'P',
      secondaryCtaLabel: 'Sec',
    })
    expect(vm.headline).toEqual(rt('H'))
    expect(vm.subhead).toEqual(rt('S'))
  })

  it('mapHero defaults missing text to empty string and richText to null', () => {
    const vm = mapHero({})
    expect(vm.kicker).toBe('')
    expect(vm.headline).toBeNull()
    expect(vm.subhead).toBeNull()
  })

  it('mapNav maps the five nav labels', () => {
    const vm = mapNav({
      capabilities: 'C',
      platform: 'P',
      work: 'W',
      process: 'Pr',
      ctaLabel: 'Get in touch',
    })
    expect(vm).toEqual({
      capabilities: 'C',
      platform: 'P',
      work: 'W',
      process: 'Pr',
      ctaLabel: 'Get in touch',
    })
  })

  it('mapMarquee carries the heading and the provided logos', () => {
    const vm = mapMarquee({ heading: 'Shipped' }, [{ name: 'Acme' }, { name: 'Beta' }])
    expect(vm.heading).toBe('Shipped')
    expect(vm.logos).toEqual([{ name: 'Acme' }, { name: 'Beta' }])
  })

  it('mapSectionHeadings maps each heading row (number/title/subtitle)', () => {
    const vm = mapSectionHeadings({
      headings: [{ number: '01', title: rt('What'), subtitle: 'sub' }],
    })
    expect(vm).toHaveLength(1)
    expect(vm[0]).toMatchObject({ number: '01', subtitle: 'sub' })
    expect(vm[0]?.title).toEqual(rt('What'))
  })

  it('mapSectionHeadings tolerates a missing/empty headings array', () => {
    expect(mapSectionHeadings(null)).toEqual([])
    expect(mapSectionHeadings({})).toEqual([])
  })

  it('mapTestimonial passes quote and attribution richText through', () => {
    const vm = mapTestimonial({ quote: rt('Q'), attribution: rt('A') })
    expect(vm.quote).toEqual(rt('Q'))
    expect(vm.attribution).toEqual(rt('A'))
  })

  it('mapCta maps fields and social links', () => {
    const vm = mapCta({
      kicker: "Let's build",
      heading: rt('Build?'),
      body: 'Tell us',
      email: 'hello@x.com',
      bookCallLabel: 'Book',
      socialLinks: [
        { label: 'LinkedIn', url: '#' },
        { label: 'X', url: 'https://x.com' },
      ],
    })
    expect(vm).toMatchObject({
      kicker: "Let's build",
      body: 'Tell us',
      email: 'hello@x.com',
      bookCallLabel: 'Book',
    })
    expect(vm.heading).toEqual(rt('Build?'))
    expect(vm.socialLinks).toEqual([
      { label: 'LinkedIn', url: '#' },
      { label: 'X', url: 'https://x.com' },
    ])
  })

  it('mapFooter maps blurb, studio/connect links, and bottom note', () => {
    const vm = mapFooter({
      blurb: 'Blurb',
      studioLinks: [{ label: 'Work', anchor: '#work' }],
      connectLinks: [{ label: 'Email', url: 'mailto:hi@x.com' }],
      bottomNote: 'Note',
    })
    expect(vm.blurb).toBe('Blurb')
    expect(vm.studioLinks).toEqual([{ label: 'Work', anchor: '#work' }])
    expect(vm.connectLinks).toEqual([{ label: 'Email', url: 'mailto:hi@x.com' }])
    expect(vm.bottomNote).toBe('Note')
  })

  it('defaults every field when the source docs are empty (covers fallback branches)', () => {
    expect(mapNav({})).toEqual({
      capabilities: '',
      platform: '',
      work: '',
      process: '',
      ctaLabel: '',
    })
    expect(mapMarquee({}, [])).toEqual({ heading: '', logos: [] })
    expect(mapTestimonial({})).toEqual({ quote: null, attribution: null })
    const cta = mapCta({})
    expect(cta).toMatchObject({ kicker: '', body: '', email: '', bookCallLabel: '' })
    expect(cta.heading).toBeNull()
    expect(cta.socialLinks).toEqual([])
    const footer = mapFooter({})
    expect(footer).toMatchObject({ blurb: '', bottomNote: '' })
    expect(footer.studioLinks).toEqual([])
    expect(footer.connectLinks).toEqual([])
  })

  it('mapSeo extracts the ogImage url and falls back to null when absent', () => {
    expect(mapSeo({ title: 'T', description: 'D', ogImage: { url: 'https://x/og.png' } })).toEqual({
      title: 'T',
      description: 'D',
      ogImage: 'https://x/og.png',
    })
    expect(mapSeo({ title: 'T', description: 'D' }).ogImage).toBeNull()
    expect(mapSeo({}).ogImage).toBeNull()
  })
})
