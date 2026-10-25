import type { ISODate, Trip, TripStatus } from '@/types'
import { diffDays } from './date'

/**
 * Derived trip info. Status is never stored — it depends on "today",
 * so it is computed on render. `today` is a parameter (not `new Date()` inside)
 * to keep these functions pure and easy to test.
 */

type TripDates = Pick<Trip, 'startDate' | 'endDate'>

/**
 * `upcoming` — starts after today, `ongoing` — today is within the dates
 * (both ends inclusive), `past` — ended before today.
 * ISO dates compare correctly as strings.
 */
export function getTripStatus({ startDate, endDate }: TripDates, today: ISODate): TripStatus {
  if (today < startDate) return 'upcoming'
  if (today > endDate) return 'past'
  return 'ongoing'
}

/** Number of days in the trip, both ends inclusive: 10–12 Oct → 3. */
export function tripDuration({ startDate, endDate }: TripDates): number {
  return diffDays(startDate, endDate) + 1
}

/** Days left until the trip starts ("in N days"). 0 = starts today, negative = already started. */
export function daysUntilStart({ startDate }: Pick<Trip, 'startDate'>, today: ISODate): number {
  return diffDays(today, startDate)
}
