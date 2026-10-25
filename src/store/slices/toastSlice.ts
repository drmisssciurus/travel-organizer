import { createSlice, nanoid, type PayloadAction, type UnknownAction } from '@reduxjs/toolkit'

export type ToastTone = 'default' | 'error'

export interface Toast {
  id: string
  /** Already translated text */
  message: string
  tone: ToastTone
  /**
   * Action dispatched when the user clicks "Undo".
   * An action object (not a callback) keeps the store serializable.
   */
  undo?: UnknownAction
  /** Auto-dismiss delay, ms */
  duration: number
}

export interface ToastInput {
  message: string
  tone?: ToastTone
  undo?: UnknownAction
  duration?: number
}

/** Toasts with Undo stay longer: the user needs time to react. */
const DEFAULT_DURATION = 2500
const UNDO_DURATION = 6000
const MAX_TOASTS = 3

export const toastSlice = createSlice({
  name: 'toasts',
  initialState: [] as Toast[],
  reducers: {
    toastShown: {
      reducer(state, action: PayloadAction<Toast>) {
        state.push(action.payload)
        // Oldest ones go away when too many pile up
        if (state.length > MAX_TOASTS) state.splice(0, state.length - MAX_TOASTS)
      },
      // `prepare` fills the id and defaults, so callers pass only what matters
      prepare(input: ToastInput) {
        return {
          payload: {
            id: nanoid(),
            message: input.message,
            tone: input.tone ?? 'default',
            undo: input.undo,
            duration: input.duration ?? (input.undo ? UNDO_DURATION : DEFAULT_DURATION),
          },
        }
      },
    },
    toastDismissed(state, action: PayloadAction<string>) {
      return state.filter((toast) => toast.id !== action.payload)
    },
  },
  selectors: {
    selectToasts: (toasts) => toasts,
  },
})

export const { toastShown, toastDismissed } = toastSlice.actions
export const { selectToasts } = toastSlice.selectors
