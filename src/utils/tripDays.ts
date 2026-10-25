import type { Day, ID, ISODate, Trip } from '@/types'
import { addDays, diffDays } from './date'

/** All dates from `start` to `end`, both inclusive. */
export function dateRange(start: ISODate, end: ISODate): ISODate[] {
  const count = diffDays(start, end) + 1
  return Array.from({ length: Math.max(0, count) }, (_, i) => addDays(start, i))
}

/** New empty days for the given dates. `newId` is injected — pure and testable. */
export function buildDays(tripId: ID, dates: ISODate[], newId: () => ID): Day[] {
  return dates.map((date) => ({ id: newId(), tripId, date, itemIds: [] }))
}

export interface DaysSyncPlan {
  dayIds: ID[]
  addedDays: Day[]
  removedDayIds: ID[]
  itemsToIdeas: ID[]
}

/**
 * What changes when the trip dates change. Days are matched by **date**, not by position:
 * moving a trip 10–12 Oct → 11–13 Oct keeps the 11th and 12th with their items,
 * removes the 10th (its items go to "Ideas") and adds an empty 13th.
 */
export function planDaysSync(
  trip: Pick<Trip, 'id'>,
  currentDays: readonly Day[],
  start: ISODate,
  end: ISODate,
  newId: () => ID,
): DaysSyncPlan {
  const byDate = new Map(currentDays.map((day) => [day.date, day]))
  const dates = dateRange(start, end)
  const wanted = new Set(dates)

  const addedDays = buildDays(
    trip.id,
    dates.filter((date) => !byDate.has(date)),
    newId,
  )
  const addedByDate = new Map(addedDays.map((day) => [day.date, day]))
  const removed = [...currentDays].sort((a, b) => a.date.localeCompare(b.date)).filter((day) => !wanted.has(day.date))

  return {
    dayIds: dates.map((date) => (byDate.get(date) ?? addedByDate.get(date))!.id),
    addedDays,
    removedDayIds: removed.map((day) => day.id),
    itemsToIdeas: removed.flatMap((day) => day.itemIds),
  }
}
