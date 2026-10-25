import type { ID, ISODate, TimeHHmm } from './common'

/** One calendar day of a trip — a column on the plan board. */
export interface Day {
  id: ID
  tripId: ID
  date: ISODate
  /** Item order inside the day. Reordering = rearranging this array. */
  itemIds: ID[]
}

/** A point on the map (WGS 84, degrees). */
export interface GeoPoint {
  lat: number
  lng: number
}

export const ITEM_CATEGORIES = ['sight', 'food', 'transport', 'stay', 'activity'] as const
export type ItemCategory = (typeof ITEM_CATEGORIES)[number]

/** A stop in the itinerary, or an idea when `dayId` is `null`. */
export interface ItineraryItem {
  id: ID
  tripId: ID
  /** `null` → the item lives in the "Ideas" column (not scheduled). */
  dayId: ID | null
  title: string
  category: ItemCategory
  time?: TimeHHmm
  /** Duration in minutes. */
  durationMin?: number
  /** Place or address. */
  location?: string
  /**
   * Coordinates of `location`: picked from the place search, found by geocoding on save
   * or set on the map. Without them the item is not shown on the map.
   */
  coords?: GeoPoint
  note?: string
  /** When `true`, a linked task exists in the "Before the trip" column. */
  needsBooking: boolean
  /** Linked `ChecklistItem` (task) created by `needsBooking`. */
  bookingTaskId?: ID
  /** Checked off on the "Today" screen. */
  done: boolean
}
