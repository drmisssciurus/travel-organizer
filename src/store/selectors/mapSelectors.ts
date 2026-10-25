import { createSelector } from '@reduxjs/toolkit'
import type { GeoPoint, ID, ItineraryItem } from '@/types'
import { selectBoard, type Board } from './planSelectors'

/**
 * Map tab data, derived from the plan board (same order as the plan).
 *
 * A "layer" is a day or the Ideas column. Items with coordinates become stops (markers);
 * the rest go to the "Without a place" list. No numbers or route lines: the plan order
 * doesn't tell where the day starts, so a numbered route would be misleading.
 */

/** Key of a layer in the filter and the URL: `1`, `2`… for days, `ideas` for Ideas. */
export type MapLayerKey = `${number}` | 'ideas'
export const IDEAS_LAYER: MapLayerKey = 'ideas'
export const dayLayerKey = (number: number): MapLayerKey => `${number}`

export interface MapStop {
  item: ItineraryItem & { coords: GeoPoint }
}

export interface MapLayer {
  key: MapLayerKey
  /** Day number, `null` for Ideas */
  dayNumber: number | null
  dayId: ID | null
  date?: string
  stops: MapStop[]
  /** Items of this layer without a point (the "Without a place" list) */
  unplaced: ItineraryItem[]
}

export interface TripMapData {
  layers: MapLayer[]
  /** Every stop of the trip (for the empty state and "show all") */
  total: number
}

const hasCoords = (item: ItineraryItem): item is ItineraryItem & { coords: GeoPoint } => item.coords !== undefined

function layerOf(key: MapLayerKey, dayNumber: number | null, dayId: ID | null, items: readonly ItineraryItem[], date?: string): MapLayer {
  return {
    key,
    dayNumber,
    dayId,
    date,
    stops: items.filter(hasCoords).map((item) => ({ item })),
    unplaced: items.filter((item) => !hasCoords(item)),
  }
}

/** Pure: board → map layers (days in order, then Ideas). */
export function buildTripMap(board: Board): TripMapData {
  const layers = [
    ...board.days.map(({ day, number, items }) => layerOf(dayLayerKey(number), number, day.id, items, day.date)),
    layerOf(IDEAS_LAYER, null, null, board.ideas),
  ]
  return { layers, total: layers.reduce((sum, layer) => sum + layer.stops.length, 0) }
}

export const selectTripMap = createSelector([selectBoard], (board) => (board ? buildTripMap(board) : undefined))

/**
 * Filter from the URL (`?show=1,3,ideas`) → set of layer keys.
 * Missing, empty or only unknown keys → `null` = everything is shown.
 */
export function parseMapFilter(raw: string | null, layers: readonly MapLayer[]): Set<MapLayerKey> | null {
  if (!raw) return null
  const known = new Set(layers.map((layer) => layer.key))
  const keys = raw.split(',').filter((key): key is MapLayerKey => known.has(key as MapLayerKey))
  return keys.length > 0 ? new Set(keys) : null
}

export function serializeMapFilter(filter: ReadonlySet<MapLayerKey> | null): string | null {
  return filter && filter.size > 0 ? [...filter].join(',') : null
}

/** Clicking a chip: add/remove the layer; removing the last one → back to "all". */
export function toggleMapLayer(filter: ReadonlySet<MapLayerKey> | null, key: MapLayerKey): Set<MapLayerKey> | null {
  const next = new Set(filter ?? [])
  if (next.has(key)) next.delete(key)
  else next.add(key)
  return next.size > 0 ? next : null
}

/**
 * Day colors on the map (markers, route lines, filter chips); days cycle through them.
 * Kept here, not in tokens.css: Leaflet writes the line color into an SVG attribute,
 * where CSS variables don't work. Markers carry white numbers → every color has ≥ 5.5:1 with #fff,
 * and they stay readable on the map in both themes.
 */
export const DAY_PALETTE = ['#354024', '#a3472b', '#2f5d7c', '#80621c', '#6b3f6e', '#2e6e60', '#4c3d19', '#7a4a2a'] as const
export const IDEA_COLOR = '#6f6857'

export const dayColor = (dayNumber: number | null): string =>
  dayNumber === null ? IDEA_COLOR : DAY_PALETTE[(dayNumber - 1) % DAY_PALETTE.length]!
