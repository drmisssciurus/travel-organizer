import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/hooks/store'
import { dayColor, type MapLayer } from '@/store/selectors/mapSelectors'
import { selectLanguage } from '@/store/slices/settingsSlice'
import type { ItineraryItem } from '@/types'
import { formatWeekdayDay } from '@/utils/format'
import styles from './MapStopList.module.css'

export interface MapStopListProps {
  layers: readonly MapLayer[]
  /** Fly to the marker and open its popup */
  onShow: (item: ItineraryItem) => void
  onEdit: (item: ItineraryItem) => void
  /** Start "Set on map" for an item without a point */
  onSetPlace: (item: ItineraryItem) => void
  /** The item currently being placed (its button is pressed) */
  placingId?: string
}

/**
 * The list next to the map — the same stops in plan order, grouped by day,
 * and the "Without a place" stops of the shown days. This is the keyboard and
 * screen-reader way to everything the map shows.
 */
export function MapStopList({ layers, onShow, onEdit, onSetPlace, placingId }: MapStopListProps) {
  const { t } = useTranslation()
  const language = useAppSelector(selectLanguage)
  const withStops = layers.filter((layer) => layer.stops.length > 0)
  const unplaced = layers.flatMap((layer) => layer.unplaced.map((item) => ({ item, layer })))

  const layerTitle = (layer: MapLayer) =>
    layer.dayNumber === null
      ? t('map.ideas')
      : `${t('plan.day', { number: layer.dayNumber })} · ${layer.date ? formatWeekdayDay(layer.date, language) : ''}`

  return (
    <div className={styles.list}>
      {withStops.length > 0 && (
        <section aria-label={t('map.list')}>
          {withStops.map((layer) => (
            <div key={layer.key} className={styles.group}>
              <h2 className={styles.groupTitle}>
                <span className={styles.swatch} style={{ background: dayColor(layer.dayNumber) }} aria-hidden="true" />
                {layerTitle(layer)}
              </h2>
              <ol className={styles.stops}>
                {layer.stops.map(({ item }) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={styles.stop}
                      onClick={() => onShow(item)}
                      aria-label={t('map.showOnMap', { title: item.title })}
                    >
                      <span className={styles.badge} style={{ background: dayColor(layer.dayNumber) }} aria-hidden="true">
                        {layer.dayNumber === null && '✦'}
                      </span>
                      <span className={styles.stopText}>
                        <span className={styles.stopTitle}>
                          {item.done && '✓ '}
                          {item.title}
                        </span>
                        {(item.time || item.location) && (
                          <span className={styles.stopMeta}>{[item.time, item.location].filter(Boolean).join(' · ')}</span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          ))}
          <p className={styles.hint}>{t('map.dragHint')}</p>
        </section>
      )}

      {unplaced.length > 0 && (
        <section className={styles.group} aria-labelledby="map-unplaced">
          <h2 id="map-unplaced" className={styles.groupTitle}>
            {t('map.withoutPlace')} <span className={styles.groupCount}>{unplaced.length}</span>
          </h2>
          <p className={styles.hint}>{t('map.withoutPlaceHint')}</p>
          <ul className={styles.stops}>
            {unplaced.map(({ item, layer }) => (
              <li key={item.id} className={styles.unplaced}>
                <button type="button" className={styles.unplacedTitle} onClick={() => onEdit(item)}>
                  <span className={styles.stopTitle}>{item.title}</span>
                  <span className={styles.stopMeta}>
                    {[layer.dayNumber === null ? t('map.ideas') : t('plan.day', { number: layer.dayNumber }), item.location]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </button>
                <button
                  type="button"
                  className={styles.setPlace}
                  aria-pressed={placingId === item.id}
                  onClick={() => onSetPlace(item)}
                >
                  <span aria-hidden="true">📍</span>
                  {t('map.setOnMap')}
                  <span className="visually-hidden">: {item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
