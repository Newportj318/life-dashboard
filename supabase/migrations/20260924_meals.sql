-- Meals & nutrition: food library, meal library, week plan, targets, supplements, shopping list.
-- Run once in Supabase → SQL Editor → New query → paste → Run.

-- Ingredients you've used, with nutrition per 100 g (from Open Food Facts or typed in).
create table if not exists public.foods (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  brand      text,
  off_code   text,               -- Open Food Facts barcode, when it came from there
  kcal       numeric(7, 2) not null default 0,
  protein    numeric(7, 2) not null default 0,
  carbs      numeric(7, 2) not null default 0,
  fat        numeric(7, 2) not null default 0,
  serving_g  numeric(7, 2),      -- typical serving, as a hint
  created_at timestamptz not null default now()
);
create unique index if not exists foods_user_off_code on public.foods (user_id, off_code) where off_code is not null;

-- A meal makes `servings` portions. Macros per serving = ingredients ÷ servings + any typed extras.
create table if not exists public.meals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name          text not null,
  slots         text[] not null default '{}', -- breakfast | lunch | dinner | snack
  servings      numeric(6, 2) not null default 1 check (servings > 0),
  extra_kcal    numeric(7, 2) not null default 0, -- typed totals per serving
  extra_protein numeric(7, 2) not null default 0,
  extra_carbs   numeric(7, 2) not null default 0,
  extra_fat     numeric(7, 2) not null default 0,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.meal_items (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  meal_id  uuid not null references public.meals (id) on delete cascade,
  food_id  uuid not null references public.foods (id) on delete restrict,
  grams    numeric(8, 2) not null check (grams > 0),
  position int not null default 0
);
create index if not exists meal_items_meal on public.meal_items (meal_id);

-- What's planned in each slot. `servings` is how much gets cooked (family dinners);
-- `my_servings` is what counts toward your macros.
create table if not exists public.meal_plan (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day         date not null,
  slot        text not null check (slot in ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_id     uuid not null references public.meals (id) on delete cascade,
  servings    numeric(6, 2) not null default 1 check (servings > 0),
  my_servings numeric(6, 2) not null default 1 check (my_servings >= 0),
  created_at  timestamptz not null default now()
);
create index if not exists meal_plan_user_day on public.meal_plan (user_id, day);

-- Daily targets for training days and rest days.
create table if not exists public.nutrition_targets (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind    text not null check (kind in ('training', 'rest')),
  kcal    numeric(7, 1) not null,
  protein numeric(6, 1) not null,
  carbs   numeric(6, 1) not null,
  fat     numeric(6, 1) not null,
  primary key (user_id, kind)
);

create table if not exists public.supplements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  dose        text,
  time_of_day text not null default 'morning' check (time_of_day in ('morning', 'pre_workout', 'post_workout', 'with_meals', 'night')),
  position    int not null default 0,
  active      boolean not null default true
);

create table if not exists public.supplement_log (
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day           date not null,
  supplement_id uuid not null references public.supplements (id) on delete cascade,
  primary key (user_id, day, supplement_id)
);

-- Shopping list ticks per week: 'have' (already in the pantry) or 'bought'.
create table if not exists public.shopping_state (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week_start date not null,
  food_id    uuid not null references public.foods (id) on delete cascade,
  status     text not null check (status in ('have', 'bought')),
  primary key (user_id, week_start, food_id)
);

-- Same rule on every table: only you can see or change your rows.
do $$
declare t text;
begin
  foreach t in array array['foods', 'meals', 'meal_items', 'meal_plan', 'nutrition_targets', 'supplements', 'supplement_log', 'shopping_state'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Own rows" on public.%I', t);
    execute format('create policy "Own rows" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;
