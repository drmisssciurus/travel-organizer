import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { Controller, useForm, useWatch, type FieldError } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { PlaceInput } from '@/components/plan/PlaceInput'
import { Button, Checkbox, Field, FormErrorSummary, Input, Modal, Select, Textarea } from '@/components/ui'
import { useAppDispatch, useAppSelector } from '@/hooks/store'
import { useDestinationPoint } from '@/hooks/useDestinationPoint'
import { useToast } from '@/hooks/useToast'
import type { ItemPlace } from '@/store/actions/itemActions'
import type { BoardDay } from '@/store/selectors/planSelectors'
import { selectLanguage } from '@/store/slices/settingsSlice'
import { selectTripById } from '@/store/slices/tripsSlice'
import { locateItem } from '@/store/thunks/mapThunks'
import { addItem, deleteItem, saveItem } from '@/store/thunks/planThunks'
import { ITEM_CATEGORIES, type ChecklistItem, type ID, type ItineraryItem } from '@/types'
import { formatWeekdayDay } from '@/utils/format'
import {
  DURATION_MAX,
  DURATION_MIN,
  emptyItemForm,
  formToDraft,
  IDEAS_VALUE,
  ITEM_TEXT_MAX,
  ITEM_TITLE_MAX,
  itemFormSchema,
  itemToForm,
  type ItemFormError,
  type ItemFormInput,
  type ItemFormOutput,
} from './itemFormSchema'
import styles from './ItemFormModal.module.css'

export interface ItemFormModalProps {
  open: boolean
  onClose: () => void
  tripId: ID
  days: readonly BoardDay[]
  /** Item to edit; without it — a new item */
  item?: ItineraryItem
  bookingTask?: ChecklistItem
  /** Column the "+ Add" button belongs to */
  defaultPlace?: ItemPlace
}

/** Create / edit a plan item (stop or idea). The form mounts fresh on every opening (see Modal). */
export function ItemFormModal({ open, onClose, item, defaultPlace = null, ...rest }: ItemFormModalProps) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const formId = useId()
  const title = item
    ? t('plan.item.editTitle')
    : defaultPlace === null
      ? t('plan.item.createIdeaTitle')
      : t('plan.item.createTitle')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      closeOnBackdrop={false}
      footer={
        <>
          {item && (
            <Button
              variant="dangerOutline"
              className={styles.delete}
              onClick={() => {
                dispatch(deleteItem(item.id))
                onClose()
              }}
            >
              {t('plan.item.delete')}
            </Button>
          )}
          <Button onClick={onClose}>{t('actions.cancel')}</Button>
          <Button variant="primary" type="submit" form={formId}>
            {item ? t('actions.save') : t('plan.item.create')}
          </Button>
        </>
      }
    >
      <ItemForm id={formId} item={item} defaultPlace={defaultPlace} onDone={onClose} {...rest} />
    </Modal>
  )
}

interface ItemFormProps {
  id: string
  tripId: ID
  days: readonly BoardDay[]
  item?: ItineraryItem
  bookingTask?: ChecklistItem
  defaultPlace: ItemPlace
  onDone: () => void
}

function ItemForm({ id, tripId, days, item, bookingTask, defaultPlace, onDone }: ItemFormProps) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const toast = useToast()
  const language = useAppSelector(selectLanguage)
  const destination = useAppSelector((state) => selectTripById(state, tripId)?.destination)
  const near = useDestinationPoint(destination)
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm<ItemFormInput, unknown, ItemFormOutput>({
    resolver: zodResolver(itemFormSchema),
    mode: 'onTouched',
    defaultValues: item ? itemToForm(item, bookingTask) : emptyItemForm(defaultPlace),
  })
  // "Book by" is shown only when "Needs booking" is on
  const needsBooking = useWatch({ control, name: 'needsBooking' })
  const [location, coords] = useWatch({ control, name: ['location', 'coords'] })
  const placeHint = coords
    ? t('plan.place.onMap')
    : location.trim()
      ? t('plan.place.willSearch')
      : undefined

  const errorText = (error?: FieldError) =>
    error?.message ? t(`plan.item.errors.${error.message as ItemFormError}`) : undefined

  const onSubmit = (values: ItemFormOutput) => {
    const draft = formToDraft(values)
    let id: ID
    if (item) {
      dispatch(saveItem(item.id, draft))
      id = item.id
      toast({ message: t('plan.item.saved') })
    } else {
      id = dispatch(addItem(tripId, draft)).id
      toast({ message: t('plan.item.created') })
    }
    // Place typed but not picked from the list → find it on the map in the background
    void dispatch(locateItem(id))
    onDone()
  }

  const placeOptions = [
    { value: IDEAS_VALUE, label: t('plan.item.ideasOption') },
    ...days.map(({ day, number }) => ({
      value: day.id,
      label: `${t('plan.day', { number })} · ${formatWeekdayDay(day.date, language)}`,
    })),
  ]
  const categoryOptions = ITEM_CATEGORIES.map((category) => ({ value: category, label: t(`plan.categories.${category}`) }))

  return (
    <form id={id} className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      {isSubmitted && <FormErrorSummary count={Object.keys(errors).length} />}

      <Field label={t('plan.item.title')} required error={errorText(errors.title)}>
        <Input
          placeholder={t('plan.item.titlePlaceholder')}
          maxLength={ITEM_TITLE_MAX}
          autoComplete="off"
          {...register('title')}
        />
      </Field>

      <div className={styles.grid2}>
        <Field label={t('plan.item.place')}>
          <Select options={placeOptions} {...register('place')} />
        </Field>
        <Field label={t('plan.item.category')}>
          <Select options={categoryOptions} {...register('category')} />
        </Field>
      </div>

      <div className={styles.grid2}>
        <Field label={t('plan.item.time')} optional error={errorText(errors.time)}>
          <Input type="time" {...register('time')} />
        </Field>
        <Field label={t('plan.item.duration')} optional error={errorText(errors.duration)}>
          <Input
            type="number"
            inputMode="numeric"
            min={DURATION_MIN}
            max={DURATION_MAX}
            step={5}
            placeholder="60"
            {...register('duration')}
          />
        </Field>
      </div>

      <Field label={t('plan.item.location')} optional hint={placeHint} error={errorText(errors.location)}>
        <Controller
          control={control}
          name="location"
          render={({ field }) => (
            <PlaceInput
              ref={field.ref}
              name={field.name}
              onBlur={field.onBlur}
              value={field.value}
              near={near}
              maxLength={ITEM_TEXT_MAX}
              placeholder={t('plan.place.placeholder')}
              onChange={(text, point) => {
                field.onChange(text)
                setValue('coords', point)
              }}
            />
          )}
        />
      </Field>

      <Field label={t('plan.item.note')} optional error={errorText(errors.note)}>
        <Textarea rows={2} maxLength={ITEM_TEXT_MAX} {...register('note')} />
      </Field>

      <Checkbox label={t('plan.item.needsBooking')} {...register('needsBooking')} />
      {needsBooking && (
        <Field label={t('plan.item.bookBy')} optional error={errorText(errors.bookBy)}>
          <Input type="date" {...register('bookBy')} />
        </Field>
      )}
    </form>
  )
}
