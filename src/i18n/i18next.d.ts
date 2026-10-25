import 'i18next'
import type { en } from './locales/en'

/**
 * Typed translation keys: `t('trip.tabs.plan')` is checked at compile time,
 * and a typo like `t('trip.tab.plan')` is an error.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof en
    }
  }
}
