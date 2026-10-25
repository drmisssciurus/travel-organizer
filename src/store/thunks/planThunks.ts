import { nanoid } from '@reduxjs/toolkit'
import i18n from '@/i18n'
import type { ChecklistItem, ID, ISODate, ItineraryItem } from '@/types'
import {
  bookingTaskLinked,
  bookingTaskUnlinked,
  itemAdded,
  itemDeleted,
  itemMoved,
  itemUpdated,
  type ItemFieldChanges,
  type ItemPlace,
} from '../actions/itemActions'
import type { AppThunk, RootState } from '../index'
import { findTasksGroup } from '../selectors/planSelectors'
import { checklistItemUpdated } from '../slices/checklistItemsSlice'
import { toastShown } from '../slices/toastSlice'

/** Position of an item in its column (for "Undo" and moves). */
function placeIndex(state: RootState, item: ItineraryItem): number {
  const list = item.dayId === null ? state.trips.entities[item.tripId]?.ideaIds : state.days.entities[item.dayId]?.itemIds
  return list?.indexOf(item.id) ?? -1
}

/** Values of the item form (stage 4.5). */
export interface ItemDraft extends ItemFieldChanges {
  title: string
  category: ItineraryItem['category']
  place: ItemPlace
  needsBooking: boolean
  /** Due date of the booking task ("Book by") */
  bookBy?: ISODate
}

function fieldsOf(draft: ItemDraft): ItemFieldChanges & Pick<ItineraryItem, 'title' | 'category'> {
  const { title, category, time, durationMin, location, coords, note } = draft
  return { title, category, time, durationMin, location, coords, note }
}

/** Creates the "Book: …" task in the trip's "tasks" group. */
function buildBookingTask(state: RootState, item: ItineraryItem, bookBy?: ISODate): ChecklistItem | undefined {
  const trip = state.trips.entities[item.tripId]
  const group = trip && findTasksGroup(state.checklistGroups.entities, trip)
  if (!group) return undefined
  return {
    id: nanoid(),
    tripId: item.tripId,
    groupId: group.id,
    text: i18n.t('plan.bookingTask', { title: item.title }),
    done: false,
    dueDate: bookBy,
    sourceItemId: item.id,
  }
}

export const addItem =
  (tripId: ID, draft: ItemDraft): AppThunk<ItineraryItem> =>
  (dispatch, getState) => {
    const item: ItineraryItem = { id: nanoid(), tripId, dayId: draft.place, ...fieldsOf(draft), needsBooking: false, done: false }
    dispatch(itemAdded({ item }))
    if (draft.needsBooking) {
      const task = buildBookingTask(getState(), item, draft.bookBy)
      if (task) dispatch(bookingTaskLinked({ itemId: item.id, task }))
    }
    return item
  }

/** Saves the item form: fields, place (moved to the end of the new column) and the booking flag. */
export const saveItem =
  (id: ID, draft: ItemDraft): AppThunk =>
  (dispatch, getState) => {
    const item = getState().items.entities[id]
    if (!item) return
    dispatch(itemUpdated({ id, changes: fieldsOf(draft) }))
    if (draft.place !== item.dayId) dispatch(moveItem(id, draft.place, Number.MAX_SAFE_INTEGER))
    dispatch(setNeedsBooking(id, draft.needsBooking, draft.bookBy))
  }

/** Moves an item to `to` (a day or Ideas) at `index`; used by drag-and-drop and the form. */
export const moveItem =
  (id: ID, to: ItemPlace, index: number): AppThunk =>
  (dispatch, getState) => {
    const item = getState().items.entities[id]
    if (!item) return
    if (item.dayId === to && placeIndex(getState(), item) === index) return
    dispatch(itemMoved({ id, tripId: item.tripId, from: item.dayId, to, index }))
  }

/**
 * "Needs booking" on → a linked task; off → an open task is deleted, a done one stays (unlinked).
 * Already on: only the task's due date is updated from the form.
 */
export const setNeedsBooking =
  (itemId: ID, needsBooking: boolean, bookBy?: ISODate): AppThunk =>
  (dispatch, getState) => {
    const state = getState()
    const item = state.items.entities[itemId]
    if (!item) return
    const task = item.bookingTaskId ? state.checklistItems.entities[item.bookingTaskId] : undefined

    if (needsBooking && !task) {
      const created = buildBookingTask(state, item, bookBy)
      if (created) dispatch(bookingTaskLinked({ itemId, task: created }))
    } else if (needsBooking && task && task.dueDate !== bookBy) {
      dispatch(checklistItemUpdated({ id: task.id, changes: { dueDate: bookBy } }))
    } else if (!needsBooking && item.needsBooking) {
      dispatch(bookingTaskUnlinked({ itemId, task, deleteTask: task !== undefined && !task.done }))
    }
  }

/** Deletes an item with an "Undo" toast (the item comes back to the same place). */
export const deleteItem =
  (id: ID): AppThunk =>
  (dispatch, getState) => {
    const state = getState()
    const item = state.items.entities[id]
    if (!item) return
    const index = placeIndex(state, item)
    dispatch(itemDeleted({ id, tripId: item.tripId, place: item.dayId, bookingTaskId: item.bookingTaskId }))
    dispatch(
      toastShown({
        message: i18n.t('plan.itemDeleted', { title: item.title }),
        undo: itemAdded({ item, index }),
      }),
    )
  }
