import { useTranslation } from 'react-i18next'
import { Outlet, useNavigate, useParams } from 'react-router'
import { useTripDialogs } from '@/components/trips/TripDialogs'
import { TripHeader } from '@/components/trips/TripHeader'
import { ButtonLink, EmptyState, TabNav } from '@/components/ui'
import { useAppSelector } from '@/hooks/store'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useToday } from '@/hooks/useToday'
import { paths, TRIP_TABS } from '@/routes/paths'
import { selectTripById } from '@/store/slices/tripsSlice'
import styles from './TripLayout.module.css'

/**
 * Trip page shell: header card + tabs + the active tab (<Outlet />).
 * Tabs read the trip themselves (`useOutletContext` is not needed: the id is in the URL).
 */
export default function TripLayout() {
  const { t } = useTranslation()
  const { tripId = '' } = useParams()
  const navigate = useNavigate()
  const today = useToday()
  const trip = useAppSelector((state) => selectTripById(state, tripId))
  useDocumentTitle(trip ? trip.title : t('trip.notFound'))
  const { openEdit, requestDelete, dialogs } = useTripDialogs({
    // The page of a deleted trip makes no sense; "Undo" in the toast still works from the list
    onDeleted: () => void navigate(paths.trips(), { replace: true }),
  })

  if (!trip) {
    return (
      <EmptyState
        icon="?"
        headingLevel={1}
        title={t('trip.notFound')}
        description={t('trip.notFoundHint')}
        action={<ButtonLink to={paths.trips()}>{t('errors.toTrips')}</ButtonLink>}
      />
    )
  }

  return (
    <>
      <section className={styles.head}>
        <TripHeader trip={trip} today={today} onEdit={() => openEdit(trip)} onDelete={() => requestDelete(trip)} />
        <TabNav
          className={styles.tabs}
          label={t('trip.sections')}
          items={TRIP_TABS.map((tab) => ({ to: paths.trip(trip.id, tab), label: t(`trip.tabs.${tab}`) }))}
        />
      </section>
      <Outlet />
      {dialogs}
    </>
  )
}
