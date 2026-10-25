import { useTranslation } from 'react-i18next'
import { Badge, type BadgeTone } from '@/components/ui'
import type { TripStatus } from '@/types'

const TONE: Record<TripStatus, BadgeTone> = {
  ongoing: 'solid',
  upcoming: 'soft',
  past: 'muted',
}

export interface TripStatusBadgeProps {
  status: TripStatus
  /** Days until the start — used for upcoming trips. */
  daysUntilStart: number
  /** The nearest upcoming trip: shows "In N days" instead of "Upcoming" (short variant). */
  isNext?: boolean
  /**
   * `short` — trips list: "Now" / "In 12 days" / "Upcoming" / "Past".
   * `long`  — trip header: always shows the countdown, "Upcoming · in 12 days".
   */
  variant?: 'short' | 'long'
  size?: 'md' | 'sm'
}

/** Maps a derived trip status to a badge: tone + translated label. */
export function TripStatusBadge({ status, daysUntilStart, isNext = false, variant = 'short', size }: TripStatusBadgeProps) {
  const { t } = useTranslation()
  return (
    <Badge tone={TONE[status]} size={size}>
      {label()}
    </Badge>
  )

  function label(): string {
    if (status !== 'upcoming') return t(`tripStatus.${status}`)
    const tomorrow = daysUntilStart === 1
    if (variant === 'long') {
      return tomorrow ? t('tripStatus.soonTomorrow') : t('tripStatus.soonIn', { count: daysUntilStart })
    }
    if (!isNext) return t('tripStatus.upcoming')
    return tomorrow ? t('tripStatus.tomorrow') : t('tripStatus.inDays', { count: daysUntilStart })
  }
}
