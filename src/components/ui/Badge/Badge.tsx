import type { ReactNode } from 'react'
import { cx } from '@/utils/cx'
import styles from './Badge.module.css'

export type BadgeTone = 'solid' | 'soft' | 'muted' | 'danger'

export interface BadgeProps {
  tone?: BadgeTone
  size?: 'md' | 'sm'
  children: ReactNode
  className?: string
}

/**
 * Small pill label. Generic on purpose — domain mapping lives elsewhere
 * (e.g. TripStatusBadge: ongoing → solid, upcoming → soft, past → muted).
 */
export function Badge({ tone = 'soft', size = 'md', children, className }: BadgeProps) {
  return <span className={cx(styles.badge, styles[tone], size === 'sm' && styles.sm, className)}>{children}</span>
}
