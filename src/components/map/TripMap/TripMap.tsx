import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useEffectEvent, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { Button } from '@/components/ui'
import { dayColor, type MapLayer, type MapStop } from '@/store/selectors/mapSelectors'
import type { GeoPoint, ID, ItineraryItem } from '@/types'
import { cx } from '@/utils/cx'
import styles from './TripMap.module.css'

export interface TripMapProps {
  /** Layers to draw (already filtered) */
  layers: readonly MapLayer[]
  /** Where to look when there is nothing to show (the trip destination) */
  fallbackCenter?: GeoPoint
  /** Changes → the map fits to the shown points again (filter changed, "Show all") */
  fitKey: string
  /** Item to fly to and open (`n` lets the same item be shown twice in a row) */
  focus?: { id: ID; n: number }
  /** "Set on map" mode: the next click on the map places this item */
  placing?: ItineraryItem
  onPlace: (item: ItineraryItem, point: GeoPoint) => void
  onCancelPlacing: () => void
  /** Message over the map (empty states) */
  overlay?: ReactNode
  onMove: (item: ItineraryItem, point: GeoPoint) => void
  onEdit: (item: ItineraryItem) => void
  /** Popup subtitle: "Day 2 · 10:00 · Belém" */
  describe: (stop: MapStop, layer: MapLayer) => string
  markerLabel: (stop: MapStop, layer: MapLayer) => string
}

const WORLD: L.LatLngExpression = [30, 10]
const FIT_PADDING: L.PointExpression = [48, 48]
const MAX_FIT_ZOOM = 15

/**
 * The trip map: markers in day colors (no numbers and no route line: the order of a day
 * says nothing about where the day starts).
 * Markers can be dragged to fix a position; in "placing" mode a click sets a point.
 *
 * Tiles: OpenStreetMap (free, no key; attribution is required and shown).
 * The map is an addition to the stop list next to it — the list is the accessible
 * way to the same data; markers are focusable (Tab, Enter opens the popup).
 */
export function TripMap({
  layers,
  fallbackCenter,
  fitKey,
  focus,
  placing,
  onPlace,
  onCancelPlacing,
  overlay,
  onMove,
  onEdit,
  describe,
  markerLabel,
}: TripMapProps) {
  const { t } = useTranslation()
  const [map, setMap] = useState<L.Map | null>(null)
  // Marker instances by item id (for "show on map"); a stable object, filled by marker refs
  const [markers] = useState(() => new Map<ID, L.Marker>())
  const points = useMemo(() => layers.flatMap((layer) => layer.stops.map((stop) => stop.item.coords)), [layers])

  return (
    <div className={cx(styles.root, placing && styles.placing)}>
      {placing && (
        <div className={styles.banner} role="status">
          <span className={styles.bannerText}>{t('map.placing', { title: placing.title })}</span>
          <span className={styles.bannerActions}>
            {/* Keyboard / screen reader way: move the map, then put the point in its center */}
            <Button size="sm" variant="primary" onClick={() => map && onPlace(placing, toPoint(map.getCenter()))}>
              {t('map.placeAtCenter')}
            </Button>
            <Button size="sm" onClick={onCancelPlacing}>
              {t('actions.cancel')}
            </Button>
          </span>
        </div>
      )}
      {overlay && <div className={styles.overlay}>{overlay}</div>}
      <MapContainer
        ref={setMap}
        className={styles.map}
        center={fallbackCenter ?? WORLD}
        zoom={fallbackCenter ? 12 : 2}
        worldCopyJump
        attributionControl
      >
        <TileLayer
          className={styles.tiles}
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />
        {layers.map((layer) => {
          const color = dayColor(layer.dayNumber)
          return (
            <LayerShapes
              key={layer.key}
              layer={layer}
              color={color}
              markers={markers}
              placing={placing !== undefined}
              onMove={onMove}
              onEdit={onEdit}
              describe={describe}
              markerLabel={markerLabel}
              editLabel={t('map.edit')}
            />
          )
        })}
        <FitToPoints points={points} fallbackCenter={fallbackCenter} fitKey={fitKey} />
        <FocusItem focus={focus} markers={markers} />
        <PlaceOnClick placing={placing} onPlace={onPlace} />
        <ResizeWatcher />
      </MapContainer>
    </div>
  )
}

/* ---------- Markers of one day ---------- */

interface LayerShapesProps {
  layer: MapLayer
  color: string
  markers: Map<ID, L.Marker>
  placing: boolean
  onMove: TripMapProps['onMove']
  onEdit: TripMapProps['onEdit']
  describe: TripMapProps['describe']
  markerLabel: TripMapProps['markerLabel']
  editLabel: string
}

function LayerShapes({ layer, color, markers, placing, onMove, onEdit, describe, markerLabel, editLabel }: LayerShapesProps) {
  const isIdeas = layer.dayNumber === null

  return (
    <>
      {layer.stops.map((stop) => (
        <Marker
          key={stop.item.id}
          position={[stop.item.coords.lat, stop.item.coords.lng]}
          icon={pinIcon(isIdeas ? '✦' : '', color, stop.item.done)}
          title={markerLabel(stop, layer)}
          // Leaflet puts `alt` on image icons only; the title above names our div icons
          draggable={!placing}
          autoPan
          ref={(marker) => {
            if (marker) markers.set(stop.item.id, marker)
            else markers.delete(stop.item.id)
          }}
          eventHandlers={{
            dragend: (event) => {
              onMove(stop.item, toPoint((event.target as L.Marker).getLatLng()))
            },
          }}
        >
          <Popup>
            <div className={styles.popup}>
              <strong className={styles.popupTitle}>{stop.item.title}</strong>
              <span className={styles.popupMeta}>{describe(stop, layer)}</span>
              <Button size="sm" onClick={() => onEdit(stop.item)}>
                {editLabel}
              </Button>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}

/** Leaflet LatLng → our point (rounded to ~1 m: no 15-digit noise in storage). */
const round = (value: number) => Math.round(value * 1e5) / 1e5
const toPoint = ({ lat, lng }: L.LatLng): GeoPoint => ({ lat: round(lat), lng: round(L.Util.wrapNum(lng, [-180, 180], true)) })

/** Div icons are cached: same look → same object, so Leaflet doesn't rebuild the DOM. */
const icons = new Map<string, L.DivIcon>()
function pinIcon(text: string, color: string, done: boolean): L.DivIcon {
  const key = `${text}|${color}|${done}`
  let icon = icons.get(key)
  if (!icon) {
    icon = L.divIcon({
      className: styles.pinWrap,
      html: `<span class="${cx(styles.pin, done && styles.pinDone)}" style="background:${color}">${text}</span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    })
    icons.set(key, icon)
  }
  return icon
}

/* ---------- Behaviour (children of MapContainer: they need useMap) ---------- */

/** Fits the view to the points when `fitKey` changes — not on every drag of a marker. */
function FitToPoints({ points, fallbackCenter, fitKey }: { points: GeoPoint[]; fallbackCenter?: GeoPoint; fitKey: string }) {
  const map = useMap()
  const fit = useEffectEvent(() => {
    if (points.length === 0) {
      if (fallbackCenter) map.setView(fallbackCenter, 12)
    } else if (points.length === 1) {
      map.setView(points[0]!, MAX_FIT_ZOOM)
    } else {
      map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: FIT_PADDING, maxZoom: MAX_FIT_ZOOM })
    }
  })
  // The destination is found asynchronously: an empty map centers on it when it arrives
  const centerKey = points.length === 0 && fallbackCenter ? `${fallbackCenter.lat},${fallbackCenter.lng}` : ''
  useEffect(() => fit(), [fitKey, centerKey])
  return null
}

function FocusItem({ focus, markers }: { focus?: { id: ID; n: number }; markers: Map<ID, L.Marker> }) {
  const map = useMap()
  useEffect(() => {
    const marker = focus && markers.get(focus.id)
    if (!marker) return
    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), MAX_FIT_ZOOM), { duration: 0.6 })
    map.once('moveend', () => marker.openPopup())
  }, [focus, markers, map])
  return null
}

function PlaceOnClick({ placing, onPlace }: { placing?: ItineraryItem; onPlace: TripMapProps['onPlace'] }) {
  useMapEvents({
    click(event) {
      if (placing) onPlace(placing, toPoint(event.latlng))
    },
  })
  return null
}

/** The map box changes size with the layout (sidebar, breakpoints) — Leaflet must know. */
function ResizeWatcher() {
  const map = useMap()
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}
