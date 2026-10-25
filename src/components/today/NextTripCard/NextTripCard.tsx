import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { TripStatusBadge } from '@/components/trips/TripStatusBadge'
import { Avatar, ButtonLink, ProgressBar } from '@/components/ui'
import { useAppSelector } from '@/hooks/store'
import { paths } from '@/routes/paths'
import { selectLanguage } from '@/store/slices/settingsSlice'
import type { ISODate, Trip } from '@/types'
import { formatDateRange } from '@/utils/format'
import type { Readiness } from '@/utils/readiness'
import styles from './NextTripCard.module.css'

export interface NextTripCardProps {
  trip: Trip
  daysUntil: number
  readiness: Readiness
  today: ISODate
}

/** No trip today → the nearest upcoming one: countdown, dates, readiness, "Open trip". */
export function NextTripCard({ trip, daysUntil, readiness, today }: NextTripCardProps) {
  const { t } = useTranslation()
  const language = useAppSelector(selectLanguage)
  const titleId = useId()
  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <p className="label">{t('today.nextTrip')}</p>
      <div className={styles.row}>
        <Avatar name={trip.title} seed={trip.id} size="lg" />
        <div className={styles.main}>
          <h2 id={titleId} className={styles.title}>
            {trip.title}
          </h2>
          <p className="meta">
            {formatDateRange(trip.startDate, trip.endDate, language, today)} · {trip.destination}
          </p>
        </div>
        <TripStatusBadge status="upcoming" daysUntilStart={daysUntil} isNext />
      </div>
      <div className={styles.ready}>
        <span>{t('trip.readiness')}</span>
        <b className="num">{readiness.percent === null ? '—' : `${readiness.percent}%`}</b>
      </div>
      <ProgressBar value={readiness.percent ?? 0} decorative />
      <ButtonLink to={paths.trip(trip.id)} variant="primary" fullWidth className={styles.open}>
        {t('today.openTrip')}
      </ButtonLink>
    </section>
  )
}
