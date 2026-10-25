import { useEffect, useSyncExternalStore } from 'react'
import { selectTheme } from '@/store/slices/settingsSlice'
import { useAppSelector } from './store'

export type ResolvedTheme = 'light' | 'dark'

const DARK_QUERY = '(prefers-color-scheme: dark)'

/* ---------- OS color scheme as an external store ---------- */

function subscribeToSystemTheme(onChange: () => void) {
  const mql = window.matchMedia(DARK_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

const getSystemTheme = (): ResolvedTheme => (window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light')

/**
 * Current OS color scheme; re-renders when the user switches it in the OS.
 * `useSyncExternalStore` is the React way to read a browser API that changes over time.
 */
export function useSystemTheme(): ResolvedTheme {
  return useSyncExternalStore(subscribeToSystemTheme, getSystemTheme, () => 'light')
}

/** The theme actually on screen: the chosen mode, or the OS scheme when mode is "system". */
export function useResolvedTheme(): ResolvedTheme {
  const mode = useAppSelector(selectTheme)
  const system = useSystemTheme()
  return mode === 'system' ? system : mode
}

/**
 * Applies the chosen mode to `<html data-theme>`.
 * - "light" / "dark" → attribute forces the theme;
 * - "system" → attribute removed, CSS `color-scheme: light dark` follows the OS
 *   (see styles/tokens.css — no JS needed to react to OS changes).
 */
export function useThemeSync() {
  const mode = useAppSelector(selectTheme)

  useEffect(() => {
    const root = document.documentElement
    if (mode === 'system') delete root.dataset.theme
    else root.dataset.theme = mode
  }, [mode])
}
