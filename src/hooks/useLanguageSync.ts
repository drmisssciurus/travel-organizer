import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { selectLanguage } from '@/store/slices/settingsSlice'
import { useAppSelector } from './store'

/**
 * Keeps i18next and `<html lang>` in sync with the language in the store.
 * The store is the single source of truth; i18next only follows it.
 * `<html lang>` matters for screen readers, hyphenation and `Intl` defaults.
 */
export function useLanguageSync() {
  const language = useAppSelector(selectLanguage)
  const { i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = language
    if (i18n.language !== language) void i18n.changeLanguage(language)
  }, [language, i18n])
}
