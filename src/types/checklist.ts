import type { ID, ISODate } from './common'

/**
 * - `tasks`   — the single built-in group per trip (items may have a due date).
 *               Shown as the "Before the trip" column on the plan board.
 * - `packing` — user-defined groups: Documents, Clothes, Tech…
 */
export const CHECKLIST_GROUP_KINDS = ['tasks', 'packing'] as const
export type ChecklistGroupKind = (typeof CHECKLIST_GROUP_KINDS)[number]

export interface ChecklistGroup {
  id: ID
  tripId: ID
  kind: ChecklistGroupKind
  /** Empty for the `tasks` group — its title comes from i18n. */
  title: string
  /** Item order inside the group. */
  itemIds: ID[]
}

export interface ChecklistItem {
  id: ID
  tripId: ID
  groupId: ID
  text: string
  done: boolean
  /** Only for items in the `tasks` group. */
  dueDate?: ISODate
  /** Set when the task was created by an itinerary item's "needs booking" flag. */
  sourceItemId?: ID
}
