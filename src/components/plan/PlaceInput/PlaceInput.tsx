import { useEffect, useId, useState, type ComponentProps, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui'
import { MIN_QUERY_LENGTH, placeLabel, searchPlaces, type Place } from '@/api/geocode'
import { useAppSelector } from '@/hooks/store'
import { selectLanguage } from '@/store/slices/settingsSlice'
import type { GeoPoint } from '@/types'
import { cx } from '@/utils/cx'
import styles from './PlaceInput.module.css'

const DEBOUNCE_MS = 300

type Status = 'idle' | 'loading' | 'done' | 'error'

export interface PlaceInputProps extends Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'role'> {
  value: string
  /**
   * Text typed → `coords` is `undefined` (the text no longer matches the point);
   * a suggestion picked → its label and coordinates.
   */
  onChange: (value: string, coords: GeoPoint | undefined) => void
  /** Prefer places near this point (the trip destination). */
  near?: GeoPoint
}

/**
 * Text input with place suggestions (WAI-ARIA combobox, list autocomplete).
 * The text stays free: a place that is not found is still saved as text.
 *
 * Keyboard: ↓/↑ move through suggestions, Enter picks one, Esc closes the list
 * (and does not close the dialog around it).
 */
export function PlaceInput({ value, onChange, near, className, onBlur, ...rest }: PlaceInputProps) {
  const { t } = useTranslation()
  const language = useAppSelector(selectLanguage)
  const listId = useId()
  const [query, setQuery] = useState<string>()
  const [places, setPlaces] = useState<Place[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [active, setActive] = useState(-1)
  const [open, setOpen] = useState(false)
  const nearLat = near?.lat
  const nearLng = near?.lng

  // `query` is set only by typing: the initial value and a picked suggestion don't trigger a search
  useEffect(() => {
    if (query === undefined || query.trim().length < MIN_QUERY_LENGTH) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setStatus('loading')
      const point = nearLat === undefined || nearLng === undefined ? undefined : { lat: nearLat, lng: nearLng }
      searchPlaces(query, { language, near: point, signal: controller.signal }).then(
        (found) => {
          setPlaces(found)
          setStatus('done')
          setActive(-1)
        },
        () => {
          if (!controller.signal.aborted) setStatus('error')
        },
      )
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, language, nearLat, nearLng])

  const searchable = query !== undefined && query.trim().length >= MIN_QUERY_LENGTH
  const expanded = open && searchable && status !== 'idle'
  const showList = expanded && places.length > 0

  const pick = (place: Place) => {
    onChange(placeLabel(place), place.coords)
    setQuery(undefined)
    setOpen(false)
    setPlaces([])
    setStatus('idle')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!searchable || places.length === 0) return
      event.preventDefault()
      if (!open) {
        setOpen(true) // reopen after Esc
        return
      }
      const last = places.length - 1
      setActive((index) =>
        event.key === 'ArrowDown' ? (index >= last ? 0 : index + 1) : index <= 0 ? last : index - 1,
      )
    } else if (event.key === 'Enter' && showList && places[active]) {
      event.preventDefault() // pick the place instead of submitting the form
      pick(places[active])
    } else if (event.key === 'Escape' && expanded) {
      event.preventDefault() // keep the dialog open, close only the list
      event.stopPropagation()
      setOpen(false)
    }
  }

  let message: string | undefined
  if (expanded) {
    if (status === 'loading') message = t('plan.place.searching')
    else if (status === 'error') message = t('plan.place.searchError')
    else if (places.length === 0) message = t('plan.place.notFound')
    else message = t('plan.place.found', { count: places.length })
  }

  return (
    <div className={styles.root}>
      <Input
        {...rest}
        className={className}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        value={value}
        onChange={(event) => {
          onChange(event.target.value, undefined)
          setQuery(event.target.value)
          setOpen(true)
          if (event.target.value.trim().length < MIN_QUERY_LENGTH) setStatus('idle')
        }}
        onKeyDown={onKeyDown}
        onBlur={(event) => {
          setOpen(false)
          onBlur?.(event)
        }}
      />
      <ul id={listId} role="listbox" aria-label={t('plan.place.suggestions')} className={styles.list} hidden={!showList}>
        {places.map((place, index) => (
          <li
            key={`${place.name}|${place.context}`}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === active}
            className={cx(styles.option, index === active && styles.active)}
            // mousedown, not click: picking must happen before the input's blur closes the list
            onMouseDown={(event) => {
              event.preventDefault()
              pick(place)
            }}
          >
            <span className={styles.name}>{place.name}</span>
            {place.context && <span className={styles.context}>{place.context}</span>}
          </li>
        ))}
      </ul>
      {/* Screen readers hear the count / "nothing found"; sighted users see the same line */}
      <p className={cx(styles.status, !message && styles.statusEmpty)} role="status" aria-live="polite">
        {message}
      </p>
    </div>
  )
}
