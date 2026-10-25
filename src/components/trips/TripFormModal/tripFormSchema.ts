import { z } from 'zod'
import { CURRENCIES, DEFAULT_CURRENCY, type Trip } from '@/types'
import type { TripEditableFields } from '@/store/slices/tripsSlice'
import { diffDays } from '@/utils/date'
import { isISODate } from '@/utils/guards'

/**
 * Trip form validation (rules: WORKING_PLAN §6).
 *
 * Messages are short keys of `trips.form.errors.*`, not texts: the component
 * translates them on render, so already shown errors switch language together with the UI.
 */

export const TRIP_TITLE_MIN = 2
export const TRIP_TITLE_MAX = 80
export const TRIP_DESTINATION_MAX = 80
export const TRIP_NOTES_MAX = 1000
export const TRIP_MAX_DAYS = 60

export const TRIP_FORM_ERRORS = [
  'titleLength',
  'destinationRequired',
  'destinationLength',
  'dateRequired',
  'endBeforeStart',
  'tooLong',
  'notesLength',
] as const
export type TripFormError = (typeof TRIP_FORM_ERRORS)[number]

const msg = (key: TripFormError) => ({ error: key })

const isoDate = z.string().refine(isISODate, msg('dateRequired'))

// Dates on their own — the cross-field rules below run as soon as these two are valid
const datesSchema = z.object({ startDate: isoDate, endDate: isoDate })

export const tripFormSchema = z
  .object({
    title: z.string().trim().min(TRIP_TITLE_MIN, msg('titleLength')).max(TRIP_TITLE_MAX, msg('titleLength')),
    destination: z
      .string()
      .trim()
      .min(1, msg('destinationRequired'))
      .max(TRIP_DESTINATION_MAX, msg('destinationLength')),
    ...datesSchema.shape,
    currency: z.enum(CURRENCIES),
    notes: z.string().trim().max(TRIP_NOTES_MAX, msg('notesLength')),
  })
  // Zod 4 skips object refinements while any field is invalid; `when` runs them once the dates are valid,
  // so the user sees date errors together with the others (see journal, 2.2).
  .refine((data) => data.endDate >= data.startDate, {
    ...msg('endBeforeStart'),
    path: ['endDate'],
    when: (payload) => datesSchema.safeParse(payload.value).success,
  })
  .refine((data) => data.endDate < data.startDate || diffDays(data.startDate, data.endDate) + 1 <= TRIP_MAX_DAYS, {
    ...msg('tooLong'),
    path: ['endDate'],
    when: (payload) => datesSchema.safeParse(payload.value).success,
  })

/** What the inputs hold (strings; before trimming). */
export type TripFormInput = z.input<typeof tripFormSchema>
/** What validation returns (trimmed). */
export type TripFormOutput = z.output<typeof tripFormSchema>

/** Empty form for a new trip. */
export const EMPTY_TRIP_FORM: TripFormInput = {
  title: '',
  destination: '',
  startDate: '',
  endDate: '',
  currency: DEFAULT_CURRENCY,
  notes: '',
}

/** Existing trip → form values. */
export function tripToForm(trip: Trip): TripFormInput {
  return {
    title: trip.title,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    currency: trip.currency,
    notes: trip.notes ?? '',
  }
}

/** Validated form → store fields. An empty note is stored as "no note". */
export function formToTrip({ notes, ...rest }: TripFormOutput): TripEditableFields {
  return { ...rest, notes: notes || undefined }
}
