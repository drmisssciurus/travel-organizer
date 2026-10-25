import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, ScrollRestoration } from 'react-router'
import { Toaster } from '@/components/ui'
import { useLanguageSync } from '@/hooks/useLanguageSync'
import { useRouteFocus } from '@/hooks/useRouteFocus'
import { useThemeSync } from '@/hooks/useTheme'
import BottomNav from '../BottomNav'
import Header from '../Header'
import styles from './AppLayout.module.css'

/**
 * App shell: skip link, sticky header, page content, mobile bottom navigation.
 * <main> receives focus after navigation (`useRouteFocus`).
 */
export default function AppLayout() {
  const { t } = useTranslation()
  const mainRef = useRef<HTMLElement>(null)
  useLanguageSync()
  useThemeSync()
  useRouteFocus(mainRef)

  return (
    <>
      {/* First Tab stop: jump over the header straight to the content */}
      <a href="#main" className={styles.skip}>
        {t('app.skipToContent')}
      </a>
      <Header />
      <main id="main" ref={mainRef} tabIndex={-1} className={`container ${styles.main}`}>
        <Outlet />
      </main>
      <BottomNav />
      <Toaster />
      {/* Resets scroll to top on navigation, restores it on Back */}
      <ScrollRestoration />
    </>
  )
}
