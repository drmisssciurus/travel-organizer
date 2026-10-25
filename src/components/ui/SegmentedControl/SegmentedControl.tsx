import type { ReactNode } from 'react'
import { cx } from '@/utils/cx'
import styles from './SegmentedControl.module.css'

export interface SegmentOption<V extends string> {
  value: V
  label: ReactNode
  /** Tooltip / full name, e.g. "English" for "EN" */
  title?: string
  count?: number
}

export interface SegmentedControlProps<V extends string> {
  options: readonly SegmentOption<V>[]
  value: V
  onChange: (value: V) => void
  /** Accessible name of the group, e.g. "Status" */
  label: string
  size?: 'md' | 'sm'
  fullWidth?: boolean
  className?: string
}

/**
 * One-of-N toggle buttons in a pill track: status filter, EN/RU, "Ideas / A day".
 * Generic over the value type: onChange receives the exact union (TripStatus, Language…).
 */
export function SegmentedControl<V extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  fullWidth,
  className,
}: SegmentedControlProps<V>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx(styles.group, size === 'sm' && styles.sm, fullWidth && styles.fullWidth, className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.option}
          aria-pressed={option.value === value}
          title={option.title}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count !== undefined && <span className={styles.count}>{option.count}</span>}
        </button>
      ))}
    </div>
  )
}
