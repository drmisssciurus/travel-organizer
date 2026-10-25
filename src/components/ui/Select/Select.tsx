import type { ComponentProps } from 'react'
import { cx } from '@/utils/cx'
import { useFieldControl } from '../Field/FieldContext'
// Shared control styles (border, focus, invalid state) live with <Input>
import styles from '../Input/Input.module.css'

export interface SelectOption<V extends string = string> {
  value: V
  label: string
}

export interface SelectProps<V extends string = string> extends Omit<ComponentProps<'select'>, 'children'> {
  options: readonly SelectOption<V>[]
  /** Rounded pill look for toolbars ("Category: all", "Sort: dates ↑") */
  pill?: boolean
  inputSize?: 'md' | 'sm'
}

/** Native <select> styled like the mockup. Native = free keyboard & mobile pickers. */
export function Select<V extends string = string>({ options, pill, inputSize = 'md', className, ...rest }: SelectProps<V>) {
  const { props } = useFieldControl(rest)
  return (
    <select
      className={cx(styles.control, styles.select, pill && styles.pill, inputSize === 'sm' && styles.sm, className)}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
