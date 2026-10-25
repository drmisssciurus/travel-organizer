import { createEntityAdapter, createSlice } from '@reduxjs/toolkit'
import type { Day } from '@/types'
import { insertAt, removeId } from '@/utils/arrays'
import { itemAdded, itemDeleted, itemMoved } from '../actions/itemActions'
import { isTripInserted, tripDaysSynced, tripDeleted } from '../actions/tripActions'

/**
 * Days of all trips — the columns of the plan board.
 * Days are never created by hand: they follow the trip dates (`createTrip`, `syncTripDays`).
 * A day owns the order of its items (`itemIds`).
 */
export const daysAdapter = createEntityAdapter({
  sortComparer: (a: Day, b: Day) => a.date.localeCompare(b.date),
})

export const daysSlice = createSlice({
  name: 'days',
  initialState: daysAdapter.getInitialState(),
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(tripDeleted, (state, { payload: tripId }) => {
        const ids = Object.values(state.entities)
          .filter((day) => day.tripId === tripId)
          .map((day) => day.id)
        daysAdapter.removeMany(state, ids)
      })
      .addCase(tripDaysSynced, (state, { payload }) => {
        daysAdapter.removeMany(state, payload.removedDayIds)
        daysAdapter.addMany(state, payload.addedDays)
      })
      .addCase(itemAdded, (state, { payload: { item, index } }) => {
        const day = item.dayId ? state.entities[item.dayId] : undefined
        if (day) insertAt(day.itemIds, item.id, index)
      })
      .addCase(itemMoved, (state, { payload }) => {
        const from = payload.from ? state.entities[payload.from] : undefined
        const to = payload.to ? state.entities[payload.to] : undefined
        if (from) removeId(from.itemIds, payload.id)
        if (to) insertAt(to.itemIds, payload.id, payload.index)
      })
      .addCase(itemDeleted, (state, { payload }) => {
        const day = payload.place ? state.entities[payload.place] : undefined
        if (day) removeId(day.itemIds, payload.id)
      })
      .addMatcher(isTripInserted, (state, { payload }) => {
        daysAdapter.addMany(state, payload.days)
      })
  },
})
