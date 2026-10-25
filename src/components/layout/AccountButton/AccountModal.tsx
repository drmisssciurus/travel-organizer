import { useId, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { signIn, signOut, signUp, type AuthError } from '@/api/cloud'
import { requestSync } from '@/cloud/sync'
import { useCloudStatus } from '@/cloud/status'
import { Button, Field, FormErrorSummary, Input, Modal } from '@/components/ui'
import styles from './AccountButton.module.css'

const PASSWORD_MIN = 8

/**
 * Account dialog. Signed out: sign in / create an account (email + password).
 * Signed in: who, sync status, "Sync now", "Sign out".
 */
export function AccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const status = useCloudStatus()
  const formId = useId()
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const signedIn = status.kind !== 'signedOut' && status.kind !== 'off'

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={signedIn ? t('cloud.account') : t(mode === 'signIn' ? 'cloud.signInTitle' : 'cloud.signUpTitle')}
      footer={
        signedIn ? (
          <>
            <Button variant="dangerOutline" className={styles.footerStart} onClick={() => void signOut()}>
              {t('cloud.signOut')}
            </Button>
            <Button variant="primary" disabled={status.kind === 'syncing'} onClick={requestSync}>
              {t('cloud.syncNow')}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>{t('actions.cancel')}</Button>
            <Button variant="primary" type="submit" form={formId}>
              {t(mode === 'signIn' ? 'cloud.signIn' : 'cloud.signUp')}
            </Button>
          </>
        )
      }
    >
      {signedIn ? (
        <div className={styles.info}>
          <p className={styles.email}>{status.email}</p>
          <p role="status">
            {status.kind === 'synced'
              ? t('cloud.status.syncedAt', {
                  time: new Date(status.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
                })
              : status.kind === 'offline' && status.pending
                ? t('cloud.status.offlinePending')
                : t(`cloud.status.${status.kind}`)}
          </p>
          <p className="meta">{t('cloud.howItWorks')}</p>
        </div>
      ) : (
        <AuthForm id={formId} mode={mode} onModeChange={setMode} onDone={onClose} />
      )}
    </Modal>
  )
}

function AuthForm({
  id,
  mode,
  onModeChange,
  onDone,
}: {
  id: string
  mode: 'signIn' | 'signUp'
  onModeChange: (mode: 'signIn' | 'signUp') => void
  onDone: () => void
}) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: boolean; password?: boolean }>({})
  const [error, setError] = useState<AuthError | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const errors = {
      email: !/^\S+@\S+\.\S+$/.test(email.trim()),
      password: password.length < PASSWORD_MIN,
    }
    setFieldErrors(errors)
    if (errors.email || errors.password || busy) return
    setBusy(true)
    setError(null)
    const result = await (mode === 'signIn' ? signIn : signUp)(email.trim(), password)
    setBusy(false)
    if (result) setError(result)
    else onDone()
  }

  const invalidCount = Number(Boolean(fieldErrors.email)) + Number(Boolean(fieldErrors.password))

  return (
    <form id={id} className={styles.form} onSubmit={(event) => void submit(event)} noValidate aria-busy={busy}>
      <p className="meta">{t('cloud.why')}</p>
      {invalidCount > 0 && <FormErrorSummary count={invalidCount} />}
      {error && (
        <p className={error === 'confirmEmail' ? styles.notice : styles.error} role="alert">
          {t(`cloud.errors.${error}`)}
        </p>
      )}
      <Field label={t('cloud.email')} required error={fieldErrors.email ? t('cloud.errors.email') : undefined}>
        <Input type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field
        label={t('cloud.password')}
        required
        hint={mode === 'signUp' ? t('cloud.passwordHint', { count: PASSWORD_MIN }) : undefined}
        error={fieldErrors.password ? t('cloud.passwordHint', { count: PASSWORD_MIN }) : undefined}
      >
        <Input
          type="password"
          autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <button
        type="button"
        className={styles.switch}
        onClick={() => {
          setError(null)
          onModeChange(mode === 'signIn' ? 'signUp' : 'signIn')
        }}
      >
        {t(mode === 'signIn' ? 'cloud.toSignUp' : 'cloud.toSignIn')}
      </button>
      {mode === 'signUp' && <p className="meta">{t('cloud.firstDeviceHint')}</p>}
    </form>
  )
}
