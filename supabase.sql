-- GRIT Supabase setup — run the WHOLE file at once in Supabase > SQL Editor.
-- Idempotent: safe to re-run. Athletes is created FIRST, before anything that references it.
create table if not exists public.athletes (id uuid primary key default gen_random_uuid(), name text not null unique, sport text default '', position text default '', mindset text default '', grateful text default '', look_up_to_you text default '', focus text default '', focus_why text default '', pin text not null default '1234', doc_url text default '', homework text default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.athletes add column if not exists sport text default '';
alter table public.athletes add column if not exists position text default '';
alter table public.athletes add column if not exists mindset text default '';
alter table public.athletes add column if not exists grateful text default '';
alter table public.athletes add column if not exists look_up_to_you text default '';
alter table public.athletes add column if not exists focus text default '';
alter table public.athletes add column if not exists focus_why text default '';
alter table public.athletes add column if not exists pin text not null default '1234';
alter table public.athletes add column if not exists doc_url text default '';
alter table public.athletes add column if not exists homework text default '';
alter table public.athletes add column if not exists created_at timestamptz not null default now();
alter table public.athletes add column if not exists updated_at timestamptz not null default now();
create table if not exists public.training_blocks (id uuid primary key default gen_random_uuid(), athlete_id uuid not null references public.athletes(id) on delete cascade, block_key text not null, content text default '', updated_at timestamptz not null default now(), unique (athlete_id, block_key));
create table if not exists public.homework (id uuid primary key default gen_random_uuid(), athlete_id uuid not null references public.athletes(id) on delete cascade, content text default '', week_of date, updated_at timestamptz not null default now());
create table if not exists public.progress_notes (id uuid primary key default gen_random_uuid(), athlete_id uuid not null references public.athletes(id) on delete cascade, kind text default 'note', content text default '', created_at timestamptz not null default now());
create table if not exists public.grit_cards (id uuid primary key default gen_random_uuid(), from_athlete_id uuid references public.athletes(id) on delete set null, to_athlete_id uuid not null references public.athletes(id) on delete cascade, message text default '', created_at timestamptz not null default now());
insert into public.athletes (name, pin) values ('Amelia Couturier','1234'),('Autumn S.','1234'),('Bailey B.','1234'),('Brett Robb','1234'),('Brook Hayden','1234'),('Brooklyn Brashaw','1234'),('Callie Schwall','1234'),('Clara','1234'),('Dawsyn / Levi','1234'),('Evy G','1234'),('Gracie M','1234'),('Hailey','1234'),('Hannah King','1234'),('Jorja Kiley','1234'),('Kaitlyn Hayden','1234'),('Kamryn Kiley','1234'),('Lorelei Driver','1234'),('Lydia Watson','1234'),('Mackenzie Mercer','1234'),('Mad dawg','1234'),('Mayson Lahr','1234'),('Mayla Zettle','1234'),('Morgan Fox','1234'),('Nat Wright','1234'),('Reagan V','1234'),('Tabatha Wheeler','1234'),('Tessa G','1234'),('Thailyn','1234') on conflict (name) do nothing;
create or replace function public.verify_athlete_pin(p_athlete_id uuid, p_pin text) returns boolean language sql stable security definer as $$ select exists (select 1 from public.athletes where id = p_athlete_id and pin = p_pin); $$;
alter table public.athletes enable row level security;
alter table public.training_blocks enable row level security;
alter table public.homework enable row level security;
alter table public.progress_notes enable row level security;
alter table public.grit_cards enable row level security;
drop policy if exists "grit_read" on public.athletes; drop policy if exists "grit_write" on public.athletes;
drop policy if exists "grit_read" on public.training_blocks; drop policy if exists "grit_write" on public.training_blocks;
drop policy if exists "grit_read" on public.homework; drop policy if exists "grit_write" on public.homework;
drop policy if exists "grit_read" on public.progress_notes; drop policy if exists "grit_write" on public.progress_notes;
drop policy if exists "grit_read" on public.grit_cards; drop policy if exists "grit_write" on public.grit_cards;
create policy "grit_read" on public.athletes for select using (true);
create policy "grit_write" on public.athletes for all using (true) with check (true);
create policy "grit_read" on public.training_blocks for select using (true);
create policy "grit_write" on public.training_blocks for all using (true) with check (true);
create policy "grit_read" on public.homework for select using (true);
create policy "grit_write" on public.homework for all using (true) with check (true);
create policy "grit_read" on public.progress_notes for select using (true);
create policy "grit_write" on public.progress_notes for all using (true) with check (true);
create policy "grit_read" on public.grit_cards for select using (true);
create policy "grit_write" on public.grit_cards for all using (true) with check (true);
-- ---- GRIT shared backend (added for Vercel build) ----
-- One generic table that stores EVERYTHING the app saves, by collection:
-- grit_athletes, grit_workouts, grit_homework, grit_challenges,
-- grit_completions, grit_cards, grit_pillars, grit_settings, grit_calendar
-- This is what makes saves show up on every phone.
create table if not exists public.grit_records (
  id uuid primary key default gen_random_uuid(),
  collection text not null,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists grit_records_collection_idx on public.grit_records (collection, created_at);
alter table public.grit_records enable row level security;
drop policy if exists "grit_records_read" on public.grit_records;
drop policy if exists "grit_records_write" on public.grit_records;
create policy "grit_records_read" on public.grit_records for select using (true);
create policy "grit_records_write" on public.grit_records for all using (true) with check (true);
