import { useId, useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '@/utils/cx'
import { FieldContext } from './FieldContext'
import styles from './Field.module.css'

export interface FieldProps {
  label: ReactNode
  /** Shows " *" after the label and sets aria-required on the control */
  required?: boolean
  /** Shows "· optional" after the label */
  optional?: boolean
  /** Helper text under the control */
  hint?: ReactNode
  /** Error text; when set, the control is marked invalid */
  error?: string
  /** Custom id for the control (otherwise generated) */
  id?: string
  className?: string
  children: ReactNode
}

/**
 * Label + control + hint/error, with accessibility wired through context:
 *
 *   <Field label={t('trip.form.title')} required error={errors.title?.message}>
 *     <Input {...register('title')} />
 *   </Field>
 */
export function Field({ label, required = false, optional, hint, error, id, className, children }: FieldProps) {
  const { t } = useTranslation()
  const generatedId = useId()
  const controlId = id ?? generatedId
  const hintId = hint ? `${controlId}-hint` : undefined
  const errorId = error ? `${controlId}-error` : undefined

  const context = useMemo(
    () => ({
      id: controlId,
      describedBy: [hintId, errorId].filter(Boolean).join(' ') || undefined,
      invalid: Boolean(error),
      required,
    }),
    [controlId, hintId, errorId, error, required],
  )

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={controlId} className={styles.label}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
        {optional && <span className={styles.optional}> · {t('form.optional')}</span>}
      </label>
      <FieldContext value={context}>{children}</FieldContext>
      {hint && (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className={styles.error}>
          {error}
        </span>
      )}
    </div>
  )
}
