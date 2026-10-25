import type { ChecklistItem } from '@/types'

/**
 * Trip readiness = (packed items + completed tasks) / (all checklist items).
 * Packing items and tasks are both `ChecklistItem`s, so this is simply
 * "done items / all items" over the trip's checklist.
 *
 * Pure function over a list of items: the memoized per-trip selector
 * (`selectReadiness(tripId)`) will wrap it once the checklist slices exist (stage 6).
 */

export interface Readiness {
  done: number
  total: number
  /** 0–100, or `null` when the checklist is empty (shown as "—"). */
  percent: number | null
}

export function readiness(items: readonly Pick<ChecklistItem, 'done'>[]): Readiness {
  const total = items.length
  const done = items.filter((item) => item.done).length
  // floor, not round: 199 of 200 must not show as 100 %
  const percent = total === 0 ? null : Math.floor((done / total) * 100)
  return { done, total, percent }
}
