import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Cloud storage on Supabase (PostgreSQL + Auth). The only module that talks to it.
 *
 * One row per user in `user_state` (see supabase/schema.sql): the same envelope as in
 * localStorage, as `jsonb`. Row Level Security lets a signed-in user read and write
 * only their own row, so the publishable key can safely live in the frontend.
 *
 * `revision` is an optimistic lock: an update succeeds only if the row still has the
 * revision this device last saw — otherwise another device wrote in between (`conflict`).
 *
 * Without VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY the cloud is off
 * and the app works locally, as before (dev without an account, tests).
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const cloudEnabled = Boolean(url && key)

let client: SupabaseClient | undefined
function supabase(): SupabaseClient {
  if (!url || !key) throw new Error('Cloud is not configured')
  client ??= createClient(url, key, {
    // The session (refresh token) is kept in localStorage under its own key and refreshed automatically
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'waypoint-auth' },
  })
  return client
}

const TABLE = 'user_state'

export interface CloudUser {
  id: string
  email: string
}

export interface RemoteState {
  data: unknown
  revision: number
  /** ISO timestamp of the last write */
  updatedAt: string
}

const toUser = (session: Session | null): CloudUser | null =>
  session ? { id: session.user.id, email: session.user.email ?? '' } : null

/* ---------- Auth ---------- */

/** Called with the restored session at startup, then on every sign-in / sign-out; returns an unsubscribe function. */
export function onUserChange(callback: (user: CloudUser | null) => void): () => void {
  const { data } = supabase().auth.onAuthStateChange((_event, session) => callback(toUser(session)))
  return () => data.subscription.unsubscribe()
}

export type AuthError = 'invalidCredentials' | 'emailTaken' | 'weakPassword' | 'confirmEmail' | 'network' | 'unknown'

function authError(error: { name?: string; message?: string; code?: string; status?: number } | null): AuthError {
  const code = error?.code ?? ''
  if (code === 'invalid_credentials') return 'invalidCredentials'
  if (code === 'user_already_exists' || code === 'email_exists') return 'emailTaken'
  if (code === 'weak_password') return 'weakPassword'
  if (code === 'email_not_confirmed') return 'confirmEmail'
  if (error?.name === 'AuthRetryableFetchError' || error?.status === 0) return 'network'
  return 'unknown'
}

export async function signIn(email: string, password: string): Promise<AuthError | null> {
  try {
    const { error } = await supabase().auth.signInWithPassword({ email, password })
    return error ? authError(error) : null
  } catch {
    return 'network'
  }
}

/**
 * Creates the account. If email confirmation is on in the Supabase project,
 * there is no session yet → `confirmEmail` (the user confirms, then signs in).
 */
export async function signUp(email: string, password: string): Promise<AuthError | null> {
  try {
    const { data, error } = await supabase().auth.signUp({ email, password })
    if (error) return authError(error)
    return data.session ? null : 'confirmEmail'
  } catch {
    return 'network'
  }
}

export async function signOut(): Promise<void> {
  await supabase().auth.signOut()
}

/* ---------- Data ---------- */

export async function fetchRemote(userId: string): Promise<RemoteState | null> {
  const { data, error } = await supabase()
    .from(TABLE)
    .select('data, revision, updated_at')
    .eq('user_id', userId)
    .maybeSingle<{ data: unknown; revision: number; updated_at: string }>()
  if (error) throw new Error(error.message)
  return data ? { data: data.data, revision: data.revision, updatedAt: data.updated_at } : null
}

/**
 * Writes `data` if the row is still at `expected` revision (`null` = no row yet).
 * Returns the new revision, or `conflict` when another device wrote first.
 */
export async function pushRemote(userId: string, data: unknown, expected: number | null): Promise<number | 'conflict'> {
  const updatedAt = new Date().toISOString()
  if (expected === null) {
    const { error } = await supabase().from(TABLE).insert({ user_id: userId, data, revision: 1, updated_at: updatedAt })
    // 23505 = unique violation: the row was created by another device
    if (error?.code === '23505') return 'conflict'
    if (error) throw new Error(error.message)
    return 1
  }
  const next = expected + 1
  const { data: rows, error } = await supabase()
    .from(TABLE)
    .update({ data, revision: next, updated_at: updatedAt })
    .eq('user_id', userId)
    .eq('revision', expected)
    .select('revision')
  if (error) throw new Error(error.message)
  return rows.length === 0 ? 'conflict' : next
}
