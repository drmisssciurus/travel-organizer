export const THEME_MODES = ['system', 'light', 'dark'] as const
export type ThemeMode = (typeof THEME_MODES)[number]

/** Order = order of the EN/RU switcher in the header. */
export const LANGUAGES = ['en', 'ru'] as const
export type Language = (typeof LANGUAGES)[number]

export interface Settings {
  theme: ThemeMode
  language: Language
}
