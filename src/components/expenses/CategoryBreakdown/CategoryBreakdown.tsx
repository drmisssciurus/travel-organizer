import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { ProgressBar } from '@/components/ui'
import { useAppSelector } from '@/hooks/store'
import { selectLanguage } from '@/store/slices/settingsSlice'
import type { CurrencyCode } from '@/types'
import type { CategoryTotal } from '@/utils/expenses'
import { formatMoney } from '@/utils/format'
import styles from './CategoryBreakdown.module.css'

export interface CategoryBreakdownProps {
  rows: readonly CategoryTotal[]
  currency: CurrencyCode
}

/**
 * Totals per category, biggest first. Bars are scaled to the biggest category
 * (not to 100 %), so small categories stay readable; the share is written next to the sum.
 */
export function CategoryBreakdown({ rows, currency }: CategoryBreakdownProps) {
  const { t } = useTranslation()
  const language = useAppSelector(selectLanguage)
  const titleId = useId()
  const max = rows[0]?.sum ?? 0

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <h2 id={titleId} className="label">
        {t('expenses.byCategory')}
      </h2>
      <ul className={styles.list}>
        {rows.map(({ category, sum, share }) => {
          const name = t(`expenses.categories.${category}`)
          const amount = formatMoney(sum, currency, language)
          return (
            <li key={category}>
              <div className={styles.top}>
                <span className={styles.name}>
                  <span className={styles.dot} style={{ background: `var(--color-exp-${category})` }} aria-hidden="true" />
                  {name}
                </span>
                <span>
                  <b className="num">{amount}</b>
                  <span className={styles.share}> · {Math.round(share)}%</span>
                </span>
              </div>
              {/* The numbers are written above — the bar is decorative */}
              <ProgressBar value={sum} max={max} size="sm" color={`var(--color-exp-${category})`} decorative highlightOverflow={false} />
            </li>
          )
        })}
      </ul>
    </section>
  )
}
