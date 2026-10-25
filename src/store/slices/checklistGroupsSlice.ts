import { createEntityAdapter, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ChecklistGroup, ID } from '@/types'
import { insertAt, removeId } from '@/utils/arrays'
import {
  checklistGroupAdded,
  checklistGroupDeleted,
  checklistItemAdded,
  checklistItemDeleted,
} from '../actions/checklistActions'
import { bookingTaskLinked, bookingTaskUnlinked } from '../actions/itemActions'
import { isTripInserted, tripDeleted } from '../actions/tripActions'

/**
 * Checklist groups. Every trip has exactly one `tasks` group ("Before the trip"
 * on the plan board) and any number of packing groups (Documents, Clothes…).
 * A group owns the order of its items (`itemIds`).
 */
export const checklistGroupsAdapter = createEntityAdapter<ChecklistGroup>()

export const checklistGroupsSlice = createSlice({
  name: 'checklistGroups',
  initialState: checklistGroupsAdapter.getInitialState(),
  reducers: {
    checklistGroupRenamed(state, action: PayloadAction<{ id: ID; title: string }>) {
      const group = state.entities[action.payload.id]
      if (group?.kind === 'packing') group.title = action.payload.title
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(tripDeleted, (state, { payload: tripId }) => {
        const ids = Object.values(state.entities)
          .filter((group) => group.tripId === tripId)
          .map((group) => group.id)
        checklistGroupsAdapter.removeMany(state, ids)
      })
      .addCase(checklistGroupAdded, (state, { payload }) => {
        checklistGroupsAdapter.addOne(state, payload.group)
      })
      .addCase(checklistGroupDeleted, (state, { payload }) => {
        checklistGroupsAdapter.removeOne(state, payload.group.id)
      })
      .addCase(checklistItemAdded, (state, { payload: { item, index } }) => {
        const group = state.entities[item.groupId]
        if (group) insertAt(group.itemIds, item.id, index)
      })
      .addCase(checklistItemDeleted, (state, { payload }) => {
        const group = state.entities[payload.groupId]
        if (group) removeId(group.itemIds, payload.id)
      })
      .addCase(bookingTaskLinked, (state, { payload: { task } }) => {
        const group = state.entities[task.groupId]
        if (group) group.itemIds.push(task.id)
      })
      .addCase(bookingTaskUnlinked, (state, { payload: { task, deleteTask } }) => {
        const group = task && state.entities[task.groupId]
        if (group && deleteTask) removeId(group.itemIds, task.id)
      })
      .addMatcher(isTripInserted, (state, { payload }) => {
        checklistGroupsAdapter.addMany(state, payload.checklistGroups)
      })
  },
})

export const { checklistGroupRenamed } = checklistGroupsSlice.actions
