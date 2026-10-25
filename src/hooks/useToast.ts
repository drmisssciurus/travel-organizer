import { useCallback } from 'react'
import { toastShown, type ToastInput } from '@/store/slices/toastSlice'
import { useAppDispatch } from './store'

/**
 * Shortcut for components: const toast = useToast(); toast({ message: t('toast.saved') }).
 * Thunks dispatch `toastShown(...)` directly.
 */
export function useToast() {
  const dispatch = useAppDispatch()
  return useCallback((input: ToastInput) => dispatch(toastShown(input)), [dispatch])
}
