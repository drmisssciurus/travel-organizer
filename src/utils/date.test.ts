import { describe, expect, it } from 'vitest'
import { addDays, diffDays, todayISO } from './date'
import { isISODate } from './guards'
import { dateRange, planDaysSync } from './tripDays'
import type { Day } from '@/types'

describe('date helpers', () => {
  it('todayISO uses the local date, not UTC', () => {
    expect(todayISO(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })

  it('diffDays is not broken by DST (UTC arithmetic)', () => {
    expect(diffDays('2026-03-20', '2026-04-02')).toBe(13)
    expect(diffDays('2026-10-05', '2026-10-01')).toBe(-4)
  })

  it('addDays crosses months, years and leap days', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29')
  })

  it('isISODate rejects impossible dates and wrong formats', () => {
    expect(isISODate('2026-02-28')).toBe(true)
    expect(isISODate('2026-02-30')).toBe(false)
    expect(isISODate('2026-2-3')).toBe(false)
    expect(isISODate(20260101)).toBe(false)
  })
})

describe('trip days', () => {
  it('dateRange is inclusive', () => {
    expect(dateRange('2026-10-30', '2026-11-02')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'])
  })

  it('planDaysSync matches days by date: kept days keep ids and items', () => {
    const days: Day[] = [
      { id: 'd10', tripId: 't', date: '2026-10-10', itemIds: ['a'] },
      { id: 'd11', tripId: 't', date: '2026-10-11', itemIds: ['b', 'c'] },
      { id: 'd12', tripId: 't', date: '2026-10-12', itemIds: [] },
    ]
    let n = 0
    const sync = planDaysSync({ id: 't' }, days, '2026-10-11', '2026-10-13', () => `new${++n}`)
    expect(sync.dayIds).toEqual(['d11', 'd12', 'new1'])
    expect(sync.removedDayIds).toEqual(['d10'])
    expect(sync.itemsToIdeas).toEqual(['a'])
    expect(sync.addedDays).toEqual([{ id: 'new1', tripId: 't', date: '2026-10-13', itemIds: [] }])
  })
})
