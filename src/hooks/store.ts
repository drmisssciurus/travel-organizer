import { useDispatch, useSelector, useStore } from 'react-redux'
import type { AppDispatch, AppStore, RootState } from '@/store'

/**
 * Typed versions of the react-redux hooks. Use these everywhere
 * instead of plain `useDispatch` / `useSelector`, so state and thunks are typed.
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppStore = useStore.withTypes<AppStore>()
