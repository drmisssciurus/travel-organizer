import type { ComponentProps, ReactNode } from 'react'
import { cx } from '@/utils/cx'
import styles from './Checkbox.module.css'

export interface CheckboxProps extends Omit<ComponentProps<'input'>, 'type'> {
  label: ReactNode
  /** Strike the label through when checked (checklist items) */
  strikeWhenChecked?: boolean
}

/** Native checkbox with the waypoint look. The whole label is clickable. */
export function Checkbox({ label, strikeWhenChecked, className, ...rest }: CheckboxProps) {
  return (
    <label className={cx(styles.root, strikeWhenChecked && styles.strike, className)}>
      <input type="checkbox" className={styles.box} {...rest} />
      <span className={styles.label}>{label}</span>
    </label>
  )
}
