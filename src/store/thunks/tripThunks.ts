import { nanoid } from '@reduxjs/toolkit'
import i18n from '@/i18n'
import type { ChecklistGroup, Trip } from '@/types'
import { buildDays, dateRange, planDaysSync } from '@/utils/tripDays'
import { tripCreated, tripDaysSynced, tripDeleted, tripRestored, type TripSnapshot } from '../actions/tripActions'
import type { AppThunk } from '../index'
import { selectTripSnapshot } from '../selectors/planSelectors'
import { buildDefaultPackingGroups } from './checklistThunks'
import { toastShown } from '../slices/toastSlice'
import { tripUpdated, type TripEditableFields } from '../slices/tripsSlice'

/**
 * Builds a new trip with everything it starts with and adds it in one action:
 * - one day per date of the trip (board columns);
 * - the "tasks" checklist group ("Before the trip" column) and default packing groups
 *   (Documents, Clothes, Tech, Toiletries — in the UI language).
 * Returns the created trip (to navigate to it).
 *
 * A thunk, not a reducer: generating ids and timestamps are side effects.
 */
export const createTrip =
  (fields: TripEditableFields): AppThunk<Trip> =>
  (dispatch) => {
    const now = Date.now()
    const id = nanoid()
    const days = buildDays(id, dateRange(fields.startDate, fields.endDate), nanoid)
    const tasksGroup: ChecklistGroup = { id: nanoid(), tripId: id, kind: 'tasks', title: '', itemIds: [] }
    const groups = [tasksGroup, ...buildDefaultPackingGroups(id)]
    const trip: Trip = {
      id,
      ...fields,
      dayIds: days.map((day) => day.id),
      ideaIds: [],
      groupIds: groups.map((group) => group.id),
      createdAt: now,
      updatedAt: now,
    }
    dispatch(tripCreated({ trip, days, items: [], checklistGroups: groups, checklistItems: [], expenses: [] }))
    return trip
  }

/**
 * Saves the trip form. When the dates change, days follow (matched by date):
 * removed days send their items to "Ideas" — the user gets a toast about it.
 */
export const updateTrip =
  (id: Trip['id'], fields: TripEditableFields): AppThunk =>
  (dispatch, getState) => {
    const before = selectTripSnapshot(getState(), id)
    if (!before) return
    dispatch(tripUpdated({ id, changes: fields }))

    const { trip, days } = before
    if (trip.startDate === fields.startDate && trip.endDate === fields.endDate) return
    const sync = planDaysSync(trip, days, fields.startDate, fields.endDate, nanoid)
    dispatch(tripDaysSynced({ tripId: id, ...sync }))
    if (sync.itemsToIdeas.length > 0) {
      dispatch(toastShown({ message: i18n.t('plan.movedToIdeas', { count: sync.itemsToIdeas.length }) }))
    }
  }

/**
 * Deletes a trip with everything in it (cascade) and offers "Undo".
 *
 * 1. Takes a snapshot of the trip and its related entities.
 * 2. `tripDeleted` — every slice removes its entities of this trip in `extraReducers`,
 *    so one action deletes everything consistently.
 * 3. A toast whose "Undo" is the `tripRestored(snapshot)` action — data, not a callback.
 */
export const deleteTrip =
  (id: Trip['id']): AppThunk =>
  (dispatch, getState) => {
    const snapshot: TripSnapshot | undefined = selectTripSnapshot(getState(), id)
    if (!snapshot) return
    dispatch(tripDeleted(id))
    dispatch(
      toastShown({
        message: i18n.t('trips.delete.done', { title: snapshot.trip.title }),
        undo: tripRestored(snapshot),
      }),
    )
  }
