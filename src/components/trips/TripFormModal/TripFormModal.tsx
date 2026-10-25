import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { useForm, type FieldError } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Field, FormErrorSummary, Input, Modal, Select, Textarea } from '@/components/ui'
import { useAppDispatch } from '@/hooks/store'
import { useToast } from '@/hooks/useToast'
import { createTrip, updateTrip } from '@/store/thunks/tripThunks'
import { CURRENCIES, type Trip } from '@/types'
import {
  EMPTY_TRIP_FORM,
  formToTrip,
  TRIP_DESTINATION_MAX,
  TRIP_NOTES_MAX,
  TRIP_TITLE_MAX,
  tripFormSchema,
  tripToForm,
  type TripFormError,
  type TripFormInput,
  type TripFormOutput,
} from './tripFormSchema'
import styles from './TripFormModal.module.css'

export interface TripFormModalProps {
  open: boolean
  onClose: () => void
  /** Trip to edit; without it the modal creates a new trip. */
  trip?: Trip
  /** Called after a successful save (e.g. to navigate to the new trip). */
  onSaved?: (trip: Trip) => void
}

const CURRENCY_OPTIONS = CURRENCIES.map((code) => ({ value: code, label: code }))

/**
 * Create / edit trip. Modal (stage 2.3) renders its content only while open,
 * so the form below mounts fresh on every opening — no stale values to reset.
 */
export function TripFormModal({ open, onClose, trip, onSaved }: TripFormModalProps) {
  const { t } = useTranslation()
  const formId = useId()
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t(trip ? 'trips.form.editTitle' : 'trips.form.createTitle')}
      // A stray click outside must not throw away typed data
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('actions.cancel')}
          </Button>
          <Button variant="primary" type="submit" form={formId}>
            {t(trip ? 'actions.save' : 'trips.form.create')}
          </Button>
        </>
      }
    >
      <TripForm id={formId} trip={trip} onDone={onClose} onSaved={onSaved} />
    </Modal>
  )
}

interface TripFormProps {
  id: string
  trip?: Trip
  onDone: () => void
  onSaved?: (trip: Trip) => void
}

function TripForm({ id, trip, onDone, onSaved }: TripFormProps) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const toast = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm<TripFormInput, unknown, TripFormOutput>({
    resolver: zodResolver(tripFormSchema),
    mode: 'onTouched', // first error after blur or submit, then live
    defaultValues: trip ? tripToForm(trip) : EMPTY_TRIP_FORM,
  })

  /** Error keys from the schema → translated text (re-translated when the language changes). */
  const errorText = (error?: FieldError) =>
    error?.message ? t(`trips.form.errors.${error.message as TripFormError}`) : undefined

  const onSubmit = (values: TripFormOutput) => {
    const fields = formToTrip(values)
    if (trip) {
      dispatch(updateTrip(trip.id, fields))
      toast({ message: t('trips.form.saved') })
      onSaved?.({ ...trip, ...fields })
    } else {
      const created = dispatch(createTrip(fields))
      toast({ message: t('trips.form.created') })
      onSaved?.(created)
    }
    onDone()
  }

  return (
    <form id={id} className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      {isSubmitted && <FormErrorSummary count={Object.keys(errors).length} />}

      <Field label={t('trips.form.title')} required error={errorText(errors.title)}>
        <Input
          placeholder={t('trips.form.titlePlaceholder')}
          maxLength={TRIP_TITLE_MAX}
          autoComplete="off"
          {...register('title')}
        />
      </Field>

      <Field label={t('trips.form.destination')} required error={errorText(errors.destination)}>
        <Input
          placeholder={t('trips.form.destinationPlaceholder')}
          maxLength={TRIP_DESTINATION_MAX}
          autoComplete="off"
          {...register('destination')}
        />
      </Field>

      <div className={styles.grid2}>
        <Field label={t('trips.form.start')} required error={errorText(errors.startDate)}>
          {/* deps: changing the start re-validates the end (the cross-field rules live on endDate) */}
          <Input type="date" {...register('startDate', { deps: ['endDate'] })} />
        </Field>
        <Field label={t('trips.form.end')} required error={errorText(errors.endDate)}>
          <Input type="date" {...register('endDate')} />
        </Field>
      </div>

      <Field label={t('trips.form.currency')} hint={t('trips.form.currencyHint')}>
        <Select options={CURRENCY_OPTIONS} {...register('currency')} />
      </Field>

      <Field label={t('trips.form.notes')} optional error={errorText(errors.notes)}>
        <Textarea placeholder={t('trips.form.notesPlaceholder')} maxLength={TRIP_NOTES_MAX} {...register('notes')} />
      </Field>
    </form>
  )
}
