import { nanoid } from '@reduxjs/toolkit'
import i18n from '@/i18n'
import type { ChecklistGroup, ID, ISODate } from '@/types'
import {
  checklistGroupAdded,
  checklistGroupDeleted,
  checklistItemAdded,
  checklistItemDeleted,
} from '../actions/checklistActions'
import type { AppThunk } from '../index'
import { toastShown } from '../slices/toastSlice'

/** Default packing groups of a new trip, in the UI language (they can be renamed or deleted). */
export function buildDefaultPackingGroups(tripId: ID): ChecklistGroup[] {
  const titles = [
    i18n.t('checklist.defaultGroups.documents'),
    i18n.t('checklist.defaultGroups.clothes'),
    i18n.t('checklist.defaultGroups.tech'),
    i18n.t('checklist.defaultGroups.hygiene'),
  ]
  return titles.map((title) => ({ id: nanoid(), tripId, kind: 'packing', title, itemIds: [] }))
}

/** Adds a task (with an optional due date) or a packing item to the end of its group. */
export const addChecklistItem =
  (groupId: ID, text: string, dueDate?: ISODate): AppThunk =>
  (dispatch, getState) => {
    const group = getState().checklistGroups.entities[groupId]
    if (!group) return
    // Due dates exist only for tasks
    const due = group.kind === 'tasks' ? dueDate : undefined
    dispatch(checklistItemAdded({ item: { id: nanoid(), tripId: group.tripId, groupId, text, done: false, dueDate: due } }))
  }

/** Deletes a task or item with "Undo" (back to the same place; a booking task re-links to its stop). */
export const deleteChecklistItem =
  (id: ID): AppThunk =>
  (dispatch, getState) => {
    const state = getState()
    const item = state.checklistItems.entities[id]
    if (!item) return
    const index = state.checklistGroups.entities[item.groupId]?.itemIds.indexOf(id) ?? -1
    dispatch(checklistItemDeleted({ id, groupId: item.groupId, sourceItemId: item.sourceItemId }))
    dispatch(
      toastShown({
        message: i18n.t('checklist.itemDeleted', { text: item.text }),
        undo: checklistItemAdded({ item, index: index === -1 ? undefined : index }),
      }),
    )
  }

export const addChecklistGroup =
  (tripId: ID, title: string): AppThunk =>
  (dispatch) => {
    dispatch(checklistGroupAdded({ group: { id: nanoid(), tripId, kind: 'packing', title, itemIds: [] } }))
  }

/** Deletes a packing group with its items; "Undo" restores the group at the same position. */
export const deleteChecklistGroup =
  (id: ID): AppThunk =>
  (dispatch, getState) => {
    const state = getState()
    const group = state.checklistGroups.entities[id]
    if (!group || group.kind === 'tasks') return
    const items = group.itemIds.map((itemId) => state.checklistItems.entities[itemId]).filter((item) => item !== undefined)
    const index = state.trips.entities[group.tripId]?.groupIds.indexOf(id) ?? -1
    dispatch(checklistGroupDeleted({ group, items }))
    dispatch(
      toastShown({
        message: i18n.t('checklist.groupDeleted', { title: group.title }),
        undo: checklistGroupAdded({ group, items, index: index === -1 ? undefined : index }),
      }),
    )
  }
