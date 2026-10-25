import { createContext, useContext } from 'react'
import type { ItemPlace } from '@/store/actions/itemActions'
import type { ChecklistItem, ID, ItineraryItem } from '@/types'

/** A droppable list on the board: a day (`day:<id>`) or "Ideas". */
export type ColumnId = 'ideas' | `day:${string}`

export const columnIdOf = (place: ItemPlace): ColumnId => (place === null ? 'ideas' : `day:${place}`)
export const placeOf = (column: ColumnId): ItemPlace => (column === 'ideas' ? null : column.slice('day:'.length))

export interface PlanDndValue {
  /** Item ids of a column — the live order while dragging, the store order otherwise */
  orderOf: (column: ColumnId, storeOrder: readonly ID[]) => readonly ID[]
  getItem: (id: ID) => ItineraryItem | undefined
  activeId: ID | null
  /** Faded by the category filter */
  isDimmed: (item: ItineraryItem) => boolean
  bookingTaskOf: (item: ItineraryItem) => ChecklistItem | undefined
  openItem: (item: ItineraryItem) => void
  /** A click right after a drop is the end of the drag, not "open the item" */
  wasJustDragged: () => boolean
}

export const PlanDndContext = createContext<PlanDndValue | null>(null)

export function usePlanDnd(): PlanDndValue {
  const value = useContext(PlanDndContext)
  if (!value) throw new Error('usePlanDnd must be used inside <PlanDnd>')
  return value
}
