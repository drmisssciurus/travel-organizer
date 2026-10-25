import { combineSlices, configureStore, type Action, type ThunkAction, type UnknownAction } from '@reduxjs/toolkit'
import { cloudStateLoaded } from './actions/cloudActions'
import { loadState } from './persist'
import { settingsSlice } from './slices/settingsSlice'
import { toastSlice } from './slices/toastSlice'
import { checklistGroupsSlice } from './slices/checklistGroupsSlice'
import { checklistItemsSlice } from './slices/checklistItemsSlice'
import { daysSlice } from './slices/daysSlice'
import { expensesSlice } from './slices/expensesSlice'
import { itemsSlice } from './slices/itemsSlice'
import { tripsSlice } from './slices/tripsSlice'

/**
 * Root reducer. `combineSlices` mounts each slice under its `name`
 * (`state.settings`, `state.trips`, `state.days`…).
 * New slices are added here as the stages progress.
 */
export const rootReducer = combineSlices(
  settingsSlice,
  toastSlice,
  tripsSlice,
  daysSlice,
  itemsSlice,
  checklistGroupsSlice,
  checklistItemsSlice,
  expensesSlice,
)

export type RootState = ReturnType<typeof rootReducer>

/** Root reducer + the cloud replace (all entity slices swapped in one action, settings kept). */
function appReducer(state: Parameters<typeof rootReducer>[0], action: UnknownAction): RootState {
  if (state && cloudStateLoaded.match(action)) return rootReducer({ ...state, ...action.payload }, action)
  return rootReducer(state, action)
}

/**
 * Store factory. `preloadedState` will be used to restore data from
 * localStorage (stage 1.8) and to build isolated stores in tests.
 */
export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: appReducer,
    preloadedState,
  })
}

/** App store, restored from localStorage (see `persist.ts`). */
export const store = makeStore(loadState())

export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = AppStore['dispatch']
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action>
