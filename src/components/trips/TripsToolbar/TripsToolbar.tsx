import { useTranslation } from 'react-i18next'
import { Input, SegmentedControl } from '@/components/ui'
import { TRIP_STATUS_FILTERS, type TripSort, type TripStatusFilter } from '@/store/selectors/tripsTable'
import { TripSortSelect } from '../TripSortSelect'
import styles from './TripsToolbar.module.css'

export interface TripsToolbarProps {
  query: string
  onQueryChange: (query: string) => void
  status: TripStatusFilter
  onStatusChange: (status: TripStatusFilter) => void
  /** Number of trips per filter, shown on the segments */
  counts: Record<TripStatusFilter, number>
  sort: TripSort
  onSortChange: (sort: TripSort) => void
}

/**
 * Search + status filter (+ sort select on narrow screens, where the table headers are hidden).
 * Controlled: values come from the URL through the page.
 */
export function TripsToolbar(props: TripsToolbarProps) {
  const { query, onQueryChange, status, onStatusChange, counts, sort, onSortChange } = props
  const { t } = useTranslation()

  return (
    <div className={styles.toolbar} role="search">
      <Input
        type="search"
        variant="search"
        className={styles.search}
        placeholder={t('trips.filters.searchPlaceholder')}
        aria-label={t('trips.filters.search')}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <SegmentedControl
        className={styles.status}
        label={t('trips.filters.status')}
        value={status}
        onChange={onStatusChange}
        options={TRIP_STATUS_FILTERS.map((value) => ({
          value,
          label: t(`trips.filters.${value}`),
          count: counts[value],
        }))}
      />
      <TripSortSelect className={styles.sort} sort={sort} onSortChange={onSortChange} />
    </div>
  )
}
