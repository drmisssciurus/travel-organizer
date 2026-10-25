import type { GeoPoint, Language } from '@/types'
import { isRecord } from '@/utils/guards'

/**
 * Place search (geocoding) through Photon — https://photon.komoot.io:
 * OpenStreetMap data, free, no API key, CORS enabled, and — unlike Nominatim,
 * whose usage policy forbids it — allowed for search-as-you-type.
 *
 * Fair use of the public server: the UI debounces input, and every query
 * is cached for the session (the same text is never requested twice).
 */

const PHOTON_URL = 'https://photon.komoot.io/api/'
/** Photon knows only these languages; for others it returns local names. */
const PHOTON_LANGUAGES: readonly string[] = ['en', 'de', 'fr']
export const MIN_QUERY_LENGTH = 3

export interface Place {
  /** Short name: “Belém Tower”, “Rua de São Miguel 12” */
  name: string
  /** Where it is: “Lisbon, Portugal” (may be empty) */
  context: string
  coords: GeoPoint
}

export interface SearchOptions {
  language: Language
  /** Prefer results near this point (the trip destination). */
  near?: GeoPoint
  limit?: number
  signal?: AbortSignal
}

const str = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : undefined)

/** Photon GeoJSON → places. Pure; unknown or broken features are skipped. */
export function parsePhotonResponse(json: unknown): Place[] {
  const features = isRecord(json) && Array.isArray(json.features) ? json.features : []
  const places: Place[] = []
  const seen = new Set<string>()
  for (const feature of features) {
    if (!isRecord(feature) || !isRecord(feature.geometry) || !isRecord(feature.properties)) continue
    const [lng, lat] = Array.isArray(feature.geometry.coordinates) ? feature.geometry.coordinates : []
    if (typeof lat !== 'number' || typeof lng !== 'number') continue
    const p = feature.properties
    const street = str(p.street)
    const address = street && [street, str(p.housenumber)].filter(Boolean).join(' ')
    const name = str(p.name) ?? address
    if (!name) continue
    const context = [name === address ? undefined : address, str(p.city) ?? str(p.county), str(p.country)]
      .filter((part): part is string => part !== undefined && part !== name)
      .join(', ')
    // The same object often comes back twice (a building and its node)
    const key = `${name}|${context}`
    if (seen.has(key)) continue
    seen.add(key)
    places.push({ name, context, coords: { lat, lng } })
  }
  return places
}

/** One label for the input: “Belém Tower, Lisbon, Portugal”. */
export const placeLabel = (place: Place) => (place.context ? `${place.name}, ${place.context}` : place.name)

const cache = new Map<string, Promise<Place[]>>()

/** Test helper. */
export function clearGeocodeCache() {
  cache.clear()
}

export function searchPlaces(query: string, { language, near, limit = 5, signal }: SearchOptions): Promise<Place[]> {
  const q = query.trim()
  if (q.length < MIN_QUERY_LENGTH) return Promise.resolve([])
  const params = new URLSearchParams({ q, limit: String(limit) })
  if (PHOTON_LANGUAGES.includes(language)) params.set('lang', language)
  if (near) {
    // ~1 km precision is enough for a bias and keeps the cache key stable
    params.set('lat', near.lat.toFixed(2))
    params.set('lon', near.lng.toFixed(2))
  }
  const key = params.toString().toLowerCase()
  let request = cache.get(key)
  if (!request) {
    request = fetch(`${PHOTON_URL}?${params}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Photon: HTTP ${response.status}`)
        return response.json() as Promise<unknown>
      })
      .then(parsePhotonResponse)
    // A failed request is not cached — the next attempt goes to the network again
    request.catch(() => cache.delete(key))
    cache.set(key, request)
  }
  // Abort only stops waiting: the shared request may still serve the cache
  return signal ? abortable(request, signal) : request
}

/** Best match for a typed text (background geocoding on save). */
export async function findPlace(query: string, options: SearchOptions): Promise<Place | undefined> {
  const [first] = await searchPlaces(query, { ...options, limit: 1 })
  return first
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(signal.reason)
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason)
    signal.addEventListener('abort', onAbort, { once: true })
    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort)
        resolve(value)
      },
      (error: unknown) => {
        signal.removeEventListener('abort', onAbort)
        reject(error instanceof Error ? error : new Error(String(error)))
      },
    )
  })
}
