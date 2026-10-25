import { useEffect, useState } from 'react'
import { findPlace } from '@/api/geocode'
import type { GeoPoint } from '@/types'
import { useAppSelector } from './store'
import { selectLanguage } from '@/store/slices/settingsSlice'

/**
 * Coordinates of a trip destination ("Lisbon, Portugal"), found once and cached
 * for the session by the geocoder. `undefined` while loading, offline or not found:
 * callers work without it (search without a bias, map fitted to the points).
 */
export function useDestinationPoint(destination: string | undefined): GeoPoint | undefined {
  const language = useAppSelector(selectLanguage)
  const [found, setFound] = useState<{ query: string; point?: GeoPoint }>()
  const query = destination?.trim() ?? ''

  useEffect(() => {
    if (!query) return
    let current = true
    findPlace(query, { language }).then(
      (place) => current && setFound({ query, point: place?.coords }),
      () => {}, // no network — no bias, that's fine
    )
    return () => {
      current = false
    }
  }, [query, language])

  // A result for a previous destination is ignored (the trip was edited)
  return found?.query === query ? found.point : undefined
}
