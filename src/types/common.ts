/**
 * Entity identifier, generated with RTK `nanoid()`.
 * (`crypto.randomUUID()` exists only in secure contexts — it would break
 * when the dev server is opened from a phone over plain http://192.168…)
 */
export type ID = string

/** Calendar date without time, `YYYY-MM-DD`. Compare as strings — ISO sorts correctly. */
export type ISODate = string

/** Time of day, `HH:mm` (24h). */
export type TimeHHmm = string

/** Unix epoch milliseconds (`Date.now()`). */
export type Timestamp = number

/**
 * Supported currencies. Each trip has its own currency;
 * all its expenses are stored in that currency.
 */
export const CURRENCIES = ['ILS', 'USD', 'EUR', 'GBP', 'GEL', 'TRY', 'THB', 'JPY', 'CZK'] as const
export type CurrencyCode = (typeof CURRENCIES)[number]

export const DEFAULT_CURRENCY: CurrencyCode = 'ILS'
