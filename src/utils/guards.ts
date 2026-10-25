/** Plain object check (not null, not an array). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Narrows `value` to one of the literals in `options`.
 * Pairs with the `as const` lists in `src/types`: `isOneOf(THEME_MODES, x)`.
 */
export function isOneOf<const T extends readonly string[]>(options: T, value: unknown): value is T[number] {
  return typeof value === 'string' && options.includes(value)
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * `YYYY-MM-DD` that is also a real calendar date (`2026-02-30` is rejected).
 * Round-trips through `Date`: an impossible date rolls over to another day.
 */
export function isISODate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE_RE.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

/** `HH:mm`, 24h. */
export function isTimeHHmm(value: unknown): value is string {
  return typeof value === 'string' && TIME_RE.test(value)
}

/** `undefined`, or a value passing `check` — for optional fields. */
export function isOptional<T>(value: unknown, check: (v: unknown) => v is T): value is T | undefined {
  return value === undefined || check(value)
}

export const isString = (value: unknown): value is string => typeof value === 'string'
