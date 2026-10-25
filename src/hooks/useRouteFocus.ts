import { useEffect, useRef, type RefObject } from 'react'
import { useLocation } from 'react-router'

/**
 * SPA navigation doesn't move focus like a page load does: keyboard and screen-reader
 * users would stay on the clicked link in the old place. After a **path** change
 * focus goes to <main> (tabIndex=-1), so reading and Tab start from the new content.
 * Query changes (search, filters) don't count — focus must stay in the search field.
 */
export function useRouteFocus(target: RefObject<HTMLElement | null>) {
  const { pathname } = useLocation()
  // Compare with the previous path (not a "first run" flag): StrictMode runs effects
  // twice in development, and the initial load must keep the browser's own focus
  const previous = useRef(pathname)
  useEffect(() => {
    if (previous.current === pathname) return
    previous.current = pathname
    target.current?.focus({ preventScroll: true })
  }, [pathname, target])
}
