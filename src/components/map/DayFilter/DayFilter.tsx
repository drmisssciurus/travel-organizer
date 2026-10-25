import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/hooks/store'
import { dayColor, type MapLayer, type MapLayerKey } from '@/store/selectors/mapSelectors'
import { selectLanguage } from '@/store/slices/settingsSlice'
import { formatWeekdayDay } from '@/utils/format'
import styles from './DayFilter.module.css'

export interface DayFilterProps {
  layers: readonly MapLayer[]
  /** `null` = all layers shown */
  filter: ReadonlySet<MapLayerKey> | null
  onToggle: (key: MapLayerKey) => void
  onAll: () => void
}

/**
 * Chips "All · 1 Wed 30 · 2 Thu 1 · … · Ideas" — several can be on at once.
 * Each chip carries the day color used by its markers and route line.
 * Toggle buttons (`aria-pressed`) in a labelled group.
 */
export function DayFilter({ layers, filter, onToggle, onAll }: DayFilterProps) {
  const { t } = useTranslation()
  const language = useAppSelector(selectLanguage)

  return (
    <div className={styles.chips} role="group" aria-label={t('map.filter')}>
      <button type="button" className={styles.chip} aria-pressed={filter === null} onClick={onAll}>
        {t('map.allDays')}
      </button>
      {layers.map((layer) => {
        const count = layer.stops.length
        const label = layer.dayNumber === null ? t('map.ideas') : t('plan.day', { number: layer.dayNumber })
        return (
          <button
            key={layer.key}
            type="button"
            className={styles.chip}
            aria-pressed={filter?.has(layer.key) ?? false}
            onClick={() => onToggle(layer.key)}
          >
            <span className={styles.dot} style={{ background: dayColor(layer.dayNumber) }} aria-hidden="true" />
            {label}
            {layer.date && <span className={styles.date}>{formatWeekdayDay(layer.date, language)}</span>}
            {/* Count of points; a day without them stays clickable (its "without a place" list) */}
            <span className={styles.count} aria-hidden="true">
              {count}
            </span>
            <span className="visually-hidden">{t('map.stops', { count })}</span>
          </button>
        )
      })}
    </div>
  )
}
