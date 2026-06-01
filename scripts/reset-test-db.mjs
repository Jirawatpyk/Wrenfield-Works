/**
 * Reset the integration test database to a clean slate before a run.
 *
 * Truncates every table in the public schema (keeping the schema itself, which
 * Payload pushes on first connect) so integration tests — especially those that
 * touch singleton globals — never inherit state from a previous run. Safe to run
 * against a brand-new DB: if no tables exist yet, it is a no-op and Payload pushes
 * the schema on boot.
 *
 * Uses the `pg` driver (a transitive dependency of @payloadcms/db-postgres) and
 * the same env var the harness uses, so it is portable across local + CI.
 */
import pg from 'pg'

const uri =
  process.env.TEST_DATABASE_URI ||
  process.env.DATABASE_URI ||
  'postgres://wrenfield:wrenfield@localhost:5432/wrenfield_test'

const client = new pg.Client({ connectionString: uri })

try {
  await client.connect()
  const { rows } = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
  if (rows.length === 0) {
    console.log('[reset-test-db] no tables yet — Payload will push the schema on boot')
  } else {
    const list = rows.map((r) => `"${r.tablename}"`).join(', ')
    await client.query(`TRUNCATE ${list} RESTART IDENTITY CASCADE`)
    console.log(
      `[reset-test-db] truncated ${rows.length} tables in ${new URL(uri).pathname.slice(1)}`,
    )
  }
} catch (err) {
  console.error('[reset-test-db] failed:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
