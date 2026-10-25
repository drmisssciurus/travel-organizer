import { useTranslation } from 'react-i18next'
import styles from './FormErrorSummary.module.css'

export interface FormErrorSummaryProps {
  /** Number of invalid fields. Nothing is rendered when 0. */
  count: number
}

/**
 * "Fix 3 fields to save" banner at the top of a form (from the mockup).
 * role="alert" makes screen readers announce it when it appears after submit.
 */
export function FormErrorSummary({ count }: FormErrorSummaryProps) {
  const { t } = useTranslation()
  if (count === 0) return null
  return (
    <div role="alert" className={styles.summary}>
      {t('form.fixFields', { count })}
    </div>
  )
}
