import { Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { CategoryBreakdown } from '@/components/expenses/CategoryBreakdown'
import { LazyExpenseFormModal } from '@/components/expenses/ExpenseFormModal/LazyExpenseFormModal'
import { ExpenseTable } from '@/components/expenses/ExpenseTable'
import { SpentSummary } from '@/components/expenses/SpentSummary'
import { Button, EmptyState } from '@/components/ui'
import { useAppDispatch, useAppSelector } from '@/hooks/store'
import { useToast } from '@/hooks/useToast'
import { useToday } from '@/hooks/useToday'
import { selectTripExpenses } from '@/store/selectors/expenseSelectors'
import { expenseDeleted, expenseRestored } from '@/store/slices/expensesSlice'
import { selectTripById } from '@/store/slices/tripsSlice'
import type { Expense, ExpenseCategory, ID } from '@/types'
import { summarizeExpenses, type ExpenseSort } from '@/utils/expenses'
import styles from './ExpensesTab.module.css'

type FormState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; expenseId: ID }

/** "Expenses" tab: spent summary + by category on the side, the expense list on the right. */
export default function ExpensesTab() {
  const { t } = useTranslation()
  const { tripId = '' } = useParams()
  const dispatch = useAppDispatch()
  const toast = useToast()
  const today = useToday()
  const trip = useAppSelector((state) => selectTripById(state, tripId))
  const expenses = useAppSelector((state) => selectTripExpenses(state, tripId))
  const [category, setCategory] = useState<ExpenseCategory | 'all'>('all')
  const [sort, setSort] = useState<ExpenseSort>('dateDesc')
  const [form, setForm] = useState<FormState>({ mode: 'closed' })
  const [formUsed, setFormUsed] = useState(false)

  if (!trip) return null // TripLayout shows "Trip not found"

  const openForm = (next: FormState) => {
    setFormUsed(true)
    setForm(next)
  }
  const remove = (expense: Expense) => {
    dispatch(expenseDeleted(expense.id))
    toast({ message: t('expenses.deleted', { title: expense.title }), undo: expenseRestored(expense) })
  }
  const edited = form.mode === 'edit' ? expenses.find((expense) => expense.id === form.expenseId) : undefined
  const summary = summarizeExpenses(expenses, trip, today)

  return (
    <>
      {expenses.length === 0 ? (
        <EmptyState
          icon="€"
          title={t('expenses.empty')}
          description={t('expenses.emptyHint')}
          action={
            <Button variant="primary" icon="+" onClick={() => openForm({ mode: 'create' })}>
              {t('expenses.add')}
            </Button>
          }
        />
      ) : (
        <div className={styles.layout}>
          <div className={styles.side}>
            <SpentSummary summary={summary} currency={trip.currency} />
            <CategoryBreakdown rows={summary.byCategory} currency={trip.currency} />
          </div>
          <ExpenseTable
            expenses={expenses}
            currency={trip.currency}
            category={category}
            onCategoryChange={setCategory}
            sort={sort}
            onSortChange={setSort}
            onAdd={() => openForm({ mode: 'create' })}
            onEdit={(expense) => openForm({ mode: 'edit', expenseId: expense.id })}
            onDelete={remove}
          />
        </div>
      )}

      {formUsed && (
        <Suspense fallback={null}>
          <LazyExpenseFormModal
            open={form.mode !== 'closed'}
            onClose={() => setForm({ mode: 'closed' })}
            trip={trip}
            today={today}
            expense={edited}
          />
        </Suspense>
      )}
    </>
  )
}
