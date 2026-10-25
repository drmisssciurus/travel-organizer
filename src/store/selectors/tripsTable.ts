import { createSelector } from '@reduxjs/toolkit'
import { TRIP_STATUSES, type ISODate, type Language, type Trip, type TripStatus } from '@/types'
import { readiness, type Readiness } from '@/utils/readiness'
import { daysUntilStart, getTripStatus, tripDuration } from '@/utils/tripStatus'
import { sumAmounts } from '@/utils/expenses'
import { selectExpensesByTrip } from './expenseSelectors'
import { selectChecklistByTrip } from './planSelectors'
import { selectAllTrips } from '../slices/tripsSlice'

/**
 * View model of the trips list (table on desktop, cards on mobile):
 * everything a row shows, computed once per trip.
 */
export interface TripRow {
  trip: Trip
  status: TripStatus
  duration: number
  /** Days until start; meaningful for `upcoming` trips. */
  daysUntilStart: number
  /** The nearest upcoming trip shows "In N days" instead of "Upcoming". */
  isNext: boolean
  readiness: Readiness
  spent: number
  expenseCount: number
}

/**
 * Rows for all trips relative to `today` (a parameter, so the selector stays pure).
 * Memoized: recomputed only when trips or `today` change.
 *
 * Readiness comes from the trip's checklist (tasks + packing), spent — from its expenses.
 */
export const selectTripRows = createSelector(
  [selectAllTrips, selectChecklistByTrip, selectExpensesByTrip, (_state: unknown, today: ISODate) => today],
  (trips, checklistByTrip, expensesByTrip, today): TripRow[] => {
    // selectAllTrips is sorted by startDate → the first upcoming one is the nearest
    const nextId = trips.find((trip) => getTripStatus(trip, today) === 'upcoming')?.id
    return trips.map((trip) => ({
      trip,
      status: getTripStatus(trip, today),
      duration: tripDuration(trip),
      daysUntilStart: daysUntilStart(trip, today),
      isNext: trip.id === nextId,
      readiness: readiness(checklistByTrip.get(trip.id) ?? []),
      spent: sumAmounts(expensesByTrip.get(trip.id) ?? []),
      expenseCount: expensesByTrip.get(trip.id)?.length ?? 0,
    }))
  },
)

/** Counts for the page summary: "6 trips · 1 now · 4 upcoming". */
export const selectTripsSummary = createSelector([selectTripRows], (rows) => {
  const count = (status: TripStatus) => rows.filter((row) => row.status === status).length
  return { total: rows.length, ongoing: count('ongoing'), upcoming: count('upcoming'), past: count('past') }
})

/* ---------- Filtering ---------- */

export const TRIP_STATUS_FILTERS = ['all', ...TRIP_STATUSES] as const
export type TripStatusFilter = (typeof TRIP_STATUS_FILTERS)[number]

/** Case-insensitive, and "е" finds "ё" (users rarely type "ё"). */
const normalize = (text: string) => text.toLocaleLowerCase().replaceAll('ё', 'е')

/** Search in title and destination + status filter. Returns the same array when nothing is filtered. */
export function filterTripRows(rows: readonly TripRow[], query: string, status: TripStatusFilter): readonly TripRow[] {
  const q = normalize(query.trim())
  if (!q && status === 'all') return rows
  return rows.filter(
    (row) =>
      (status === 'all' || row.status === status) &&
      (!q || normalize(`${row.trip.title} ${row.trip.destination}`).includes(q)),
  )
}

/* ---------- Sorting ---------- */

export const TRIP_SORT_KEYS = ['title', 'dates', 'readiness', 'spent'] as const
export type TripSortKey = (typeof TRIP_SORT_KEYS)[number]
export type SortDir = 'asc' | 'desc'

/**
 * Direction applied on the first click on a column:
 * names and dates read naturally A→Z / soonest first, numbers — biggest first.
 */
export const DEFAULT_SORT_DIR: Record<TripSortKey, SortDir> = {
  title: 'asc',
  dates: 'asc',
  readiness: 'desc',
  spent: 'desc',
}

export interface TripSort {
  key: TripSortKey
  dir: SortDir
}

/**
 * Sort after a click on a column header:
 * the same column → flip the direction; another column → its default direction.
 */
export function nextTripSort(current: TripSort, key: TripSortKey): TripSort {
  if (current.key === key) return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
  return { key, dir: DEFAULT_SORT_DIR[key] }
}

type Compare = (a: TripRow, b: TripRow) => number

/** Comparators for the ascending order. */
function comparators(language: Language): Record<TripSortKey, Compare> {
  // Collator: locale-aware, case-insensitive ("é" next to "e", "Ё" next to "Е")
  const collator = new Intl.Collator(language, { sensitivity: 'base' })
  return {
    title: (a, b) => collator.compare(a.trip.title, b.trip.title),
    dates: (a, b) => a.trip.startDate.localeCompare(b.trip.startDate),
    readiness: (a, b) => (a.readiness.percent ?? 0) - (b.readiness.percent ?? 0),
    spent: (a, b) => a.spent - b.spent,
  }
}

/**
 * Returns a new sorted array (the input is not mutated).
 * - Trips with an empty checklist ("—") always go last, in both directions.
 * - Ties are broken by start date, so the order is stable and predictable.
 */
export function sortTripRows(rows: readonly TripRow[], key: TripSortKey, dir: SortDir, language: Language): TripRow[] {
  const compare = comparators(language)[key]
  const sign = dir === 'asc' ? 1 : -1
  return rows.toSorted((a, b) => {
    if (key === 'readiness') {
      const aEmpty = a.readiness.percent === null
      const bEmpty = b.readiness.percent === null
      if (aEmpty !== bEmpty) return aEmpty ? 1 : -1
    }
    return sign * compare(a, b) || a.trip.startDate.localeCompare(b.trip.startDate)
  })
}
