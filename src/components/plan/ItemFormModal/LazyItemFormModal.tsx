import { lazy } from 'react'

/** The item form is loaded on first use (see LazyTripFormModal). */
export const LazyItemFormModal = lazy(() => import('./ItemFormModal').then((module) => ({ default: module.ItemFormModal })))
