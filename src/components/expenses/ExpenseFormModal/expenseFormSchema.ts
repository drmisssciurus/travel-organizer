import { z } from 'zod'
import type { ExpenseFields } from '@/store/slices/expensesSlice'
import { EXPENSE_CATEGORIES, type Expense, type ISODate, type Trip } from '@/types'
import { isISODate } from '@/utils/guards'

/**
 * Expense form validation (WORKING_PLAN §6): title required, amount > 0,
 * date optional but within the trip. Messages are keys of `expenses.form.errors.*`.
 *
 * The schema depends on the trip (date range), so it is built per trip.
 */

export const EXPENSE_TITLE_MAX = 80
const AMOUNT_MAX = 1_000_000_000

export type ExpenseFormError = 'titleRequired' | 'amount' | 'dateRange'
const msg = (key: ExpenseFormError) => ({ error: key })

/**
 * "1 240,50", "1240.5", "99" → number; anything else → NaN.
 * Spaces (thousands) are ignored, a comma works as the decimal point (Russian keyboards).
 */
export function parseAmount(text: string): number {
  // \s also covers non-breaking spaces (thousands separator in Russian formatting)
  const normalized = text.replace(/\s/g, '').replace(',', '.')
  return /^\d+(\.\d{1,2})?$/.test(normalized) ? Number(normalized) : Number.NaN
}

export function createExpenseSchema(trip: Pick<Trip, 'startDate' | 'endDate'>) {
  return z.object({
    title: z.string().trim().min(1, msg('titleRequired')).max(EXPENSE_TITLE_MAX, msg('titleRequired')),
    amount: z
      .string()
      .refine((value) => {
        const amount = parseAmount(value)
        return amount > 0 && amount <= AMOUNT_MAX
      }, msg('amount'))
      .transform(parseAmount),
    category: z.enum(EXPENSE_CATEGORIES),
    date: z
      .string()
      .refine(
        (value) => value === '' || (isISODate(value) && value >= trip.startDate && value <= trip.endDate),
        msg('dateRange'),
      )
      .transform((value) => value || undefined),
  })
}

export type ExpenseFormInput = z.input<ReturnType<typeof createExpenseSchema>>
export type ExpenseFormOutput = z.output<ReturnType<typeof createExpenseSchema>>

/** New expense: dated today when the trip is going on, otherwise without a date. */
export function emptyExpenseForm(trip: Pick<Trip, 'startDate' | 'endDate'>, today: ISODate): ExpenseFormInput {
  const inTrip = today >= trip.startDate && today <= trip.endDate
  return { title: '', amount: '', category: 'food', date: inTrip ? today : '' }
}

export function expenseToForm(expense: Expense): ExpenseFormInput {
  return { title: expense.title, amount: String(expense.amount), category: expense.category, date: expense.date ?? '' }
}

export const formToExpense = (values: ExpenseFormOutput): ExpenseFields => values
