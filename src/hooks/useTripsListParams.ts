import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import {
  TRIP_SORT_KEYS,
  TRIP_STATUS_FILTERS,
  type TripSort,
  type TripStatusFilter,
} from '@/store/selectors/tripsTable'
import { isOneOf } from '@/utils/guards'

/**
 * Trips list state in the URL: `/?q=lis&status=upcoming&sort=title&dir=desc`.
 * - a link to a filtered list can be shared or bookmarked;
 * - going into a trip and pressing Back returns to the same search, filter and sort;
 * - default values are omitted, so the plain list stays at `/`.
 * Invalid values in a hand-edited URL fall back to the defaults.
 */

export interface TripsListParams {
  q: string
  status: TripStatusFilter
  sort: TripSort
}

export const DEFAULT_TRIPS_LIST: TripsListParams = {
  q: '',
  status: 'all',
  sort: { key: 'dates', dir: 'asc' },
}

export function parseTripsListParams(search: URLSearchParams): TripsListParams {
  const status = search.get('status')
  const key = search.get('sort')
  const dir = search.get('dir')
  return {
    q: search.get('q') ?? '',
    status: isOneOf(TRIP_STATUS_FILTERS, status) ? status : DEFAULT_TRIPS_LIST.status,
    sort: isOneOf(TRIP_SORT_KEYS, key)
      ? { key, dir: dir === 'desc' ? 'desc' : 'asc' }
      : DEFAULT_TRIPS_LIST.sort,
  }
}

export function serializeTripsListParams({ q, status, sort }: TripsListParams): URLSearchParams {
  const search = new URLSearchParams()
  if (q) search.set('q', q)
  if (status !== DEFAULT_TRIPS_LIST.status) search.set('status', status)
  const { key, dir } = DEFAULT_TRIPS_LIST.sort
  if (sort.key !== key || sort.dir !== dir) {
    search.set('sort', sort.key)
    search.set('dir', sort.dir)
  }
  return search
}

/**
 * Reads the params and returns `update(patch)`.
 * `replace: true` — typing or clicking a sort column doesn't fill the browser history:
 * Back leaves the list instead of undoing each keystroke.
 */
export function useTripsListParams() {
  const [search, setSearch] = useSearchParams()
  const params = useMemo(() => parseTripsListParams(search), [search])

  const update = useCallback(
    (patch: Partial<TripsListParams>) =>
      setSearch((prev) => serializeTripsListParams({ ...parseTripsListParams(prev), ...patch }), {
        replace: true,
        // The search input is controlled by the URL. By default React Router applies the change
        // in a transition (later), the input re-renders with the old value and fast typing loses
        // characters. flushSync applies it immediately, like a normal useState.
        flushSync: true,
      }),
    [setSearch],
  )

  return [params, update] as const
}
