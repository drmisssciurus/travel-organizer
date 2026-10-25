import { createAction } from '@reduxjs/toolkit'
import type { ChecklistGroup, ChecklistItem, ID } from '@/types'

/**
 * Checklist actions that touch several slices:
 * items ↔ their group's `itemIds` order, groups ↔ the trip's `groupIds` order.
 */
export const checklistItemAdded = createAction<{ item: ChecklistItem; index?: number }>('checklist/itemAdded')

/** Deleting a booking task also clears the link on its itinerary item (`sourceItemId`). */
export const checklistItemDeleted = createAction<{ id: ID; groupId: ID; sourceItemId?: ID }>('checklist/itemDeleted')

/** A new packing group, appended to the trip's group order (or put back at `index` by "Undo"). */
export const checklistGroupAdded = createAction<{ group: ChecklistGroup; items?: ChecklistItem[]; index?: number }>(
  'checklist/groupAdded',
)

/**
 * Deletes a packing group with all its items. Carries the items, so "Undo"
 * can put everything back with `checklistGroupAdded` (same ids, same place).
 * The "tasks" group can't be deleted — the thunk refuses it.
 */
export const checklistGroupDeleted = createAction<{ group: ChecklistGroup; items: ChecklistItem[] }>(
  'checklist/groupDeleted',
)
