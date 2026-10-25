import { describe, expect, it } from 'vitest'
import { parseAmount } from '@/components/expenses/ExpenseFormModal/expenseFormSchema'
import type { Expense } from '@/types'
import { filterSortExpenses, sumAmounts, summarizeExpenses } from './expenses'

const expense = (id: string, amount: number, category: Expense['category'], date?: string): Expense => ({
  id,
  tripId: 't',
  title: id,
  amount,
  category,
  date,
})
const list = [expense('Hotel', 300, 'stay', '2026-10-01'), expense('Coffee', 0.1, 'food', '2026-10-02'), expense('Bread', 0.2, 'food')]
const trip = { startDate: '2026-10-01', endDate: '2026-10-04' }

describe('expenses', () => {
  it('sums to cents (0.1 + 0.2 = 0.3)', () => {
    expect(sumAmounts(list.filter((e) => e.category === 'food'))).toBe(0.3)
  })

  it('summary: total, per day over the elapsed days, categories biggest first', () => {
    const summary = summarizeExpenses(list, trip, '2026-10-02')
    expect(summary.total).toBe(300.3)
    expect(summary.perDay).toBe(150.15)
    expect(summary.byCategory.map((row) => row.category)).toEqual(['stay', 'food'])
  })

  it('no "per day" before the trip', () => {
    expect(summarizeExpenses(list, trip, '2026-09-01').perDay).toBeNull()
  })

  it('date sort keeps undated expenses last; category filter', () => {
    expect(filterSortExpenses(list, 'all', 'dateDesc').map((e) => e.id)).toEqual(['Coffee', 'Hotel', 'Bread'])
    expect(filterSortExpenses(list, 'all', 'dateAsc').map((e) => e.id)).toEqual(['Hotel', 'Coffee', 'Bread'])
    expect(filterSortExpenses(list, 'food', 'amountAsc').map((e) => e.id)).toEqual(['Coffee', 'Bread'])
  })

  it.each([
    ['12,50', 12.5],
    ['1 240,5', 1240.5],
    ['1 240', 1240],
    ['99', 99],
  ])('parseAmount(%j) = %d', (input, expected) => {
    expect(parseAmount(input)).toBe(expected)
  })

  it.each(['12,345', 'abc', '-5', ''])('parseAmount(%j) is NaN', (input) => {
    expect(parseAmount(input)).toBeNaN()
  })
})
