import { beforeEach, vi } from 'vitest'
import { initI18n } from '@/i18n'

/**
 * Test environment:
 * - an in-memory localStorage (Node has none) — the store module reads it on import;
 * - i18n in English: thunks put translated texts into toasts and default group names.
 */
const memory = new Map<string, string>()

vi.stubGlobal('localStorage', {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => void memory.set(key, String(value)),
  removeItem: (key: string) => void memory.delete(key),
  clear: () => memory.clear(),
})

initI18n('en')

beforeEach(() => memory.clear())
