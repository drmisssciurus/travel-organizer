import type { ComponentProps } from 'react'
import { cx } from '@/utils/cx'
import { useFieldControl } from '../Field/FieldContext'
import styles from './Input.module.css'

export interface InputProps extends ComponentProps<'input'> {
  variant?: 'default' | 'search'
  inputSize?: 'md' | 'sm'
}

/**
 * Text-like input (text, number, date, time, search…).
 * Works with react-hook-form: <Input {...register('title')} /> — `ref` is a regular prop in React 19.
 */
export function Input({ variant = 'default', inputSize = 'md', className, ...rest }: InputProps) {
  const { props } = useFieldControl(rest)
  return (
    <input
      className={cx(styles.control, variant === 'search' && styles.search, inputSize === 'sm' && styles.sm, className)}
      {...props}
    />
  )
}
