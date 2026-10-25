import { createEntityAdapter, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ID, Trip } from '@/types'
import { insertAt, removeId } from '@/utils/arrays'
import { checklistGroupAdded, checklistGroupDeleted } from '../actions/checklistActions'
import { itemAdded, itemDeleted, itemMoved } from '../actions/itemActions'
import { isTripInserted, tripDaysSynced, tripDeleted } from '../actions/tripActions'

/**
 * Trips, normalized: `{ ids: ID[], entities: Record<ID, Trip> }`.
 * The adapter keeps `ids` sorted by start date, so "all trips" comes out
 * in chronological order without sorting in every component.
 *
 * The trip also owns order arrays: `dayIds`, `ideaIds` (the "Ideas" column) and `groupIds`,
 * so item and checklist-group actions that change those orders are handled here too.
 */
export const tripsAdapter = createEntityAdapter({
  // Types are inferred from the comparer; `selectId` defaults to `trip.id`
  sortComparer: (a: Trip, b: Trip) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title),
})

/** Fields the user edits in the trip form. Ids, ordering arrays and timestamps are managed by the app. */
export type TripEditableFields = Pick<Trip, 'title' | 'destination' | 'startDate' | 'endDate' | 'currency' | 'notes'>

export interface TripUpdate {
  id: ID
  changes: Partial<TripEditableFields>
}

export const tripsSlice = createSlice({
  name: 'trips',
  initialState: tripsAdapter.getInitialState(),
  reducers: {
    tripUpdated: {
      reducer(state, action: PayloadAction<TripUpdate & { updatedAt: number }>) {
        const { id, changes, updatedAt } = action.payload
        tripsAdapter.updateOne(state, { id, changes: { ...changes, updatedAt } })
      },
      // Date.now() is a side effect, so it lives in `prepare`, not in the reducer
      prepare(update: TripUpdate) {
        return { payload: { ...update, updatedAt: Date.now() } }
      },
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(tripDeleted, (state, { payload: id }) => {
        tripsAdapter.removeOne(state, id)
      })
      .addCase(tripDaysSynced, (state, { payload }) => {
        const trip = state.entities[payload.tripId]
        if (!trip) return
        trip.dayIds = payload.dayIds
        trip.ideaIds.push(...payload.itemsToIdeas)
      })
      // "Ideas" order lives on the trip
      .addCase(itemAdded, (state, { payload: { item, index } }) => {
        const trip = state.entities[item.tripId]
        if (trip && item.dayId === null) insertAt(trip.ideaIds, item.id, index)
      })
      .addCase(itemMoved, (state, { payload }) => {
        const trip = state.entities[payload.tripId]
        if (!trip) return
        if (payload.from === null) removeId(trip.ideaIds, payload.id)
        if (payload.to === null) insertAt(trip.ideaIds, payload.id, payload.index)
      })
      .addCase(itemDeleted, (state, { payload }) => {
        const trip = state.entities[payload.tripId]
        if (trip && payload.place === null) removeId(trip.ideaIds, payload.id)
      })
      .addCase(checklistGroupAdded, (state, { payload: { group, index } }) => {
        const trip = state.entities[group.tripId]
        if (trip) insertAt(trip.groupIds, group.id, index)
      })
      .addCase(checklistGroupDeleted, (state, { payload: { group } }) => {
        const trip = state.entities[group.tripId]
        if (trip) removeId(trip.groupIds, group.id)
      })
      .addMatcher(isTripInserted, (state, { payload }) => {
        tripsAdapter.addOne(state, payload.trip)
      })
  },
  // Adapter selectors receive the slice state; `createSlice` wraps them to take RootState.
  selectors: {
    selectAllTrips: tripsAdapter.getSelectors().selectAll,
    selectTripById: tripsAdapter.getSelectors().selectById,
    selectTripIds: tripsAdapter.getSelectors().selectIds,
    selectTripsTotal: tripsAdapter.getSelectors().selectTotal,
  },
})

export const { tripUpdated } = tripsSlice.actions
export const { selectAllTrips, selectTripById, selectTripIds, selectTripsTotal } = tripsSlice.selectors
