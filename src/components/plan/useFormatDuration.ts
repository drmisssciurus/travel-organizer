import { useTranslation } from 'react-i18next'

/** 90 → "1h 30m" / "1 ч 30 мин"; 45 → "45m". */
export function useFormatDuration() {
  const { t } = useTranslation()
  return (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const rest = minutes % 60
    return [hours ? t('plan.durationH', { count: hours }) : '', rest ? t('plan.durationM', { count: rest }) : '']
      .filter(Boolean)
      .join(' ')
  }
}
