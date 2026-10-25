import { describe, expect, it } from 'vitest'
import type { ItineraryItem } from '@/types'
import { fromMinutes, planDayAgenda, timeRange } from './today'

const item = (id: string, time?: string, durationMin?: number, done = false): ItineraryItem => ({
  id,
  tripId: 't',
  dayId: 'd',
  title: id,
  category: 'sight',
  time,
  durationMin,
  done,
  needsBooking: false,
})
const day = [item('breakfast', '09:00', 45, true), item('market', '11:00', 120), item('lunch', '13:30'), item('anytime'), item('cable', '16:00', 120)]
const at = (hh: number, mm = 0) => hh * 60 + mm

describe('planDayAgenda', () => {
  it('a stop whose time window contains "now" is current', () => {
    const agenda = planDayAgenda(day, at(12))
    expect(agenda.current?.id).toBe('market')
    expect(agenda.rest.map((i) => i.id)).toEqual(['lunch', 'anytime', 'cable'])
  })

  it('between stops: the next one is the hero, missed stops drop out', () => {
    const agenda = planDayAgenda(day, at(13, 10))
    expect(agenda.current).toBeUndefined()
    expect(agenda.hero?.id).toBe('lunch')
    expect(agenda.rest.map((i) => i.id)).toEqual(['anytime', 'cable'])
  })

  it('a stop without a duration lasts 60 minutes', () => {
    expect(planDayAgenda(day, at(14, 20)).current?.id).toBe('lunch')
  })

  it('late evening: only stops without a time are left', () => {
    const agenda = planDayAgenda(day, at(23))
    expect(agenda.hero?.id).toBe('anytime')
    expect(agenda.rest).toEqual([])
  })

  it('allDone only when there were stops and all are done', () => {
    expect(planDayAgenda([item('x', '10:00', 30, true)], at(10)).allDone).toBe(true)
    expect(planDayAgenda([], at(10)).allDone).toBe(false)
  })
})

describe('time formatting', () => {
  it('timeRange', () => {
    expect(timeRange({ time: '11:00', durationMin: 120 })).toBe('11:00–13:00')
    expect(timeRange({ time: '23:30', durationMin: 90 })).toBe('23:30–01:00')
    expect(timeRange({ time: '11:00' })).toBe('11:00')
    expect(timeRange({})).toBe('')
    expect(fromMinutes(-30)).toBe('23:30')
  })
})
