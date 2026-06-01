/**
 * Numeric formatting for the public site (FR-011c: render numeric values **as authored**).
 *
 * Stat/KPI values come straight from a Payload `number` field, so they may be large
 * integers (1400) or non-integers (99.9, 4.8). The animated <Counter> must render them
 * exactly as authored: no locale thousands-grouping (which would turn 1400 into "1,400")
 * and no silent integer rounding (which would turn 99.9 into "100"). These helpers are
 * pure and unit-tested.
 */

/** Digits after the decimal point in a finite number (0 for integers / non-finite input). */
export function decimalPlaces(n: number): number {
  if (!Number.isFinite(n) || Number.isInteger(n)) return 0
  const s = String(n)
  const dot = s.indexOf('.')
  return dot === -1 ? 0 : s.length - dot - 1
}

/**
 * Format `n` with a fixed number of fraction digits and NO locale grouping separator.
 * Used for both the settled value and each count-up frame, so the in-flight and final
 * renders share precision.
 */
export function formatCount(n: number, fractionDigits: number): string {
  const d = Number.isFinite(fractionDigits) && fractionDigits > 0 ? Math.floor(fractionDigits) : 0
  return n.toFixed(d)
}
