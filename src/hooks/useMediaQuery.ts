import { useCallback, useSyncExternalStore } from 'react'

/**
 * `true` while the media query matches; re-renders when it changes (resize, rotation).
 * Used where CSS alone can't switch: the plan renders either the desktop board
 * or the mobile day view, each with its own drag-and-drop setup.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}

/** Same breakpoint as `--bp-mobile` in tokens.css. */
export const MOBILE_QUERY = '(max-width: 720px)'
