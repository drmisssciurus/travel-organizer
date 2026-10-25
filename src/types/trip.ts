import type { CurrencyCode, ID, ISODate, Timestamp } from './common'

/**
 * Trip status is derived from the dates relative to today — it is never stored.
 * See `utils/tripStatus.ts`.
 */
export const TRIP_STATUSES = ['upcoming', 'ongoing', 'past'] as const
export type TripStatus = (typeof TRIP_STATUSES)[number]

export interface Trip {
  id: ID
  title: string
  destination: string
  startDate: ISODate
  endDate: ISODate
  currency: CurrencyCode
  notes?: string
  /** Day order. Days are generated from `startDate..endDate`. */
  dayIds: ID[]
  /** Order of unscheduled items in the "Ideas" column. */
  ideaIds: ID[]
  /** Checklist group order (the "tasks" group is always present). */
  groupIds: ID[]
  createdAt: Timestamp
  updatedAt: Timestamp
}
