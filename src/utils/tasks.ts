import type { ChecklistItem } from '@/types'

/** Open tasks first, by due date (no date — last); done tasks at the bottom. */
export function sortTasks(tasks: readonly ChecklistItem[]): ChecklistItem[] {
  return tasks.toSorted(
    (a, b) => Number(a.done) - Number(b.done) || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'),
  )
}
