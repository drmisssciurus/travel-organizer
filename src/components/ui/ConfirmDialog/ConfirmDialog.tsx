import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../Button'
import { Modal } from '../Modal'

export interface ConfirmDialogProps {
  open: boolean
  title: ReactNode
  message: ReactNode
  /** Label of the confirm button, e.g. "Delete" */
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  /** Red confirm button (default) — for destructive actions */
  danger?: boolean
}

/**
 * "Delete trip?" style confirmation.
 * Focus starts on Cancel: an accidental Enter must not destroy data.
 */
export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel, danger = true }: ConfirmDialogProps) {
  const { t } = useTranslation()
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button data-autofocus onClick={onCancel}>
            {t('actions.cancel')}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p style={{ lineHeight: 1.6 }}>{message}</p>
    </Modal>
  )
}
