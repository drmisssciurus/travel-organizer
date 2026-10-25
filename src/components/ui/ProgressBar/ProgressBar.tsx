import type { CSSProperties } from 'react'
import { cx } from '@/utils/cx'
import styles from './ProgressBar.module.css'

export interface ProgressBarProps {
  value: number
  max?: number
  /** Accessible name, e.g. "Ready". Required unless the bar is decorative (`decorative`). */
  label?: string
  /** Screen-reader text for the value, e.g. "8 of 15 done". Defaults to the percentage. */
  valueText?: string
  size?: 'md' | 'sm'
  /** Custom fill color, e.g. a category color: `var(--color-exp-food)` */
  color?: string
  /** Highlight in red when value > max (default true) */
  highlightOverflow?: boolean
  /** Visual only — hidden from screen readers (the value is shown as text nearby) */
  decorative?: boolean
  className?: string
}

/**
 * Horizontal progress bar: readiness, category share.
 * The fill is clamped to 100%; going over max turns it red.
 */
export function ProgressBar({
  value,
  max = 100,
  label,
  valueText,
  size = 'md',
  color,
  highlightOverflow = true,
  decorative = false,
  className,
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1
  const percent = Math.max(0, Math.min(100, (value / safeMax) * 100))
  const over = highlightOverflow && value > safeMax

  const a11y = decorative
    ? { 'aria-hidden': true as const }
    : {
        role: 'progressbar',
        'aria-label': label,
        'aria-valuemin': 0,
        'aria-valuemax': safeMax,
        'aria-valuenow': Math.round(value),
        'aria-valuetext': valueText ?? `${Math.round((value / safeMax) * 100)}%`,
      }

  return (
    <div
      className={cx(styles.track, size === 'sm' && styles.sm, over && styles.over, className)}
      style={color ? ({ '--bar-color': color } as CSSProperties) : undefined}
      {...a11y}
    >
      <span className={styles.fill} style={{ width: `${percent}%` }} />
    </div>
  )
}
