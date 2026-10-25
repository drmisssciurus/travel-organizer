import { Button } from '@/components/ui'
import { useAppDispatch, useAppSelector } from '@/hooks/store'
import { useToast } from '@/hooks/useToast'
import { selectTheme, themeChanged } from '@/store/slices/settingsSlice'
import styles from './UiKitPage.module.css'

/* Dev-only demo of toasts. "Undo" is a real Redux action that restores the previous theme. */
export default function ToastDemo() {
  const toast = useToast()
  const dispatch = useAppDispatch()
  const theme = useAppSelector(selectTheme)

  const switchThemeWithUndo = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    dispatch(themeChanged(next))
    toast({ message: `Theme: ${next}`, undo: themeChanged(theme) })
  }

  return (
    <div className={styles.row}>
      <Button onClick={() => toast({ message: 'Saved' })}>“Saved”</Button>
      <Button onClick={switchThemeWithUndo}>Toggle theme · with Undo</Button>
      <Button variant="dangerOutline" onClick={() => toast({ message: 'Could not save: storage is full', tone: 'error' })}>
        Error toast
      </Button>
    </div>
  )
}
