import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/hooks/store'
import { selectLanguage } from '@/store/slices/settingsSlice'
import type { CurrencyCode } from '@/types'
import type { ExpenseSummary } from '@/utils/expenses'
import { formatMoney } from '@/utils/format'
import styles from './SpentSummary.module.css'

export interface SpentSummaryProps {
  summary: ExpenseSummary
  currency: CurrencyCode
}

/** Big "Spent" card: total in the trip currency, number of expenses, average per day. */
export function SpentSummary({ summary, currency }: SpentSummaryProps) {
  const { t } = useTranslation()
  const language = useAppSelector(selectLanguage)
  const titleId = useId()
  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.label}>
        {t('expenses.spent')}
      </h2>
      <p className={styles.total}>{formatMoney(summary.total, currency, language)}</p>
      <p className={styles.meta}>
        {t('expenses.count', { count: summary.count })}
        {summary.perDay !== null &&
          ` · ${t('expenses.perDay', { amount: formatMoney(Math.round(summary.perDay), currency, language) })}`}
      </p>
    </section>
  )
}
