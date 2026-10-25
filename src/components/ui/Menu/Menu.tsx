import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from 'react'
import { cx } from '@/utils/cx'
import styles from './Menu.module.css'

export interface MenuItem<Id extends string = string> {
  id: Id
  label: ReactNode
  icon?: ReactNode
  /** Secondary line under the label ("now dark") */
  hint?: ReactNode
  /** Set on every item to make it a radio menu (role="menuitemradio" + ✓) */
  checked?: boolean
  danger?: boolean
  disabled?: boolean
}

/** Props the trigger button must receive. Spread them onto <IconButton> / <Button>. */
export interface MenuTriggerProps {
  ref: Ref<HTMLButtonElement>
  'aria-haspopup': 'menu'
  'aria-expanded': boolean
  'aria-controls': string | undefined
  onClick: () => void
}

export interface MenuProps<Id extends string = string> {
  /** Accessible name of the menu, e.g. "Theme" */
  label: string
  items: readonly MenuItem<Id>[]
  onSelect: (id: Id) => void
  renderTrigger: (props: MenuTriggerProps) => ReactNode
  /** Which edge of the trigger the menu aligns to */
  align?: 'start' | 'end'
  className?: string
}

/**
 * Dropdown menu (WAI-ARIA menu button pattern):
 * - ↑/↓/Home/End move focus, Enter/Space activate, Esc closes;
 * - click outside or Tab closes;
 * - focus goes to the checked (or first) item on open and back to the trigger on close.
 */
export function Menu<Id extends string = string>({
  label,
  items,
  onSelect,
  renderTrigger,
  align = 'end',
  className,
}: MenuProps<Id>) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  const isRadio = items.some((item) => item.checked !== undefined)
  const initialIndex = Math.max(
    0,
    items.findIndex((item) => item.checked),
  )

  const close = (returnFocus = true) => {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }

  // While open: close on a pointer press outside
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const enabled = itemRefs.current.filter((el): el is HTMLButtonElement => Boolean(el && !el.disabled))
    const current = enabled.indexOf(document.activeElement as HTMLButtonElement)
    const move = (index: number) => enabled[(index + enabled.length) % enabled.length]?.focus()

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        move(current + 1)
        break
      case 'ArrowUp':
        e.preventDefault()
        move(current - 1)
        break
      case 'Home':
        e.preventDefault()
        move(0)
        break
      case 'End':
        e.preventDefault()
        move(enabled.length - 1)
        break
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'Tab':
        close(false)
        break
    }
  }

  return (
    <div className={cx(styles.root, className)} ref={rootRef}>
      {renderTrigger({
        ref: triggerRef,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? menuId : undefined,
        onClick: () => setOpen((v) => !v),
      })}

      {open && (
        <div id={menuId} role="menu" aria-label={label} className={cx(styles.menu, styles[align])} onKeyDown={onKeyDown}>
          {items.map((item, i) => (
            <button
              key={item.id}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              type="button"
              role={isRadio ? 'menuitemradio' : 'menuitem'}
              aria-checked={isRadio ? Boolean(item.checked) : undefined}
              disabled={item.disabled}
              tabIndex={-1}
              // The menu mounts on open, so this focuses the right item every time it opens
              autoFocus={i === initialIndex}
              className={cx(styles.item, item.danger && styles.danger)}
              onClick={() => {
                onSelect(item.id)
                close()
              }}
            >
              {item.icon !== undefined && (
                <span className={styles.icon} aria-hidden="true">
                  {item.icon}
                </span>
              )}
              <span className={styles.text}>
                {item.label}
                {item.hint && <span className={styles.hint}>{item.hint}</span>}
              </span>
              {isRadio && (
                <span className={styles.check} aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
