import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useSearchParams } from 'react-router'
import { DayFilter } from '@/components/map/DayFilter'
import { MapStopList } from '@/components/map/MapStopList'
import { TripMap } from '@/components/map/TripMap'
import { LazyItemFormModal } from '@/components/plan/ItemFormModal/LazyItemFormModal'
import { Button } from '@/components/ui'
import { useAppDispatch, useAppSelector } from '@/hooks/store'
import { useDestinationPoint } from '@/hooks/useDestinationPoint'
import {
  parseMapFilter,
  selectTripMap,
  serializeMapFilter,
  toggleMapLayer,
  type MapLayer,
  type MapLayerKey,
  type MapStop,
} from '@/store/selectors/mapSelectors'
import { selectBoard } from '@/store/selectors/planSelectors'
import { selectLanguage } from '@/store/slices/settingsSlice'
import { setItemCoords } from '@/store/thunks/mapThunks'
import type { ID, ItineraryItem } from '@/types'
import { formatWeekdayDay } from '@/utils/format'
import styles from './MapTab.module.css'

/**
 * "Map" tab: the plan on a map. Markers appear by themselves — from the place
 * picked (or found) in the item form, colored by day.
 *
 * Desktop: day chips on top, map | list side by side. Narrower: the list goes under the map.
 * The day filter lives in the URL (`?show=1,3,ideas`), like the trips list filters.
 */
export default function MapTab() {
  const { t } = useTranslation()
  const { tripId = '' } = useParams()
  const dispatch = useAppDispatch()
  const language = useAppSelector(selectLanguage)
  const board = useAppSelector((state) => selectBoard(state, tripId))
  const data = useAppSelector((state) => selectTripMap(state, tripId))
  const tasks = useAppSelector((state) => state.checklistItems.entities)
  const center = useDestinationPoint(board?.trip.destination)
  const [params, setParams] = useSearchParams()
  const [fitRequest, setFitRequest] = useState(0)
  const [focus, setFocus] = useState<{ id: ID; n: number }>()
  const [placingId, setPlacingId] = useState<ID>()
  const [editId, setEditId] = useState<ID>()
  const [formUsed, setFormUsed] = useState(false)

  // Esc leaves "Set on map" mode
  useEffect(() => {
    if (!placingId) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPlacingId(undefined)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [placingId])

  if (!board || !data) return null // TripLayout shows "Trip not found"

  const rawFilter = params.get('show')
  const filter = parseMapFilter(rawFilter, data.layers)
  const visible = filter ? data.layers.filter((layer) => filter.has(layer.key)) : data.layers
  const shown = visible.reduce((sum, layer) => sum + layer.stops.length, 0)
  const allItems = [...board.days.flatMap((day) => day.items), ...board.ideas]
  const placing = allItems.find((item) => item.id === placingId)
  const edited = allItems.find((item) => item.id === editId)

  const setFilter = (next: Set<MapLayerKey> | null) => {
    const value = serializeMapFilter(next)
    setParams(
      (current) => {
        const updated = new URLSearchParams(current)
        if (value) updated.set('show', value)
        else updated.delete('show')
        return updated
      },
      { replace: true },
    )
  }

  const openEdit = (item: ItineraryItem) => {
    setFormUsed(true)
    setEditId(item.id)
  }

  const describe = (stop: MapStop, layer: MapLayer) =>
    [
      layer.dayNumber === null
        ? t('map.ideas')
        : `${t('plan.day', { number: layer.dayNumber })}${layer.date ? `, ${formatWeekdayDay(layer.date, language)}` : ''}`,
      stop.item.time,
      stop.item.location,
    ]
      .filter(Boolean)
      .join(' · ')

  const markerLabel = (stop: MapStop, layer: MapLayer) =>
    layer.dayNumber === null
      ? t('map.ideaMarker', { title: stop.item.title })
      : `${t('plan.day', { number: layer.dayNumber })}: ${stop.item.title}`

  let overlay: ReactNode
  if (data.total === 0) {
    overlay = (
      <>
        <p className={styles.overlayTitle}>{t('map.empty')}</p>
        <p className={styles.overlayText}>{t('map.emptyHint')}</p>
      </>
    )
  } else if (shown === 0) {
    overlay = <p className={styles.overlayTitle}>{t('map.emptyFilter')}</p>
  }

  return (
    <>
      <div className={styles.toolbar}>
        <DayFilter
          layers={data.layers}
          filter={filter}
          onToggle={(key) => setFilter(toggleMapLayer(filter, key))}
          onAll={() => setFilter(null)}
        />
        <div className={styles.summary}>
          <span className="meta" aria-live="polite">
            {t('map.stops', { count: shown })}
          </span>
          <Button size="sm" disabled={shown === 0} onClick={() => setFitRequest((n) => n + 1)}>
            {t('map.fit')}
          </Button>
        </div>
      </div>

      <div className={styles.layout}>
        <section className={styles.mapBox} aria-label={t('map.region')}>
          <TripMap
            layers={visible}
            fallbackCenter={center}
            fitKey={`${rawFilter ?? ''}|${data.total}|${fitRequest}`}
            focus={focus}
            placing={placing}
            onPlace={(item, point) => {
              dispatch(setItemCoords(item.id, point))
              setPlacingId(undefined)
            }}
            onCancelPlacing={() => setPlacingId(undefined)}
            overlay={placing ? undefined : overlay}
            onMove={(item, point) => dispatch(setItemCoords(item.id, point))}
            onEdit={openEdit}
            describe={describe}
            markerLabel={markerLabel}
          />
        </section>
        <aside className={styles.side}>
          <MapStopList
            layers={visible}
            onShow={(item) => setFocus((previous) => ({ id: item.id, n: (previous?.n ?? 0) + 1 }))}
            onEdit={openEdit}
            onSetPlace={(item) => setPlacingId((current) => (current === item.id ? undefined : item.id))}
            placingId={placingId}
          />
        </aside>
      </div>

      {formUsed && (
        <Suspense fallback={null}>
          <LazyItemFormModal
            open={editId !== undefined}
            onClose={() => setEditId(undefined)}
            tripId={board.trip.id}
            days={board.days}
            item={edited}
            bookingTask={edited?.bookingTaskId ? tasks[edited.bookingTaskId] : undefined}
            defaultPlace={null}
          />
        </Suspense>
      )}
    </>
  )
}
