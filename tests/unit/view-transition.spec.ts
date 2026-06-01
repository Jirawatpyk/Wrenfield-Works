/**
 * Unit tests for src/lib/viewTransition.ts — the shared guard that runs a DOM mutation
 * inside the browser's View Transitions API only when it is supported AND motion is not
 * reduced (FR-006). Covers all four branches: SSR (no document), unsupported API,
 * reduced motion, and the supported + motion-on happy path. Runs in the `node` env, so a
 * fake `document` is stubbed onto `globalThis` per case.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { startViewTransition } from '@/lib/viewTransition'

const originalDocument = globalThis.document

type FakeOpts = {
  motionOff?: boolean
  startViewTransition?: (cb: () => void | Promise<void>) => { finished: Promise<void> }
}

function fakeDocument(opts: FakeOpts): Document {
  return {
    body: {
      classList: {
        contains: (cls: string) => (cls === 'motion-off' ? Boolean(opts.motionOff) : false),
      },
    },
    ...(opts.startViewTransition ? { startViewTransition: opts.startViewTransition } : {}),
  } as unknown as Document
}

afterEach(() => {
  // Restore the node default (undefined) so cases do not leak into one another.
  Object.defineProperty(globalThis, 'document', {
    value: originalDocument,
    configurable: true,
    writable: true,
  })
  vi.restoreAllMocks()
})

function setDocument(doc: Document | undefined): void {
  Object.defineProperty(globalThis, 'document', {
    value: doc,
    configurable: true,
    writable: true,
  })
}

describe('startViewTransition()', () => {
  it('applies the mutation immediately and returns null when there is no document (SSR)', () => {
    setDocument(undefined)
    const mutate = vi.fn()

    expect(startViewTransition(mutate)).toBeNull()
    expect(mutate).toHaveBeenCalledOnce()
  })

  it('falls back to an instant mutation when the View Transitions API is unsupported', () => {
    setDocument(fakeDocument({}))
    const mutate = vi.fn()

    expect(startViewTransition(mutate)).toBeNull()
    expect(mutate).toHaveBeenCalledOnce()
  })

  it('respects reduced motion: applies instantly and never starts a transition', () => {
    const start = vi.fn(() => ({ finished: Promise.resolve() }))
    setDocument(fakeDocument({ motionOff: true, startViewTransition: start }))
    const mutate = vi.fn()

    expect(startViewTransition(mutate)).toBeNull()
    expect(mutate).toHaveBeenCalledOnce()
    expect(start).not.toHaveBeenCalled()
  })

  it('runs the mutation inside a View Transition when supported and motion is on', () => {
    const transition = { finished: Promise.resolve() }
    const start = vi.fn((cb: () => void | Promise<void>) => {
      cb()
      return transition
    })
    setDocument(fakeDocument({ startViewTransition: start }))
    const mutate = vi.fn()

    const result = startViewTransition(mutate)

    expect(start).toHaveBeenCalledOnce()
    expect(mutate).toHaveBeenCalledOnce()
    expect(result).toBe(transition)
  })
})
