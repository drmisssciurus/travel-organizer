import { useDroppable } from '@dnd-kit/core'
import {
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { KeyboardEvent } from 'react'
import type { ItineraryItem } from '@/types'
import { cx } from '@/utils/cx'
import { ItemCard } from '../ItemCard'
import { usePlanDnd, type ColumnId } from '../PlanDnd'
import styles from './ItemList.module.css'

export interface ItemListProps {
  column: ColumnId
  /** Items in store order */
  items: readonly ItineraryItem[]
  emptyText: string
  /** Horizontal chips (the mobile "Ideas" sheet) instead of cards */
  variant?: 'cards' | 'chips'
  className?: string
}

/**
 * A droppable, sortable list of plan items (a day or "Ideas").
 * The list itself is a drop target too, so an item can be dropped into an empty day.
 */
export function ItemList({ column, items, emptyText, variant = 'cards', className }: ItemListProps) {
  const dnd = usePlanDnd()
  const storeIds = items.map((item) => item.id)
  const ids = dnd.orderOf(column, storeIds)
  const { setNodeRef } = useDroppable({ id: column })
  // Highlight the column an item is being moved into (not the one it came from)
  const receiving = dnd.activeId !== null && ids.includes(dnd.activeId) && !storeIds.includes(dnd.activeId)
  const chips = variant === 'chips'

  return (
    <SortableContext items={[...ids]} strategy={chips ? horizontalListSortingStrategy : verticalListSortingStrategy}>
      <ul ref={setNodeRef} className={cx(styles.list, chips && styles.chips, receiving && styles.receiving, className)}>
        {ids.map((id) => {
          const item = dnd.getItem(id)
          return item ? (
            <li key={id}>
              <SortableItem item={item} chip={chips} />
            </li>
          ) : null
        })}
        {ids.length === 0 && <li className={styles.empty}>{emptyText}</li>}
      </ul>
    </SortableContext>
  )
}

function SortableItem({ item, chip }: { item: ItineraryItem; chip: boolean }) {
  const dnd = usePlanDnd()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const open = () => {
    if (!dnd.wasJustDragged()) dnd.openItem(item)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    listeners?.onKeyDown?.(event) // Space → drag (dnd-kit keyboard sensor)
    if (event.key === 'Enter' && !isDragging) open()
  }
  const common = {
    ref: setNodeRef,
    style: { transform: CSS.Translate.toString(transform), transition },
    ...attributes,
    ...listeners,
    onKeyDown,
    onClick: open,
  }

  if (chip) {
    return (
      <div {...common} className={cx(styles.chip, isDragging && styles.chipGhost)}>
        <span className={styles.dot} style={{ background: `var(--color-cat-${item.category})` }} aria-hidden="true" />
        {item.title}
      </div>
    )
  }
  return (
    <ItemCard
      {...common}
      item={item}
      bookingTask={dnd.bookingTaskOf(item)}
      dimmed={dnd.isDimmed(item)}
      ghost={isDragging}
    />
  )
}
