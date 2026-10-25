import { useTranslation } from 'react-i18next'
import { IconButton, Select } from '@/components/ui'
import { ITEM_CATEGORIES, type ItemCategory } from '@/types'
import styles from './BoardToolbar.module.css'

export interface BoardToolbarProps {
  /** Visible day columns; absent for a trip without days */
  range?: { from: number; to: number; total: number }
  onPrev: () => void
  onNext: () => void
  category: ItemCategory | 'all'
  onCategoryChange: (category: ItemCategory | 'all') => void
}

/** "Days 1–3 of 8 ‹ ›" + category filter (other categories are faded on the board). */
export function BoardToolbar({ range, onPrev, onNext, category, onCategoryChange }: BoardToolbarProps) {
  const { t } = useTranslation()
  const options = [
    { value: 'all' as const, label: t('plan.categoryAll') },
    ...ITEM_CATEGORIES.map((value) => ({ value, label: t(`plan.categories.${value}`) })),
  ]

  return (
    <div className={styles.toolbar}>
      {range && (
        <div className={styles.nav}>
          {/* Live region: the counter is read out after paging */}
          <span className="label" aria-live="polite">
            {t('plan.daysRange', { from: range.from, to: range.to, total: range.total })}
          </span>
          <IconButton size="sm" icon="‹" label={t('plan.prevDays')} onClick={onPrev} disabled={range.from <= 1} />
          <IconButton size="sm" icon="›" label={t('plan.nextDays')} onClick={onNext} disabled={range.to >= range.total} />
        </div>
      )}
      <Select
        pill
        inputSize="sm"
        aria-label={t('plan.category')}
        options={options}
        value={category}
        onChange={(event) => onCategoryChange(event.target.value as ItemCategory | 'all')}
      />
    </div>
  )
}
