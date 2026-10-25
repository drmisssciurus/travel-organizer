import { beforeEach, describe, expect, it } from 'vitest'
import { makeStore } from '@/store'
import { selectChecklistView } from './selectors/checklistSelectors'
import { selectTripExpenses } from './selectors/expenseSelectors'
import { selectTripRows } from './selectors/tripsTable'
import { checklistGroupRenamed } from './slices/checklistGroupsSlice'
import { checklistItemToggled } from './slices/checklistItemsSlice'
import { expenseAdded, expenseDeleted, expenseRestored } from './slices/expensesSlice'
import { addChecklistGroup, addChecklistItem, deleteChecklistGroup, deleteChecklistItem } from './thunks/checklistThunks'
import { createTrip, deleteTrip } from './thunks/tripThunks'

let store: ReturnType<typeof makeStore>
const newTrip = () =>
  store.dispatch(createTrip({ title: 'Oslo', destination: 'NO', startDate: '2026-10-01', endDate: '2026-10-04', currency: 'EUR' }))
const view = (tripId: string) => selectChecklistView(store.getState(), tripId)!
const undoLast = () => store.dispatch(store.getState().toasts.at(-1)!.undo!)

beforeEach(() => {
  store = makeStore({})
})

describe('checklist', () => {
  it('a new trip: "Tasks" first, then the default groups (in the UI language)', () => {
    const trip = newTrip()
    expect(view(trip.id).groups.map(({ group }) => (group.kind === 'tasks' ? 'Tasks' : group.title))).toEqual([
      'Tasks',
      'Documents',
      'Clothes',
      'Tech',
      'Toiletries',
    ])
  })

  it('due dates only for tasks; summary counters', () => {
    const trip = newTrip()
    const [tasks, docs] = view(trip.id).groups
    store.dispatch(addChecklistItem(docs!.group.id, 'Passport', '2026-09-01'))
    store.dispatch(addChecklistItem(tasks!.group.id, 'Book hotel', '2026-09-01'))
    store.dispatch(checklistItemToggled(view(trip.id).groups[1]!.items[0]!.id))
    const v = view(trip.id)
    expect(v.groups[1]!.items[0]!.dueDate).toBeUndefined()
    expect(v.groups[0]!.items[0]!.dueDate).toBe('2026-09-01')
    expect(v).toMatchObject({ packed: 1, packTotal: 1, tasksDone: 0, tasksTotal: 1 })
  })

  it('groups: rename, add, delete with items, Undo back at the same position', () => {
    const trip = newTrip()
    const docs = view(trip.id).groups[1]!.group
    store.dispatch(addChecklistItem(docs.id, 'Passport'))
    store.dispatch(checklistGroupRenamed({ id: docs.id, title: 'Papers' }))
    store.dispatch(addChecklistGroup(trip.id, 'Ski'))
    expect(view(trip.id).groups.at(-1)!.group.title).toBe('Ski')
    store.dispatch(deleteChecklistGroup(docs.id))
    expect(store.getState().checklistItems.ids).toHaveLength(0)
    undoLast()
    expect(view(trip.id).groups[1]!.group).toMatchObject({ id: docs.id, title: 'Papers' })
    expect(view(trip.id).groups[1]!.items).toHaveLength(1)
  })

  it('the "Tasks" group cannot be deleted', () => {
    const trip = newTrip()
    store.dispatch(deleteChecklistGroup(view(trip.id).groups[0]!.group.id))
    expect(view(trip.id).groups[0]!.group.kind).toBe('tasks')
  })

  it('item delete + Undo keeps the position', () => {
    const trip = newTrip()
    const docs = view(trip.id).groups[1]!.group
    for (const text of ['A', 'B', 'C']) store.dispatch(addChecklistItem(docs.id, text))
    store.dispatch(deleteChecklistItem(view(trip.id).groups[1]!.items[1]!.id))
    undoLast()
    expect(view(trip.id).groups[1]!.items.map((item) => item.text)).toEqual(['A', 'B', 'C'])
  })
})

describe('expenses', () => {
  it('add / delete / restore, spent in the trips list, cascade with the trip', () => {
    const trip = newTrip()
    store.dispatch(expenseAdded(trip.id, { title: 'Hotel', amount: 300, category: 'stay', date: '2026-10-01' }))
    store.dispatch(expenseAdded(trip.id, { title: 'Coffee', amount: 4.5, category: 'food' }))
    const hotel = selectTripExpenses(store.getState(), trip.id)[0]!
    store.dispatch(expenseDeleted(hotel.id))
    store.dispatch(expenseRestored(hotel))
    expect(selectTripRows(store.getState(), '2026-10-02')[0]).toMatchObject({ spent: 304.5, expenseCount: 2 })
    store.dispatch(deleteTrip(trip.id))
    expect(store.getState().expenses.ids).toHaveLength(0)
    undoLast()
    expect(store.getState().expenses.ids).toHaveLength(2)
  })
})
