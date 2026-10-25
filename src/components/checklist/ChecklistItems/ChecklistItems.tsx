import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Checkbox, IconButton, Input } from '@/components/ui'
import { useAppDispatch, useAppSelector } from '@/hooks/store'
import { checklistItemToggled } from '@/store/slices/checklistItemsSlice'
import { selectLanguage } from '@/store/slices/settingsSlice'
import { addChecklistItem, deleteChecklistItem } from '@/store/thunks/checklistThunks'
import type { ChecklistGroup, ChecklistItem, ISODate } from '@/types'
import { cx } from '@/utils/cx'
import { formatShortDate } from '@/utils/format'
import { sortTasks } from '@/utils/tasks'
import styles from './ChecklistItems.module.css'

export type ChecklistFilter = 'all' | 'todo' | 'done'

export interface ChecklistItemsProps {
  group: ChecklistGroup
  /** Items of the group in its order */
  items: readonly ChecklistItem[]
  today: ISODate
  filter?: ChecklistFilter
  /** Label of the "+ …" button; without it there is no quick entry (e.g. "Don't forget today") */
  addLabel?: string
  /** Text when there are no items (default: "Nothing here yet") */
  emptyText?: string
  /** Wide add button (mobile plan) */
  fullWidthAdd?: boolean
}

/**
 * Items of one checklist group: checkbox, due date for tasks (overdue in red),
 * delete with "Undo"; inline "add" form (quick entry — stays open for several items in a row).
 * Used by the "Before the trip" board column and by every group of the checklist tab.
 */
export function ChecklistItems({ group, items, today, filter = 'all', addLabel, emptyText, fullWidthAdd }: ChecklistItemsProps) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const language = useAppSelector(selectLanguage)
  const [adding, setAdding] = useState(false)
  const isTasks = group.kind === 'tasks'

  // Tasks: open first, by due date; packing items keep the user's order
  const ordered = isTasks ? sortTasks(items) : items
  const shown = ordered.filter((item) => filter === 'all' || (filter === 'done' ? item.done : !item.done))

  return (
    <>
      {shown.length > 0 ? (
        <ul className={styles.list}>
          {shown.map((item) => {
            const overdue = !item.done && item.dueDate !== undefined && item.dueDate < today
            return (
              <li key={item.id} className={cx(styles.row, item.done && styles.done)}>
                <Checkbox
                  className={styles.check}
                  checked={item.done}
                  onChange={() => dispatch(checklistItemToggled(item.id))}
                  strikeWhenChecked
                  label={
                    <span className={styles.body}>
                      <span className={styles.text}>{item.text}</span>
                      {item.dueDate && (
                        <span className={cx(styles.due, overdue && styles.overdue)}>
                          {formatShortDate(item.dueDate, language)}
                          {overdue && ` · ${t('plan.overdue')}`}
                        </span>
                      )}
                    </span>
                  }
                />
                <IconButton
                  className={styles.delete}
                  size="sm"
                  variant="ghost"
                  icon="×"
                  label={t('checklist.itemDelete', { text: item.text })}
                  title={t('actions.delete')}
                  onClick={() => dispatch(deleteChecklistItem(item.id))}
                />
              </li>
            )
          })}
        </ul>
      ) : (
        <p className={styles.empty}>
          {items.length === 0 ? (emptyText ?? t('checklist.groupEmpty')) : t('checklist.groupFiltered')}
        </p>
      )}
      {addLabel === undefined ? null : adding ? (
        <AddForm
          withDate={isTasks}
          placeholder={isTasks ? t('plan.taskPlaceholder') : t('checklist.itemPlaceholder')}
          onAdd={(text, dueDate) => dispatch(addChecklistItem(group.id, text, dueDate))}
          onClose={() => setAdding(false)}
        />
      ) : (
        <button type="button" className={cx(styles.add, fullWidthAdd && styles.addFull)} onClick={() => setAdding(true)}>
          + {addLabel}
        </button>
      )}
    </>
  )
}

interface AddFormProps {
  withDate: boolean
  placeholder: string
  onAdd: (text: string, dueDate?: ISODate) => void
  onClose: () => void
}

/** Inline quick entry: Enter adds and keeps the field focused, Esc closes. */
function AddForm({ withDate, placeholder, onAdd, onClose }: AddFormProps) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const value = text.trim()
    if (!value) {
      setError(true)
      return
    }
    onAdd(value.slice(0, 200), dueDate || undefined)
    setText('')
    setDueDate('')
    setError(false)
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <Input
        inputSize="sm"
        autoFocus
        maxLength={200}
        placeholder={placeholder}
        aria-label={placeholder}
        aria-invalid={error || undefined}
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          setError(false)
        }}
        onKeyDown={(event) => event.key === 'Escape' && onClose()}
      />
      {withDate && (
        <Input
          inputSize="sm"
          type="date"
          aria-label={t('plan.taskDue')}
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
      )}
      {error && (
        <p className={styles.error} role="alert">
          {t('checklist.itemEmpty')}
        </p>
      )}
      <div className={styles.formActions}>
        <Button size="sm" variant="primary" type="submit">
          {t('checklist.itemAdd')}
        </Button>
        <Button size="sm" onClick={onClose}>
          {t('actions.cancel')}
        </Button>
      </div>
    </form>
  )
}
