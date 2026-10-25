import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { ChecklistGroupCard } from '@/components/checklist/ChecklistGroupCard'
import type { ChecklistFilter } from '@/components/checklist/ChecklistItems'
import { GroupFormModal } from '@/components/checklist/GroupFormModal'
import { Button, ConfirmDialog, SegmentedControl } from '@/components/ui'
import { useAppDispatch, useAppSelector } from '@/hooks/store'
import { useToday } from '@/hooks/useToday'
import { selectChecklistView, type ChecklistGroupView } from '@/store/selectors/checklistSelectors'
import { checklistGroupRenamed } from '@/store/slices/checklistGroupsSlice'
import { addChecklistGroup, deleteChecklistGroup } from '@/store/thunks/checklistThunks'
import styles from './ChecklistTab.module.css'

const FILTERS: ChecklistFilter[] = ['all', 'todo', 'done']

type GroupForm = { mode: 'closed' } | { mode: 'create' } | { mode: 'rename'; view: ChecklistGroupView }

/**
 * "Checklist" tab: filter (all / to do / done), summary "Packed 6 of 10 · Tasks 2 of 5",
 * groups as cards in a grid ("Tasks" — the same tasks as "Before the trip" on the plan).
 */
export default function ChecklistTab() {
  const { t } = useTranslation()
  const { tripId = '' } = useParams()
  const dispatch = useAppDispatch()
  const today = useToday()
  const view = useAppSelector((state) => selectChecklistView(state, tripId))
  const [filter, setFilter] = useState<ChecklistFilter>('all')
  const [form, setForm] = useState<GroupForm>({ mode: 'closed' })
  // Kept as an object: the dialog still shows the title while closing after deletion
  const [toDelete, setToDelete] = useState<ChecklistGroupView>()

  if (!view) return null // TripLayout shows "Trip not found"

  return (
    <>
      <div className={styles.bar}>
        <SegmentedControl
          size="sm"
          label={t('checklist.filter')}
          value={filter}
          onChange={setFilter}
          options={FILTERS.map((value) => ({ value, label: t(`checklist.filters.${value}`) }))}
        />
        <span className="meta">
          {t('checklist.summary', {
            packed: view.packed,
            packTotal: view.packTotal,
            tasksDone: view.tasksDone,
            tasksTotal: view.tasksTotal,
          })}
        </span>
        <span className={styles.spacer} />
        <Button size="sm" icon="+" onClick={() => setForm({ mode: 'create' })}>
          {t('checklist.addGroup')}
        </Button>
      </div>

      <div className={styles.grid}>
        {view.groups.map((groupView) => (
          <ChecklistGroupCard
            key={groupView.group.id}
            view={groupView}
            today={today}
            filter={filter}
            onRename={() => setForm({ mode: 'rename', view: groupView })}
            onDelete={() => setToDelete(groupView)}
          />
        ))}
      </div>

      <GroupFormModal
        open={form.mode !== 'closed'}
        onClose={() => setForm({ mode: 'closed' })}
        initialTitle={form.mode === 'rename' ? form.view.group.title : undefined}
        onSubmit={(title) =>
          form.mode === 'rename'
            ? dispatch(checklistGroupRenamed({ id: form.view.group.id, title }))
            : dispatch(addChecklistGroup(tripId, title))
        }
      />

      <ConfirmDialog
        open={toDelete !== undefined}
        title={t('checklist.deleteGroupTitle')}
        message={t('checklist.deleteGroupMessage', { title: toDelete?.group.title ?? '', count: toDelete?.items.length ?? 0 })}
        confirmLabel={t('actions.delete')}
        onConfirm={() => {
          if (toDelete) dispatch(deleteChecklistGroup(toDelete.group.id))
          setToDelete(undefined)
        }}
        onCancel={() => setToDelete(undefined)}
      />
    </>
  )
}
