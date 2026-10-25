import { createAsyncThunk } from '@reduxjs/toolkit'
import type { AppDispatch, RootState } from './index'

/**
 * Pre-typed `createAsyncThunk`: `getState()` returns `RootState`
 * and `dispatch` is `AppDispatch` — no generics at every call site.
 * Kept in a separate file (type-only import) to avoid a circular runtime import
 * between the store and slices that define thunks.
 */
export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState
  dispatch: AppDispatch
}>()
