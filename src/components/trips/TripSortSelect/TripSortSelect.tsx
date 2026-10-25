import { useTranslation } from 'react-i18next'
import { Select, type SelectOption } from '@/components/ui'
import { TRIP_SORT_KEYS, type SortDir, type TripSort } from '@/store/selectors/tripsTable'

type SortValue = `${TripSort['key']}_${SortDir}`

const DIRS: SortDir[] = ['asc', 'desc']
const VALUES = TRIP_SORT_KEYS.flatMap((key) => DIRS.map((dir): SortValue => `${key}_${dir}`))

const toValue = (sort: TripSort): SortValue => `${sort.key}_${sort.dir}`
function fromValue(value: string): TripSort | undefined {
  const [key, dir] = value.split('_')
  const match = TRIP_SORT_KEYS.find((k) => k === key)
  return match && (dir === 'asc' || dir === 'desc') ? { key: match, dir } : undefined
}

export interface TripSortSelectProps {
  sort: TripSort
  onSortChange: (sort: TripSort) => void
  className?: string
}

/**
 * Sorting on mobile, where there are no column headers: one native <select>
 * with every "column + direction" pair, so any sort chosen on desktop
 * (e.g. "Title Z→A") is still shown correctly after resizing.
 */
export function TripSortSelect({ sort, onSortChange, className }: TripSortSelectProps) {
  const { t } = useTranslation()
  const options: SelectOption<SortValue>[] = VALUES.map((value) => ({ value, label: t(`trips.sort.${value}`) }))

  return (
    <Select
      pill
      className={className}
      aria-label={t('trips.sort.label')}
      options={options}
      value={toValue(sort)}
      onChange={(event) => {
        const next = fromValue(event.target.value)
        if (next) onSortChange(next)
      }}
    />
  )
}
