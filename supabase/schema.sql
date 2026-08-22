-- ============================================================================
-- OUR MEMORIES — Private Couple Album — Database Schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. profiles
-- One row per authorized account. Only two rows should ever exist — this is
-- enforced by application/setup process (see README "Configure the two
-- accounts"), not by a hard DB constraint, so the admin retains flexibility
-- during setup/offboarding.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default 'Partner',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. media
-- ---------------------------------------------------------------------------
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  thumbnail_path text,
  file_name text not null,
  media_type text not null check (media_type in ('photo', 'video', 'collage')),
  mime_type text not null,
  file_size bigint not null check (file_size >= 0),
  width int,
  height int,
  caption text,
  taken_at timestamptz,
  uploaded_at timestamptz not null default now(),
  is_favorite boolean not null default false,
  is_archived boolean not null default false,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_taken_at_idx on public.media (taken_at desc);
create index if not exists media_uploaded_at_idx on public.media (uploaded_at desc);
create index if not exists media_owner_idx on public.media (owner_id);
create index if not exists media_favorite_idx on public.media (is_favorite) where is_favorite = true;
create index if not exists media_deleted_idx on public.media (is_deleted) where is_deleted = true;
create index if not exists media_archived_idx on public.media (is_archived) where is_archived = true;
create index if not exists media_caption_trgm_idx on public.media using gin (to_tsvector('english', coalesce(caption, '') || ' ' || file_name));

-- ---------------------------------------------------------------------------
-- 3. albums
-- ---------------------------------------------------------------------------
create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_media_id uuid references public.media(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.album_media (
  album_id uuid not null references public.albums(id) on delete cascade,
  media_id uuid not null references public.media(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (album_id, media_id)
);

-- ---------------------------------------------------------------------------
-- 4. collections
-- ---------------------------------------------------------------------------
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_media_id uuid references public.media(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_media (
  collection_id uuid not null references public.collections(id) on delete cascade,
  media_id uuid not null references public.media(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, media_id)
);

-- ---------------------------------------------------------------------------
-- 5. collages
-- ---------------------------------------------------------------------------
create table if not exists public.collages (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  media_id uuid references public.media(id) on delete cascade, -- the rendered collage image lives in `media`
  layout text not null,
  metadata jsonb not null default '{}'::jsonb, -- source media ids, positions, text overlays
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. reminders + app_settings (single shared row for the couple)
-- ---------------------------------------------------------------------------
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  reminder_type text not null default 'monthsary',
  reminder_day int not null default 22 check (reminder_day between 1 and 28),
  reminder_time time not null default '09:00',
  enabled boolean not null default true,
  message text not null default 'Happy Monthsary! Another month of memories together.',
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id int primary key default 1 check (id = 1), -- singleton row
  relationship_start_date date,
  monthsary_day int not null default 22 check (monthsary_day between 1 and 28),
  notification_settings jsonb not null default '{"browser": false, "in_app": true}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id) values (1) on conflict (id) do nothing;
insert into public.reminders (reminder_type) select 'monthsary'
  where not exists (select 1 from public.reminders where reminder_type = 'monthsary');

-- ---------------------------------------------------------------------------
-- 7. updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_media_updated_at on public.media;
create trigger trg_media_updated_at before update on public.media
  for each row execute function public.set_updated_at();

drop trigger if exists trg_albums_updated_at on public.albums;
create trigger trg_albums_updated_at before update on public.albums
  for each row execute function public.set_updated_at();

drop trigger if exists trg_collections_updated_at on public.collections;
create trigger trg_collections_updated_at before update on public.collections
  for each row execute function public.set_updated_at();

drop trigger if exists trg_app_settings_updated_at on public.app_settings;
create trigger trg_app_settings_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();

-- auto-create a profile row whenever a new auth user is created (setup step
-- creates exactly two users; see README)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
-- Model: any authenticated user who has a row in `profiles` is one of the
-- two authorized partners and gets full shared access. Nobody else — not
-- even a signed-in user without a profiles row — can read or write anything.
-- ============================================================================

create or replace function public.is_authorized_partner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.media enable row level security;
alter table public.albums enable row level security;
alter table public.album_media enable row level security;
alter table public.collections enable row level security;
alter table public.collection_media enable row level security;
alter table public.collages enable row level security;
alter table public.reminders enable row level security;
alter table public.app_settings enable row level security;

-- profiles: any authorized partner can see both profiles (needed to show
-- "who uploaded this"); a user may only update their own row.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (public.is_authorized_partner());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update
  using (id = auth.uid() and public.is_authorized_partner());

-- media: shared full access between both partners, zero access otherwise
drop policy if exists "media_select" on public.media;
create policy "media_select" on public.media for select
  using (public.is_authorized_partner());

drop policy if exists "media_insert" on public.media;
create policy "media_insert" on public.media for insert
  with check (public.is_authorized_partner() and owner_id = auth.uid());

drop policy if exists "media_update" on public.media;
create policy "media_update" on public.media for update
  using (public.is_authorized_partner());

drop policy if exists "media_delete" on public.media;
create policy "media_delete" on public.media for delete
  using (public.is_authorized_partner());

-- albums
drop policy if exists "albums_all" on public.albums;
create policy "albums_select" on public.albums for select using (public.is_authorized_partner());
create policy "albums_insert" on public.albums for insert with check (public.is_authorized_partner() and created_by = auth.uid());
create policy "albums_update" on public.albums for update using (public.is_authorized_partner());
create policy "albums_delete" on public.albums for delete using (public.is_authorized_partner());

drop policy if exists "album_media_all" on public.album_media;
create policy "album_media_select" on public.album_media for select using (public.is_authorized_partner());
create policy "album_media_insert" on public.album_media for insert with check (public.is_authorized_partner());
create policy "album_media_delete" on public.album_media for delete using (public.is_authorized_partner());

-- collections
create policy "collections_select" on public.collections for select using (public.is_authorized_partner());
create policy "collections_insert" on public.collections for insert with check (public.is_authorized_partner() and created_by = auth.uid());
create policy "collections_update" on public.collections for update using (public.is_authorized_partner());
create policy "collections_delete" on public.collections for delete using (public.is_authorized_partner());

create policy "collection_media_select" on public.collection_media for select using (public.is_authorized_partner());
create policy "collection_media_insert" on public.collection_media for insert with check (public.is_authorized_partner());
create policy "collection_media_delete" on public.collection_media for delete using (public.is_authorized_partner());

-- collages
create policy "collages_select" on public.collages for select using (public.is_authorized_partner());
create policy "collages_insert" on public.collages for insert with check (public.is_authorized_partner() and created_by = auth.uid());
create policy "collages_update" on public.collages for update using (public.is_authorized_partner());
create policy "collages_delete" on public.collages for delete using (public.is_authorized_partner());

-- reminders + app_settings: shared, read/write by either partner only
create policy "reminders_select" on public.reminders for select using (public.is_authorized_partner());
create policy "reminders_update" on public.reminders for update using (public.is_authorized_partner());

create policy "app_settings_select" on public.app_settings for select using (public.is_authorized_partner());
create policy "app_settings_update" on public.app_settings for update using (public.is_authorized_partner());

-- ============================================================================
-- STORAGE — private bucket + policies
-- Run once. The bucket is created NOT public, so files are only reachable
-- via signed URLs issued to authenticated, authorized users.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('couple-media', 'couple-media', false)
on conflict (id) do update set public = false;

drop policy if exists "couple_media_select" on storage.objects;
create policy "couple_media_select" on storage.objects for select
  using (bucket_id = 'couple-media' and public.is_authorized_partner());

drop policy if exists "couple_media_insert" on storage.objects;
create policy "couple_media_insert" on storage.objects for insert
  with check (bucket_id = 'couple-media' and public.is_authorized_partner());

drop policy if exists "couple_media_update" on storage.objects;
create policy "couple_media_update" on storage.objects for update
  using (bucket_id = 'couple-media' and public.is_authorized_partner());

drop policy if exists "couple_media_delete" on storage.objects;
create policy "couple_media_delete" on storage.objects for delete
  using (bucket_id = 'couple-media' and public.is_authorized_partner());

-- ============================================================================
-- Done. Next: create exactly two auth users (see README), then confirm
-- each got a row in public.profiles automatically via the trigger above.
-- ============================================================================
