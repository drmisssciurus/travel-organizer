import { useTranslation } from 'react-i18next'
import { NavLink, useMatch } from 'react-router'
import { paths, TRIP_TABS, type TripTab } from '@/routes/paths'
import styles from './BottomNav.module.css'

interface NavItem {
  to: string
  icon: string
  label: string
  /** Match the path exactly (needed for "/") */
  end?: boolean
}

const TAB_ICONS: Record<TripTab, string> = {
  plan: '▦',
  map: '⌖',
  expenses: '€',
  checklist: '✓',
}

/**
 * Mobile-only bottom navigation (hidden above 720px).
 * Inside a trip it shows the trip tabs; elsewhere — Trips / Today.
 */
export default function BottomNav() {
  const { t } = useTranslation()
  const tripMatch = useMatch('/trips/:tripId/*')
  const tripId = tripMatch?.params.tripId

  const items: NavItem[] = tripId
    ? [
        { to: paths.today(), icon: '◉', label: t('nav.today') },
        ...TRIP_TABS.map((tab) => ({ to: paths.trip(tripId, tab), icon: TAB_ICONS[tab], label: t(`trip.tabs.${tab}`) })),
      ]
    : [
        { to: paths.trips(), icon: '✈', label: t('nav.trips'), end: true },
        { to: paths.today(), icon: '◉', label: t('nav.today') },
      ]

  return (
    <nav className={styles.nav} aria-label={t('nav.mobile')}>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={styles.item}>
          <span className={styles.icon} aria-hidden="true">
            {item.icon}
          </span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
