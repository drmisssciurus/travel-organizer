import { useSyncExternalStore } from 'react'

const TICK_MS = 30_000

/** Minutes since local midnight, e.g. 14:05 → 845. */
function nowMinutes(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

function subscribe(onChange: () => void) {
  // A tick every 30 s keeps "Now" correct while the screen stays open;
  // coming back to the tab updates it at once.
  const timer = setInterval(onChange, TICK_MS)
  document.addEventListener('visibilitychange', onChange)
  return () => {
    clearInterval(timer)
    document.removeEventListener('visibilitychange', onChange)
  }
}

/** Current time of day in minutes; re-renders only when the minute changes. */
export function useNowMinutes(): number {
  return useSyncExternalStore(subscribe, nowMinutes)
}
