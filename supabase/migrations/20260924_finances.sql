-- Finances: daily net worth snapshots (PocketSmith's API has no history endpoint).
-- Run once in Supabase → SQL Editor → New query → paste → Run.

create table if not exists public.net_worth_snapshots (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day         date not null,
  net_worth   numeric(14, 2) not null,
  assets      numeric(14, 2),
  liabilities numeric(14, 2),
  updated_at  timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.net_worth_snapshots enable row level security;

drop policy if exists "Own net worth" on public.net_worth_snapshots;
create policy "Own net worth" on public.net_worth_snapshots
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on public.net_worth_snapshots from anon;
