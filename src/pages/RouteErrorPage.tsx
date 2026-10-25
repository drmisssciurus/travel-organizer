import { useTranslation } from 'react-i18next'
import { isRouteErrorResponse, useRouteError } from 'react-router'
import NotFoundPage from './NotFoundPage'

/**
 * Error boundary for routes: renders when a route throws while rendering
 * (or a loader/action fails — we don't use them yet).
 */
export default function RouteErrorPage() {
  const { t } = useTranslation()
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />
  }

  // Show the technical message only in development
  const devMessage = error instanceof Error ? error.message : String(error)
  return <NotFoundPage title={t('errors.genericTitle')} hint={import.meta.env.DEV ? devMessage : t('errors.genericHint')} />
}
