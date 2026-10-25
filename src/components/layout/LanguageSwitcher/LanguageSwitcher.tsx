import { useTranslation } from 'react-i18next'
import { SegmentedControl } from '@/components/ui'
import { useAppDispatch, useAppSelector } from '@/hooks/store'
import { languageChanged, selectLanguage } from '@/store/slices/settingsSlice'
import { LANGUAGES } from '@/types'

/** EN / RU switch. Writes to the store; `useLanguageSync` applies it. */
export default function LanguageSwitcher() {
  const { t } = useTranslation()
  const language = useAppSelector(selectLanguage)
  const dispatch = useAppDispatch()

  return (
    <SegmentedControl
      size="sm"
      label={t('language.label')}
      value={language}
      onChange={(lng) => dispatch(languageChanged(lng))}
      options={LANGUAGES.map((lng) => ({ value: lng, label: lng.toUpperCase(), title: t(`language.${lng}`) }))}
    />
  )
}
