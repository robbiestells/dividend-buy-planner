-- Dividend Buy Planner: account sync.
-- Run once in the Supabase project (the same one Mise en Place uses):
-- SQL Editor -> New query -> paste -> Run. Safe to run again.
--
-- One row per signed-in person holding the whole planner (holdings, targets,
-- purchases, dividend history). Row-level security keeps each row private.

create table if not exists public.planner_state (
  user_id    uuid        primary key default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb       not null,
  updated_at timestamptz not null default now()
);

alter table public.planner_state enable row level security;

drop policy if exists "Read own planner"   on public.planner_state;
drop policy if exists "Insert own planner" on public.planner_state;
drop policy if exists "Update own planner" on public.planner_state;
drop policy if exists "Delete own planner" on public.planner_state;

create policy "Read own planner"   on public.planner_state for select to authenticated using (auth.uid() = user_id);
create policy "Insert own planner" on public.planner_state for insert to authenticated with check (auth.uid() = user_id);
create policy "Update own planner" on public.planner_state for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Delete own planner" on public.planner_state for delete to authenticated using (auth.uid() = user_id);
