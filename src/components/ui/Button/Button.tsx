import type { ComponentProps, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cx } from '@/utils/cx'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'dangerOutline' | 'ghost'
export type ButtonSize = 'md' | 'sm'

interface ButtonStyleProps {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  /** Icon before the label (decorative — hidden from screen readers) */
  icon?: ReactNode
}

/** Class list shared by <Button> and <ButtonLink>. */
function buttonClasses({ variant = 'secondary', size = 'md', fullWidth }: ButtonStyleProps, className?: string) {
  return cx(styles.button, styles[variant], size === 'sm' && styles.sm, fullWidth && styles.fullWidth, className)
}

function Content({ icon, children }: { icon?: ReactNode; children?: ReactNode }) {
  return (
    <>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </>
  )
}

export type ButtonProps = ButtonStyleProps & ComponentProps<'button'>

/**
 * Pill button from the waypoint design.
 * `type` defaults to "button" so it never submits a form by accident.
 * In React 19 `ref` is a regular prop — no forwardRef needed.
 */
export function Button({ variant, size, fullWidth, icon, className, type = 'button', children, ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses({ variant, size, fullWidth }, className)} {...rest}>
      <Content icon={icon}>{children}</Content>
    </button>
  )
}

export type ButtonLinkProps = ButtonStyleProps & LinkProps

/** Router link that looks like a button: navigation stays a real <a>. */
export function ButtonLink({ variant, size, fullWidth, icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, fullWidth }, className)} {...rest}>
      <Content icon={icon}>{children}</Content>
    </Link>
  )
}
