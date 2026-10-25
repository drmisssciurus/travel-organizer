import { useTranslation } from 'react-i18next'
import type { ItineraryItem } from '@/types'
import styles from './NextList.module.css'

export interface NextListProps {
  items: readonly ItineraryItem[]
  onOpen: (item: ItineraryItem) => void
}

/** "Later today": the rest of the day's stops; each row opens the stop. */
export function NextList({ items, onOpen }: NextListProps) {
  const { t } = useTranslation()
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.id}>
          <button type="button" className={styles.row} onClick={() => onOpen(item)}>
            <span className={styles.text}>
              <b>{item.title}</b>
              <span className="meta">
                {item.time ? `${item.time} · ` : ''}
                {t(`plan.categories.${item.category}`)}
              </span>
            </span>
            <span className={styles.dot} style={{ background: `var(--color-cat-${item.category})` }} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  )
}
