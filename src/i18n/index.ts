import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { LANGUAGES, type Language } from '@/types'
import { en } from './locales/en'
import { ru } from './locales/ru'

export const resources = {
  en: { translation: en },
  ru: { translation: ru },
} as const

/**
 * Initializes i18next with bundled resources. Synchronous (`initAsync: false`),
 * so `t()` works on the very first render — no flash of untranslated keys.
 * The language comes from the store; later changes are synced by `useLanguageSync`.
 */
export function initI18n(language: Language) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: 'en',
    supportedLngs: LANGUAGES,
    initAsync: false,
    interpolation: {
      escapeValue: false, // React already escapes rendered strings
    },
  })
  return i18n
}

export default i18n
