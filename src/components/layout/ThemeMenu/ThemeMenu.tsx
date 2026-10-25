import { useTranslation } from 'react-i18next'
import { IconButton, Menu } from '@/components/ui'
import { useAppDispatch, useAppSelector } from '@/hooks/store'
import { useResolvedTheme } from '@/hooks/useTheme'
import { selectTheme, themeChanged } from '@/store/slices/settingsSlice'
import { THEME_MODES, type ThemeMode } from '@/types'

const ICONS: Record<ThemeMode, string> = {
  system: '◐',
  light: '☀',
  dark: '☾',
}

/** Theme picker in the header: System / Light / Dark. Keyboard & a11y come from <Menu>. */
export default function ThemeMenu() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const mode = useAppSelector(selectTheme)
  const resolved = useResolvedTheme()

  return (
    <Menu
      label={t('theme.label')}
      items={THEME_MODES.map((option) => ({
        id: option,
        label: t(`theme.${option}`),
        icon: ICONS[option],
        hint: option === 'system' ? t(`theme.now.${resolved}`) : undefined,
        checked: option === mode,
      }))}
      onSelect={(option) => dispatch(themeChanged(option))}
      renderTrigger={(triggerProps) => (
        <IconButton {...triggerProps} label={`${t('theme.label')}: ${t(`theme.${mode}`)}`} icon={ICONS[mode]} />
      )}
    />
  )
}
