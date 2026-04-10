-- Live3C full database setup (tables + RLS + storage separation)
-- Run in Supabase SQL Editor

create extension if not exists pgcrypto;

-- =====================
-- 1) TOURNAMENTS
-- =====================
create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date_str text,
  location text,
  format text,
  status text default 'registration' check (status in ('registration','ongoing','finished')),
  prize text,
  cover_url text,
  description text,
  content text,
  bracket_size int default 4,
  bracket_state jsonb,
  schedule_order jsonb,
  settings jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_tournaments_created_at on public.tournaments(created_at desc);
create index if not exists idx_tournaments_status on public.tournaments(status);

-- =====================
-- 2) TOURNAMENT PLAYERS
-- =====================
create table if not exists public.tournament_players (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  stt int,
  name text not null,
  unit text,
  rank text,
  is_seed boolean default false,
  drawn boolean default false,
  bracket_slot text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_players_tournament on public.tournament_players(tournament_id);
create index if not exists idx_players_seed on public.tournament_players(tournament_id, is_seed);

-- =====================
-- 3) MATCH METRICS (popup score/avg/hr per player)
-- =====================
create table if not exists public.match_metrics (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round_index int not null,
  match_index int not null,
  player1 jsonb default '{}'::jsonb,
  player2 jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tournament_id, round_index, match_index)
);

create index if not exists idx_metrics_tournament on public.match_metrics(tournament_id);

-- =====================
-- 4) SIMPLE updated_at trigger
-- =====================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tournaments_updated_at on public.tournaments;
create trigger trg_tournaments_updated_at
before update on public.tournaments
for each row execute function public.set_updated_at();

drop trigger if exists trg_players_updated_at on public.tournament_players;
create trigger trg_players_updated_at
before update on public.tournament_players
for each row execute function public.set_updated_at();

drop trigger if exists trg_metrics_updated_at on public.match_metrics;
create trigger trg_metrics_updated_at
before update on public.match_metrics
for each row execute function public.set_updated_at();

-- =====================
-- 5) RLS + POLICIES
-- =====================
alter table public.tournaments enable row level security;
alter table public.tournament_players enable row level security;
alter table public.match_metrics enable row level security;

-- Open demo mode policies (anon full CRUD)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tournaments' and policyname='tournaments_select_anon'
  ) then
    create policy tournaments_select_anon on public.tournaments for select to anon using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tournaments' and policyname='tournaments_insert_anon'
  ) then
    create policy tournaments_insert_anon on public.tournaments for insert to anon with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tournaments' and policyname='tournaments_update_anon'
  ) then
    create policy tournaments_update_anon on public.tournaments for update to anon using (true) with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tournaments' and policyname='tournaments_delete_anon'
  ) then
    create policy tournaments_delete_anon on public.tournaments for delete to anon using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tournament_players' and policyname='players_select_anon'
  ) then
    create policy players_select_anon on public.tournament_players for select to anon using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tournament_players' and policyname='players_insert_anon'
  ) then
    create policy players_insert_anon on public.tournament_players for insert to anon with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tournament_players' and policyname='players_update_anon'
  ) then
    create policy players_update_anon on public.tournament_players for update to anon using (true) with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tournament_players' and policyname='players_delete_anon'
  ) then
    create policy players_delete_anon on public.tournament_players for delete to anon using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='match_metrics' and policyname='metrics_select_anon'
  ) then
    create policy metrics_select_anon on public.match_metrics for select to anon using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='match_metrics' and policyname='metrics_insert_anon'
  ) then
    create policy metrics_insert_anon on public.match_metrics for insert to anon with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='match_metrics' and policyname='metrics_update_anon'
  ) then
    create policy metrics_update_anon on public.match_metrics for update to anon using (true) with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='match_metrics' and policyname='metrics_delete_anon'
  ) then
    create policy metrics_delete_anon on public.match_metrics for delete to anon using (true);
  end if;
end$$;

-- =====================
-- 6) STORAGE (media separated)
-- =====================
insert into storage.buckets (id, name, public)
values ('tournament-media', 'tournament-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('app-media', 'app-media', true)
on conflict (id) do nothing;

-- Storage policies (public read, anon upload/update/delete for demo)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='media_public_read'
  ) then
    create policy media_public_read on storage.objects
      for select to public
      using (bucket_id in ('tournament-media','app-media'));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='media_anon_insert'
  ) then
    create policy media_anon_insert on storage.objects
      for insert to anon
      with check (bucket_id in ('tournament-media','app-media'));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='media_anon_update'
  ) then
    create policy media_anon_update on storage.objects
      for update to anon
      using (bucket_id in ('tournament-media','app-media'))
      with check (bucket_id in ('tournament-media','app-media'));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='media_anon_delete'
  ) then
    create policy media_anon_delete on storage.objects
      for delete to anon
      using (bucket_id in ('tournament-media','app-media'));
  end if;
end$$;
