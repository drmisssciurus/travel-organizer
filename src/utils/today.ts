import type { ItineraryItem, TimeHHmm } from '@/types'

/** Duration assumed for a stop without one — to know when it ends. */
export const DEFAULT_DURATION_MIN = 60

/** "09:30" → 570 */
export function toMinutes(time: TimeHHmm): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/** 570 → "09:30" (wraps past midnight: 1500 → "01:00") */
export function fromMinutes(total: number): TimeHHmm {
  const minutes = ((total % 1440) + 1440) % 1440
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

/** "11:00–13:00", "11:00" without a duration, "" without a time. */
export function timeRange(item: Pick<ItineraryItem, 'time' | 'durationMin'>): string {
  if (!item.time) return ''
  if (!item.durationMin) return item.time
  return `${item.time}–${fromMinutes(toMinutes(item.time) + item.durationMin)}`
}

export interface DayAgenda {
  /** The stop happening right now (its time window contains `now`) */
  current?: ItineraryItem
  /** What the big card shows: the current stop, otherwise the next one */
  hero?: ItineraryItem
  /** Remaining stops after the hero ("Next") */
  rest: ItineraryItem[]
  /** All stops of the day are done (and there were some) */
  allDone: boolean
}

/**
 * Today's agenda from the day's stops (in plan order) and the current time in minutes.
 * - done stops are skipped;
 * - "current" — a stop whose [time, time + duration) contains now;
 * - stops whose time has passed without being marked done are not "next" anymore,
 *   stops without a time stay in the list (they can happen any time).
 */
export function planDayAgenda(items: readonly ItineraryItem[], nowMinutes: number): DayAgenda {
  const open = items.filter((item) => !item.done)
  const end = (item: ItineraryItem) => toMinutes(item.time!) + (item.durationMin ?? DEFAULT_DURATION_MIN)
  const current = open.find((item) => item.time && toMinutes(item.time) <= nowMinutes && nowMinutes < end(item))
  const upcoming = open.filter((item) => item !== current && (!item.time || toMinutes(item.time) >= nowMinutes))
  const hero = current ?? upcoming[0]
  return {
    current,
    hero,
    rest: upcoming.filter((item) => item !== hero),
    allDone: items.length > 0 && open.length === 0,
  }
}
