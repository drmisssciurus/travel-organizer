import { lazy } from 'react'

/**
 * The trip form (react-hook-form + zod, ≈ 35 kB gzip) is loaded on the first
 * "New trip" / "Edit" click, not with the page: most visits only look at the list.
 * (Own file: react-refresh wants component modules to export only components.)
 */
export const LazyTripFormModal = lazy(() =>
  import('../TripFormModal').then((module) => ({ default: module.TripFormModal })),
)
