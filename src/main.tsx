import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router/dom'
import '@/styles/index.css'
import { initI18n } from '@/i18n'
import { router } from '@/router'
import { store } from '@/store'
import { setupCloudSync } from '@/cloud/sync'
import { setupPersistence } from '@/store/persist'

// Save persisted slices to localStorage on every change (throttled)
setupPersistence(store)
// …and to the cloud when signed in (stage 10; off without Supabase settings)
setupCloudSync(store)

// i18n must be ready before the first render; the initial language comes from the store
initI18n(store.getState().settings.language)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
)
