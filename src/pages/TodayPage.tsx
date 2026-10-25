import { Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ChecklistItems } from '@/components/checklist/ChecklistItems'
import { LazyExpenseFormModal } from '@/components/expenses/ExpenseFormModal/LazyExpenseFormModal'
import { LazyItemFormModal } from '@/components/plan/ItemFormModal/LazyItemFormModal'
import { NextList } from '@/components/today/NextList'
import { NextTripCard } from '@/components/today/NextTripCard'
import { NowCard } from '@/components/today/NowCard'
import { useTripDialogs } from '@/components/trips/TripDialogs'
import { Button, ButtonLink, EmptyState } from '@/components/ui'
import { useAppDispatch, useAppSelector } from '@/hooks/store'
import { useNowMinutes } from '@/hooks/useNowMinutes'
import { useToast } from '@/hooks/useToast'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useToday } from '@/hooks/useToday'
import { itemUpdated } from '@/store/actions/itemActions'
import { selectBoard } from '@/store/selectors/planSelectors'
import { selectTodayView } from '@/store/selectors/todaySelectors'
import { selectLanguage } from '@/store/slices/settingsSlice'
import { paths } from '@/routes/paths'
import type { ID, ItineraryItem } from '@/types'
import { formatLongDate } from '@/utils/format'
import { planDayAgenda } from '@/utils/today'
import styles from './TodayPage.module.css'

type Dialog = { kind: 'none' } | { kind: 'item'; itemId: ID } | { kind: 'expense' }

/**
 * "Today": the plan of the trip going on today — what's on now, what's next,
 * tasks not to forget, a quick "+ Expense". Without an ongoing trip — the nearest
 * upcoming one; without trips — an empty state.
 */
export default function TodayPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('today.title'))
  const dispatch = useAppDispatch()
  const toast = useToast()
  const navigate = useNavigate()
  const today = useToday()
  const now = useNowMinutes()
  const language = useAppSelector(selectLanguage)
  const view = useAppSelector((state) => selectTodayView(state, today))
  const tripId = view.kind === 'none' ? '' : view.trip.id
  const board = useAppSelector((state) => selectBoard(state, tripId))
  const tasks = useAppSelector((state) => state.checklistItems.entities)
  const [dialog, setDialog] = useState<Dialog>({ kind: 'none' })
  const [dialogUsed, setDialogUsed] = useState(false)
  const { openCreate, dialogs } = useTripDialogs({ onCreated: (trip) => void navigate(paths.trip(trip.id)) })

  const open = (next: Dialog) => {
    setDialogUsed(true)
    setDialog(next)
  }
  const markDone = (item: ItineraryItem) => {
    dispatch(itemUpdated({ id: item.id, changes: { done: true } }))
    toast({ message: t('today.markedDone', { title: item.title }), undo: itemUpdated({ id: item.id, changes: { done: false } }) })
  }

  const dateLine = formatLongDate(today, language)

  if (view.kind === 'none') {
    return (
      <div className={styles.page}>
        <EmptyState
          icon="◉"
          headingLevel={1}
          title={t('today.empty')}
          description={t('today.emptyHint')}
          action={
            <Button variant="primary" icon="+" onClick={openCreate}>
              {t('trips.newTrip')}
            </Button>
          }
        />
        {dialogs}
      </div>
    )
  }

  if (view.kind === 'upcoming') {
    return (
      <div className={styles.page}>
        <header className={styles.head}>
          <div>
            <h1>{t('today.title')}</h1>
            <p className="meta">{dateLine}</p>
          </div>
        </header>
        <NextTripCard trip={view.trip} daysUntil={view.daysUntil} readiness={view.readiness} today={today} />
        {view.tasksGroup && (
          <section aria-labelledby="today-before">
            <h2 id="today-before" className={`label ${styles.section}`}>
              {t('today.beforeTrip')}
            </h2>
            <ChecklistItems
              group={view.tasksGroup}
              items={view.openTasks}
              today={today}
              emptyText={t('today.allTasksDone')}
            />
          </section>
        )}
      </div>
    )
  }

  // Ongoing trip
  const { trip, items } = view
  const agenda = planDayAgenda(items, now)
  const editedItem = dialog.kind === 'item' ? items.find((item) => item.id === dialog.itemId) : undefined

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1>{view.day ? t('today.dayOf', { number: view.dayNumber, total: view.totalDays }) : t('today.title')}</h1>
          <p className="meta">
            {dateLine} · {trip.destination}
          </p>
        </div>
        <ButtonLink size="sm" to={paths.trip(trip.id)} className={styles.planLink}>
          {t('today.openPlan')} →
        </ButtonLink>
      </header>

      {agenda.hero ? (
        <NowCard
          item={agenda.hero}
          isCurrent={agenda.current === agenda.hero}
          onNotes={() => open({ kind: 'item', itemId: agenda.hero!.id })}
          onDone={() => markDone(agenda.hero!)}
        />
      ) : (
        <EmptyState
          icon="✓"
          compact
          className={styles.dayEmpty}
          title={
            agenda.allDone
              ? t('today.dayDone')
              : items.length > 0
                ? t('today.dayOver')
                : view.day
                  ? t('today.noStops')
                  : t('today.notInPlan')
          }
          description={
            agenda.allDone ? t('today.dayDoneHint') : items.length > 0 ? t('today.dayOverHint') : t('today.noStopsHint')
          }
          action={<ButtonLink to={paths.trip(trip.id)}>{t('today.openPlan')}</ButtonLink>}
        />
      )}

      {agenda.rest.length > 0 && (
        <section aria-labelledby="today-later">
          <h2 id="today-later" className={`label ${styles.section}`}>
            {t('today.later')}
          </h2>
          <NextList items={agenda.rest} onOpen={(item) => open({ kind: 'item', itemId: item.id })} />
        </section>
      )}

      {view.tasksGroup && (
        <section aria-labelledby="today-tasks">
          <h2 id="today-tasks" className={`label ${styles.section}`}>
            {t('today.dontForget')}
          </h2>
          <ChecklistItems group={view.tasksGroup} items={view.todayTasks} today={today} emptyText={t('today.noTasksToday')} />
        </section>
      )}

      <Button variant="primary" icon="+" fullWidth className={styles.expense} onClick={() => open({ kind: 'expense' })}>
        {t('today.addExpense')}
      </Button>

      {dialogUsed && board && (
        <Suspense fallback={null}>
          <LazyItemFormModal
            open={dialog.kind === 'item'}
            onClose={() => setDialog({ kind: 'none' })}
            tripId={trip.id}
            days={board.days}
            item={editedItem}
            bookingTask={editedItem?.bookingTaskId ? tasks[editedItem.bookingTaskId] : undefined}
          />
          <LazyExpenseFormModal
            open={dialog.kind === 'expense'}
            onClose={() => setDialog({ kind: 'none' })}
            trip={trip}
            today={today}
          />
        </Suspense>
      )}
    </div>
  )
}
