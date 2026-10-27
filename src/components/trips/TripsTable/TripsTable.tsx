import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { Avatar, CloseIcon, EditIcon, IconButton, ProgressBar } from '@/components/ui'
import { useAppSelector } from '@/hooks/store'
import { paths } from '@/routes/paths'
import { nextTripSort, type TripRow, type TripSort, type TripSortKey } from '@/store/selectors/tripsTable'
import { selectLanguage } from '@/store/slices/settingsSlice'
import type { ISODate, Trip } from '@/types'
import { formatDateRange, formatMoney } from '@/utils/format'
import { TripStatusBadge } from '../TripStatusBadge'
import styles from './TripsTable.module.css'

export interface TripsTableProps {
  /** Rows in display order — sorting happens outside (`sortTripRows`). */
  rows: readonly TripRow[]
  sort: TripSort
  onSortChange: (sort: TripSort) => void
  /** Used to decide whether date ranges need a year. */
  today: ISODate
  /** Action buttons are shown only when handlers are passed (wired in 3.4 / 3.5). */
  onEdit?: (trip: Trip) => void
  onDelete?: (trip: Trip) => void
}

/**
 * Desktop trips table. Controlled: it shows `sort` and reports header clicks
 * through `onSortChange`, the page owns the state (later — the URL, stage 3.6).
 *
 * Semantics: a real <table> (screen readers announce columns and rows);
 * sortable headers are <button>s inside <th aria-sort>.
 * The trip title is the actual link; a click anywhere else on the row
 * is a mouse shortcut to the same place.
 */
export function TripsTable({ rows, sort, onSortChange, today, onEdit, onDelete }: TripsTableProps) {
  const { t } = useTranslation()
  const language = useAppSelector(selectLanguage)
  const navigate = useNavigate()
  const hasActions = Boolean(onEdit || onDelete)

  const sortHeader = (key: TripSortKey, label: string) => {
    const active = sort.key === key
    return (
      <th scope="col" aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
        <button
          type="button"
          className={styles.sortButton}
          data-active={active || undefined}
          onClick={() => onSortChange(nextTripSort(sort, key))}
        >
          {label}
          <span className={styles.arrow} aria-hidden="true">
            {active ? (sort.dir === 'asc' ? '↑' : '↓') : '↑↓'}
          </span>
        </button>
      </th>
    )
  }

  const onRowClick = (event: MouseEvent<HTMLTableRowElement>, trip: Trip) => {
    // Clicks on the link or the action buttons do their own thing
    if ((event.target as HTMLElement).closest('a, button')) return
    // Don't navigate when the user is selecting text
    if (window.getSelection()?.toString()) return
    void navigate(paths.trip(trip.id))
  }

  return (
    <table className={styles.table}>
      <caption className="visually-hidden">{t('trips.table.caption')}</caption>
      <thead>
        <tr>
          {sortHeader('title', t('trips.table.columns.trip'))}
          {sortHeader('dates', t('trips.table.columns.dates'))}
          <th scope="col">{t('trips.table.columns.days')}</th>
          {sortHeader('readiness', t('trips.table.columns.readiness'))}
          {sortHeader('spent', t('trips.table.columns.spent'))}
          <th scope="col">{t('trips.table.columns.status')}</th>
          {hasActions && (
            <th scope="col">
              <span className="visually-hidden">{t('trips.table.columns.actions')}</span>
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const { trip, readiness } = row
          return (
            <tr key={trip.id} className={styles.row} onClick={(event) => onRowClick(event, trip)}>
              <td>
                <div className={styles.trip}>
                  <Avatar name={trip.title} seed={trip.id} />
                  <div className={styles.tripText}>
                    <Link to={paths.trip(trip.id)} className={styles.title}>
                      {trip.title}
                    </Link>
                    <span className={styles.sub}>{trip.destination}</span>
                  </div>
                </div>
              </td>
              <td className="num">{formatDateRange(trip.startDate, trip.endDate, language, today)}</td>
              <td className="num">{row.duration}</td>
              <td>
                <ProgressBar value={readiness.percent ?? 0} decorative />
                <span className={styles.cellMeta}>
                  {readiness.percent === null
                    ? t('trips.table.readyNone')
                    : t('trips.table.readyPct', { percent: readiness.percent })}
                </span>
              </td>
              <td>
                <b className="num">{formatMoney(row.spent, trip.currency, language)}</b>
                <span className={styles.cellMeta}>{t('trips.table.expenses', { count: row.expenseCount })}</span>
              </td>
              <td>
                <TripStatusBadge status={row.status} daysUntilStart={row.daysUntilStart} isNext={row.isNext} />
              </td>
              {hasActions && (
                <td>
                  <div className={styles.actions}>
                    {onEdit && (
                      <IconButton
                        shape="square"
                        icon={<EditIcon />}
                        label={t('trips.table.editTrip', { title: trip.title })}
                        title={t('actions.edit')}
                        onClick={() => onEdit(trip)}
                      />
                    )}
                    {onDelete && (
                      <IconButton
                        shape="square"
                        variant="danger"
                        icon={<CloseIcon />}
                        label={t('trips.table.deleteTrip', { title: trip.title })}
                        title={t('actions.delete')}
                        onClick={() => onDelete(trip)}
                      />
                    )}
                  </div>
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
