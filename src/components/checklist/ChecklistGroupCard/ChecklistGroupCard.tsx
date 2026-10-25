import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/components/ui'
import type { ChecklistGroupView } from '@/store/selectors/checklistSelectors'
import type { ISODate } from '@/types'
import { ChecklistItems, type ChecklistFilter } from '../ChecklistItems'
import styles from './ChecklistGroupCard.module.css'

export interface ChecklistGroupCardProps {
  view: ChecklistGroupView
  today: ISODate
  filter: ChecklistFilter
  onRename: () => void
  onDelete: () => void
}

/**
 * One checklist group: title, "3/5" counter, rename / delete (packing groups only —
 * "Tasks" is built-in), the items and quick entry.
 */
export function ChecklistGroupCard({ view: { group, items }, today, filter, onRename, onDelete }: ChecklistGroupCardProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const isTasks = group.kind === 'tasks'
  const title = isTasks ? t('checklist.tasks') : group.title
  const done = items.filter((item) => item.done).length

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <header className={styles.head}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <span className={styles.count} title={t('checklist.groupCount', { done, total: items.length })}>
          <span aria-hidden="true">
            {done}/{items.length}
          </span>
          <span className="visually-hidden">{t('checklist.groupCount', { done, total: items.length })}</span>
        </span>
        {!isTasks && (
          <span className={styles.tools}>
            <IconButton size="sm" variant="ghost" icon="✎" label={t('checklist.renameGroup', { title })} onClick={onRename} />
            <IconButton
              size="sm"
              variant="ghost"
              icon="×"
              label={t('checklist.deleteGroup', { title })}
              onClick={onDelete}
            />
          </span>
        )}
      </header>
      <ChecklistItems
        group={group}
        items={items}
        today={today}
        filter={filter}
        addLabel={isTasks ? t('checklist.addTaskDated') : t('checklist.addItem')}
      />
    </section>
  )
}
