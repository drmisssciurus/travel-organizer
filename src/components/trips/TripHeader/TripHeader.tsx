import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Avatar, Button, CloseIcon, EditIcon, IconButton, ProgressBar } from '@/components/ui'
import { useAppSelector } from '@/hooks/store'
import { paths } from '@/routes/paths'
import { selectTripChecklist } from '@/store/selectors/planSelectors'
import { selectLanguage } from '@/store/slices/settingsSlice'
import type { ISODate, Trip } from '@/types'
import { formatDateRange } from '@/utils/format'
import { readiness } from '@/utils/readiness'
import { daysUntilStart, getTripStatus, tripDuration } from '@/utils/tripStatus'
import { TripStatusBadge } from '../TripStatusBadge'
import styles from './TripHeader.module.css'

export interface TripHeaderProps {
  trip: Trip
  today: ISODate
  onEdit: () => void
  onDelete: () => void
}

/**
 * Trip page header: back, avatar, title + status ("Upcoming · in 12 days"),
 * dates · days · destination, readiness bar, Edit / Delete, collapsible notes.
 * On phones the buttons become icons (labels stay for screen readers).
 */
export function TripHeader({ trip, today, onEdit, onDelete }: TripHeaderProps) {
  const { t } = useTranslation()
  const language = useAppSelector(selectLanguage)
  const checklist = useAppSelector((state) => selectTripChecklist(state, trip.id))
  const ready = readiness(checklist)
  const days = tripDuration(trip)

  return (
    <div className={styles.header}>
      <div className={styles.row}>
        <Link to={paths.trips()} className={styles.back} aria-label={t('trip.back')}>
          ←
        </Link>
        <Avatar name={trip.title} seed={trip.id} size="lg" className={styles.avatar} />
        <div className={styles.main}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{trip.title}</h1>
            <TripStatusBadge
              status={getTripStatus(trip, today)}
              daysUntilStart={daysUntilStart(trip, today)}
              variant="long"
            />
          </div>
          <p className="meta">
            <span className="num">{formatDateRange(trip.startDate, trip.endDate, language, today)}</span>
            {' · '}
            {t('common.days', { count: days })}
            {' · '}
            {trip.destination}
          </p>
        </div>

        <div className={styles.ready}>
          <div className={styles.readyTop}>
            <span className="label">{t('trip.readiness')}</span>
            <b className="num">{ready.percent === null ? '—' : `${ready.percent}%`}</b>
          </div>
          <ProgressBar
            value={ready.percent ?? 0}
            label={t('trip.readiness')}
            valueText={
              ready.percent === null ? t('trips.table.readyNone') : t('trip.readyOf', { done: ready.done, total: ready.total })
            }
          />
        </div>

        <div className={styles.actions}>
          {/* Text buttons on wide screens, icon buttons on phones (one of the pair is hidden by CSS) */}
          <Button className={styles.wide} icon={<EditIcon />} onClick={onEdit}>
            {t('actions.edit')}
          </Button>
          <Button className={styles.wide} variant="dangerOutline" icon={<CloseIcon />} onClick={onDelete}>
            {t('actions.delete')}
          </Button>
          <IconButton className={styles.narrow} icon={<EditIcon />} label={t('actions.edit')} onClick={onEdit} />
          <IconButton className={styles.narrow} icon={<CloseIcon />} variant="danger" label={t('actions.delete')} onClick={onDelete} />
        </div>
      </div>

      {trip.notes && (
        // Native disclosure: keyboard, screen readers and the open/closed state for free
        <details className={styles.notes}>
          <summary>{t('trip.notes')}</summary>
          <p>{trip.notes}</p>
        </details>
      )}
    </div>
  )
}
