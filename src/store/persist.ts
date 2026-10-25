import { nanoid } from '@reduxjs/toolkit'
import { readJSON, writeJSON } from '@/api/storage'
import { createDemoSnapshots } from '@/data/demoTrips'
import { LANGUAGES, THEME_MODES, type Settings } from '@/types'
import { todayISO } from '@/utils/date'
import { isISODate, isOneOf, isRecord } from '@/utils/guards'
import { detectLanguage } from '@/utils/language'
import { throttle } from '@/utils/throttle'
import { dateRange } from '@/utils/tripDays'
import type { AppStore, RootState } from './index'
import { sanitizeEntities, slicesFromSnapshots, type EntitySlices } from './sanitize'

/**
 * Persistence of the Redux state to localStorage.
 *
 * Stored as an envelope: { version: number, state: { settings, trips, days, … } }
 * - only slices from PERSISTED_SLICES are saved;
 * - `version` + MIGRATIONS let us change the shape later without losing user data;
 * - loaded data is validated and repaired (`sanitize.ts`): broken values fall back to defaults.
 *
 * ⚠️ STORAGE_KEY is also read by the inline script in index.html (theme before first paint).
 */
export const STORAGE_KEY = 'waypoint'
export const SCHEMA_VERSION = 4
/** Schema version that introduced trips. Data saved before it has never had trips → gets the demo. */
const TRIPS_SINCE_VERSION = 2
const SAVE_THROTTLE_MS = 500

/** Slices saved to storage. Add entity slices here as they appear. */
const PERSISTED_SLICES = [
  'settings',
  'trips',
  'days',
  'items',
  'checklistGroups',
  'checklistItems',
  'expenses',
] as const satisfies readonly (keyof RootState)[]

type PersistedKey = (typeof PERSISTED_SLICES)[number]
export type PersistedState = Pick<RootState, PersistedKey>

/** Synced to the cloud: everything except settings (theme and language stay per device). */
const SYNCED_SLICES = PERSISTED_SLICES.filter(
  (key): key is Exclude<PersistedKey, 'settings'> => key !== 'settings',
)

interface Envelope {
  version: number
  state: unknown
}

/* ---------- Migrations ---------- */

type Migration = (state: Record<string, unknown>) => Record<string, unknown>

const emptyCollection = () => ({ ids: [], entities: {} })

/**
 * MIGRATIONS[n] upgrades data from version n-1 to n.
 * Never edit a released migration — add a new one and bump SCHEMA_VERSION.
 * Migrations work on raw JSON: they must survive anything (sanitize runs after them).
 */
const MIGRATIONS: Record<number, Migration> = {
  // v2 (stage 3.1): trips appear. v1 data had only settings.
  2: (state) => ({ ...state, trips: emptyCollection() }),

  // v3 (stage 4.1): days, items and the checklist appear. Each existing trip gets
  // one day per date and its "tasks" group; plans and checklists start empty.
  3: (state) => {
    const trips = isRecord(state.trips) && isRecord(state.trips.entities) ? state.trips.entities : {}
    const days: Record<string, unknown> = {}
    const groups: Record<string, unknown> = {}
    const nextTrips: Record<string, unknown> = {}
    for (const [key, trip] of Object.entries(trips)) {
      if (!isRecord(trip) || !isISODate(trip.startDate) || !isISODate(trip.endDate)) {
        nextTrips[key] = trip // sanitize will drop it
        continue
      }
      const tripDays = dateRange(trip.startDate, trip.endDate).map((date) => ({
        id: nanoid(),
        tripId: trip.id,
        date,
        itemIds: [],
      }))
      for (const day of tripDays) days[day.id] = day
      const group = { id: nanoid(), tripId: trip.id, kind: 'tasks', title: '', itemIds: [] }
      groups[group.id] = group
      nextTrips[key] = { ...trip, dayIds: tripDays.map((day) => day.id), ideaIds: [], groupIds: [group.id] }
    }
    return {
      ...state,
      trips: { ids: Object.keys(nextTrips), entities: nextTrips },
      days: { ids: Object.keys(days), entities: days },
      items: emptyCollection(),
      checklistGroups: { ids: Object.keys(groups), entities: groups },
      checklistItems: emptyCollection(),
    }
  },

  // v4 (stage 5.1): expenses appear, empty for existing trips.
  4: (state) => ({ ...state, expenses: emptyCollection() }),
}

function migrate(state: Record<string, unknown>, fromVersion: number): Record<string, unknown> | undefined {
  let current = state
  for (let version = fromVersion + 1; version <= SCHEMA_VERSION; version++) {
    const step = MIGRATIONS[version]
    if (!step) return undefined
    current = step(current)
  }
  return current
}

/* ---------- Validation ---------- */

function sanitizeSettings(raw: unknown): Settings {
  const data = isRecord(raw) ? raw : {}
  return {
    theme: isOneOf(THEME_MODES, data.theme) ? data.theme : 'system',
    language: isOneOf(LANGUAGES, data.language) ? data.language : detectLanguage(),
  }
}

/* ---------- Load ---------- */

/** The stored envelope, or `undefined` if there is none or its shape is wrong. */
function readEnvelope(): { version: number; state: Record<string, unknown> } | undefined {
  const raw = readJSON(STORAGE_KEY)
  if (!isRecord(raw) || typeof raw.version !== 'number' || !isRecord(raw.state)) return undefined
  return { version: raw.version, state: raw.state }
}

/** Demo trips (with days, plan items and tasks), texts in the user's language. */
function demoState(settings: Settings): EntitySlices {
  return slicesFromSnapshots(createDemoSnapshots(todayISO(), settings.language))
}

/**
 * Reads the saved state for `makeStore(preloadedState)`.
 *
 * Demo trips are seeded when the user has never had trips:
 * - nothing saved, or the saved data is unreadable → first launch;
 * - data saved before trips existed (v1: only theme and language).
 * Once trips are saved (even an empty list after deleting everything), the demo never comes back.
 */
export function loadState(): Partial<PersistedState> | undefined {
  const envelope = readEnvelope()

  // Data from a newer app version: we can't understand it, start clean (no demo either)
  if (envelope && envelope.version > SCHEMA_VERSION) return undefined

  const version = envelope?.version ?? 0
  const state = envelope && version < SCHEMA_VERSION ? migrate(envelope.state, version) : envelope?.state

  // Nothing usable: first launch → default settings + demo
  if (!state) {
    const settings = sanitizeSettings(undefined)
    return { settings, ...demoState(settings) }
  }

  const settings = sanitizeSettings(state.settings)
  return {
    settings,
    ...(version < TRIPS_SINCE_VERSION ? demoState(settings) : sanitizeEntities(state)),
  }
}

/* ---------- Cloud envelope ---------- */

/**
 * Cloud copy (stage 10): the same `{ version, state }` envelope, without settings.
 * The version lets an older app on another device refuse data it can't understand.
 */
export function syncedEnvelope(state: RootState): Envelope {
  const picked: Record<string, unknown> = {}
  for (const key of SYNCED_SLICES) picked[key] = state[key]
  return { version: SCHEMA_VERSION, state: picked }
}

/** Entity slices of a state, for "did the data change" checks (references). */
export function syncedSlices(state: RootState): readonly unknown[] {
  return SYNCED_SLICES.map((key) => state[key])
}

/**
 * Cloud envelope → valid entity slices (migrated and repaired like localStorage data),
 * or `undefined` if it can't be used (broken, or written by a newer app version).
 */
export function entitiesFromEnvelope(raw: unknown): EntitySlices | undefined {
  if (!isRecord(raw) || typeof raw.version !== 'number' || !isRecord(raw.state)) return undefined
  if (raw.version > SCHEMA_VERSION || raw.version < TRIPS_SINCE_VERSION) return undefined
  const state = raw.version < SCHEMA_VERSION ? migrate(raw.state, raw.version) : raw.state
  return state ? sanitizeEntities(state) : undefined
}

/* ---------- Save ---------- */

function pickPersisted(state: RootState): PersistedState {
  const picked = {} as Record<PersistedKey, unknown>
  for (const key of PERSISTED_SLICES) picked[key] = state[key]
  return picked as PersistedState
}

/** Slices are immutable: a changed slice is a new object, so comparing references is enough. */
function sameSlices(a: PersistedState, b: PersistedState | undefined): boolean {
  return b !== undefined && PERSISTED_SLICES.every((key) => a[key] === b[key])
}

/**
 * Subscribes to the store and writes persisted slices to localStorage
 * (throttled, only when something changed). Flushes when the tab is hidden or closed.
 * Returns a cleanup function.
 *
 * The first save happens right away: what was loaded may differ from what is stored
 * (demo trips seeded, data migrated to a new version), and it must be saved even if
 * the user changes nothing — otherwise the demo would be re-created on every launch.
 */
export function setupPersistence(store: AppStore): () => void {
  // Exception: data from a newer app version (e.g. an old tab left open after an update)
  // is not overwritten at startup — only if the user actually changes something here.
  const storedVersion = readEnvelope()?.version ?? 0
  let lastSaved: PersistedState | undefined =
    storedVersion > SCHEMA_VERSION ? pickPersisted(store.getState()) : undefined

  const save = throttle(() => {
    const next = pickPersisted(store.getState())
    if (sameSlices(next, lastSaved)) return
    const envelope: Envelope = { version: SCHEMA_VERSION, state: next }
    if (writeJSON(STORAGE_KEY, envelope)) lastSaved = next
  }, SAVE_THROTTLE_MS)

  const unsubscribe = store.subscribe(save)
  save() // initial write (throttled — doesn't block the first render)

  // Don't lose the last change if the tab closes inside the throttle window
  const onHidden = () => {
    if (document.visibilityState === 'hidden') save.flush()
  }
  window.addEventListener('pagehide', save.flush)
  document.addEventListener('visibilitychange', onHidden)

  return () => {
    save.flush()
    unsubscribe()
    window.removeEventListener('pagehide', save.flush)
    document.removeEventListener('visibilitychange', onHidden)
  }
}
