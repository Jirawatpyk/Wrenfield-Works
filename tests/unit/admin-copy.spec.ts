import { describe, it, expect } from 'vitest'
import { adminCopy } from '@/lib/admin/adminCopy'

describe('adminCopy', () => {
  it('has a non-empty EN and TH string for every key', () => {
    for (const [key, value] of Object.entries(adminCopy)) {
      expect(value.en, `${key}.en`).toBeTypeOf('string')
      expect(value.th, `${key}.th`).toBeTypeOf('string')
      expect(value.en.trim().length, `${key}.en non-empty`).toBeGreaterThan(0)
      expect(value.th.trim().length, `${key}.th non-empty`).toBeGreaterThan(0)
    }
  })

  it('exposes the keys the guidance components use', () => {
    for (const key of [
      'welcomeTitle',
      'welcomeBody',
      'publishRule',
      'readinessTitle',
      'readinessProgress',
      'statusReady',
      'statusNotReady',
      'statusNotStarted',
      'readinessError',
      'localeStatusTitle',
      'localeStatusHint',
      'localeStatusStale',
      'recheckLabel',
      'missingEnLabel',
      'missingThLabel',
    ]) {
      expect(adminCopy, key).toHaveProperty(key)
    }
  })
})
