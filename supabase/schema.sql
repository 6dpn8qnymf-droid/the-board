-- ============================================================
-- The Board — Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- Project Settings → SQL Editor → New Query → paste → Run
-- ============================================================

-- Profiles: one per user, links auth.users to a competitor identity
create table public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  person_id    text unique not null check (person_id in ('big-e', 'ao', 'sethy-boi')),
  display_name text not null,
  color_hex    text not null,
  created_at   timestamptz default now() not null
);

-- Metric snapshots: full history of every update
create table public.metric_snapshots (
  id                  uuid default gen_random_uuid() primary key,
  user_id             uuid references public.profiles(id) on delete cascade not null,
  aum                 numeric(15,2) not null default 0,
  fee_revenue_ytd     numeric(15,2) not null default 0,
  contributions_ytd   numeric(15,2) not null default 0,
  aum_delta           numeric(15,2) not null default 0,
  fee_revenue_delta   numeric(15,2) not null default 0,
  contributions_delta numeric(15,2) not null default 0,
  note                text,
  created_at          timestamptz default now() not null
);

-- Activity events: feed items (updates, lead changes, milestones, etc.)
create table public.activity_events (
  id           uuid default gen_random_uuid() primary key,
  triggered_by uuid references public.profiles(id) not null,
  event_type   text not null check (event_type in ('update','lead_change','milestone','personal_best','triple_crown')),
  category     text check (category in ('aum','fee_revenue_ytd','contributions_ytd')),
  payload      jsonb not null default '{}',
  created_at   timestamptz default now() not null
);

-- Push subscriptions: Web Push subscription per user
create table public.push_subscriptions (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references public.profiles(id) on delete cascade not null unique,
  subscription jsonb not null,
  created_at   timestamptz default now() not null
);

-- App settings: key/value store (milestone thresholds, etc.)
create table public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz default now() not null
);

-- Default settings
insert into public.app_settings (key, value) values
  ('milestone_thresholds', '{"aum": 500000, "fee_revenue_ytd": 2000, "contributions_ytd": 50000}'::jsonb);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles           enable row level security;
alter table public.metric_snapshots   enable row level security;
alter table public.activity_events    enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.app_settings       enable row level security;

-- Profiles: everyone reads, only update own
create policy "profiles_select" on public.profiles for select to authenticated using (true);
create policy "profiles_insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update to authenticated using (auth.uid() = id);

-- Snapshots: everyone reads, only insert for own user_id
create policy "snapshots_select" on public.metric_snapshots for select to authenticated using (true);
create policy "snapshots_insert" on public.metric_snapshots for insert to authenticated with check (auth.uid() = user_id);

-- Activity events: everyone reads, anyone can insert (server-controlled)
create policy "events_select" on public.activity_events for select to authenticated using (true);
create policy "events_insert" on public.activity_events for insert to authenticated with check (true);

-- Push subscriptions: own only
create policy "push_select" on public.push_subscriptions for select to authenticated using (auth.uid() = user_id);
create policy "push_insert" on public.push_subscriptions for insert to authenticated with check (auth.uid() = user_id);
create policy "push_update" on public.push_subscriptions for update to authenticated using (auth.uid() = user_id);
create policy "push_delete" on public.push_subscriptions for delete to authenticated using (auth.uid() = user_id);

-- Settings: everyone reads, anyone can update (all 3 users are trusted)
create policy "settings_select" on public.app_settings for select to authenticated using (true);
create policy "settings_update" on public.app_settings for update to authenticated using (true);
