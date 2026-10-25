import { useTranslation } from 'react-i18next'
import { Button, IconButton, Select } from '@/components/ui'
import { useAppSelector } from '@/hooks/store'
import { selectLanguage } from '@/store/slices/settingsSlice'
import { EXPENSE_CATEGORIES, type CurrencyCode, type Expense, type ExpenseCategory } from '@/types'
import { EXPENSE_SORTS, filterSortExpenses, sumAmounts, type ExpenseSort } from '@/utils/expenses'
import { formatMoney, formatShortDate } from '@/utils/format'
import { isOneOf } from '@/utils/guards'
import styles from './ExpenseTable.module.css'

export interface ExpenseTableProps {
  expenses: readonly Expense[]
  currency: CurrencyCode
  category: ExpenseCategory | 'all'
  onCategoryChange: (category: ExpenseCategory | 'all') => void
  sort: ExpenseSort
  onSortChange: (sort: ExpenseSort) => void
  onAdd: () => void
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

const CATEGORY_FILTERS = ['all', ...EXPENSE_CATEGORIES] as const

/**
 * Expense list: category filter, sort (date / amount ↑↓), total of the shown rows.
 * A real <table>; on phones the date and category columns fold into a line under the title.
 */
export function ExpenseTable(props: ExpenseTableProps) {
  const { expenses, currency, category, onCategoryChange, sort, onSortChange, onAdd, onEdit, onDelete } = props
  const { t } = useTranslation()
  const language = useAppSelector(selectLanguage)
  const rows = filterSortExpenses(expenses, category, sort)
  const money = (amount: number) => formatMoney(amount, currency, language)

  return (
    <section className={styles.card}>
      <div className={styles.tools}>
        <Select
          pill
          inputSize="sm"
          aria-label={t('expenses.category')}
          options={CATEGORY_FILTERS.map((value) => ({
            value,
            label: value === 'all' ? t('expenses.categoryAll') : t(`expenses.categories.${value}`),
          }))}
          value={category}
          onChange={(event) => isOneOf(CATEGORY_FILTERS, event.target.value) && onCategoryChange(event.target.value)}
        />
        <Select
          pill
          inputSize="sm"
          aria-label={t('expenses.sort')}
          options={EXPENSE_SORTS.map((value) => ({ value, label: t(`expenses.sorts.${value}`) }))}
          value={sort}
          onChange={(event) => isOneOf(EXPENSE_SORTS, event.target.value) && onSortChange(event.target.value)}
        />
        <span className={styles.spacer} />
        <Button variant="primary" icon="+" className={styles.add} onClick={onAdd}>
          {t('expenses.add')}
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className={styles.noMatch}>
          <p>{t('expenses.noMatch')}</p>
          <Button size="sm" onClick={() => onCategoryChange('all')}>
            {t('expenses.showAll')}
          </Button>
        </div>
      ) : (
        <table className={styles.table}>
          <caption className="visually-hidden">{t('expenses.caption')}</caption>
          <thead>
            <tr>
              <th scope="col" className={styles.date}>
                {t('expenses.columns.date')}
              </th>
              <th scope="col">{t('expenses.columns.what')}</th>
              <th scope="col" className={styles.category}>
                {t('expenses.columns.category')}
              </th>
              <th scope="col" className={styles.amount}>
                {t('expenses.columns.amount')}
              </th>
              <th scope="col" className={styles.actionsCol}>
                <span className="visually-hidden">{t('expenses.columns.actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((expense) => {
              const date = expense.date ? formatShortDate(expense.date, language) : '—'
              const categoryName = t(`expenses.categories.${expense.category}`)
              return (
                <tr key={expense.id}>
                  <td className={`${styles.date} num`}>{date}</td>
                  <td>
                    <span className={styles.what}>{expense.title}</span>
                    {/* Phones: date and category under the title */}
                    <span className={styles.sub}>
                      {expense.date ? `${date} · ` : ''}
                      {categoryName}
                    </span>
                  </td>
                  <td className={styles.category}>
                    <span className={styles.dot} style={{ background: `var(--color-exp-${expense.category})` }} aria-hidden="true" />
                    {categoryName}
                  </td>
                  <td className={`${styles.amount} num`}>{money(expense.amount)}</td>
                  <td>
                    <div className={styles.actions}>
                      <IconButton
                        shape="square"
                        size="sm"
                        icon="✎"
                        label={t('expenses.edit', { title: expense.title })}
                        title={t('actions.edit')}
                        onClick={() => onEdit(expense)}
                      />
                      <IconButton
                        shape="square"
                        size="sm"
                        variant="danger"
                        icon="×"
                        label={t('expenses.delete', { title: expense.title })}
                        title={t('actions.delete')}
                        onClick={() => onDelete(expense)}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5}>
                <div className={styles.foot}>
                  <span className="meta">{t('expenses.count', { count: rows.length })}</span>
                  <b className="num">{t('expenses.total', { amount: money(sumAmounts(rows)) })}</b>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </section>
  )
}
