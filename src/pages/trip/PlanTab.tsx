import { Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { Board } from '@/components/plan/Board'
import { LazyItemFormModal } from '@/components/plan/ItemFormModal/LazyItemFormModal'
import { MobilePlan } from '@/components/plan/MobilePlan'
import { PlanDnd, placeOf, type ColumnId } from '@/components/plan/PlanDnd'
import { useAppDispatch, useAppSelector } from '@/hooks/store'
import { MOBILE_QUERY, useMediaQuery } from '@/hooks/useMediaQuery'
import { useToday } from '@/hooks/useToday'
import type { ItemPlace } from '@/store/actions/itemActions'
import { selectBoard } from '@/store/selectors/planSelectors'
import { moveItem } from '@/store/thunks/planThunks'
import type { ID, ItemCategory, ItineraryItem } from '@/types'

/** Which item form is open */
type FormState = { mode: 'closed' } | { mode: 'create'; place: ItemPlace } | { mode: 'edit'; itemId: ID }

/**
 * "Plan" tab: the board on desktop, one day at a time on phones.
 * Only one of the two is rendered (`useMediaQuery`): each has its own set of
 * drag-and-drop columns, and a hidden copy would still register drop targets.
 */
export default function PlanTab() {
  const { t } = useTranslation()
  const { tripId = '' } = useParams()
  const dispatch = useAppDispatch()
  const today = useToday()
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const board = useAppSelector((state) => selectBoard(state, tripId))
  const tasks = useAppSelector((state) => state.checklistItems.entities)
  const [category, setCategory] = useState<ItemCategory | 'all'>('all')
  const [form, setForm] = useState<FormState>({ mode: 'closed' })
  const [formUsed, setFormUsed] = useState(false)
  const [mobileDay, setMobileDay] = useState<'before' | ID>()

  if (!board) return null // TripLayout shows "Trip not found"

  const openForm = (next: FormState) => {
    setFormUsed(true)
    setForm(next)
  }
  const editedItem = form.mode === 'edit' ? board.days.flatMap((d) => d.items).concat(board.ideas).find((i) => i.id === form.itemId) : undefined
  const bookingTaskOf = (item: ItineraryItem) => (item.bookingTaskId ? tasks[item.bookingTaskId] : undefined)

  // Mobile: today's day for an ongoing trip, otherwise day 1 (or "Before" for a trip without days)
  const selected =
    mobileDay && (mobileDay === 'before' || board.days.some(({ day }) => day.id === mobileDay))
      ? mobileDay
      : (board.days.find(({ day }) => day.date === today) ?? board.days[0])?.day.id ?? 'before'
  const visibleDays = isMobile ? board.days.filter(({ day }) => day.id === selected) : board.days

  const columns: Partial<Record<ColumnId, readonly ItineraryItem[]>> = { ideas: board.ideas }
  for (const { day, items } of visibleDays) columns[`day:${day.id}`] = items

  const columnName = (column: ColumnId) => {
    const place = placeOf(column)
    const found = board.days.find(({ day }) => day.id === place)
    return found ? t('plan.day', { number: found.number }) : t('plan.ideas')
  }

  return (
    <>
      <PlanDnd
        columns={columns}
        columnName={columnName}
        onMove={(id, to, index) => dispatch(moveItem(id, to, index))}
        isDimmed={(item) => category !== 'all' && item.category !== category}
        bookingTaskOf={bookingTaskOf}
        openItem={(item) => openForm({ mode: 'edit', itemId: item.id })}
      >
        {isMobile ? (
          <MobilePlan
            board={board}
            today={today}
            selected={selected}
            onSelect={setMobileDay}
            onAdd={(place) => openForm({ mode: 'create', place })}
          />
        ) : (
          <Board
            board={board}
            today={today}
            category={category}
            onCategoryChange={setCategory}
            onAdd={(place) => openForm({ mode: 'create', place })}
          />
        )}
      </PlanDnd>

      {formUsed && (
        <Suspense fallback={null}>
          <LazyItemFormModal
            open={form.mode !== 'closed'}
            onClose={() => setForm({ mode: 'closed' })}
            tripId={board.trip.id}
            days={board.days}
            item={editedItem}
            bookingTask={editedItem && bookingTaskOf(editedItem)}
            defaultPlace={form.mode === 'create' ? form.place : null}
          />
        </Suspense>
      )}
    </>
  )
}
