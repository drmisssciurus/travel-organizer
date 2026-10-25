import { createBrowserRouter, Navigate } from 'react-router'
import AppLayout from '@/components/layout/AppLayout'
import NotFoundPage from '@/pages/NotFoundPage'
import RouteErrorPage from '@/pages/RouteErrorPage'
import TodayPage from '@/pages/TodayPage'
import TripsPage from '@/pages/TripsPage'
import ChecklistTab from '@/pages/trip/ChecklistTab'
import ExpensesTab from '@/pages/trip/ExpensesTab'
import TripLayout from '@/pages/trip/TripLayout'

/**
 * Route tree (React Router data mode).
 *
 * /                          TripsPage
 * /today                     TodayPage
 * /trips/:tripId             TripLayout → redirects to "plan"
 * /trips/:tripId/plan        PlanTab
 * /trips/:tripId/map         MapTab
 * /trips/:tripId/expenses    ExpensesTab
 * /trips/:tripId/checklist   ChecklistTab
 * *                          NotFoundPage
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        // Pathless route: errors render inside the layout, so header & nav stay visible
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <TripsPage /> },
          { path: 'today', element: <TodayPage /> },
          {
            path: 'trips/:tripId',
            element: <TripLayout />,
            children: [
              { index: true, element: <Navigate to="plan" replace /> },
              {
                path: 'plan',
                // Own chunk: the board brings dnd-kit (~30 kB gzip) — not needed for the trips list
                lazy: async () => ({ Component: (await import('@/pages/trip/PlanTab')).default }),
                HydrateFallback: () => null,
              },
              {
                path: 'map',
                // Own chunk: Leaflet (~45 kB gzip) loads only when the map is opened
                lazy: async () => ({ Component: (await import('@/pages/trip/MapTab')).default }),
                HydrateFallback: () => null,
              },
              { path: 'expenses', element: <ExpensesTab /> },
              { path: 'checklist', element: <ChecklistTab /> },
            ],
          },
          // UI kit preview — dev server only; the dynamic import keeps it out of the production bundle
          ...(import.meta.env.DEV
            ? [
                {
                  path: 'dev/ui',
                  lazy: async () => ({ Component: (await import('@/pages/dev/UiKitPage')).default }),
                  // Rendered while the lazy module loads on a direct first visit to /dev/ui
                  HydrateFallback: () => null,
                },
              ]
            : []),
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
