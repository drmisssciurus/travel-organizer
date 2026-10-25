import { createAction } from '@reduxjs/toolkit'
import type { ChecklistItem, ID, ItineraryItem } from '@/types'

/**
 * Cross-slice actions for itinerary items. Item order is stored in arrays
 * (`day.itemIds`, `trip.ideaIds`), so adding, moving or deleting an item
 * touches the items slice and the array of its column.
 *
 * Payloads carry `tripId` and the source column: every reducer can do its part
 * without searching other slices.
 */

/** Where an item sits: a day, or `null` for "Ideas". */
export type ItemPlace = ID | null

/** Adds an item to `item.dayId` (or Ideas) at `index` (end if omitted). Also used by "Undo delete". */
export const itemAdded = createAction<{ item: ItineraryItem; index?: number }>('items/added')

/** Edits fields that don't change the place (place → `itemMoved`, booking → actions below). */
export type ItemFieldChanges = Partial<
  Pick<ItineraryItem, 'title' | 'category' | 'time' | 'durationMin' | 'location' | 'coords' | 'note' | 'done'>
>
export const itemUpdated = createAction<{ id: ID; changes: ItemFieldChanges }>('items/updated')

/** Drag-and-drop and "Where to put it" in the form: same or another column, at `index`. */
export const itemMoved = createAction<{ id: ID; tripId: ID; from: ItemPlace; to: ItemPlace; index: number }>(
  'items/moved',
)

/** Removes the item from its column. A linked booking task stays, the link is removed. */
export const itemDeleted = createAction<{ id: ID; tripId: ID; place: ItemPlace; bookingTaskId?: ID }>(
  'items/deleted',
)

/** "Needs booking" switched on: a task "Book: …" is created in "Before the trip" and linked. */
export const bookingTaskLinked = createAction<{ itemId: ID; task: ChecklistItem }>('items/bookingTaskLinked')

/**
 * "Needs booking" switched off. An open task is deleted (it is no longer needed);
 * a done task stays as a record, only the link is removed.
 * `task` is absent when the task was already deleted from the checklist.
 */
export const bookingTaskUnlinked = createAction<{ itemId: ID; task?: ChecklistItem; deleteTask: boolean }>(
  'items/bookingTaskUnlinked',
)
