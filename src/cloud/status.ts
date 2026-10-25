import { useSyncExternalStore } from 'react'

/** What the account button shows. */
export type CloudStatus =
  | { kind: 'off' } // no Supabase config: local-only app
  | { kind: 'signedOut' }
  | { kind: 'syncing'; email: string }
  | { kind: 'synced'; email: string; at: number }
  | { kind: 'offline'; email: string; pending: boolean }
  | { kind: 'error'; email: string }

let status: CloudStatus = { kind: 'off' }
const listeners = new Set<() => void>()

export function setCloudStatus(next: CloudStatus) {
  status = next
  for (const listener of listeners) listener()
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Sync status lives outside Redux: it's not app data and must not be persisted or synced itself. */
export function useCloudStatus(): CloudStatus {
  return useSyncExternalStore(subscribe, () => status)
}
