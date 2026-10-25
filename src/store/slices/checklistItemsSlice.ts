import { createEntityAdapter, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ChecklistItem, ID } from '@/types'
import {
  checklistGroupAdded,
  checklistGroupDeleted,
  checklistItemAdded,
  checklistItemDeleted,
} from '../actions/checklistActions'
import { bookingTaskLinked, bookingTaskUnlinked, itemAdded, itemDeleted } from '../actions/itemActions'
import { isTripInserted, tripDeleted } from '../actions/tripActions'

/** Checklist items: tasks (with an optional due date) and packing items (stage 6). */
export const checklistItemsAdapter = createEntityAdapter<ChecklistItem>()

export type ChecklistItemChanges = Partial<Pick<ChecklistItem, 'text' | 'dueDate'>>

export const checklistItemsSlice = createSlice({
  name: 'checklistItems',
  initialState: checklistItemsAdapter.getInitialState(),
  reducers: {
    checklistItemToggled(state, action: PayloadAction<ID>) {
      const item = state.entities[action.payload]
      if (item) item.done = !item.done
    },
    checklistItemUpdated(state, action: PayloadAction<{ id: ID; changes: ChecklistItemChanges }>) {
      checklistItemsAdapter.updateOne(state, action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(tripDeleted, (state, { payload: tripId }) => {
        const ids = Object.values(state.entities)
          .filter((item) => item.tripId === tripId)
          .map((item) => item.id)
        checklistItemsAdapter.removeMany(state, ids)
      })
      .addCase(checklistGroupAdded, (state, { payload }) => {
        checklistItemsAdapter.addMany(state, payload.items ?? [])
      })
      .addCase(checklistGroupDeleted, (state, { payload }) => {
        checklistItemsAdapter.removeMany(state, payload.items.map((item) => item.id))
      })
      .addCase(checklistItemAdded, (state, { payload }) => {
        checklistItemsAdapter.addOne(state, payload.item)
      })
      .addCase(checklistItemDeleted, (state, { payload }) => {
        checklistItemsAdapter.removeOne(state, payload.id)
      })
      .addCase(bookingTaskLinked, (state, { payload }) => {
        checklistItemsAdapter.addOne(state, payload.task)
      })
      .addCase(bookingTaskUnlinked, (state, { payload: { task, deleteTask } }) => {
        if (!task) return
        if (deleteTask) checklistItemsAdapter.removeOne(state, task.id)
        else delete state.entities[task.id]?.sourceItemId
      })
      // The itinerary item is gone, its booking task stays as a normal task
      .addCase(itemDeleted, (state, { payload }) => {
        const task = payload.bookingTaskId ? state.entities[payload.bookingTaskId] : undefined
        if (task) delete task.sourceItemId
      })
      // "Undo delete" of an item: re-link its booking task if it still exists
      .addCase(itemAdded, (state, { payload: { item } }) => {
        const task = item.bookingTaskId ? state.entities[item.bookingTaskId] : undefined
        if (task && !task.sourceItemId) task.sourceItemId = item.id
      })
      .addMatcher(isTripInserted, (state, { payload }) => {
        checklistItemsAdapter.addMany(state, payload.checklistItems)
      })
  },
})

export const { checklistItemToggled, checklistItemUpdated } = checklistItemsSlice.actions
