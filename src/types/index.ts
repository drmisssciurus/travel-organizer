/**
 * Domain model. Entities are normalized: they reference each other by `ID`,
 * and ordering is stored as arrays of ids (`dayIds`, `itemIds`, `ideaIds`, `groupIds`).
 *
 * Trip ─┬─ Day[] ──── ItineraryItem[]
 *       ├─ ideas ──── ItineraryItem[] (dayId = null)
 *       ├─ Expense[]
 *       └─ ChecklistGroup[] ── ChecklistItem[]
 */
export * from './common'
export * from './trip'
export * from './itinerary'
export * from './expense'
export * from './checklist'
export * from './settings'
