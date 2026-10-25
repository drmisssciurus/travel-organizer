import type { ComponentProps, ReactNode } from 'react'
import { cx } from '@/utils/cx'
import styles from './IconButton.module.css'

/** `ComponentProps<'button'>` includes `ref` (React 19), so <IconButton ref={…}> just works. */
export interface IconButtonProps extends Omit<ComponentProps<'button'>, 'children'> {
  /** Accessible name — required, an icon alone means nothing to a screen reader. Also shown as a tooltip. */
  label: string
  /** The icon (character or SVG). Hidden from assistive tech — `label` is announced instead. */
  icon: ReactNode
  shape?: 'circle' | 'square'
  size?: 'md' | 'sm'
  variant?: 'default' | 'danger' | 'ghost' | 'primary'
}

/** Round or square button with only an icon: back ←, edit ✎, delete ×, theme ◐, add +. */
export function IconButton({
  label,
  icon,
  shape = 'circle',
  size = 'md',
  variant = 'default',
  className,
  type = 'button',
  title,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={title ?? label}
      className={cx(
        styles.iconButton,
        styles[shape],
        size === 'sm' && styles.sm,
        variant !== 'default' && styles[variant],
        className,
      )}
      {...rest}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  )
}
