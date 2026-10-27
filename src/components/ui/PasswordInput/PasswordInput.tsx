import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '@/utils/cx'
import { Input, type InputProps } from '../Input'
import styles from './PasswordInput.module.css'

/**
 * Password field with a "show / hide" toggle. Use inside <Field> like <Input>:
 * the label, hint and error are wired to the input itself.
 */
export function PasswordInput({ className, ...rest }: Omit<InputProps, 'type'>) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  return (
    <div className={styles.wrap}>
      <Input {...rest} type={visible ? 'text' : 'password'} className={cx(styles.input, className)} />
      <button
        type="button"
        className={styles.toggle}
        aria-pressed={visible}
        aria-label={t(visible ? 'form.hidePassword' : 'form.showPassword')}
        title={t(visible ? 'form.hidePassword' : 'form.showPassword')}
        onClick={() => setVisible((value) => !value)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="M4 4l16 16" />}
        </svg>
      </button>
    </div>
  )
}
