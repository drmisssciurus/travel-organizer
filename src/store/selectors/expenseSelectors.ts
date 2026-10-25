import { createSelector } from '@reduxjs/toolkit'
import type { Expense, ID } from '@/types'
import type { RootState } from '../index'

const selectExpenseEntities = (state: RootState) => state.expenses.entities

/** Expenses of every trip, grouped by trip id (spent in the trips list). */
export const selectExpensesByTrip = createSelector([selectExpenseEntities], (entities) => {
  const byTrip = new Map<ID, Expense[]>()
  for (const expense of Object.values(entities)) {
    const list = byTrip.get(expense.tripId)
    if (list) list.push(expense)
    else byTrip.set(expense.tripId, [expense])
  }
  return byTrip
})

const EMPTY: readonly Expense[] = []

/** Expenses of one trip (the expenses tab). Same array while nothing changes. */
export const selectTripExpenses = createSelector(
  [selectExpensesByTrip, (_state: RootState, tripId: ID) => tripId],
  (byTrip, tripId): readonly Expense[] => byTrip.get(tripId) ?? EMPTY,
)
