import type { ISODate } from '@/types'

/**
 * Calendar-date helpers for `YYYY-MM-DD` strings.
 *
 * Dates are converted to UTC midnight before any arithmetic: a local-time day
 * can be 23 or 25 hours long around DST switches, which would break
 * "difference in days". UTC days are always 24 hours.
 */

const MS_PER_DAY = 86_400_000

/** Today in the user's local time zone, as `YYYY-MM-DD`. Pass `now` in tests. */
export function todayISO(now: Date = new Date()): ISODate {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** `YYYY-MM-DD` → milliseconds at UTC midnight of that date. */
function toUTCms(date: ISODate): number {
  const [year, month, day] = date.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function diffDays(from: ISODate, to: ISODate): number {
  return Math.round((toUTCms(to) - toUTCms(from)) / MS_PER_DAY)
}

/** Shifts a date by `days` (may be negative). `addDays('2026-12-31', 1)` → `'2027-01-01'`. */
export function addDays(date: ISODate, days: number): ISODate {
  return new Date(toUTCms(date) + days * MS_PER_DAY).toISOString().slice(0, 10)
}
