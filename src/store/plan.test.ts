import { beforeEach, describe, expect, it } from 'vitest'
import { makeStore } from '@/store'
import { selectBoard } from './selectors/planSelectors'
import { selectTripRows } from './selectors/tripsTable'
import { checklistItemToggled } from './slices/checklistItemsSlice'
import { deleteChecklistItem } from './thunks/checklistThunks'
import { addItem, deleteItem, moveItem, saveItem, setNeedsBooking } from './thunks/planThunks'
import { createTrip, deleteTrip, updateTrip } from './thunks/tripThunks'

/**
 * Plan logic through a real store: thunks dispatch cross-slice actions,
 * every slice must stay consistent (order arrays ↔ entities).
 */
let store: ReturnType<typeof makeStore>
const board = (tripId: string) => selectBoard(store.getState(), tripId)!
const titles = (items: { title: string }[]) => items.map((item) => item.title)
const fields = { title: 'Rome', destination: 'IT', currency: 'EUR' as const }

beforeEach(() => {
  store = makeStore({}) // empty store: no demo
})

function setup() {
  const trip = store.dispatch(createTrip({ ...fields, startDate: '2026-11-10', endDate: '2026-11-13' }))
  const [, , d3, d4] = board(trip.id).days.map(({ day }) => day.id)
  return { trip, d3: d3!, d4: d4! }
}

describe('trip lifecycle', () => {
  it('a new trip gets one day per date, the tasks group and default packing groups', () => {
    const { trip } = setup()
    expect(board(trip.id).days.map(({ day }) => day.date)).toEqual(['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13'])
    expect(board(trip.id).tasksGroup?.kind).toBe('tasks')
    expect(trip.groupIds).toHaveLength(5)
  })

  it('shrinking the dates keeps days by date and sends items of removed days to Ideas (with a toast)', () => {
    const { trip, d3, d4 } = setup()
    store.dispatch(addItem(trip.id, { title: 'Pizza', category: 'food', place: d4, needsBooking: false }))
    store.dispatch(updateTrip(trip.id, { ...fields, startDate: '2026-11-11', endDate: '2026-11-12' }))
    expect(board(trip.id).days.map(({ day }) => day.id)[1]).toBe(d3)
    expect(titles(board(trip.id).ideas)).toEqual(['Pizza'])
    expect(store.getState().toasts.at(-1)?.message).toContain('1 stop moved')
  })

  it('deleting a trip cascades to every slice; Undo restores everything', () => {
    const { trip, d3 } = setup()
    store.dispatch(addItem(trip.id, { title: 'Colosseum', category: 'sight', place: d3, needsBooking: true }))
    store.dispatch(deleteTrip(trip.id))
    const s = store.getState()
    expect(s.trips.ids.length + s.days.ids.length + s.items.ids.length + s.checklistGroups.ids.length + s.checklistItems.ids.length).toBe(0)
    store.dispatch(store.getState().toasts.at(-1)!.undo!)
    expect(titles(board(trip.id).days[2]!.items)).toEqual(['Colosseum'])
    expect(board(trip.id).tasks).toHaveLength(1)
  })
})

describe('items', () => {
  it('moves between columns and reorders inside a day', () => {
    const { trip, d3 } = setup()
    const a = store.dispatch(addItem(trip.id, { title: 'A', category: 'sight', place: d3, needsBooking: false }))
    const idea = store.dispatch(addItem(trip.id, { title: 'Idea', category: 'sight', place: null, needsBooking: false }))
    store.dispatch(moveItem(idea.id, d3, 0))
    expect(titles(board(trip.id).days[2]!.items)).toEqual(['Idea', 'A'])
    expect(board(trip.id).ideas).toEqual([])
    store.dispatch(moveItem(a.id, d3, 0))
    expect(titles(board(trip.id).days[2]!.items)).toEqual(['A', 'Idea'])
  })

  it('saveItem with another place moves the item to the end of that column', () => {
    const { trip, d3 } = setup()
    const a = store.dispatch(addItem(trip.id, { title: 'A', category: 'sight', place: d3, needsBooking: false }))
    store.dispatch(saveItem(a.id, { title: 'A!', category: 'sight', place: null, needsBooking: false }))
    expect(titles(board(trip.id).ideas)).toEqual(['A!'])
  })

  it('delete + Undo puts the item back in the same place', () => {
    const { trip, d3 } = setup()
    store.dispatch(addItem(trip.id, { title: 'A', category: 'sight', place: d3, needsBooking: false }))
    const b = store.dispatch(addItem(trip.id, { title: 'B', category: 'sight', place: d3, needsBooking: false }))
    store.dispatch(addItem(trip.id, { title: 'C', category: 'sight', place: d3, needsBooking: false }))
    store.dispatch(deleteItem(b.id))
    store.dispatch(store.getState().toasts.at(-1)!.undo!)
    expect(titles(board(trip.id).days[2]!.items)).toEqual(['A', 'B', 'C'])
  })
})

describe('"needs booking" ↔ task', () => {
  it('on → a linked task with the due date; off → an open task is deleted', () => {
    const { trip, d3 } = setup()
    const a = store.dispatch(addItem(trip.id, { title: 'Opera', category: 'activity', place: d3, needsBooking: true, bookBy: '2026-11-01' }))
    const task = board(trip.id).tasks[0]!
    expect(task).toMatchObject({ text: 'Book: Opera', dueDate: '2026-11-01', sourceItemId: a.id })
    store.dispatch(setNeedsBooking(a.id, false))
    expect(board(trip.id).tasks).toEqual([])
  })

  it('off with a done task → the task stays, unlinked', () => {
    const { trip, d3 } = setup()
    const a = store.dispatch(addItem(trip.id, { title: 'Opera', category: 'activity', place: d3, needsBooking: true }))
    store.dispatch(checklistItemToggled(board(trip.id).tasks[0]!.id))
    store.dispatch(setNeedsBooking(a.id, false))
    expect(board(trip.id).tasks[0]!.sourceItemId).toBeUndefined()
  })

  it('deleting the task clears the flag; Undo links them again', () => {
    const { trip, d3 } = setup()
    const a = store.dispatch(addItem(trip.id, { title: 'Opera', category: 'activity', place: d3, needsBooking: true }))
    const taskId = store.getState().items.entities[a.id]!.bookingTaskId!
    store.dispatch(deleteChecklistItem(taskId))
    expect(store.getState().items.entities[a.id]!.needsBooking).toBe(false)
    store.dispatch(store.getState().toasts.at(-1)!.undo!)
    expect(store.getState().items.entities[a.id]).toMatchObject({ needsBooking: true, bookingTaskId: taskId })
  })

  it('deleting the stop keeps the task as a normal task', () => {
    const { trip, d3 } = setup()
    const a = store.dispatch(addItem(trip.id, { title: 'Opera', category: 'activity', place: d3, needsBooking: true }))
    store.dispatch(deleteItem(a.id))
    expect(board(trip.id).tasks[0]!.sourceItemId).toBeUndefined()
  })
})

describe('trips list rows', () => {
  it('readiness comes from the whole checklist', () => {
    const { trip, d3 } = setup()
    store.dispatch(addItem(trip.id, { title: 'Opera', category: 'activity', place: d3, needsBooking: true }))
    store.dispatch(checklistItemToggled(board(trip.id).tasks[0]!.id))
    expect(selectTripRows(store.getState(), '2026-10-01')[0]!.readiness.percent).toBe(100)
  })
})
