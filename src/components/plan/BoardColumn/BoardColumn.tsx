import type { ReactNode } from 'react'
import { cx } from '@/utils/cx'
import styles from './BoardColumn.module.css'

export interface BoardColumnProps {
  title: ReactNode
  /** Right side of the header: counter, "3 left", "Not scheduled" */
  aside?: ReactNode
  hint?: ReactNode
  children: ReactNode
  /** "+ Add" button under the list */
  footer?: ReactNode
  /** `ideas` — dashed outline, `today` — accent ring */
  variant?: 'default' | 'ideas' | 'today'
  /** For scrolling to the column (board navigation, "today") */
  id?: string
  className?: string
  /** Position among the day columns (visible-days counter) */
  'data-day-index'?: number
  /** Today's column (initial scroll) */
  'data-today'?: boolean
}

/** One column of the plan board (a <section> with a heading — landmarks for screen readers). */
export function BoardColumn({ title, aside, hint, children, footer, variant = 'default', id, className, ...data }: BoardColumnProps) {
  return (
    <section id={id} className={cx(styles.column, styles[variant], className)} {...data}>
      <header className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        {aside}
      </header>
      {hint && <p className={styles.hint}>{hint}</p>}
      {children}
      {footer}
    </section>
  )
}
