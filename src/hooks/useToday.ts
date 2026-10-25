import { useSyncExternalStore } from 'react'
import type { ISODate } from '@/types'
import { todayISO } from '@/utils/date'

/**
 * Re-check the date when the tab becomes visible again or regains focus:
 * a tab left open overnight shows the right statuses ("Now", "In N days")
 * as soon as the user comes back. No timers needed.
 */
function subscribe(onChange: () => void) {
  document.addEventListener('visibilitychange', onChange)
  window.addEventListener('focus', onChange)
  return () => {
    document.removeEventListener('visibilitychange', onChange)
    window.removeEventListener('focus', onChange)
  }
}

/**
 * Today's date (local time zone) as `YYYY-MM-DD`.
 * The snapshot is a string, so React re-renders only when the date actually changes.
 */
export function useToday(): ISODate {
  return useSyncExternalStore(subscribe, () => todayISO())
}
