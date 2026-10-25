import { useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '@/utils/cx'
import styles from './BottomSheet.module.css'

export interface BottomSheetProps {
  title: ReactNode
  /** Small text on the right of the title ("drag into the day") */
  meta?: ReactNode
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  children: ReactNode
  className?: string
}

/**
 * Non-modal panel docked above the mobile bottom nav (hidden above 720px).
 * The page behind stays interactive — that's the point: items are dragged from the sheet into the day.
 * The handle toggles between collapsed (one row) and expanded.
 */
export function BottomSheet({ title, meta, expanded, onExpandedChange, children, className }: BottomSheetProps) {
  const { t } = useTranslation()
  const contentId = useId()

  return (
    <section className={cx(styles.sheet, expanded && styles.expanded, className)} aria-label={typeof title === 'string' ? title : undefined}>
      <button
        type="button"
        className={styles.handle}
        aria-expanded={expanded}
        aria-controls={contentId}
        aria-label={expanded ? t('actions.collapse') : t('actions.expand')}
        onClick={() => onExpandedChange(!expanded)}
      />
      <div className={styles.head}>
        <h2>{title}</h2>
        {meta && <span className="meta">{meta}</span>}
      </div>
      <div id={contentId} className={styles.content}>
        {children}
      </div>
    </section>
  )
}
