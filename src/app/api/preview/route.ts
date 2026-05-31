import crypto from 'crypto'

import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@payload-config'
import { childLogger } from '@/lib/logging'
import { signPreviewToken } from '@/lib/preview'

/**
 * Draft-preview entry point (FR-018). Reached from the admin "Preview" control as
 * `/api/preview?path=/en&exp=…&token=…`. It (1) verifies a short-lived, path-bound HMAC token
 * (so no raw secret travels in the URL), (2) verifies the request carries an authenticated staff
 * session (so drafts are never exposed to the public — FR-017), (3) enables Next.js draft mode,
 * then redirects to the requested public path, which renders draft content.
 *
 * Lives at `/api/preview` (outside the locale `proxy` and distinct from Payload's `/api/[...slug]`
 * REST catch-all) so it is never locale-prefixed.
 */
const log = childLogger('preview')

/** Constant-time string compare that tolerates differing lengths. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb)
}

const FORBIDDEN = 'You are not allowed to preview this page.'

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') || '/en'
  const exp = Number(searchParams.get('exp'))
  const token = searchParams.get('token')
  const secret = process.env.PREVIEW_SECRET

  if (!secret) return new Response(FORBIDDEN, { status: 403 })

  // Only relative, same-site paths may be previewed (no open redirect).
  if (!path.startsWith('/') || path.startsWith('//')) {
    return new Response('Invalid preview path.', { status: 400 })
  }

  // Token must be present, unexpired, and a valid HMAC over this exact path.
  if (!token || !Number.isFinite(exp) || exp < Date.now()) {
    return new Response(FORBIDDEN, { status: 403 })
  }
  if (!safeEqual(token, signPreviewToken(path, exp, secret))) {
    return new Response(FORBIDDEN, { status: 403 })
  }

  const payload = await getPayload({ config })

  let auth: Awaited<ReturnType<typeof payload.auth>> | null = null
  try {
    auth = await payload.auth({ headers: request.headers })
  } catch (err) {
    // Fail closed, but log so a real auth-subsystem failure is observable (vs. a routine no-session).
    log.warn({ err }, 'payload.auth threw during preview entry')
    return new Response(FORBIDDEN, { status: 403 })
  }

  if (!auth?.user) return new Response(FORBIDDEN, { status: 403 })

  const draft = await draftMode()
  draft.enable()

  redirect(path)
}
