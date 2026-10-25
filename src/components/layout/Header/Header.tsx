import { useTranslation } from 'react-i18next'
import { Link, useMatch } from 'react-router'
import { paths } from '@/routes/paths'
import { AccountButton } from '../AccountButton'
import LanguageSwitcher from '../LanguageSwitcher'
import ThemeMenu from '../ThemeMenu'
import styles from './Header.module.css'

/** Top app bar. On mobile the nav links move to <BottomNav />. */
export default function Header() {
  const { t } = useTranslation()
  // "Trips" stays active inside a trip too. Hooks are called unconditionally.
  const onTripsList = useMatch('/')
  const insideTrip = useMatch('/trips/*')
  const onToday = useMatch('/today')
  const tripsActive = Boolean(onTripsList || insideTrip)

  return (
    <div className="container">
      <header className={styles.bar}>
        <Link to={paths.trips()} className={styles.logo} aria-label={t('app.home')}>
          <span className={styles.mark} aria-hidden="true">
            W
          </span>
          <span className={styles.name}>{t('app.name')}</span>
        </Link>

        <nav className={styles.nav} aria-label={t('nav.main')}>
          <Link to={paths.trips()} className={styles.link} aria-current={tripsActive ? 'page' : undefined}>
            {t('nav.trips')}
          </Link>
          <Link to={paths.today()} className={styles.link} aria-current={onToday ? 'page' : undefined}>
            {t('nav.today')}
          </Link>
        </nav>

        <div className={styles.spacer} />

        <div className={styles.controls}>
          <LanguageSwitcher />
          <ThemeMenu />
        </div>

        <AccountButton />
      </header>
    </div>
  )
}
