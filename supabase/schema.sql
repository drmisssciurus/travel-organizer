-- waypoint — cloud storage (stage 10)
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
--
-- One row per user: the app's data envelope ({ version, state }) as jsonb.
-- Row Level Security: a signed-in user can read and write only their own row,
-- so the publishable key in the frontend gives access to nothing else.

create table if not exists public.user_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  -- Optimistic lock: the app updates "where revision = what I saw" and bumps it
  revision   bigint not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

drop policy if exists "user_state: read own"   on public.user_state;
drop policy if exists "user_state: insert own" on public.user_state;
drop policy if exists "user_state: update own" on public.user_state;

create policy "user_state: read own" on public.user_state
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "user_state: insert own" on public.user_state
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "user_state: update own" on public.user_state
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- The Data API needs table privileges too (RLS then limits them to the own row).
-- No delete: the app never deletes the row; deleting the user removes it (on delete cascade).
grant select, insert, update on public.user_state to authenticated;
revoke all on public.user_state from anon;
