/**
 * Integration-test harness — boots the embedded Payload CMS against an ISOLATED
 * test database via the Local API, exactly as the app does in process (plan.md
 * "Payload Local API for integration tests against a test Postgres").
 *
 * Isolation: we point `DATABASE_URI` at `wrenfield_test` (NOT the dev `wrenfield`
 * DB) so create/publish/delete in tests never touch seeded dev content. The
 * Postgres adapter pushes the schema on first connect (non-production), so the
 * test DB only needs to exist and be empty.
 *
 * ORDER MATTERS: `payload.config.ts` reads `process.env.DATABASE_URI` /
 * `PAYLOAD_SECRET` at module-eval time (inside `buildConfig`). So we set env
 * FIRST, then lazy-`import()` the config — never import it at the top level.
 */
import type { Payload } from 'payload'

// --- Env must be set before the config module is evaluated --------------------
process.env.DATABASE_URI =
  process.env.TEST_DATABASE_URI || 'postgres://wrenfield:wrenfield@localhost:5432/wrenfield_test'
process.env.PAYLOAD_SECRET = process.env.PAYLOAD_SECRET || 'test-secret-wrenfield-integration'
process.env.NEXT_PUBLIC_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
// Configure the inquiry-email path so the afterChange hook actually attempts a send
// (the hook skips when SMTP_HOST is unset, and email.ts skips when no recipient). A
// loopback host fast-refuses real sends (T064/T065 tolerate {sent:false}); T066 stubs
// payload.sendEmail to assert failure isolation. The adapter uses skipVerify, so booting
// Payload here does not open a live SMTP handshake.
process.env.SMTP_HOST = process.env.SMTP_HOST || '127.0.0.1'
process.env.INQUIRY_NOTIFY_TO = process.env.INQUIRY_NOTIFY_TO || 'studio@wrenfield.test'
process.env.EMAIL_FROM = process.env.EMAIL_FROM || 'Wrenfield Works <no-reply@wrenfield.test>'

let _payload: Promise<Payload> | null = null

/** Boot (once per test process) the Payload Local API client against the test DB. */
export function getTestPayload(): Promise<Payload> {
  if (!_payload) {
    _payload = (async () => {
      const { getPayload } = await import('payload')
      const config = (await import('@payload-config')).default
      return getPayload({ config })
    })()
  }
  return _payload
}

/** Known back-office credentials used across the auth/access integration tests. */
export const STAFF = {
  email: 'editor@wrenfield.test',
  password: 'Test1234!staff',
  name: 'Test Editor',
} as const

/** Idempotently ensure a single staff user exists; returns its id. */
export async function ensureStaffUser(payload: Payload): Promise<string | number> {
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: STAFF.email } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs.length > 0) return (existing.docs[0] as { id: string | number }).id
  const created = await payload.create({
    collection: 'users',
    data: { email: STAFF.email, password: STAFF.password, name: STAFF.name },
    overrideAccess: true,
  })
  return (created as { id: string | number }).id
}

/**
 * Build a `req`-like context carrying an authenticated user, for exercising
 * access control / hooks as a signed-in editor would. Payload's Local API
 * methods accept `overrideAccess: false` + `user` to run real access rules.
 */
export async function asStaff(payload: Payload): Promise<{ id: string | number; user: unknown }> {
  const id = await ensureStaffUser(payload)
  const user = await payload.findByID({ collection: 'users', id, overrideAccess: true })
  return { id, user }
}
