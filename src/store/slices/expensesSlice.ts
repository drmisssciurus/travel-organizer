import { createEntityAdapter, createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'
import type { Expense, ID } from '@/types'
import { isTripInserted, tripDeleted } from '../actions/tripActions'

/**
 * Expenses of all trips. Not linked to plan days — only an optional date.
 * No adapter sorting: the expenses tab sorts by the user's choice (date / amount).
 */
export const expensesAdapter = createEntityAdapter<Expense>()

export type ExpenseFields = Omit<Expense, 'id' | 'tripId'>

export const expensesSlice = createSlice({
  name: 'expenses',
  initialState: expensesAdapter.getInitialState(),
  reducers: {
    expenseAdded: {
      reducer: expensesAdapter.addOne,
      // The id is generated in `prepare` (a side effect), the reducer stays pure
      prepare: (tripId: ID, fields: ExpenseFields) => ({ payload: { id: nanoid(), tripId, ...fields } }),
    },
    expenseUpdated(state, action: PayloadAction<{ id: ID; changes: Partial<ExpenseFields> }>) {
      expensesAdapter.updateOne(state, action.payload)
    },
    expenseDeleted(state, action: PayloadAction<ID>) {
      expensesAdapter.removeOne(state, action.payload)
    },
    /** "Undo" after deleting one expense: back with the same id */
    expenseRestored: expensesAdapter.addOne,
  },
  extraReducers: (builder) => {
    builder
      .addCase(tripDeleted, (state, { payload: tripId }) => {
        const ids = Object.values(state.entities)
          .filter((expense) => expense.tripId === tripId)
          .map((expense) => expense.id)
        expensesAdapter.removeMany(state, ids)
      })
      .addMatcher(isTripInserted, (state, { payload }) => {
        expensesAdapter.addMany(state, payload.expenses)
      })
  },
})

export const { expenseAdded, expenseUpdated, expenseDeleted, expenseRestored } = expensesSlice.actions
