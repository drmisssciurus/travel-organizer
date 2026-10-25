import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { TripCard } from '@/components/trips/TripCard'
import { useTripDialogs } from '@/components/trips/TripDialogs'
import { TripsTable } from '@/components/trips/TripsTable'
import { TripsToolbar } from '@/components/trips/TripsToolbar'
import { Button, EmptyState } from '@/components/ui'
import { useAppSelector } from '@/hooks/store'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useToday } from '@/hooks/useToday'
import { DEFAULT_TRIPS_LIST, useTripsListParams } from '@/hooks/useTripsListParams'
import {
  filterTripRows,
  selectTripRows,
  selectTripsSummary,
  sortTripRows,
  type TripStatusFilter,
} from '@/store/selectors/tripsTable'
import { selectLanguage } from '@/store/slices/settingsSlice'
import { paths } from '@/routes/paths'
import styles from './TripsPage.module.css'

/**
 * Trips list.
 * - Toolbar: search, status filter (+ sort select on narrow screens); all three are kept in the URL.
 * - Desktop (> 860px): table with column sorting; narrow screens: cards.
 * - "New trip": button in the page header (desktop), floating button (mobile ≤ 720px); after creation → the trip's plan.
 * - Delete (desktop table ×): confirmation → cascade delete → toast with Undo.
 */
export default function TripsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('trips.title'))
  const navigate = useNavigate()
  const today = useToday()
  const language = useAppSelector(selectLanguage)
  const rows = useAppSelector((state) => selectTripRows(state, today))
  const summary = useAppSelector((state) => selectTripsSummary(state, today))
  // Search, status filter and sort live in the URL (see useTripsListParams)
  const [{ q, status, sort }, updateParams] = useTripsListParams()
  // New trip → straight to its plan
  const { openCreate, openEdit, requestDelete, dialogs } = useTripDialogs({
    onCreated: (trip) => void navigate(paths.trip(trip.id)),
  })

  const visibleRows = useMemo(
    () => sortTripRows(filterTripRows(rows, q, status), sort.key, sort.dir, language),
    [rows, q, status, sort, language],
  )
  const counts: Record<TripStatusFilter, number> = {
    all: summary.total,
    upcoming: summary.upcoming,
    ongoing: summary.ongoing,
    past: summary.past,
  }
  const resetFilters = () => updateParams({ q: DEFAULT_TRIPS_LIST.q, status: DEFAULT_TRIPS_LIST.status })

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>{t('trips.title')}</h1>
          {summary.total > 0 && (
            <p className="meta">
              {[
                t('trips.summary.total', { count: summary.total }),
                t('trips.summary.ongoing', { count: summary.ongoing }),
                t('trips.summary.upcoming', { count: summary.upcoming }),
              ].join(' · ')}
            </p>
          )}
        </div>
        {rows.length > 0 && (
          <Button variant="primary" icon="+" className={styles.newButton} onClick={openCreate}>
            {t('trips.newTrip')}
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon="✈"
          title={t('trips.empty.title')}
          description={t('trips.empty.hint')}
          action={
            <Button variant="primary" icon="+" onClick={openCreate}>
              {t('trips.newTrip')}
            </Button>
          }
        />
      ) : (
        <>
          <TripsToolbar
            query={q}
            onQueryChange={(value) => updateParams({ q: value })}
            status={status}
            onStatusChange={(value) => updateParams({ status: value })}
            counts={counts}
            sort={sort}
            onSortChange={(value) => updateParams({ sort: value })}
          />

          {visibleRows.length === 0 ? (
            <EmptyState
              icon="?"
              title={t('trips.noResults.title')}
              description={
                q.trim()
                  ? t('trips.noResults.query', { query: q.trim() })
                  : t('trips.noResults.status', { status: t(`trips.filters.${status}`) })
              }
              action={<Button onClick={resetFilters}>{t('trips.noResults.reset')}</Button>}
            />
          ) : (
            <>
              {/* Both views are rendered, CSS shows one: no resize listeners, no layout jump on load */}
              <div className={styles.table}>
                <TripsTable
                  rows={visibleRows}
                  sort={sort}
                  onSortChange={(value) => updateParams({ sort: value })}
                  today={today}
                  onEdit={openEdit}
                  onDelete={requestDelete}
                />
              </div>
              <ul className={styles.cards}>
                {visibleRows.map((row) => (
                  <li key={row.trip.id}>
                    <TripCard row={row} today={today} />
                  </li>
                ))}
              </ul>
            </>
          )}

          <Button variant="primary" icon="+" className={styles.fab} onClick={openCreate}>
            {t('trips.newTrip')}
          </Button>
        </>
      )}

      {dialogs}
    </>
  )
}
