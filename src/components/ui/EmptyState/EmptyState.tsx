import type { ReactNode } from 'react'
import { cx } from '@/utils/cx'
import styles from './EmptyState.module.css'

export interface EmptyStateProps {
  /** Big symbol in the circle: ✈ ? ✓ € … (decorative) */
  icon: ReactNode
  title: ReactNode
  description?: ReactNode
  /** Buttons / links under the text */
  action?: ReactNode
  /** Heading level — pick what fits the page outline (h1 for a whole-page state) */
  headingLevel?: 1 | 2 | 3
  /** Render on its own card (default) or plain inside an existing container */
  card?: boolean
  compact?: boolean
  className?: string
}

/** "No trips yet", "Nothing found", "Page not found"… */
export function EmptyState({
  icon,
  title,
  description,
  action,
  headingLevel = 2,
  card = true,
  compact,
  className,
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as const
  return (
    <section className={cx(styles.empty, card && styles.card, compact && styles.compact, className)}>
      <div className={styles.icon} aria-hidden="true">
        {icon}
      </div>
      <Heading className={styles.title}>{title}</Heading>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.actions}>{action}</div>}
    </section>
  )
}
