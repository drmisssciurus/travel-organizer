import type { CurrencyCode, ISODate, Language } from '@/types'

/**
 * Locale-aware formatting through `Intl` — no date/number libraries needed.
 * Dates are formatted in UTC: an ISO date is a calendar day, not a moment,
 * so the user's time zone must not shift it to the previous day.
 */

const toUTCDate = (date: ISODate) => new Date(`${date}T00:00:00Z`)

/**
 * "13–19 Oct", "29 Sep – 4 Oct"; the year is added only when the range
 * is not entirely in the current year: "28 Dec 2026 – 3 Jan 2027".
 * `formatRange` picks the separator and collapses the repeated month/year itself.
 */
export function formatDateRange(start: ISODate, end: ISODate, language: Language, today: ISODate): string {
  const thisYear = today.slice(0, 4)
  const showYear = start.slice(0, 4) !== thisYear || end.slice(0, 4) !== thisYear
  const format = new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'short',
    year: showYear ? 'numeric' : undefined,
    timeZone: 'UTC',
  })
  return format.formatRange(toUTCDate(start), toUTCDate(end))
}

/**
 * "€1,240" / "1 240 €"; whole amounts without ".00", JPY never has decimals.
 * `narrowSymbol`: "₾320" instead of "GEL 320", "$" instead of "US$" in Russian.
 */
export function formatMoney(amount: number, currency: CurrencyCode, language: Language): string {
  const whole = Number.isInteger(amount)
  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    // undefined → the currency's own default (2 for EUR, 0 for JPY)
    minimumFractionDigits: whole ? 0 : undefined,
    maximumFractionDigits: whole ? 0 : undefined,
  }).format(amount)
}

/** "Mon 12" / "пн, 12" — board column headers and mobile day chips. */
export function formatWeekdayDay(date: ISODate, language: Language): string {
  return new Intl.DateTimeFormat(language, { weekday: 'short', day: 'numeric', timeZone: 'UTC' }).format(toUTCDate(date))
}

/** "5 Oct" / "5 окт." — due dates. */
export function formatShortDate(date: ISODate, language: Language): string {
  return new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(toUTCDate(date))
}

/** "Tuesday, 13 October" / "вторник, 13 октября" — mobile day title, Today screen. */
export function formatLongDate(date: ISODate, language: Language): string {
  return new Intl.DateTimeFormat(language, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    toUTCDate(date),
  )
}
