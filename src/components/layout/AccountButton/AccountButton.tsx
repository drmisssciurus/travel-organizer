import { lazy, Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCloudStatus, type CloudStatus } from '@/cloud/status'
import { cx } from '@/utils/cx'
import styles from './AccountButton.module.css'

// The dialog loads on first open — not needed for the first paint
const AccountModal = lazy(() => import('./AccountModal').then((module) => ({ default: module.AccountModal })))

const DOT: Partial<Record<CloudStatus['kind'], string>> = {
  synced: styles.ok,
  syncing: styles.busy,
  offline: styles.warn,
  error: styles.bad,
}

/**
 * Account button in the header: the first letter of the email and a sync dot
 * (green — synced, pulsing — syncing, ochre — offline, red — error).
 * Without a cloud config it stays the decorative avatar of the mockup.
 */
export function AccountButton({ className }: { className?: string }) {
  const { t } = useTranslation()
  const status = useCloudStatus()
  const [open, setOpen] = useState(false)
  const [used, setUsed] = useState(false)

  if (status.kind === 'off') {
    return (
      <span className={cx(styles.avatar, styles.decorative, className)} aria-hidden="true">
        A
      </span>
    )
  }

  const signedIn = status.kind !== 'signedOut'
  const letter = signedIn ? (status.email[0] ?? '·').toUpperCase() : '☁'
  const label = signedIn ? t(`cloud.status.${status.kind}`) : t('cloud.signIn')

  return (
    <>
      <button
        type="button"
        className={cx(styles.avatar, styles.button, !signedIn && styles.signedOut, className)}
        aria-label={`${t('cloud.account')}: ${label}`}
        title={label}
        onClick={() => {
          setUsed(true)
          setOpen(true)
        }}
      >
        <span aria-hidden="true">{letter}</span>
        {DOT[status.kind] && <span className={cx(styles.dot, DOT[status.kind])} aria-hidden="true" />}
      </button>
      {used && (
        <Suspense fallback={null}>
          <AccountModal open={open} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
