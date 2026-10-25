import { lazy } from 'react'

/** The expense form is loaded on first use (see LazyTripFormModal). */
export const LazyExpenseFormModal = lazy(() =>
  import('./ExpenseFormModal').then((module) => ({ default: module.ExpenseFormModal })),
)
