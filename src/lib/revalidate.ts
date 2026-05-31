import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

import { childLogger } from './logging'

/**
 * On-publish revalidation (FR-016). The public site renders one page per locale
 * (`/en`, `/th`); after any content write we revalidate both so a publish (or an
 * unpublish/delete) is visible immediately, with no redeploy.
 *
 * `revalidatePath` only works inside a Next.js request context (the admin save runs
 * through a Next route handler, which qualifies). Calls from the seed/CLI or from
 * integration tests have no request store, so they should opt out via
 * `req.context.disableRevalidate`. As a backstop, the "no static-generation store"
 * invariant is treated as benign; any OTHER error is a real failure that would leave
 * the public site stale, so it is logged (never silently swallowed).
 */
const log = childLogger('revalidate')

/** The Next invariant thrown when revalidatePath runs with no request store (seed/CLI/tests). */
function isNoStoreInvariant(err: unknown): boolean {
  const code = (err as { __NEXT_ERROR_CODE?: string } | null)?.__NEXT_ERROR_CODE
  if (code === 'E263') return true
  const msg = err instanceof Error ? err.message : String(err)
  return /static generation store|invariant|outside a request|was not found/i.test(msg)
}

async function revalidateSite(context: { disableRevalidate?: boolean } | undefined): Promise<void> {
  if (context?.disableRevalidate) return
  try {
    const { revalidatePath } = await import('next/cache')
    // The public site is the dynamic route `/[locale]`; revalidating literal paths does not match
    // a dynamic segment's cache key — revalidate the route pattern (covers /en and /th), plus the
    // literals as a belt-and-braces fallback.
    revalidatePath('/[locale]', 'layout')
    revalidatePath('/en')
    revalidatePath('/th')
  } catch (err) {
    if (isNoStoreInvariant(err)) return // benign: not in a request context (seed / CLI / tests)
    log.error({ err }, 'on-publish revalidation failed; the public site may be stale (FR-016)')
  }
}

export const revalidateAfterChange: CollectionAfterChangeHook = async ({ doc, req }) => {
  await revalidateSite(req.context as { disableRevalidate?: boolean } | undefined)
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await revalidateSite(req.context as { disableRevalidate?: boolean } | undefined)
  return doc
}

export const revalidateGlobalAfterChange: GlobalAfterChangeHook = async ({ doc, req }) => {
  await revalidateSite(req.context as { disableRevalidate?: boolean } | undefined)
  return doc
}
