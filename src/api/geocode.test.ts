import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearGeocodeCache, findPlace, parsePhotonResponse, placeLabel, searchPlaces } from './geocode'

const feature = (properties: Record<string, unknown>, coordinates: unknown = [-9.216, 38.6916]) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates },
  properties,
})

describe('parsePhotonResponse', () => {
  it('turns features into places: [lng, lat] → { lat, lng }, name + context', () => {
    const places = parsePhotonResponse({
      features: [feature({ name: 'Belém Tower', city: 'Lisbon', country: 'Portugal' })],
    })
    expect(places).toEqual([{ name: 'Belém Tower', context: 'Lisbon, Portugal', coords: { lat: 38.6916, lng: -9.216 } }])
    expect(placeLabel(places[0]!)).toBe('Belém Tower, Lisbon, Portugal')
  })

  it('uses the street address when there is no name', () => {
    const [place] = parsePhotonResponse({
      features: [feature({ street: 'Rua de São Miguel', housenumber: '12', city: 'Lisbon', country: 'Portugal' })],
    })
    expect(place).toMatchObject({ name: 'Rua de São Miguel 12', context: 'Lisbon, Portugal' })
  })

  it('skips broken features and duplicates', () => {
    const places = parsePhotonResponse({
      features: [
        null,
        feature({ name: 'No coords' }, 'oops'),
        feature({}),
        feature({ name: 'Sintra', country: 'Portugal' }),
        feature({ name: 'Sintra', country: 'Portugal' }, [-9.39, 38.8]),
      ],
    })
    expect(places.map((place) => place.name)).toEqual(['Sintra'])
    expect(parsePhotonResponse('not json')).toEqual([])
  })
})

describe('searchPlaces', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    clearGeocodeCache()
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ features: [feature({ name: 'Belém Tower' })] }) })
    // No `vi.unstubAllGlobals()` afterwards: it would also remove setup.ts's localStorage
    vi.stubGlobal('fetch', fetchMock)
  })

  it('does not search for less than 3 characters', async () => {
    expect(await searchPlaces(' Be ', { language: 'en' })).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends the query, the language Photon knows and the bias point', async () => {
    await searchPlaces('Belém', { language: 'en', near: { lat: 38.7223, lng: -9.1393 } })
    const url = new URL(String(fetchMock.mock.calls[0]![0]))
    expect(url.searchParams.get('q')).toBe('Belém')
    expect(url.searchParams.get('lang')).toBe('en')
    expect(url.searchParams.get('lat')).toBe('38.72')
    expect(url.searchParams.get('lon')).toBe('-9.14')
    // Russian is not supported by Photon → local names, no `lang`
    await searchPlaces('Белен', { language: 'ru' })
    expect(new URL(String(fetchMock.mock.calls[1]![0])).searchParams.has('lang')).toBe(false)
  })

  it('caches the same query, but not a failed one', async () => {
    await searchPlaces('Belém', { language: 'en' })
    await searchPlaces(' belém ', { language: 'en' })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    fetchMock.mockResolvedValueOnce({ ok: false, status: 429 })
    await expect(searchPlaces('Sintra', { language: 'en' })).rejects.toThrow('429')
    await Promise.resolve() // let the cache drop the failed request
    expect(await searchPlaces('Sintra', { language: 'en' })).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('findPlace returns the best match or undefined', async () => {
    expect(await findPlace('Belém', { language: 'en' })).toMatchObject({ name: 'Belém Tower' })
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ features: [] }) })
    expect(await findPlace('Nowhere at all', { language: 'en' })).toBeUndefined()
  })

  it('an aborted search rejects without breaking the cache', async () => {
    const controller = new AbortController()
    const search = searchPlaces('Belém', { language: 'en', signal: controller.signal })
    controller.abort()
    await expect(search).rejects.toBeDefined()
    expect(await searchPlaces('Belém', { language: 'en' })).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
