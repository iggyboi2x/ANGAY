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

drop policy if exists "Profiles viewable by authenticated users" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

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

-- ============================================================
-- ANGAY: Messaging tables and RLS
-- ============================================================

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamptz default now()
);

create table if not exists public.room_members (
  room_id uuid references public.rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (room_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  user_id uuid references auth.users(id) not null,
  content text not null,
  created_at timestamptz default now()
);

-- Realtime for chat messages (safe to rerun)
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;

-- Idempotent policy creation
drop policy if exists "Members can view rooms" on public.rooms;
drop policy if exists "Members can create rooms" on public.rooms;
drop policy if exists "Users can view own room memberships" on public.room_members;
drop policy if exists "Users can add memberships to rooms they belong to" on public.room_members;
drop policy if exists "Members can view messages" on public.messages;
drop policy if exists "Members can insert messages" on public.messages;

-- Rooms: user can only see rooms where they are a member
create policy "Members can view rooms"
on public.rooms for select
using (
  exists (
    select 1
    from public.room_members
    where room_members.room_id = rooms.id
      and room_members.user_id = auth.uid()
  )
);

-- Rooms: authenticated users can create rooms
create policy "Members can create rooms"
on public.rooms for insert
with check (auth.uid() is not null);

-- Room members: user can see their own memberships
create policy "Users can view own room memberships"
on public.room_members for select
using (user_id = auth.uid());

-- Room members: user can add member rows for rooms they are part of.
-- This allows creating both (self + recipient) rows during chat creation.
create policy "Users can add memberships to rooms they belong to"
on public.room_members for insert
with check (
  auth.uid() is not null
  and (
    user_id = auth.uid()
    or exists (
      select 1
      from public.room_members rm
      where rm.room_id = room_members.room_id
        and rm.user_id = auth.uid()
    )
  )
);

-- Messages: user can only read messages in their rooms
create policy "Members can view messages"
on public.messages for select
using (
  exists (
    select 1
    from public.room_members
    where room_members.room_id = messages.room_id
      and room_members.user_id = auth.uid()
  )
);

-- Messages: user can only send messages to rooms they belong to
create policy "Members can insert messages"
on public.messages for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.room_members
    where room_members.room_id = messages.room_id
      and room_members.user_id = auth.uid()
  )
);
