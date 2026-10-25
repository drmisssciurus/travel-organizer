import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { ItemPlace } from '@/store/actions/itemActions'
import type { ChecklistItem, ID, ItineraryItem } from '@/types'
import { ItemCard } from '../ItemCard'
import { PlanDndContext, placeOf, type ColumnId, type PlanDndValue } from './planDndContext'

export interface PlanDndProps {
  /** Columns taking part in drag-and-drop, with items in store order */
  columns: Partial<Record<ColumnId, readonly ItineraryItem[]>>
  /** Column name for screen-reader announcements ("Day 2", "Ideas") */
  columnName: (column: ColumnId) => string
  onMove: (id: ID, to: ItemPlace, index: number) => void
  isDimmed: (item: ItineraryItem) => boolean
  bookingTaskOf: (item: ItineraryItem) => ChecklistItem | undefined
  openItem: (item: ItineraryItem) => void
  children: ReactNode
}

type Order = Partial<Record<ColumnId, ID[]>>

/**
 * Board auto-scroll while dragging near an edge. dnd-kit's default zone is 20 % of the
 * board width from each edge — almost a whole column — and it accelerates fast, so
 * hovering over the edge day rushed the board to the last day before the card could be
 * dropped. A narrow zone (~6 %) and a gentle speed scroll only when the pointer is
 * really at the edge.
 */
const AUTO_SCROLL = { threshold: { x: 0.06, y: 0.12 }, acceleration: 3, interval: 12 }

/**
 * Drag-and-drop of plan items between days and "Ideas" (dnd-kit, multiple sortable lists).
 *
 * While dragging, the order lives in local state (`dragOrder`): the card moves between
 * columns as the pointer moves (`onDragOver`), so the target column opens a gap.
 * The store is updated once, on drop, with one `moveItem` — undoable and saved once.
 *
 * Input: mouse (5 px threshold, so a click still opens the item), touch (long press
 * 250 ms — a quick swipe scrolls the page), keyboard (Space to pick up / drop,
 * arrows to move, Esc to cancel) with spoken announcements.
 */
export function PlanDnd({ columns, columnName, onMove, isDimmed, bookingTaskOf, openItem, children }: PlanDndProps) {
  const { t } = useTranslation()
  const [dragOrder, setDragOrder] = useState<Order | null>(null)
  const [activeId, setActiveId] = useState<ID | null>(null)
  const justDragged = useRef(false)

  const items = useMemo(() => {
    const map = new Map<ID, ItineraryItem>()
    for (const list of Object.values(columns)) for (const item of list ?? []) map.set(item.id, item)
    return map
  }, [columns])

  const storeOrder = useCallback(
    (): Order =>
      Object.fromEntries(Object.entries(columns).map(([column, list]) => [column, (list ?? []).map((item) => item.id)])),
    [columns],
  )

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Enter stays "open the item"; only Space picks up and drops
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] },
    }),
  )

  /** Column of an item or of a column id (dropping onto an empty list targets the list itself). */
  const findColumn = (id: UniqueIdentifier, order: Order): ColumnId | undefined => {
    if (id in order) return id as ColumnId
    return (Object.keys(order) as ColumnId[]).find((column) => order[column]?.includes(id as ID))
  }

  const finish = () => {
    setDragOrder(null)
    setActiveId(null)
    // The click that may follow the drop must not open the item
    justDragged.current = true
    setTimeout(() => (justDragged.current = false), 0)
  }

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id))
    setDragOrder(storeOrder())
  }

  // Crossing into another column: move the id there right away (the column opens a gap)
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || !dragOrder) return
    const from = findColumn(active.id, dragOrder)
    const to = findColumn(over.id, dragOrder)
    if (!from || !to || from === to) return
    setDragOrder((order) => {
      if (!order) return order
      const source = (order[from] ?? []).filter((id) => id !== active.id)
      const target = [...(order[to] ?? [])]
      const overIndex = target.indexOf(String(over.id))
      target.splice(overIndex === -1 ? target.length : overIndex, 0, String(active.id))
      return { ...order, [from]: source, [to]: target }
    })
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const order = dragOrder
    finish()
    if (!over || !order) return
    const column = findColumn(active.id, order)
    if (!column) return
    let list = order[column] ?? []
    // Reorder inside the column
    const from = list.indexOf(String(active.id))
    const to = list.indexOf(String(over.id))
    if (to !== -1 && from !== to) list = arrayMove(list, from, to)
    onMove(String(active.id), placeOf(column), list.indexOf(String(active.id)))
  }

  /* ---------- Screen-reader announcements ---------- */
  const titleOf = (id: UniqueIdentifier) => items.get(String(id))?.title ?? ''
  const where = (id: UniqueIdentifier | undefined) => {
    const order = dragOrder ?? storeOrder()
    const column = id === undefined ? undefined : findColumn(id, order)
    if (!column) return undefined
    const index = order[column]?.indexOf(String(id)) ?? -1
    return { column: columnName(column), position: index === -1 ? (order[column]?.length ?? 0) + 1 : index + 1 }
  }
  const announcements: Announcements = {
    onDragStart: ({ active }) => t('plan.dndPickedUp', { title: titleOf(active.id) }),
    onDragOver: ({ active, over }) => {
      const place = where(over?.id)
      return place ? t('plan.dndOver', { title: titleOf(active.id), ...place }) : undefined
    },
    onDragEnd: ({ active, over }) => {
      const place = where(over?.id)
      return place ? t('plan.dndDropped', { title: titleOf(active.id), ...place }) : undefined
    },
    onDragCancel: ({ active }) => t('plan.dndCancelled', { title: titleOf(active.id) }),
  }

  const value: PlanDndValue = {
    orderOf: (column, order) => dragOrder?.[column] ?? order,
    getItem: (id) => items.get(id),
    activeId,
    isDimmed,
    bookingTaskOf,
    openItem,
    wasJustDragged: () => justDragged.current,
  }

  const active = activeId ? items.get(activeId) : undefined

  return (
    <PlanDndContext.Provider value={value}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        autoScroll={AUTO_SCROLL}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={finish}
        accessibility={{ announcements, screenReaderInstructions: { draggable: t('plan.dragHint') } }}
      >
        {children}
        <DragOverlay>{active ? <ItemCard item={active} bookingTask={bookingTaskOf(active)} overlay /> : null}</DragOverlay>
      </DndContext>
    </PlanDndContext.Provider>
  )
}
