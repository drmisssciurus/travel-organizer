import type { ID, ISODate } from './common'

export const EXPENSE_CATEGORIES = ['transport', 'stay', 'food', 'activities', 'shopping', 'other'] as const
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

/** A spending record. Not linked to itinerary days — only an optional date. */
export interface Expense {
  id: ID
  tripId: ID
  title: string
  /** Amount in the trip currency. Always > 0. */
  amount: number
  category: ExpenseCategory
  date?: ISODate
}
