/**
 * Parse a non-negative integer environment variable with a fallback — the single
 * source of truth for env-int parsing (inquiry rate limiter, SMTP port, retention
 * window) so the semantics are identical everywhere.
 *
 * Rules: an UNSET or empty/whitespace value falls back (Number('') would otherwise
 * coerce to 0); a non-finite, below-`min`, or non-numeric value falls back; a valid
 * value is floored to an integer. `min` defaults to 0 (use `min: 1` to forbid 0).
 *
 * Pure; unit-tested in tests/unit/env.spec.ts.
 */
export function envInt(name: string, fallback: number, min = 0): number {
  const raw = process.env[name]
  if (raw == null || raw.trim() === '') return fallback
  const n = Number(raw)
  return Number.isFinite(n) && n >= min ? Math.floor(n) : fallback
}
