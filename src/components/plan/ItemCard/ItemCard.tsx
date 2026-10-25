import type { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/hooks/store'
import { selectLanguage } from '@/store/slices/settingsSlice'
import type { ChecklistItem, ItineraryItem } from '@/types'
import { cx } from '@/utils/cx'
import { formatShortDate } from '@/utils/format'
import { useFormatDuration } from '../useFormatDuration'
import styles from './ItemCard.module.css'

export interface ItemCardProps extends ComponentProps<'div'> {
  item: ItineraryItem
  /** The linked booking task (for "needs booking · by 5 Oct" / "✓ booked") */
  bookingTask?: ChecklistItem
  /** Faded out by the category filter */
  dimmed?: boolean
  /** Placeholder left in the column while the card is being dragged */
  ghost?: boolean
  /** The floating copy under the pointer while dragging */
  overlay?: boolean
}

/**
 * A stop on the plan board: title · time, place · note · duration, booking state, category.
 * Presentational — dragging and clicks are wired by `SortableItemCard`.
 */
export function ItemCard({ item, bookingTask, dimmed, ghost, overlay, className, ...rest }: ItemCardProps) {
  const { t } = useTranslation()
  const language = useAppSelector(selectLanguage)
  const formatDuration = useFormatDuration()
  const sub = [item.location, item.note, item.durationMin ? formatDuration(item.durationMin) : '']
    .filter(Boolean)
    .join(' · ')

  let booking: string | undefined
  if (item.needsBooking) {
    if (bookingTask?.done) booking = t('plan.booked')
    else if (bookingTask?.dueDate)
      booking = t('plan.needsBookingBy', { date: formatShortDate(bookingTask.dueDate, language) })
    else booking = t('plan.needsBooking')
  }

  return (
    <div
      className={cx(
        styles.card,
        dimmed && styles.dimmed,
        item.done && styles.done,
        ghost && styles.ghost,
        overlay && styles.overlay,
        className,
      )}
      {...rest}
    >
      <div className={styles.top}>
        <span className={styles.title}>
          {item.done && <span aria-label={t('plan.done')}>✓ </span>}
          {item.title}
        </span>
        {item.time && <span className="num">{item.time}</span>}
      </div>
      {sub && <div className={styles.sub}>{sub}</div>}
      {booking && <div className={cx(styles.booking, bookingTask?.done && styles.booked)}>{booking}</div>}
      {/* Typed place that was not found on the map */}
      {item.location && !item.coords && <div className={styles.noPlace}>{t('plan.place.notOnMap')}</div>}
      <div className={styles.bottom}>
        <span className={styles.category}>
          <span className={styles.dot} style={{ background: `var(--color-cat-${item.category})` }} aria-hidden="true" />
          {t(`plan.categories.${item.category}`)}
        </span>
        <span className={styles.grip} aria-hidden="true">
          ⠿
        </span>
      </div>
    </div>
  )
}
