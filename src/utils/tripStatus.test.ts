import { describe, expect, it } from 'vitest'
import { readiness } from './readiness'
import { daysUntilStart, getTripStatus, tripDuration } from './tripStatus'

const trip = { startDate: '2026-10-10', endDate: '2026-10-12' }

describe('trip status', () => {
  it.each([
    ['2026-10-09', 'upcoming'],
    ['2026-10-10', 'ongoing'],
    ['2026-10-12', 'ongoing'],
    ['2026-10-13', 'past'],
  ] as const)('on %s the trip is %s (both ends inclusive)', (today, status) => {
    expect(getTripStatus(trip, today)).toBe(status)
  })

  it('duration counts both ends', () => {
    expect(tripDuration(trip)).toBe(3)
    expect(tripDuration({ startDate: '2026-10-10', endDate: '2026-10-10' })).toBe(1)
  })

  it('days until start', () => {
    expect(daysUntilStart(trip, '2026-10-01')).toBe(9)
    expect(daysUntilStart(trip, '2026-10-10')).toBe(0)
  })
})

describe('readiness', () => {
  const items = (done: number, total: number) => Array.from({ length: total }, (_, i) => ({ done: i < done }))

  it('empty checklist → null ("—")', () => {
    expect(readiness([])).toEqual({ done: 0, total: 0, percent: null })
  })

  it('rounds down: 199 of 200 is not 100 %', () => {
    expect(readiness(items(3, 4)).percent).toBe(75)
    expect(readiness(items(199, 200)).percent).toBe(99)
    expect(readiness(items(5, 5)).percent).toBe(100)
  })
})
