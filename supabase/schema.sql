-- Event Photo Sharing database setup.
-- Matches the tables first created in the Supabase dashboard and adds what the app needs.
-- Run it in the Supabase dashboard (SQL Editor > New query > paste > Run).
-- It is safe to run again; it skips things that already exist.

-- Events ------------------------------------------------------------------

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Code guests use to find the event, e.g. in the share link
  event_code text not null unique,
  created_at timestamptz default now()
);

-- Photos ------------------------------------------------------------------

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  -- Path of the file inside the event-photos bucket, e.g. "<event id>/<photo id>.jpg"
  photo_path text not null,
  -- Set only if the uploader is logged in. Guests upload without an account.
  uploaded_by uuid references auth.users (id),
  uploaded_at timestamptz default now()
);

-- Optional display name for guests who upload without an account.
alter table public.photos
  add column if not exists uploader_name text
  check (char_length(uploader_name) <= 100);

-- One database row per stored file.
create unique index if not exists photos_photo_path_key
  on public.photos (photo_path);

-- The gallery loads one event's photos, newest first.
create index if not exists photos_event_id_uploaded_at_idx
  on public.photos (event_id, uploaded_at desc);

-- Access rules (row-level security) ---------------------------------------
-- Guests using the publishable key can read events and photos but cannot
-- change them. The backend writes with the secret key, which bypasses these rules.
-- Realtime also uses these rules: without a read rule, guests get no live updates.

alter table public.events enable row level security;
alter table public.photos enable row level security;

grant select on public.events, public.photos to anon, authenticated;

-- The backend's secret key acts as service_role and needs full access to these tables.
grant select, insert, update, delete on public.events, public.photos to service_role;

drop policy if exists "Anyone can view events" on public.events;
create policy "Anyone can view events"
  on public.events for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can view photos" on public.photos;
create policy "Anyone can view photos"
  on public.photos for select
  to anon, authenticated
  using (true);

-- Realtime ----------------------------------------------------------------
-- Send new photo rows to gallery pages as they are inserted.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'photos'
  ) then
    alter publication supabase_realtime add table public.photos;
  end if;
end
$$;

-- Storage -----------------------------------------------------------------
-- Private bucket: the backend hands out one-time upload links and signed
-- viewing links, so no storage policies are needed for guests.
-- An existing bucket keeps its public/private setting; only the limits are updated.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-photos',
  'event-photos',
  false,
  20971520, -- 20 MB per photo
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
