import { createSelector } from '@reduxjs/toolkit'
import type { ChecklistGroup, ChecklistItem, Day, ISODate, ItineraryItem, Trip } from '@/types'
import { readiness, type Readiness } from '@/utils/readiness'
import { sortTasks } from '@/utils/tasks'
import { daysUntilStart, getTripStatus, tripDuration } from '@/utils/tripStatus'
import type { RootState } from '../index'
import { selectAllTrips } from '../slices/tripsSlice'
import { findTasksGroup, selectChecklistByTrip } from './planSelectors'

export type TodayView =
  | {
      kind: 'ongoing'
      trip: Trip
      /** 1-based day number and the number of days */
      dayNumber: number
      totalDays: number
      day?: Day
      /** Stops of today in plan order */
      items: ItineraryItem[]
      tasksGroup?: ChecklistGroup
      /** Tasks due today + overdue open tasks ("Don't forget today") */
      todayTasks: ChecklistItem[]
    }
  | {
      kind: 'upcoming'
      trip: Trip
      daysUntil: number
      readiness: Readiness
      tasksGroup?: ChecklistGroup
      openTasks: ChecklistItem[]
    }
  | { kind: 'none' }

/**
 * What the "Today" screen shows:
 * 1. a trip going on today (the earliest one if several overlap) — today's plan;
 * 2. otherwise the nearest upcoming trip — countdown, readiness, open tasks;
 * 3. otherwise nothing ("No trips right now").
 */
export const selectTodayView = createSelector(
  [
    selectAllTrips,
    (state: RootState) => state.days.entities,
    (state: RootState) => state.items.entities,
    (state: RootState) => state.checklistGroups.entities,
    (state: RootState) => state.checklistItems.entities,
    selectChecklistByTrip,
    (_state: RootState, today: ISODate) => today,
  ],
  (trips, days, items, groups, checklist, checklistByTrip, today): TodayView => {
    // selectAllTrips is sorted by start date
    const ongoing = trips.find((trip) => getTripStatus(trip, today) === 'ongoing')
    if (ongoing) {
      const tripDays = ongoing.dayIds.map((id) => days[id]).filter((day) => day !== undefined)
      const index = tripDays.findIndex((day) => day.date === today)
      const day = tripDays[index]
      const tasksGroup = findTasksGroup(groups, ongoing)
      const tasks = tasksGroup ? tasksGroup.itemIds.map((id) => checklist[id]).filter((task) => task !== undefined) : []
      return {
        kind: 'ongoing',
        trip: ongoing,
        dayNumber: index + 1,
        totalDays: tripDuration(ongoing),
        day,
        items: day ? day.itemIds.map((id) => items[id]).filter((item) => item !== undefined) : [],
        tasksGroup,
        todayTasks: sortTasks(
          tasks.filter((task) => task.dueDate === today || (task.dueDate !== undefined && task.dueDate < today && !task.done)),
        ),
      }
    }

    const next = trips.find((trip) => getTripStatus(trip, today) === 'upcoming')
    if (next) {
      const tasksGroup = findTasksGroup(groups, next)
      const tasks = tasksGroup ? tasksGroup.itemIds.map((id) => checklist[id]).filter((task) => task !== undefined) : []
      return {
        kind: 'upcoming',
        trip: next,
        daysUntil: daysUntilStart(next, today),
        readiness: readiness(checklistByTrip.get(next.id) ?? []),
        tasksGroup,
        openTasks: sortTasks(tasks.filter((task) => !task.done)),
      }
    }

    return { kind: 'none' }
  },
)
