import { readJSON, removeItem, writeJSON } from '@/api/storage'
import { cloudEnabled, fetchRemote, onUserChange, pushRemote, type CloudUser, type RemoteState } from '@/api/cloud'
import i18n from '@/i18n'
import type { AppStore } from '@/store'
import { cloudStateLoaded } from '@/store/actions/cloudActions'
import { entitiesFromEnvelope, syncedEnvelope, syncedSlices } from '@/store/persist'
import { toastShown } from '@/store/slices/toastSlice'
import { isRecord } from '@/utils/guards'
import { setCloudStatus } from './status'

/**
 * Sync between this device (localStorage — still the main storage, works offline)
 * and the user's row in the cloud.
 *
 *   change in the app ─► mark dirty ─► push after a short pause (if online and signed in)
 *   app start / sign-in / back online / tab shown ─► sync: pull, compare, push or apply
 *
 * Decisions (one user, several devices — last write wins):
 * - no cloud copy yet → this device uploads its data;
 * - first sign-in on this device and a cloud copy exists → the cloud wins
 *   (a new phone with demo data must not overwrite the real plan);
 * - cloud unchanged since our last sync → upload local changes, if any;
 * - cloud changed elsewhere, no local changes → download;
 * - both changed → the newer one wins; when the cloud wins, a toast says so.
 */

const META_KEY = 'waypoint-sync'
/** Local data replaced by the first download on this device (recoverable by hand) */
const BACKUP_KEY = 'waypoint-backup'
const PUSH_DELAY_MS = 1500
const RETRY_MS = 30_000

interface SyncMeta {
  /** Whose data this device last synced */
  userId: string | null
  /** Cloud revision this device last saw (`null` — never synced) */
  revision: number | null
  /** When the data changed locally after the last sync (`null` — nothing to upload) */
  dirtyAt: number | null
}

function readMeta(): SyncMeta {
  const raw = readJSON(META_KEY)
  if (!isRecord(raw)) return { userId: null, revision: null, dirtyAt: null }
  return {
    userId: typeof raw.userId === 'string' ? raw.userId : null,
    revision: typeof raw.revision === 'number' ? raw.revision : null,
    dirtyAt: typeof raw.dirtyAt === 'number' ? raw.dirtyAt : null,
  }
}

const sameSlices = (a: readonly unknown[], b: readonly unknown[]) => a.every((slice, i) => slice === b[i])

let syncNow: () => void = () => {}

/** "Sync now" button. */
export function requestSync() {
  syncNow()
}

export function setupCloudSync(store: AppStore): () => void {
  if (!cloudEnabled) {
    setCloudStatus({ kind: 'off' })
    return () => {}
  }

  let user: CloudUser | null = null
  let meta = readMeta()
  // Entity slices as last seen — a new reference means the user changed something
  let seen = syncedSlices(store.getState())
  let running: Promise<void> | null = null
  let again = false
  let pushTimer: ReturnType<typeof setTimeout> | undefined
  let retryTimer: ReturnType<typeof setTimeout> | undefined

  const saveMeta = (next: SyncMeta) => {
    meta = next
    writeJSON(META_KEY, meta)
  }

  // Local changes → dirty → push soon
  const unsubscribe = store.subscribe(() => {
    const current = syncedSlices(store.getState())
    if (sameSlices(current, seen)) return
    seen = current
    if (meta.dirtyAt === null) saveMeta({ ...meta, dirtyAt: Date.now() })
    clearTimeout(pushTimer)
    pushTimer = setTimeout(syncNow, PUSH_DELAY_MS)
  })

  const apply = (remote: RemoteState, userId: string, announce: boolean) => {
    const entities = entitiesFromEnvelope(remote.data)
    if (!entities) throw new Error('Cloud data is from a newer app version')
    store.dispatch(cloudStateLoaded(entities))
    seen = syncedSlices(store.getState()) // not a local change
    saveMeta({ userId, revision: remote.revision, dirtyAt: null })
    if (announce) store.dispatch(toastShown({ message: i18n.t('cloud.downloaded') }))
  }

  /** Uploads local data; `false` if another device wrote first (the caller syncs again). */
  const push = async (userId: string, expected: number | null): Promise<boolean> => {
    const snapshot = syncedSlices(store.getState())
    const result = await pushRemote(userId, syncedEnvelope(store.getState()), expected)
    if (result === 'conflict') return false
    // Changes made while uploading stay dirty and go with the next push
    const changedMeanwhile = !sameSlices(syncedSlices(store.getState()), snapshot)
    saveMeta({ userId, revision: result, dirtyAt: changedMeanwhile ? Date.now() : null })
    if (changedMeanwhile) pushTimer = setTimeout(syncNow, PUSH_DELAY_MS)
    return true
  }

  const syncOnce = async (current: CloudUser) => {
    // Up to 3 rounds: a conflict means "pull again and decide again"
    for (let round = 0; round < 3; round++) {
      const remote = await fetchRemote(current.id)
      const linked = meta.userId === current.id
      const dirty = meta.dirtyAt !== null

      if (!remote) {
        if (await push(current.id, null)) return
      } else if (!linked) {
        // Safety net: what was on this device before the first download stays in localStorage
        writeJSON(BACKUP_KEY, { savedAt: new Date().toISOString(), envelope: syncedEnvelope(store.getState()) })
        apply(remote, current.id, true)
        return
      } else if (remote.revision === meta.revision) {
        if (!dirty || (await push(current.id, remote.revision))) return
      } else if (!dirty || Date.parse(remote.updatedAt) >= (meta.dirtyAt ?? 0)) {
        apply(remote, current.id, dirty) // tell the user only if local changes were replaced
        return
      } else if (await push(current.id, remote.revision)) {
        return
      }
    }
    throw new Error('Sync kept conflicting')
  }

  const run = async () => {
    const current = user
    if (!current) return
    clearTimeout(retryTimer)
    if (!navigator.onLine) {
      setCloudStatus({ kind: 'offline', email: current.email, pending: meta.dirtyAt !== null })
      return
    }
    setCloudStatus({ kind: 'syncing', email: current.email })
    try {
      await syncOnce(current)
      if (user?.id === current.id) setCloudStatus({ kind: 'synced', email: current.email, at: Date.now() })
    } catch (error) {
      console.warn('[cloud] sync failed', error)
      const offline = !navigator.onLine
      setCloudStatus(
        offline
          ? { kind: 'offline', email: current.email, pending: meta.dirtyAt !== null }
          : { kind: 'error', email: current.email },
      )
      retryTimer = setTimeout(syncNow, RETRY_MS)
    }
  }

  // One sync at a time; a request during a sync runs once more after it
  syncNow = () => {
    if (running) {
      again = true
      return
    }
    running = run().finally(() => {
      running = null
      if (again) {
        again = false
        syncNow()
      }
    })
  }

  const stopAuth = onUserChange((next) => {
    if (next?.id === user?.id) return // token refresh etc.
    user = next
    if (!next) {
      clearTimeout(pushTimer)
      clearTimeout(retryTimer)
      // Data stays on the device; the link to the account is dropped
      removeItem(META_KEY)
      meta = readMeta()
      setCloudStatus({ kind: 'signedOut' })
      return
    }
    syncNow()
  })

  const onOnline = () => syncNow()
  const onOffline = () => user && setCloudStatus({ kind: 'offline', email: user.email, pending: meta.dirtyAt !== null })
  const onVisible = () => {
    if (document.visibilityState === 'visible') syncNow()
  }
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
  document.addEventListener('visibilitychange', onVisible)
  setCloudStatus({ kind: 'signedOut' }) // until the stored session is restored

  return () => {
    unsubscribe()
    stopAuth()
    clearTimeout(pushTimer)
    clearTimeout(retryTimer)
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
    document.removeEventListener('visibilitychange', onVisible)
  }
}
