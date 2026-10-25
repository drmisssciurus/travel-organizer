import type { ID } from '@/types'

export const TRIP_TABS = ['plan', 'map', 'expenses', 'checklist'] as const
export type TripTab = (typeof TRIP_TABS)[number]

/**
 * Single source of truth for URLs. Build links with these helpers
 * instead of string literals: `paths.trip(id, 'expenses')`.
 */
export const paths = {
  trips: () => '/',
  today: () => '/today',
  trip: (tripId: ID, tab: TripTab = 'plan') => `/trips/${tripId}/${tab}`,
} as const
