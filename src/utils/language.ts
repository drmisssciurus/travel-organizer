import { LANGUAGES, type Language } from '@/types'
import { isOneOf } from './guards'

/** Type guard: narrows an arbitrary value to a supported `Language`. */
export function isLanguage(value: unknown): value is Language {
  return isOneOf(LANGUAGES, value)
}

/**
 * Picks the first supported language from the browser preferences
 * (`ru-RU` → `ru`, `en-GB` → `en`). Falls back to English.
 */
export function detectLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en'
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0]
    if (isLanguage(base)) return base
  }
  return 'en'
}
