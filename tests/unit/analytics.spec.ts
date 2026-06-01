/**
 * T078 (unit) — Cookieless analytics (FR-011b).
 *
 * Privacy-friendly, cookieless measurement (Plausible/Umami) — no personal
 * identifiers, so NO cookie-consent banner. Two pure-ish concerns:
 *   - `analyticsConfig()` reads env and is null unless fully configured (so the
 *     script is only injected when an in-region endpoint exists).
 *   - `trackEvent()` emits a conversion (e.g. `inquiry_submitted`) via the loaded
 *     analytics global and MUST never throw — analytics can't break the app.
 *
 * Source of truth: src/lib/analytics.ts.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

import {
  analyticsConfig,
  isAnalyticsEnabled,
  trackEvent,
  INQUIRY_SUBMITTED_EVENT,
} from '@/lib/analytics'

const w = globalThis as { plausible?: unknown }

afterEach(() => {
  delete w.plausible
})

describe('analyticsConfig', () => {
  it('is null when the analytics env is not configured', () => {
    const prevD = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN
    const prevS = process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_URL
    delete process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN
    delete process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_URL
    try {
      expect(analyticsConfig()).toBeNull()
      expect(isAnalyticsEnabled()).toBe(false)
    } finally {
      process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN = prevD
      process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_URL = prevS
    }
  })

  it('returns {domain, scriptUrl} when both env vars are set', () => {
    const prevD = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN
    const prevS = process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_URL
    process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN = 'wrenfieldworks.com'
    process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_URL = 'https://a.example.com/script.js'
    try {
      expect(analyticsConfig()).toEqual({
        domain: 'wrenfieldworks.com',
        scriptUrl: 'https://a.example.com/script.js',
      })
      expect(isAnalyticsEnabled()).toBe(true)
    } finally {
      process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN = prevD
      process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_URL = prevS
    }
  })
})

describe('trackEvent', () => {
  it('calls the analytics global with the event name', () => {
    const spy = vi.fn()
    w.plausible = spy
    trackEvent(INQUIRY_SUBMITTED_EVENT)
    expect(spy).toHaveBeenCalledWith(INQUIRY_SUBMITTED_EVENT, undefined)
  })

  it('forwards custom props', () => {
    const spy = vi.fn()
    w.plausible = spy
    trackEvent('evt', { locale: 'th' })
    expect(spy).toHaveBeenCalledWith('evt', { props: { locale: 'th' } })
  })

  it('is a no-op (no throw) when the analytics global is absent', () => {
    expect(() => trackEvent(INQUIRY_SUBMITTED_EVENT)).not.toThrow()
  })

  it('never throws even if the analytics global throws', () => {
    w.plausible = () => {
      throw new Error('analytics boom')
    }
    expect(() => trackEvent(INQUIRY_SUBMITTED_EVENT)).not.toThrow()
  })
})
