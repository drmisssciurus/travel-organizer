import { nanoid } from '@reduxjs/toolkit'
import {
  CHECKLIST_GROUP_KINDS,
  CURRENCIES,
  EXPENSE_CATEGORIES,
  ITEM_CATEGORIES,
  type ChecklistGroup,
  type ChecklistItem,
  type Day,
  type Expense,
  type GeoPoint,
  type ID,
  type ItineraryItem,
  type Trip,
} from '@/types'
import { isISODate, isOneOf, isOptional, isRecord, isString, isStringArray, isTimeHHmm } from '@/utils/guards'
import type { TripSnapshot } from './actions/tripActions'
import { checklistGroupsAdapter } from './slices/checklistGroupsSlice'
import { checklistItemsAdapter } from './slices/checklistItemsSlice'
import { daysAdapter } from './slices/daysSlice'
import { expensesAdapter } from './slices/expensesSlice'
import { itemsAdapter } from './slices/itemsSlice'
import { tripsAdapter } from './slices/tripsSlice'

/**
 * Validation and repair of the stored entities (localStorage can contain anything:
 * old versions, manual edits, a write cut in half).
 *
 * 1. Each entity is checked on its own; a broken one is dropped, the rest survive.
 *    Objects are rebuilt field by field — unknown keys don't get into the store.
 * 2. References are repaired: entities of missing trips are dropped, order arrays
 *    keep only existing ids and get back the ones that were lost, every trip
 *    has exactly one "tasks" group.
 */

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

function sanitizeTrip(raw: unknown): Trip | undefined {
  if (!isRecord(raw)) return undefined
  const { id, title, destination, startDate, endDate, currency, notes, dayIds, ideaIds, groupIds, createdAt, updatedAt } = raw
  const valid =
    isString(id) &&
    isString(title) &&
    isString(destination) &&
    isISODate(startDate) &&
    isISODate(endDate) &&
    startDate <= endDate &&
    isOneOf(CURRENCIES, currency) &&
    isOptional(notes, isString) &&
    isStringArray(dayIds) &&
    isStringArray(ideaIds) &&
    isStringArray(groupIds) &&
    isNumber(createdAt) &&
    isNumber(updatedAt)
  if (!valid) return undefined
  return { id, title, destination, startDate, endDate, currency, notes, dayIds, ideaIds, groupIds, createdAt, updatedAt }
}

function sanitizeDay(raw: unknown): Day | undefined {
  if (!isRecord(raw)) return undefined
  const { id, tripId, date, itemIds } = raw
  if (!(isString(id) && isString(tripId) && isISODate(date) && isStringArray(itemIds))) return undefined
  return { id, tripId, date, itemIds }
}

/** `{ lat, lng }` within the valid ranges; anything else → `undefined` (the item stays, just off the map). */
export function sanitizeGeoPoint(raw: unknown): GeoPoint | undefined {
  if (!isRecord(raw)) return undefined
  const { lat, lng } = raw
  if (!(isNumber(lat) && isNumber(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) return undefined
  return { lat, lng }
}

function sanitizeItem(raw: unknown): ItineraryItem | undefined {
  if (!isRecord(raw)) return undefined
  const { id, tripId, dayId, title, category, time, durationMin, location, note, needsBooking, bookingTaskId, done } = raw
  const valid =
    isString(id) &&
    isString(tripId) &&
    (dayId === null || isString(dayId)) &&
    isString(title) &&
    isOneOf(ITEM_CATEGORIES, category) &&
    isOptional(time, isTimeHHmm) &&
    isOptional(durationMin, isNumber) &&
    isOptional(location, isString) &&
    isOptional(note, isString) &&
    typeof needsBooking === 'boolean' &&
    isOptional(bookingTaskId, isString) &&
    typeof done === 'boolean'
  if (!valid) return undefined
  // Broken coordinates don't drop the item: it only disappears from the map
  const coords = sanitizeGeoPoint(raw.coords)
  return { id, tripId, dayId, title, category, time, durationMin, location, coords, note, needsBooking, bookingTaskId, done }
}

function sanitizeGroup(raw: unknown): ChecklistGroup | undefined {
  if (!isRecord(raw)) return undefined
  const { id, tripId, kind, title, itemIds } = raw
  if (!(isString(id) && isString(tripId) && isOneOf(CHECKLIST_GROUP_KINDS, kind) && isString(title) && isStringArray(itemIds))) {
    return undefined
  }
  return { id, tripId, kind, title, itemIds }
}

function sanitizeChecklistItem(raw: unknown): ChecklistItem | undefined {
  if (!isRecord(raw)) return undefined
  const { id, tripId, groupId, text, done, dueDate, sourceItemId } = raw
  const valid =
    isString(id) &&
    isString(tripId) &&
    isString(groupId) &&
    isString(text) &&
    typeof done === 'boolean' &&
    isOptional(dueDate, isISODate) &&
    isOptional(sourceItemId, isString)
  if (!valid) return undefined
  return { id, tripId, groupId, text, done, dueDate, sourceItemId }
}

function sanitizeExpense(raw: unknown): Expense | undefined {
  if (!isRecord(raw)) return undefined
  const { id, tripId, title, amount, category, date } = raw
  const valid =
    isString(id) &&
    isString(tripId) &&
    isString(title) &&
    isNumber(amount) &&
    amount > 0 &&
    isOneOf(EXPENSE_CATEGORIES, category) &&
    isOptional(date, isISODate)
  if (!valid) return undefined
  return { id, tripId, title, amount, category, date }
}

/** Valid entities of an `{ ids, entities }` collection (stored `ids` are not trusted). */
function entitiesOf<T>(raw: unknown, sanitize: (value: unknown) => T | undefined): T[] {
  const entities = isRecord(raw) && isRecord(raw.entities) ? Object.values(raw.entities) : []
  return entities.map(sanitize).filter((entity): entity is T => entity !== undefined)
}

/**
 * Keeps ids that exist and belong here (in their current order),
 * then appends members that the array lost (in the order of `members`).
 */
function repairOrder(ids: readonly ID[], members: readonly { id: ID }[]): ID[] {
  const memberIds = new Set(members.map((member) => member.id))
  const kept = [...new Set(ids)].filter((id) => memberIds.has(id))
  const keptSet = new Set(kept)
  return [...kept, ...members.filter((member) => !keptSet.has(member.id)).map((member) => member.id)]
}

export type EntitySlices = {
  trips: ReturnType<typeof tripsAdapter.getInitialState>
  days: ReturnType<typeof daysAdapter.getInitialState>
  items: ReturnType<typeof itemsAdapter.getInitialState>
  checklistGroups: ReturnType<typeof checklistGroupsAdapter.getInitialState>
  checklistItems: ReturnType<typeof checklistItemsAdapter.getInitialState>
  expenses: ReturnType<typeof expensesAdapter.getInitialState>
}

/** Snapshots (demo data, tests) → slice states. */
export function slicesFromSnapshots(snapshots: readonly TripSnapshot[]): EntitySlices {
  return {
    trips: tripsAdapter.setAll(tripsAdapter.getInitialState(), snapshots.map((s) => s.trip)),
    days: daysAdapter.setAll(daysAdapter.getInitialState(), snapshots.flatMap((s) => s.days)),
    items: itemsAdapter.setAll(itemsAdapter.getInitialState(), snapshots.flatMap((s) => s.items)),
    checklistGroups: checklistGroupsAdapter.setAll(
      checklistGroupsAdapter.getInitialState(),
      snapshots.flatMap((s) => s.checklistGroups),
    ),
    checklistItems: checklistItemsAdapter.setAll(
      checklistItemsAdapter.getInitialState(),
      snapshots.flatMap((s) => s.checklistItems),
    ),
    expenses: expensesAdapter.setAll(expensesAdapter.getInitialState(), snapshots.flatMap((s) => s.expenses)),
  }
}

/** Stored state → valid, consistent entity slices. */
export function sanitizeEntities(state: Record<string, unknown>): EntitySlices {
  const trips = entitiesOf(state.trips, sanitizeTrip)
  const tripIds = new Set(trips.map((trip) => trip.id))
  const ofTrip = <T extends { tripId: ID }>(list: T[]) => list.filter((entity) => tripIds.has(entity.tripId))

  const days = ofTrip(entitiesOf(state.days, sanitizeDay))
  const dayById = new Map(days.map((day) => [day.id, day]))
  // An item pointing to a missing day (or a day of another trip) becomes an idea
  const items = ofTrip(entitiesOf(state.items, sanitizeItem)).map((item) =>
    item.dayId !== null && dayById.get(item.dayId)?.tripId !== item.tripId ? { ...item, dayId: null } : item,
  )
  const groups = ofTrip(entitiesOf(state.checklistGroups, sanitizeGroup))
  const groupById = new Map(groups.map((group) => [group.id, group]))
  const checklist = ofTrip(entitiesOf(state.checklistItems, sanitizeChecklistItem)).filter(
    (task) => groupById.get(task.groupId)?.tripId === task.tripId,
  )
  const checklistIds = new Set(checklist.map((task) => task.id))
  const itemIds = new Set(items.map((item) => item.id))

  // Links between items and booking tasks: both sides must exist
  const fixedItems = items.map((item) =>
    item.bookingTaskId && !checklistIds.has(item.bookingTaskId)
      ? { ...item, needsBooking: false, bookingTaskId: undefined }
      : item,
  )
  const fixedChecklist = checklist.map((task) =>
    task.sourceItemId && !itemIds.has(task.sourceItemId) ? { ...task, sourceItemId: undefined } : task,
  )

  // Every trip has one "tasks" group
  const extraGroups: ChecklistGroup[] = trips
    .filter((trip) => !groups.some((group) => group.tripId === trip.id && group.kind === 'tasks'))
    .map((trip) => ({ id: nanoid(), tripId: trip.id, kind: 'tasks', title: '', itemIds: [] }))
  const allGroups = [...groups, ...extraGroups]

  const fixedTrips = trips.map((trip) => ({
    ...trip,
    // day order = date order; the dates are the source of truth
    dayIds: days.filter((day) => day.tripId === trip.id).sort((a, b) => a.date.localeCompare(b.date)).map((day) => day.id),
    ideaIds: repairOrder(trip.ideaIds, fixedItems.filter((item) => item.tripId === trip.id && item.dayId === null)),
    groupIds: repairOrder(trip.groupIds, allGroups.filter((group) => group.tripId === trip.id)),
  }))
  const fixedDays = days.map((day) => ({
    ...day,
    itemIds: repairOrder(day.itemIds, fixedItems.filter((item) => item.dayId === day.id)),
  }))
  const fixedGroups = allGroups.map((group) => ({
    ...group,
    itemIds: repairOrder(group.itemIds, fixedChecklist.filter((task) => task.groupId === group.id)),
  }))

  return {
    trips: tripsAdapter.setAll(tripsAdapter.getInitialState(), fixedTrips),
    days: daysAdapter.setAll(daysAdapter.getInitialState(), fixedDays),
    items: itemsAdapter.setAll(itemsAdapter.getInitialState(), fixedItems),
    checklistGroups: checklistGroupsAdapter.setAll(checklistGroupsAdapter.getInitialState(), fixedGroups),
    checklistItems: checklistItemsAdapter.setAll(checklistItemsAdapter.getInitialState(), fixedChecklist),
    expenses: expensesAdapter.setAll(expensesAdapter.getInitialState(), ofTrip(entitiesOf(state.expenses, sanitizeExpense))),
  }
}
