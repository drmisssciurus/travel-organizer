import { useTranslation } from 'react-i18next'
import { ButtonLink, EmptyState } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'

interface NotFoundPageProps {
  /** Already translated text; defaults to the generic 404 copy */
  title?: string
  hint?: string
}

/** 404 for unknown URLs. Reused later for "trip not found". */
export default function NotFoundPage({ title, hint }: NotFoundPageProps) {
  const { t } = useTranslation()
  useDocumentTitle(t('errors.notFoundTitle'))

  return (
    <EmptyState
      icon="?"
      headingLevel={1}
      title={title ?? t('errors.notFoundTitle')}
      description={hint ?? t('errors.notFoundHint')}
      action={
        <ButtonLink size="sm" to={paths.trips()}>
          {t('errors.toTrips')}
        </ButtonLink>
      }
    />
  )
}
