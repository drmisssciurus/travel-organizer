import { useTranslation } from 'react-i18next'
import { ChecklistItems } from '@/components/checklist/ChecklistItems'
import type { ChecklistGroup, ChecklistItem, ISODate } from '@/types'
import { BoardColumn } from '../BoardColumn'
import styles from './TasksColumn.module.css'

export interface TasksColumnProps {
  group: ChecklistGroup
  tasks: readonly ChecklistItem[]
  today: ISODate
}

/**
 * First board column: "Before the trip" — the checklist's "Tasks" group shown on the plan
 * (same data as in the checklist tab), with a "N left" / "all done" pill.
 */
export function TasksColumn({ group, tasks, today }: TasksColumnProps) {
  const { t } = useTranslation()
  const left = tasks.filter((task) => !task.done).length
  return (
    <BoardColumn
      id="col-before"
      title={t('plan.beforeTrip')}
      aside={
        <span className={left > 0 ? styles.pill : styles.pillDone}>
          {left > 0 ? t('plan.tasksLeft', { count: left }) : t('plan.allDone')}
        </span>
      }
    >
      <ChecklistItems group={group} items={tasks} today={today} addLabel={t('plan.addTask')} />
    </BoardColumn>
  )
}
