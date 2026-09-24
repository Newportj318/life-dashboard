-- Goals and projects.
-- Run once in Supabase → SQL Editor → New query → paste → Run.

create table if not exists public.goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title        text not null,
  area         text not null default 'personal'
               check (area in ('training', 'nutrition', 'finance', 'career', 'personal', 'family', 'home')),
  status       text not null default 'current' check (status in ('current', 'future', 'achieved', 'dropped')),
  tracking     text not null default 'manual' check (tracking in ('manual', 'net_worth', 'milestones')),
  unit         text,                 -- e.g. "kg", "$", "km"
  start_value  numeric(14, 2),       -- where progress is measured from
  target_value numeric(14, 2),
  current_value numeric(14, 2),      -- for manual tracking
  deadline     date,
  notes        text,
  position     int not null default 0,
  created_at   timestamptz not null default now(),
  achieved_at  timestamptz
);

-- Checkpoints on the way. With a value, a milestone ticks itself once the goal reaches it.
create table if not exists public.goal_milestones (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id  uuid not null references public.goals (id) on delete cascade,
  title    text not null,
  value    numeric(14, 2),
  due      date,
  done     boolean not null default false,
  position int not null default 0
);
create index if not exists goal_milestones_goal on public.goal_milestones (goal_id);

create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title        text not null,
  stage        text not null default 'idea' check (stage in ('idea', 'planning', 'active', 'done')),
  goal_id      uuid references public.goals (id) on delete set null,
  target_date  date,
  budget       numeric(12, 2),
  notes        text,
  position     int not null default 0,
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.project_tasks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  title      text not null,
  due        date,
  done       boolean not null default false,
  position   int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists project_tasks_project on public.project_tasks (project_id);

create table if not exists public.project_costs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id  uuid not null references public.projects (id) on delete cascade,
  description text not null,
  amount      numeric(12, 2) not null,
  spent_on    date not null default current_date,
  created_at  timestamptz not null default now()
);
create index if not exists project_costs_project on public.project_costs (project_id);

do $$
declare t text;
begin
  foreach t in array array['goals', 'goal_milestones', 'projects', 'project_tasks', 'project_costs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Own rows" on public.%I', t);
    execute format('create policy "Own rows" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;
