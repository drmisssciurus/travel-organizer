import { createEntityAdapter, createSlice } from '@reduxjs/toolkit'
import type { ItineraryItem } from '@/types'
import { checklistItemAdded, checklistItemDeleted } from '../actions/checklistActions'
import {
  bookingTaskLinked,
  bookingTaskUnlinked,
  itemAdded,
  itemDeleted,
  itemMoved,
  itemUpdated,
} from '../actions/itemActions'
import { isTripInserted, tripDaysSynced, tripDeleted } from '../actions/tripActions'

/**
 * Itinerary items of all trips (stops in days and ideas).
 * No sorting here: the order is defined by `day.itemIds` / `trip.ideaIds`.
 */
export const itemsAdapter = createEntityAdapter<ItineraryItem>()

export const itemsSlice = createSlice({
  name: 'items',
  initialState: itemsAdapter.getInitialState(),
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(tripDeleted, (state, { payload: tripId }) => {
        const ids = Object.values(state.entities)
          .filter((item) => item.tripId === tripId)
          .map((item) => item.id)
        itemsAdapter.removeMany(state, ids)
      })
      .addCase(tripDaysSynced, (state, { payload }) => {
        for (const id of payload.itemsToIdeas) {
          const item = state.entities[id]
          if (item) item.dayId = null
        }
      })
      .addCase(itemAdded, (state, { payload }) => {
        itemsAdapter.addOne(state, payload.item)
      })
      .addCase(itemUpdated, (state, { payload }) => {
        itemsAdapter.updateOne(state, payload)
      })
      .addCase(itemMoved, (state, { payload }) => {
        const item = state.entities[payload.id]
        if (item) item.dayId = payload.to
      })
      .addCase(itemDeleted, (state, { payload }) => {
        itemsAdapter.removeOne(state, payload.id)
      })
      .addCase(bookingTaskLinked, (state, { payload }) => {
        const item = state.entities[payload.itemId]
        if (!item) return
        item.needsBooking = true
        item.bookingTaskId = payload.task.id
      })
      .addCase(bookingTaskUnlinked, (state, { payload }) => {
        const item = state.entities[payload.itemId]
        if (!item) return
        item.needsBooking = false
        delete item.bookingTaskId
      })
      // The booking task was deleted from the checklist → the item no longer has a task
      .addCase(checklistItemDeleted, (state, { payload }) => {
        const item = payload.sourceItemId ? state.entities[payload.sourceItemId] : undefined
        if (item?.bookingTaskId !== payload.id) return
        item.needsBooking = false
        delete item.bookingTaskId
      })
      // "Undo" after deleting a booking task: the item gets its flag and link back
      .addCase(checklistItemAdded, (state, { payload: { item: task } }) => {
        const item = task.sourceItemId ? state.entities[task.sourceItemId] : undefined
        if (!item || item.bookingTaskId) return
        item.needsBooking = true
        item.bookingTaskId = task.id
      })
      .addMatcher(isTripInserted, (state, { payload }) => {
        itemsAdapter.addMany(state, payload.items)
      })
  },
})
