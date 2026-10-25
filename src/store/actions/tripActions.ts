import { createAction, isAnyOf } from '@reduxjs/toolkit'
import type { ChecklistGroup, ChecklistItem, Day, Expense, ID, ItineraryItem, Trip } from '@/types'

/**
 * Cross-slice actions of the trip lifecycle.
 *
 * One trip is spread over several normalized slices (trips, days, items, checklist…).
 * Creating, deleting or restoring it must change all of them consistently, so these
 * actions live outside any slice: every slice handles its own part in `extraReducers`.
 * (They also break import cycles: slices import actions, not each other.)
 */

/** Everything that belongs to one trip. */
export interface TripSnapshot {
  trip: Trip
  days: Day[]
  items: ItineraryItem[]
  checklistGroups: ChecklistGroup[]
  checklistItems: ChecklistItem[]
  expenses: Expense[]
}

/** A new trip, already built by the `createTrip` thunk (ids, days, the "tasks" group). */
export const tripCreated = createAction<TripSnapshot>('trips/created')

/** "Undo" after deletion: the snapshot goes back exactly as it was (same ids). */
export const tripRestored = createAction<TripSnapshot>('trips/restored')

/** Matches both: for slices the two mean the same — "add this snapshot". */
export const isTripInserted = isAnyOf(tripCreated, tripRestored)

/** Cascade delete: each slice removes its entities of this trip. */
export const tripDeleted = createAction<ID>('trips/deleted')

/**
 * Trip dates changed → days follow (computed by `syncTripDays`):
 * days outside the new range are removed and their items go to "Ideas",
 * missing dates get new empty days; days that stay keep their ids and items.
 */
export interface TripDaysSync {
  tripId: ID
  /** New day order of the trip. */
  dayIds: ID[]
  addedDays: Day[]
  removedDayIds: ID[]
  /** Items of removed days, in their order — appended to "Ideas". */
  itemsToIdeas: ID[]
}
export const tripDaysSynced = createAction<TripDaysSync>('trips/daysSynced')
