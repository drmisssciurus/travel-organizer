import { useEffect, useId, useRef, type ReactNode, type SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '@/utils/cx'
import { IconButton } from '../IconButton'
import styles from './Modal.module.css'

export interface ModalProps {
  open: boolean
  /** Called on ×, Esc, backdrop click. The parent decides whether to actually close. */
  onClose: () => void
  title: ReactNode
  children: ReactNode
  /** Action buttons, right-aligned. For a form inside, use <Button type="submit" form={formId}>. */
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  /** Close when clicking the dimmed backdrop (default true). Turn off for forms with unsaved input. */
  closeOnBackdrop?: boolean
  className?: string
}

/**
 * Modal dialog on the native <dialog> + showModal():
 * - rendered in the browser's top layer — no portal, no z-index;
 * - the rest of the page becomes inert (no clicks/focus behind it);
 * - Esc closes, focus returns to the trigger on close;
 * - page scroll is locked by CSS (`html:has(dialog:modal)` in global.css).
 *
 * React state (`open`) is the source of truth; the effect mirrors it onto the element.
 *
 * Initial focus: an element with `data-autofocus`, otherwise the first control in the body,
 * otherwise the first footer button. (React's `autoFocus` runs before showModal() and gets lost;
 * the browser default would focus the × button.)
 */
export function Modal({ open, onClose, title, children, footer, size = 'md', closeOnBackdrop = true, className }: ModalProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  // Where the pointer went down: a drag that starts inside and ends on the backdrop must not close
  const pressedOnBackdrop = useRef(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      const target =
        dialog.querySelector<HTMLElement>('[data-autofocus]') ??
        dialog.querySelector<HTMLElement>(`.${styles.body} :is(input, select, textarea, button, a[href])`) ??
        dialog.querySelector<HTMLElement>(`.${styles.footer} button`)
      target?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Esc fires "cancel": keep React in control instead of letting the browser close it
  const handleCancel = (e: SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault()
    onClose()
  }

  return (
    <dialog
      ref={ref}
      className={cx(styles.dialog, styles[size], className)}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onPointerDown={(e) => (pressedOnBackdrop.current = e.target === e.currentTarget)}
      onClick={(e) => {
        // A click on the ::backdrop targets the <dialog> element itself
        if (closeOnBackdrop && pressedOnBackdrop.current && e.target === e.currentTarget) onClose()
      }}
    >
      {open && (
        <>
          <header className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <IconButton label={t('actions.close')} icon="×" size="sm" onClick={onClose} />
          </header>
          <div className={styles.body}>{children}</div>
          {footer && <footer className={styles.footer}>{footer}</footer>}
        </>
      )}
    </dialog>
  )
}
