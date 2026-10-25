import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/hooks/store'
import type { ItemPlace } from '@/store/actions/itemActions'
import type { Board as BoardData } from '@/store/selectors/planSelectors'
import { selectLanguage } from '@/store/slices/settingsSlice'
import type { ISODate, ItemCategory } from '@/types'
import { cx } from '@/utils/cx'
import { formatWeekdayDay } from '@/utils/format'
import { BoardColumn } from '../BoardColumn'
import { BoardToolbar } from '../BoardToolbar'
import { ItemList } from '../ItemList'
import { columnIdOf, usePlanDnd } from '../PlanDnd'
import { TasksColumn } from '../TasksColumn'
import styles from './Board.module.css'

export interface BoardProps {
  board: BoardData
  today: ISODate
  category: ItemCategory | 'all'
  onCategoryChange: (category: ItemCategory | 'all') => void
  onAdd: (place: ItemPlace) => void
}

interface VisibleRange {
  from: number
  to: number
}

/**
 * Desktop plan board: "Before the trip" → Day 1…N → "Ideas", scrolling horizontally.
 * The toolbar shows which days are visible ("Days 4–6 of 14") and pages through them.
 * Drag-and-drop is provided by the surrounding <PlanDnd>.
 */
export function Board({ board, today, category, onCategoryChange, onAdd }: BoardProps) {
  const { t } = useTranslation()
  const language = useAppSelector(selectLanguage)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { activeId } = usePlanDnd()
  const total = board.days.length
  const [range, setRange] = useState<VisibleRange>({ from: 1, to: Math.min(3, total) })
  const todayIndex = board.days.findIndex(({ day }) => day.date === today)

  // Which day columns are visible (at least half) — recomputed on scroll and resize
  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return
    const update = () => {
      const left = scroller.scrollLeft
      const right = left + scroller.clientWidth
      const visible: number[] = []
      for (const column of scroller.querySelectorAll<HTMLElement>('[data-day-index]')) {
        const start = column.offsetLeft
        const end = start + column.offsetWidth
        const shown = Math.min(end, right) - Math.max(start, left)
        if (shown >= column.offsetWidth / 2) visible.push(Number(column.dataset.dayIndex))
      }
      if (visible.length > 0) setRange({ from: Math.min(...visible) + 1, to: Math.max(...visible) + 1 })
    }
    update()
    scroller.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(scroller)
    return () => {
      scroller.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [total])

  // Ongoing trip: open the board at today's column (once per trip)
  useEffect(() => {
    const scroller = scrollRef.current
    const column = scroller?.querySelector<HTMLElement>('[data-today]')
    if (scroller && column) scroller.scrollTo({ left: column.offsetLeft - 16 })
  }, [board.trip.id])

  // ‹ › page by the visible width; scroll-snap aligns the result to a column
  const page = (direction: 1 | -1) => {
    const scroller = scrollRef.current
    if (!scroller) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    scroller.scrollBy({ left: direction * (scroller.clientWidth - 80), behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <>
      <BoardToolbar
        range={total > 0 ? { ...range, total } : undefined}
        onPrev={() => page(-1)}
        onNext={() => page(1)}
        category={category}
        onCategoryChange={onCategoryChange}
      />
      {/* Focusable so the board can be scrolled with arrow keys */}
      <div
        ref={scrollRef}
        // While dragging, scroll-snap is off: it fought the auto-scroll and pulled the board to columns
        className={cx(styles.board, activeId !== null && styles.dragging)}
        role="region" aria-label={t('plan.board')} tabIndex={0}>
        {board.tasksGroup && <TasksColumn group={board.tasksGroup} tasks={board.tasks} today={today} />}

        {board.days.map(({ day, number, items }, index) => {
          const isToday = index === todayIndex
          const name = t('plan.day', { number })
          return (
            <BoardColumn
              key={day.id}
              data-day-index={index}
              data-today={isToday || undefined}
              variant={isToday ? 'today' : 'default'}
              title={
                <>
                  {name} · {formatWeekdayDay(day.date, language)}
                  {isToday && <span className={styles.todayTag}>{t('plan.today')}</span>}
                </>
              }
              aside={<span className={styles.count}>{items.length}</span>}
              footer={<AddButton label={t('plan.addStop')} aria-label={t('plan.addStopTo', { column: name })} onClick={() => onAdd(day.id)} />}
            >
              <ItemList column={columnIdOf(day.id)} items={items} emptyText={t('plan.emptyDay')} />
            </BoardColumn>
          )
        })}

        <BoardColumn
          variant="ideas"
          title={t('plan.ideas')}
          aside={<span className="label">{t('plan.notScheduled')}</span>}
          hint={t('plan.ideasHint')}
          footer={<AddButton label={t('plan.addIdea')} onClick={() => onAdd(null)} />}
        >
          <ItemList column="ideas" items={board.ideas} emptyText={t('plan.emptyIdeas')} />
        </BoardColumn>
      </div>
    </>
  )
}

function AddButton({ label, onClick, ...rest }: { label: string; onClick: () => void; 'aria-label'?: string }) {
  return (
    <button type="button" className={styles.add} onClick={onClick} aria-label={rest['aria-label']}>
      + {label}
    </button>
  )
}
