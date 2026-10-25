import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormatDuration } from '@/components/plan/useFormatDuration'
import type { ItineraryItem } from '@/types'
import { timeRange } from '@/utils/today'
import styles from './NowCard.module.css'

export interface NowCardProps {
  item: ItineraryItem
  /** `true` — happening right now; `false` — the next stop of the day */
  isCurrent: boolean
  onNotes: () => void
  onDone: () => void
}

/** The big card of the Today screen: "Now · 11:00–13:00" (or "Next"), title, details, Notes / Done ✓. */
export function NowCard({ item, isCurrent, onNotes, onDone }: NowCardProps) {
  const { t } = useTranslation()
  const formatDuration = useFormatDuration()
  const titleId = useId()
  const range = timeRange(item)
  const label = isCurrent
    ? range
      ? t('today.now', { range })
      : t('today.nowNoTime')
    : range
      ? t('today.next', { range })
      : t('today.nextNoTime')
  const details = [item.location, item.note, item.durationMin ? formatDuration(item.durationMin) : '']
    .filter(Boolean)
    .join(' · ')

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <p className={styles.label}>{label}</p>
      <h2 id={titleId} className={styles.title}>
        {item.title}
      </h2>
      <p className={styles.meta}>{details || t(`plan.categories.${item.category}`)}</p>
      <div className={styles.actions}>
        <button type="button" className={styles.button} onClick={onNotes}>
          {t('today.notes')}
        </button>
        <button type="button" className={`${styles.button} ${styles.fill}`} onClick={onDone}>
          {t('today.done')}
        </button>
      </div>
    </section>
  )
}
