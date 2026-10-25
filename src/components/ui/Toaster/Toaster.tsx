import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/hooks/store'
import { selectToasts, toastDismissed, type Toast } from '@/store/slices/toastSlice'
import { cx } from '@/utils/cx'
import styles from './Toaster.module.css'

/**
 * Renders toasts from the store. Mount once, in the app layout.
 * The live region is always in the DOM: screen readers only announce changes
 * inside a region that already existed.
 */
export function Toaster() {
  const toasts = useAppSelector(selectToasts)
  return (
    <div className={styles.region} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

function ToastItem({ toast }: { toast: Toast }) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [paused, setPaused] = useState(false)
  const remaining = useRef(toast.duration)

  // Auto-dismiss; hovering or focusing the toast pauses the countdown
  useEffect(() => {
    if (paused) return
    const startedAt = Date.now()
    const timer = setTimeout(() => dispatch(toastDismissed(toast.id)), remaining.current)
    return () => {
      clearTimeout(timer)
      remaining.current -= Date.now() - startedAt
    }
  }, [paused, dispatch, toast.id])

  const undo = () => {
    if (toast.undo) dispatch(toast.undo)
    dispatch(toastDismissed(toast.id))
  }

  return (
    <div
      className={cx(styles.toast, toast.tone === 'error' && styles.error)}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span>{toast.message}</span>
      {toast.undo && (
        <button type="button" className={styles.undo} onClick={undo}>
          {t('actions.undo')}
        </button>
      )}
    </div>
  )
}
