import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { cx } from '@/utils/cx'
import styles from './TabNav.module.css'

export interface TabNavItem {
  to: string
  label: ReactNode
  /** Optional counter after the label: "Plan 10" */
  count?: number | string
  /** Match the path exactly */
  end?: boolean
}

export interface TabNavProps {
  items: readonly TabNavItem[]
  /** Accessible name of the navigation, e.g. "Trip sections" */
  label: string
  className?: string
}

/**
 * Pill tabs where every tab is a URL (Plan / Expenses / Checklist).
 * Semantically this is navigation — links with aria-current, not an ARIA tablist:
 * role="tablist" is for switching panels on one page without changing the URL.
 */
export function TabNav({ items, label, className }: TabNavProps) {
  return (
    <nav aria-label={label} className={cx(styles.tabs, className)}>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={styles.tab}>
          {item.label}
          {item.count !== undefined && <span className={styles.count}>{item.count}</span>}
        </NavLink>
      ))}
    </nav>
  )
}
