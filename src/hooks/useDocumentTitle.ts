import { useEffect } from 'react'

/** Browser tab title: "Lisbon & Sintra · waypoint" (screen readers also announce it on navigation). */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    document.title = title ? `${title} · waypoint` : 'waypoint'
  }, [title])
}
