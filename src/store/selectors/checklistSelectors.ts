import { createSelector } from '@reduxjs/toolkit'
import type { ChecklistGroup, ChecklistItem, ID, Trip } from '@/types'
import type { RootState } from '../index'

export interface ChecklistGroupView {
  group: ChecklistGroup
  items: ChecklistItem[]
}

export interface ChecklistView {
  /** "Tasks" first, then packing groups in the trip's order */
  groups: ChecklistGroupView[]
  packed: number
  packTotal: number
  tasksDone: number
  tasksTotal: number
}

const selectTrip = (state: RootState, tripId: ID) => state.trips.entities[tripId] as Trip | undefined

/** The checklist tab: groups with their items in order + counters for the summary line. */
export const selectChecklistView = createSelector(
  [selectTrip, (state: RootState) => state.checklistGroups.entities, (state: RootState) => state.checklistItems.entities],
  (trip, groupEntities, itemEntities): ChecklistView | undefined => {
    if (!trip) return undefined
    const groups = trip.groupIds
      .map((id) => groupEntities[id])
      .filter((group) => group !== undefined)
      .map((group) => ({
        group,
        items: group.itemIds.map((id) => itemEntities[id]).filter((item) => item !== undefined),
      }))
      // stable sort: the tasks group goes first, packing groups keep their order
      .sort((a, b) => Number(b.group.kind === 'tasks') - Number(a.group.kind === 'tasks'))

    const count = (kind: ChecklistGroup['kind'], done: boolean) =>
      groups
        .filter(({ group }) => group.kind === kind)
        .flatMap(({ items }) => items)
        .filter((item) => !done || item.done).length

    return {
      groups,
      packed: count('packing', true),
      packTotal: count('packing', false),
      tasksDone: count('tasks', true),
      tasksTotal: count('tasks', false),
    }
  },
)
