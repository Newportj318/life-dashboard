-- Training: weekly plan + third-party connections (Strava tokens).
-- Run once in Supabase → SQL Editor → New query → paste → Run.

-- One planned session per day.
create table if not exists public.training_plan (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day        date not null,
  kind       text not null check (kind in ('routine', 'cardio', 'rest')),
  routine_id text,          -- Hevy routine id when kind = 'routine'
  label      text not null, -- routine title, cardio type, or 'Rest'
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.training_plan enable row level security;

drop policy if exists "Own training plan" on public.training_plan;
create policy "Own training plan" on public.training_plan
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- OAuth tokens for connected apps (Strava). Only you can read or write your row.
create table if not exists public.integrations (
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  provider      text not null,
  access_token  text not null,
  refresh_token text not null,
  expires_at    bigint not null, -- unix seconds
  external_id   text,            -- e.g. Strava athlete id
  updated_at    timestamptz not null default now(),
  primary key (user_id, provider)
);

alter table public.integrations enable row level security;

drop policy if exists "Own integrations" on public.integrations;
create policy "Own integrations" on public.integrations
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Signed-out visitors get nothing, even with the public key.
revoke all on public.training_plan from anon;
revoke all on public.integrations from anon;
