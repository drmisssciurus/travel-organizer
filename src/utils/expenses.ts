import { EXPENSE_CATEGORIES, type Expense, type ExpenseCategory, type ISODate, type Trip } from '@/types'
import { diffDays } from './date'
import { getTripStatus, tripDuration } from './tripStatus'

/** Sum of amounts, rounded to cents (0.1 + 0.2 must not become 0.30000000000000004). */
export function sumAmounts(expenses: readonly Pick<Expense, 'amount'>[]): number {
  return Math.round(expenses.reduce((sum, expense) => sum + expense.amount, 0) * 100) / 100
}

export interface CategoryTotal {
  category: ExpenseCategory
  sum: number
  /** Share of the total, 0–100 */
  share: number
}

export interface ExpenseSummary {
  total: number
  count: number
  /**
   * Average per day so far: for an ongoing trip — over the days already started,
   * for a past one — over all days; `null` for an upcoming trip (no days yet).
   */
  perDay: number | null
  /** Non-empty categories, biggest first */
  byCategory: CategoryTotal[]
}

export function summarizeExpenses(
  expenses: readonly Expense[],
  trip: Pick<Trip, 'startDate' | 'endDate'>,
  today: ISODate,
): ExpenseSummary {
  const total = sumAmounts(expenses)
  const status = getTripStatus(trip, today)
  const elapsed = status === 'past' ? tripDuration(trip) : status === 'ongoing' ? diffDays(trip.startDate, today) + 1 : 0

  const byCategory = EXPENSE_CATEGORIES.map((category) => {
    const sum = sumAmounts(expenses.filter((expense) => expense.category === category))
    return { category, sum, share: total > 0 ? (sum / total) * 100 : 0 }
  })
    .filter((row) => row.sum > 0)
    .sort((a, b) => b.sum - a.sum)

  return { total, count: expenses.length, perDay: elapsed > 0 && total > 0 ? total / elapsed : null, byCategory }
}

export const EXPENSE_SORTS = ['dateDesc', 'dateAsc', 'amountDesc', 'amountAsc'] as const
export type ExpenseSort = (typeof EXPENSE_SORTS)[number]

/**
 * Filter by category + sort. Expenses without a date go last in both date orders.
 * Ties keep a stable order (amount, then title).
 */
export function filterSortExpenses(
  expenses: readonly Expense[],
  category: ExpenseCategory | 'all',
  sort: ExpenseSort,
): Expense[] {
  const list = category === 'all' ? [...expenses] : expenses.filter((expense) => expense.category === category)
  const byDate = (a: Expense, b: Expense, dir: 1 | -1) => {
    if (!a.date || !b.date) return a.date ? -1 : b.date ? 1 : 0
    return dir * a.date.localeCompare(b.date)
  }
  const compare: Record<ExpenseSort, (a: Expense, b: Expense) => number> = {
    dateDesc: (a, b) => byDate(a, b, -1) || b.amount - a.amount,
    dateAsc: (a, b) => byDate(a, b, 1) || b.amount - a.amount,
    amountDesc: (a, b) => b.amount - a.amount || a.title.localeCompare(b.title),
    amountAsc: (a, b) => a.amount - b.amount || a.title.localeCompare(b.title),
  }
  return list.sort(compare[sort])
}
