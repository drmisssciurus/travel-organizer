import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Avatar, ProgressBar } from '@/components/ui'
import { useAppSelector } from '@/hooks/store'
import { paths } from '@/routes/paths'
import type { TripRow } from '@/store/selectors/tripsTable'
import { selectLanguage } from '@/store/slices/settingsSlice'
import type { ISODate } from '@/types'
import { formatDateRange, formatMoney } from '@/utils/format'
import { TripStatusBadge } from '../TripStatusBadge'
import styles from './TripCard.module.css'

export interface TripCardProps {
  row: TripRow
  today: ISODate
}

/**
 * Mobile trip card. The whole card is clickable through the "stretched link"
 * pattern: the title link's ::after covers the card. Unlike table rows,
 * a card is a normal block, so `position: relative` works everywhere.
 * No action buttons here — edit/delete live on the trip page on mobile.
 */
export function TripCard({ row, today }: TripCardProps) {
  const { t } = useTranslation()
  const language = useAppSelector(selectLanguage)
  const { trip, readiness } = row

  return (
    <article className={styles.card}>
      <Avatar name={trip.title} seed={trip.id} size="xl" />
      <div className={styles.body}>
        <h2 className={styles.title}>
          <Link to={paths.trip(trip.id)} className={styles.link}>
            {trip.title}
          </Link>
        </h2>
        <div className={styles.row}>
          <span className="num">{formatDateRange(trip.startDate, trip.endDate, language, today)}</span>
          <TripStatusBadge status={row.status} daysUntilStart={row.daysUntilStart} isNext={row.isNext} size="sm" />
        </div>
        <ProgressBar value={readiness.percent ?? 0} decorative size="sm" />
        <p className={styles.meta}>
          {readiness.percent === null
            ? t('trips.table.readyNone')
            : t('trips.table.readyPct', { percent: readiness.percent })}
          {' · '}
          <span className="num">{formatMoney(row.spent, trip.currency, language)}</span>
        </p>
      </div>
    </article>
  )
}
