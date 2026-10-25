import { Suspense, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/ui'
import { useAppDispatch, useAppSelector } from '@/hooks/store'
import { selectTripById } from '@/store/slices/tripsSlice'
import { deleteTrip } from '@/store/thunks/tripThunks'
import type { ID, Trip } from '@/types'

import { LazyTripFormModal as TripFormModal } from './LazyTripFormModal'

/** Which form is open: none, "new trip", or editing a trip (by id — always the fresh entity from the store). */
type FormState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; tripId: ID }

export interface TripDialogsOptions {
  /** After a trip is created (e.g. go to its page) */
  onCreated?: (trip: Trip) => void
  /** After a trip is deleted (e.g. leave its page) */
  onDeleted?: (trip: Trip) => void
}

/**
 * Create / edit / delete dialogs of a trip, shared by the trips list and the trip page.
 * Returns the openers and the dialogs element to render once.
 */
export function useTripDialogs({ onCreated, onDeleted }: TripDialogsOptions = {}) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [form, setForm] = useState<FormState>({ mode: 'closed' })
  // Mounted after the first opening and kept: the modal needs to stay in the DOM
  // to close properly (return focus to the button that opened it)
  const [formUsed, setFormUsed] = useState(false)
  const editedTrip = useAppSelector((state) => (form.mode === 'edit' ? selectTripById(state, form.tripId) : undefined))
  // Trip waiting for delete confirmation. The object (not the id) is kept,
  // so the dialog can still show its title while closing after deletion.
  const [toDelete, setToDelete] = useState<Trip>()

  const openForm = (next: FormState) => {
    setFormUsed(true)
    setForm(next)
  }

  const confirmDelete = () => {
    if (toDelete) {
      dispatch(deleteTrip(toDelete.id))
      onDeleted?.(toDelete)
    }
    setToDelete(undefined)
  }

  const dialogs: ReactNode = (
    <>
      <ConfirmDialog
        open={toDelete !== undefined}
        title={t('trips.delete.title')}
        message={t('trips.delete.message', { title: toDelete?.title ?? '' })}
        confirmLabel={t('trips.delete.confirm')}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(undefined)}
      />
      {formUsed && (
        <Suspense fallback={null}>
          <TripFormModal
            open={form.mode !== 'closed'}
            onClose={() => setForm({ mode: 'closed' })}
            trip={editedTrip}
            onSaved={(trip) => {
              if (form.mode === 'create') onCreated?.(trip)
            }}
          />
        </Suspense>
      )}
    </>
  )

  return {
    openCreate: () => openForm({ mode: 'create' }),
    openEdit: (trip: Trip) => openForm({ mode: 'edit', tripId: trip.id }),
    requestDelete: (trip: Trip) => setToDelete(trip),
    dialogs,
  }
}
