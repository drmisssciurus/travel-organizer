import type { ComponentProps } from 'react'
import { cx } from '@/utils/cx'
import { useFieldControl } from '../Field/FieldContext'
// Shared control styles (border, focus, invalid state) live with <Input>
import styles from '../Input/Input.module.css'

export type TextareaProps = ComponentProps<'textarea'>

/** Multi-line text (trip notes, stop note). Resizes vertically only. */
export function Textarea({ className, rows = 3, ...rest }: TextareaProps) {
  const { props } = useFieldControl(rest)
  return <textarea rows={rows} className={cx(styles.control, styles.textarea, className)} {...props} />
}
