/**
 * Thin, failure-safe wrapper around localStorage.
 * localStorage can throw (Safari private mode, quota exceeded, disabled storage) —
 * the app must keep working, just without persistence.
 *
 * All storage access goes through this module, so at stage 9 it can be
 * replaced by an HTTP client without touching the rest of the app.
 */

export function readJSON(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? undefined : (JSON.parse(raw) as unknown)
  } catch (error) {
    console.warn(`[storage] Failed to read "${key}"`, error)
    return undefined
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.warn(`[storage] Failed to write "${key}"`, error)
    return false
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore — nothing to clean up if storage is unavailable
  }
}
