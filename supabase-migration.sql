-- ============================================================
-- ANGAY: Profiles table with geocoordinates
-- Run this in your Supabase SQL Editor
-- ============================================================

create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  role        text        not null,
  full_name   text,
  org_name    text,
  address     text,
  latitude    float8,
  longitude   float8,
  contact     text,
  hours       text,
  file_url    text,
  created_at  timestamptz default now()
);

-- Row-Level Security
alter table public.profiles enable row level security;

-- Any authenticated user can read all profiles (needed for the map)
create policy "Profiles viewable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- Users can only insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can only update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);
