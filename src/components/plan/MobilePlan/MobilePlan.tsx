import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@/components/ui'
import { useAppSelector } from '@/hooks/store'
import type { ItemPlace } from '@/store/actions/itemActions'
import type { Board } from '@/store/selectors/planSelectors'
import { selectLanguage } from '@/store/slices/settingsSlice'
import type { ID, ISODate } from '@/types'
import { cx } from '@/utils/cx'
import { formatLongDate, formatWeekdayDay } from '@/utils/format'
import { ItemList } from '../ItemList'
import { columnIdOf } from '../PlanDnd'
import { ChecklistItems } from '@/components/checklist/ChecklistItems'
import styles from './MobilePlan.module.css'

export interface MobilePlanProps {
  board: Board
  today: ISODate
  /** Selected chip: `before` or a day id */
  selected: 'before' | ID
  onSelect: (selected: 'before' | ID) => void
  onAdd: (place: ItemPlace) => void
}

/**
 * Plan on phones: day chips ("Before · 3", "Mon 12", …) → one day at a time;
 * "Ideas" live in a bottom sheet, from where they are dragged into the day (long press).
 * The surrounding <PlanDnd> gets only the visible day + Ideas as columns.
 */
export function MobilePlan({ board, today, selected, onSelect, onAdd }: MobilePlanProps) {
  const { t } = useTranslation()
  const language = useAppSelector(selectLanguage)
  const [sheetExpanded, setSheetExpanded] = useState(false)
  const left = board.tasks.filter((task) => !task.done).length
  const current = board.days.find(({ day }) => day.id === selected)

  return (
    <div className={styles.plan}>
      <div className={styles.chips} role="group" aria-label={t('plan.board')}>
        <button
          type="button"
          className={cx(styles.chip, styles.before)}
          aria-pressed={selected === 'before'}
          onClick={() => onSelect('before')}
        >
          {t('plan.beforeShort')} · {left}
        </button>
        {board.days.map(({ day, number }) => (
          <button
            key={day.id}
            type="button"
            className={cx(styles.chip, day.date === today && styles.todayChip)}
            aria-pressed={selected === day.id}
            aria-label={`${t('plan.day', { number })} · ${formatWeekdayDay(day.date, language)}`}
            onClick={() => onSelect(day.id)}
          >
            {formatWeekdayDay(day.date, language)}
          </button>
        ))}
      </div>

      {current ? (
        <section>
          <div className={styles.dayHead}>
            <div>
              <h2>
                {t('plan.day', { number: current.number })} · {formatLongDate(current.day.date, language)}
              </h2>
              <p className="meta">{t('plan.dayHint', { stops: t('plan.stops', { count: current.items.length }) })}</p>
            </div>
            <button
              type="button"
              className={styles.addRound}
              aria-label={t('plan.addStopTo', { column: t('plan.day', { number: current.number }) })}
              onClick={() => onAdd(current.day.id)}
            >
              +
            </button>
          </div>
          <ItemList column={columnIdOf(current.day.id)} items={current.items} emptyText={t('plan.emptyDay')} />
        </section>
      ) : (
        <section>
          <div className={styles.dayHead}>
            <div>
              <h2>{t('plan.beforeTrip')}</h2>
              <p className="meta">{t('plan.beforeHint')}</p>
            </div>
          </div>
          {board.tasksGroup && (
            <ChecklistItems
              group={board.tasksGroup}
              items={board.tasks}
              today={today}
              addLabel={t('plan.addTask')}
              fullWidthAdd
            />
          )}
        </section>
      )}

      <BottomSheet
        title={`${t('plan.ideas')} · ${board.ideas.length}`}
        meta={t('plan.ideasSheetHint')}
        expanded={sheetExpanded}
        onExpandedChange={setSheetExpanded}
      >
        <div className={styles.sheetRow}>
          <ItemList
            column="ideas"
            items={board.ideas}
            emptyText={t('plan.emptyIdeas')}
            variant="chips"
            className={cx(styles.ideas, sheetExpanded && styles.ideasWrap)}
          />
          <button type="button" className={styles.addChip} aria-label={t('plan.addIdea')} onClick={() => onAdd(null)}>
            +
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
