import { describe, expect, it, vi } from 'vitest'
import { createDemoSnapshots } from '@/data/demoTrips'
import { loadState, STORAGE_KEY } from './persist'
import { sanitizeEntities, slicesFromSnapshots } from './sanitize'
import { selectTodayView } from './selectors/todaySelectors'
import { makeStore } from './index'

const save = (value: unknown) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
const trip = (id: string, extra: object = {}) => ({
  id,
  title: 'T',
  destination: 'Y',
  startDate: '2026-12-01',
  endDate: '2026-12-03',
  currency: 'EUR',
  dayIds: [],
  ideaIds: [],
  groupIds: [],
  createdAt: 1,
  updatedAt: 1,
  ...extra,
})

describe('loadState', () => {
  it('first launch → demo trips', () => {
    expect(loadState()?.trips?.ids).toHaveLength(1)
  })

  it('unreadable data → treated as a first launch', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {}) // the expected "failed to read"
    localStorage.setItem(STORAGE_KEY, '{oops')
    expect(loadState()?.trips?.ids).toHaveLength(1)
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })

  it('all trips deleted → the demo does not come back', () => {
    save({ version: 4, state: { settings: {}, trips: { ids: [], entities: {} } } })
    expect(loadState()?.trips?.ids).toHaveLength(0)
  })

  it('data from a newer version is ignored (no demo either)', () => {
    save({ version: 99, state: {} })
    expect(loadState()).toBeUndefined()
  })

  it('v2 → v4: existing trips get days and the tasks group; expenses appear', () => {
    save({ version: 2, state: { settings: { theme: 'dark', language: 'en' }, trips: { ids: ['x'], entities: { x: trip('x') } } } })
    const state = loadState()!
    expect(state.settings).toEqual({ theme: 'dark', language: 'en' })
    expect(state.trips!.entities.x!.dayIds).toHaveLength(3)
    expect(state.checklistGroups!.ids).toHaveLength(1)
    expect(state.expenses!.ids).toHaveLength(0)
  })
})

describe('sanitize', () => {
  it('drops broken entities one by one and repairs references', () => {
    const state = sanitizeEntities({
      trips: { entities: { x: trip('x', { endDate: '2026-12-02', dayIds: ['ghost'], ideaIds: ['ghost'] }), bad: trip('bad', { startDate: '2026-02-30' }) } },
      days: {
        entities: {
          d1: { id: 'd1', tripId: 'x', date: '2026-12-01', itemIds: ['i2', 'ghost'] },
          d2: { id: 'd2', tripId: 'x', date: '2026-12-02', itemIds: [] },
          orphan: { id: 'orphan', tripId: 'nope', date: '2026-12-02', itemIds: [] },
        },
      },
      items: {
        entities: {
          i1: { id: 'i1', tripId: 'x', dayId: 'd1', title: 'A', category: 'food', needsBooking: true, bookingTaskId: 'missing', done: false },
          i2: { id: 'i2', tripId: 'x', dayId: 'gone', title: 'B', category: 'food', needsBooking: false, done: false },
          bad: { id: 'bad', tripId: 'x', dayId: null, title: 'C', category: 'pizza', needsBooking: false, done: false },
        },
      },
      expenses: { entities: { e1: { id: 'e1', tripId: 'x', title: 'Z', amount: -5, category: 'food' } } },
    })
    const x = state.trips.entities.x!
    expect(state.trips.ids).toEqual(['x'])
    expect(x.dayIds).toEqual(['d1', 'd2'])
    expect(state.days.entities.orphan).toBeUndefined()
    expect(state.items.entities.i2!.dayId).toBeNull() // its day is gone → idea
    expect(x.ideaIds).toEqual(['i2'])
    expect(state.days.entities.d1!.itemIds).toEqual(['i1'])
    expect(state.items.entities.i1!.needsBooking).toBe(false) // task missing
    expect(state.items.entities.bad).toBeUndefined()
    expect(state.checklistGroups.ids).toHaveLength(1) // tasks group recreated
    expect(state.expenses.ids).toHaveLength(0)
  })

  it('demo data is consistent: sanitize changes nothing', () => {
    const demo = JSON.parse(JSON.stringify(slicesFromSnapshots(createDemoSnapshots('2026-10-02', 'ru', 1))))
    expect(JSON.parse(JSON.stringify(sanitizeEntities(demo)))).toEqual(demo)
  })
})

describe('Today', () => {
  const store = makeStore(slicesFromSnapshots(createDemoSnapshots('2026-10-25', 'en', 1)))

  it('ongoing demo trip: Prague, day 3 of 9', () => {
    const view = selectTodayView(store.getState(), '2026-10-30')
    expect(view).toMatchObject({ kind: 'ongoing', dayNumber: 3, totalDays: 9 })
  })

  it('before it → the upcoming trip; after it → none', () => {
    expect(selectTodayView(store.getState(), '2026-10-25')).toMatchObject({ kind: 'upcoming', daysUntil: 3 })
    expect(selectTodayView(store.getState(), '2028-01-01').kind).toBe('none')
  })
})
