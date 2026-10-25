/** Small helpers for id-order arrays (`day.itemIds`, `trip.ideaIds`…). Used inside Immer reducers — they mutate. */

/** Removes `id` if present. */
export function removeId<T>(list: T[], id: T): void {
  const index = list.indexOf(id)
  if (index !== -1) list.splice(index, 1)
}

/** Inserts `id` at `index`, clamped to the array bounds (`undefined` → end). */
export function insertAt<T>(list: T[], id: T, index?: number): void {
  const at = index === undefined ? list.length : Math.max(0, Math.min(index, list.length))
  list.splice(at, 0, id)
}
