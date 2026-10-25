import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Language, Settings, ThemeMode } from '@/types'
import { detectLanguage } from '@/utils/language'

const initialState: Settings = {
  theme: 'system',
  language: detectLanguage(),
}

/**
 * User preferences: theme and UI language.
 * Action names describe *what happened* (`themeChanged`), per the Redux style guide.
 */
export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    themeChanged(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload
    },
    languageChanged(state, action: PayloadAction<Language>) {
      state.language = action.payload
    },
  },
  selectors: {
    selectTheme: (settings) => settings.theme,
    selectLanguage: (settings) => settings.language,
  },
})

export const { themeChanged, languageChanged } = settingsSlice.actions
export const { selectTheme, selectLanguage } = settingsSlice.selectors
