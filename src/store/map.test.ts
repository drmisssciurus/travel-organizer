import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeStore } from '@/store'
import { selectBoard } from './selectors/planSelectors'
import {
  buildTripMap,
  dayColor,
  IDEA_COLOR,
  parseMapFilter,
  selectTripMap,
  serializeMapFilter,
  toggleMapLayer,
} from './selectors/mapSelectors'
import { sanitizeGeoPoint } from './sanitize'
import { locateItem, setItemCoords } from './thunks/mapThunks'
import { addItem, moveItem } from './thunks/planThunks'
import { createTrip } from './thunks/tripThunks'

let store: ReturnType<typeof makeStore>
const ROME = { lat: 41.89, lng: 12.49 }
const COLOSSEUM = { lat: 41.8902, lng: 12.4922 }

beforeEach(() => {
  store = makeStore({})
})

function setup() {
  const trip = store.dispatch(
    createTrip({ title: 'Rome', destination: 'Rome, Italy', currency: 'EUR', startDate: '2026-11-10', endDate: '2026-11-11' }),
  )
  const [d1, d2] = selectBoard(store.getState(), trip.id)!.days.map(({ day }) => day.id)
  const add = (title: string, place: string | null, extra: object = {}) =>
    store.dispatch(addItem(trip.id, { title, category: 'sight', place, needsBooking: false, ...extra }))
  return { trip, d1: d1!, d2: d2!, add }
}
const map = (tripId: string) => selectTripMap(store.getState(), tripId)!

describe('map layers', () => {
  it('splits a day into stops (with a point) and unplaced items, in plan order', () => {
    const { trip, d1, add } = setup()
    add('Colosseum', d1, { coords: COLOSSEUM })
    add('Lunch', d1)
    add('Forum', d1, { coords: { lat: 41.8925, lng: 12.4853 } })
    add('Pantheon idea', null, { coords: { lat: 41.8986, lng: 12.4769 } })

    const { layers, total } = map(trip.id)
    expect(layers.map((layer) => layer.key)).toEqual(['1', '2', 'ideas'])
    expect(layers[0]!.stops.map(({ item }) => item.title)).toEqual(['Colosseum', 'Forum'])
    expect(layers[0]!.unplaced.map((item) => item.title)).toEqual(['Lunch'])
    expect(layers[2]!.stops).toHaveLength(1)
    expect(total).toBe(3)
  })

  it('follows drag-and-drop: a stop moved to another day changes its layer', () => {
    const { trip, d1, d2, add } = setup()
    const a = add('A', d1, { coords: ROME })
    add('B', d1, { coords: COLOSSEUM })
    store.dispatch(moveItem(a.id, d2, 0))
    const [day1, day2] = map(trip.id).layers
    expect(day1!.stops.map(({ item }) => item.title)).toEqual(['B'])
    expect(day2!.stops.map(({ item }) => item.title)).toEqual(['A'])
  })

  it('is memoized while the plan does not change', () => {
    const { trip } = setup()
    expect(map(trip.id)).toBe(map(trip.id))
    expect(buildTripMap(selectBoard(store.getState(), trip.id)!)).toEqual(map(trip.id))
  })

  it('day colors cycle through the palette', () => {
    expect(dayColor(9)).toBe(dayColor(1))
    expect(dayColor(2)).not.toBe(dayColor(1))
    expect(dayColor(null)).toBe(IDEA_COLOR)
  })
})

describe('map filter (URL)', () => {
  it('parses known keys, anything else means "all"', () => {
    const { trip, d1, add } = setup()
    add('A', d1, { coords: ROME })
    const { layers } = map(trip.id)
    expect([...parseMapFilter('2,ideas,99,x', layers)!]).toEqual(['2', 'ideas'])
    expect(parseMapFilter('99', layers)).toBeNull()
    expect(parseMapFilter(null, layers)).toBeNull()
  })

  it('toggling the last layer off goes back to "all"', () => {
    const one = toggleMapLayer(null, '1')
    expect(serializeMapFilter(one)).toBe('1')
    expect(serializeMapFilter(toggleMapLayer(one, 'ideas'))).toBe('1,ideas')
    expect(toggleMapLayer(one, '1')).toBeNull()
    expect(serializeMapFilter(null)).toBeNull()
  })
})

describe('points', () => {
  it('sanitize keeps valid coordinates and drops broken ones', () => {
    expect(sanitizeGeoPoint({ lat: 41.9, lng: 12.5, extra: 1 })).toEqual({ lat: 41.9, lng: 12.5 })
    expect(sanitizeGeoPoint({ lat: 91, lng: 0 })).toBeUndefined()
    expect(sanitizeGeoPoint({ lat: '41', lng: 12 })).toBeUndefined()
    expect(sanitizeGeoPoint(null)).toBeUndefined()
  })

  it('setItemCoords sets a point with "Undo" that restores the previous one', () => {
    const { trip, d1, add } = setup()
    const item = add('A', d1, { coords: ROME })
    store.dispatch(setItemCoords(item.id, COLOSSEUM))
    expect(store.getState().items.entities[item.id]!.coords).toEqual(COLOSSEUM)
    const toast = store.getState().toasts.at(-1)!
    expect(toast.message).toContain('moved')
    store.dispatch(toast.undo!)
    expect(store.getState().items.entities[item.id]!.coords).toEqual(ROME)
    expect(map(trip.id).total).toBe(1)
  })
})

// `fetch` is stubbed per test. No `vi.unstubAllGlobals()`: it would also remove
// the in-memory localStorage that src/test/setup.ts installs.
describe('locateItem (background geocoding)', () => {
  const answer = (features: object[]) => ({ ok: true, json: async () => ({ features }) })
  const colosseum = { geometry: { coordinates: [COLOSSEUM.lng, COLOSSEUM.lat] }, properties: { name: 'Colosseum' } }

  it('finds a typed place and puts the item on the map', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer([colosseum])))
    const { d1, add } = setup()
    const item = add('Colosseum', d1, { location: 'Colosseo' })
    await store.dispatch(locateItem(item.id))
    expect(store.getState().items.entities[item.id]!.coords).toEqual(COLOSSEUM)
  })

  it('not found → a toast, the item stays without a point', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer([])))
    const { d1, add } = setup()
    const item = add('Secret bar', d1, { location: 'Unfindable place 123' })
    await store.dispatch(locateItem(item.id))
    expect(store.getState().items.entities[item.id]!.coords).toBeUndefined()
    expect(store.getState().toasts.at(-1)!.message).toContain('Unfindable place 123')
  })

  it('offline → nothing changes, no toast', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const { d1, add } = setup()
    const item = add('Offline place', d1, { location: 'Somewhere offline' })
    const toasts = store.getState().toasts.length
    await store.dispatch(locateItem(item.id))
    expect(store.getState().items.entities[item.id]!.coords).toBeUndefined()
    expect(store.getState().toasts).toHaveLength(toasts)
  })

  it('does nothing for a picked place (already has a point)', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { d1, add } = setup()
    const item = add('Colosseum', d1, { location: 'Colosseum, Rome', coords: COLOSSEUM })
    await store.dispatch(locateItem(item.id))
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
