import { z } from 'zod'
import type { ItemPlace } from '@/store/actions/itemActions'
import type { ItemDraft } from '@/store/thunks/planThunks'
import { ITEM_CATEGORIES, type ChecklistItem, type ItineraryItem } from '@/types'
import { isISODate, isTimeHHmm } from '@/utils/guards'

/**
 * Item form validation (WORKING_PLAN §6). Like the trip form, messages are keys
 * of `plan.item.errors.*`, translated on render.
 * Inputs are strings; the schema turns them into the store shape
 * (empty optional fields → `undefined`, duration → number).
 */

export const ITEM_TITLE_MIN = 2
export const ITEM_TITLE_MAX = 80
export const ITEM_TEXT_MAX = 200
export const DURATION_MIN = 5
export const DURATION_MAX = 24 * 60

export type ItemFormError = 'titleLength' | 'time' | 'duration' | 'textLength' | 'bookByDate'
const msg = (key: ItemFormError) => ({ error: key })

/** "Where to put it" select: `ideas` or a day id */
export const IDEAS_VALUE = 'ideas'

const optionalText = z
  .string()
  .trim()
  .max(ITEM_TEXT_MAX, msg('textLength'))
  .transform((value) => value || undefined)

export const itemFormSchema = z.object({
  title: z.string().trim().min(ITEM_TITLE_MIN, msg('titleLength')).max(ITEM_TITLE_MAX, msg('titleLength')),
  place: z.string(),
  category: z.enum(ITEM_CATEGORIES),
  time: z
    .string()
    .refine((value) => value === '' || isTimeHHmm(value), msg('time'))
    .transform((value) => value || undefined),
  duration: z
    .string()
    .trim()
    .refine((value) => {
      if (value === '') return true
      const minutes = Number(value)
      return Number.isInteger(minutes) && minutes >= DURATION_MIN && minutes <= DURATION_MAX
    }, msg('duration'))
    .transform((value) => (value === '' ? undefined : Number(value))),
  location: optionalText,
  /** Set by picking a place suggestion; typing in the place field clears it */
  coords: z.object({ lat: z.number(), lng: z.number() }).optional(),
  note: optionalText,
  needsBooking: z.boolean(),
  bookBy: z
    .string()
    .refine((value) => value === '' || isISODate(value), msg('bookByDate'))
    .transform((value) => value || undefined),
})

export type ItemFormInput = z.input<typeof itemFormSchema>
export type ItemFormOutput = z.output<typeof itemFormSchema>

const placeToValue = (place: ItemPlace) => place ?? IDEAS_VALUE

export function emptyItemForm(place: ItemPlace): ItemFormInput {
  return {
    title: '',
    place: placeToValue(place),
    category: 'sight',
    time: '',
    duration: '',
    location: '',
    coords: undefined,
    note: '',
    needsBooking: false,
    bookBy: '',
  }
}

export function itemToForm(item: ItineraryItem, bookingTask?: ChecklistItem): ItemFormInput {
  return {
    title: item.title,
    place: placeToValue(item.dayId),
    category: item.category,
    time: item.time ?? '',
    duration: item.durationMin === undefined ? '' : String(item.durationMin),
    location: item.location ?? '',
    coords: item.coords,
    note: item.note ?? '',
    needsBooking: item.needsBooking,
    bookBy: bookingTask?.dueDate ?? '',
  }
}

export function formToDraft({ place, duration, needsBooking, bookBy, ...rest }: ItemFormOutput): ItemDraft {
  return {
    ...rest,
    place: place === IDEAS_VALUE ? null : place,
    durationMin: duration,
    needsBooking,
    bookBy: needsBooking ? bookBy : undefined,
  }
}
