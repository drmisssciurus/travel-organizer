import { createSelector } from '@reduxjs/toolkit'
import type { ChecklistGroup, ChecklistItem, Day, ID, ItineraryItem, Trip } from '@/types'
import type { TripSnapshot } from '../actions/tripActions'
import type { RootState } from '../index'

/**
 * Plan selectors. Entities are looked up through the order arrays
 * (`trip.dayIds`, `day.itemIds`, `trip.ideaIds`, `group.itemIds`), so columns
 * come out in the user's order; ids pointing to missing entities are skipped.
 */

const selectTrip = (state: RootState, tripId: ID) => state.trips.entities[tripId] as Trip | undefined
const selectDayEntities = (state: RootState) => state.days.entities
const selectItemEntities = (state: RootState) => state.items.entities
const selectGroupEntities = (state: RootState) => state.checklistGroups.entities
const selectChecklistEntities = (state: RootState) => state.checklistItems.entities

function pick<T>(entities: Record<ID, T>, ids: readonly ID[]): T[] {
  return ids.map((id) => entities[id]).filter((entity): entity is T => entity !== undefined)
}

/** The trip's single "tasks" group ("Before the trip"). */
export function findTasksGroup(groups: Record<ID, ChecklistGroup>, trip: Trip): ChecklistGroup | undefined {
  return pick(groups, trip.groupIds).find((group) => group.kind === 'tasks')
}

export interface BoardDay {
  day: Day
  /** 1-based number of the day in the trip */
  number: number
  items: ItineraryItem[]
}

export interface Board {
  trip: Trip
  tasksGroup?: ChecklistGroup
  tasks: ChecklistItem[]
  days: BoardDay[]
  ideas: ItineraryItem[]
}

/** Everything the plan board shows, in order. Memoized per (state slices, tripId). */
export const selectBoard = createSelector(
  [selectTrip, selectDayEntities, selectItemEntities, selectGroupEntities, selectChecklistEntities],
  (trip, days, items, groups, checklist): Board | undefined => {
    if (!trip) return undefined
    const tasksGroup = findTasksGroup(groups, trip)
    return {
      trip,
      tasksGroup,
      tasks: tasksGroup ? pick(checklist, tasksGroup.itemIds) : [],
      days: pick(days, trip.dayIds).map((day, index) => ({ day, number: index + 1, items: pick(items, day.itemIds) })),
      ideas: pick(items, trip.ideaIds),
    }
  },
)

/** Checklist items of every trip, grouped by trip id (readiness in the trips list). */
export const selectChecklistByTrip = createSelector([selectChecklistEntities], (checklist) => {
  const byTrip = new Map<ID, ChecklistItem[]>()
  for (const item of Object.values(checklist)) {
    const list = byTrip.get(item.tripId)
    if (list) list.push(item)
    else byTrip.set(item.tripId, [item])
  }
  return byTrip
})

/** Checklist items of one trip (readiness in the trip header). */
export const selectTripChecklist = createSelector(
  [selectChecklistByTrip, (_state: RootState, tripId: ID) => tripId],
  (byTrip, tripId): readonly ChecklistItem[] => byTrip.get(tripId) ?? EMPTY,
)
const EMPTY: readonly ChecklistItem[] = []

/** Everything that belongs to the trip — taken before deletion, put back by "Undo". */
export function selectTripSnapshot(state: RootState, tripId: ID): TripSnapshot | undefined {
  const trip = selectTrip(state, tripId)
  if (!trip) return undefined
  const ofTrip = <T extends { tripId: ID }>(entities: Record<ID, T>) =>
    Object.values(entities).filter((entity) => entity.tripId === tripId)
  return {
    trip,
    days: ofTrip(state.days.entities),
    items: ofTrip(state.items.entities),
    checklistGroups: ofTrip(state.checklistGroups.entities),
    checklistItems: ofTrip(state.checklistItems.entities),
    expenses: ofTrip(state.expenses.entities),
  }
}
