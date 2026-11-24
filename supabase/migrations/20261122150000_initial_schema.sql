-- Initial schema migration. Apply through the Supabase CLI migration workflow.
-- Do not run this file directly against an existing application database.
-- Photos are stored in the event-photos bucket; only their paths are stored here.
begin;

create type public.user_role as enum ('admin', 'organizer');
create type public.event_status as enum ('upcoming', 'ongoing', 'ended');
create type public.photo_status as enum ('visible', 'hidden', 'removed');
create type public.report_status as enum ('pending', 'resolved', 'dismissed');
create type public.report_reason as enum ('inappropriate', 'offensive', 'spam', 'privacy', 'other');

create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Staff and participants both use Supabase Auth. Auth is the source of truth
-- for email; the staff email here is a display/search copy.
create table public.staff_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  organization_name text,
  role public.user_role not null default 'organizer',
  is_active boolean not null default true,
  must_change_password boolean not null default true,
  created_by uuid references public.staff_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index staff_users_email_key on public.staff_users (lower(email));
create trigger trg_staff_updated before update on public.staff_users
  for each row execute function public.set_updated_at();

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.staff_users(id) on delete restrict,
  name text not null,
  location text not null,
  hashtag text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status public.event_status not null default 'upcoming',
  photo_capacity integer not null check (photo_capacity > 0),
  share_slug text not null unique default replace(gen_random_uuid()::text, '-', ''),
  share_link_active boolean not null default true,
  qr_code_path text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);
create index idx_events_organizer on public.events(organizer_id);
create index idx_events_status on public.events(status) where archived_at is null;
create trigger trg_events_updated before update on public.events
  for each row execute function public.set_updated_at();

-- Call from a trusted scheduled job; this script does not schedule it.
create function public.refresh_event_statuses() returns void
language sql as $$
  update public.events
  set status = case
        when now() < start_at then 'upcoming'::public.event_status
        when now() <= end_at then 'ongoing'::public.event_status
        else 'ended'::public.event_status
      end
  where archived_at is null
    and status is distinct from case
        when now() < start_at then 'upcoming'::public.event_status
        when now() <= end_at then 'ongoing'::public.event_status
        else 'ended'::public.event_status
      end;
$$;

-- A participant has one membership per event and a real Auth account.
create table public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete restrict,
  name text not null,
  joined_at timestamptz not null default now(),
  unique (event_id, auth_user_id),
  unique (id, event_id)
);
create index idx_participants_auth_user on public.participants(auth_user_id);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  participant_id uuid not null,
  is_anonymous boolean not null default false,
  storage_path text not null unique,
  mime_type text,
  file_size_bytes integer check (file_size_bytes > 0),
  width integer check (width > 0),
  height integer check (height > 0),
  like_count integer not null default 0 check (like_count >= 0),
  status public.photo_status not null default 'visible',
  uploaded_at timestamptz not null default now(),
  foreign key (participant_id, event_id)
    references public.participants(id, event_id) on delete cascade,
  unique (id, event_id)
);
create index idx_photos_gallery on public.photos(event_id, uploaded_at desc)
  where status = 'visible';
create index idx_photos_participant on public.photos(participant_id);

-- Lock the event before counting, including when a removed photo is restored.
create function public.enforce_photo_capacity() returns trigger
language plpgsql as $$
declare
  cap integer;
  cnt bigint;
begin
  if new.status = 'removed' then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if old.event_id = new.event_id and old.status <> 'removed' then
      return new;
    end if;
  end if;
  select photo_capacity into cap from public.events where id = new.event_id for update;
  select count(*) into cnt from public.photos
    where event_id = new.event_id and status <> 'removed';
  if cnt >= cap then
    raise exception 'Photo capacity reached for this event';
  end if;
  return new;
end $$;
create trigger trg_photo_capacity before insert or update of event_id, status on public.photos
  for each row execute function public.enforce_photo_capacity();

create function public.check_event_capacity() returns trigger
language plpgsql as $$
begin
  if new.photo_capacity < old.photo_capacity and
    new.photo_capacity < (select count(*) from public.photos
                          where event_id = new.id and status <> 'removed') then
    raise exception 'Photo capacity cannot be lower than the current photo count';
  end if;
  return new;
end $$;
create trigger trg_event_capacity before update of photo_capacity on public.events
  for each row execute function public.check_event_capacity();

create table public.photo_likes (
  photo_id uuid not null,
  participant_id uuid not null,
  event_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (photo_id, participant_id),
  foreign key (photo_id, event_id) references public.photos(id, event_id) on delete cascade,
  foreign key (participant_id, event_id) references public.participants(id, event_id) on delete cascade
);
create index idx_likes_participant on public.photo_likes(participant_id);

create function public.sync_like_count() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' or tg_op = 'UPDATE' then
    update public.photos set like_count = like_count - 1 where id = old.photo_id;
  end if;
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    update public.photos set like_count = like_count + 1 where id = new.photo_id;
  end if;
  return null;
end $$;
create trigger trg_like_count after insert or update of photo_id or delete on public.photo_likes
  for each row execute function public.sync_like_count();

-- One report per photo, with one entry per reporting participant.
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null unique,
  event_id uuid not null,
  status public.report_status not null default 'pending',
  reviewed_by uuid references public.staff_users(id) on delete set null,
  reviewed_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (photo_id, event_id) references public.photos(id, event_id) on delete cascade,
  unique (id, event_id)
);
create index idx_reports_event_status on public.reports(event_id, status);
create trigger trg_reports_updated before update on public.reports
  for each row execute function public.set_updated_at();

create table public.report_entries (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null,
  participant_id uuid not null,
  event_id uuid not null,
  reason public.report_reason not null,
  description text,
  created_at timestamptz not null default now(),
  foreign key (report_id, event_id) references public.reports(id, event_id) on delete cascade,
  foreign key (participant_id, event_id) references public.participants(id, event_id) on delete cascade,
  unique (report_id, participant_id),
  check (reason <> 'other' or (description is not null and description ~ '[^[:space:]]'))
);
create index idx_report_entries_participant on public.report_entries(participant_id);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  staff_id uuid references public.staff_users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_staff on public.audit_logs(staff_id, created_at desc);
create index idx_audit_entity on public.audit_logs(entity_type, entity_id);

create view public.event_stats as
select
  e.id as event_id, e.name, e.organizer_id, e.status, e.photo_capacity,
  (select count(*) from public.participants p where p.event_id = e.id) as participant_count,
  (select count(*) from public.photos ph where ph.event_id = e.id and ph.status <> 'removed') as photo_count
from public.events e;

create view public.top_events_by_participants as
select * from public.event_stats order by participant_count desc, photo_count desc limit 10;

create view public.top_events_by_photos as
select * from public.event_stats order by photo_count desc, participant_count desc limit 10;

create view public.system_stats as
select
  (select count(*) from public.staff_users where role = 'organizer' and is_active) as organizer_count,
  (select count(*) from public.events) as event_count,
  (select count(*) from public.participants) as participant_count,
  (select count(*) from public.photos where status <> 'removed') as photo_count;

-- All application data, including views, is accessed through the trusted backend.
alter table public.staff_users enable row level security;
alter table public.events enable row level security;
alter table public.participants enable row level security;
alter table public.photos enable row level security;
alter table public.photo_likes enable row level security;
alter table public.reports enable row level security;
alter table public.report_entries enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.staff_users, public.events, public.participants, public.photos,
  public.photo_likes, public.reports, public.report_entries, public.audit_logs,
  public.event_stats, public.top_events_by_participants, public.top_events_by_photos,
  public.system_stats from public, anon, authenticated;
grant select, insert, update, delete on public.staff_users, public.events, public.participants,
  public.photos, public.photo_likes, public.reports, public.report_entries, public.audit_logs to service_role;
grant select on public.event_stats, public.top_events_by_participants,
  public.top_events_by_photos, public.system_stats to service_role;
grant usage, select on sequence public.audit_logs_id_seq to service_role;
revoke execute on function public.refresh_event_statuses() from public, anon, authenticated;
grant execute on function public.refresh_event_statuses() to service_role;

-- Keep the existing gallery Realtime publication. RLS still prevents direct
-- anon/authenticated subscriptions from seeing these rows.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'photos'
  ) then
    alter publication supabase_realtime add table public.photos;
  end if;
end $$;

-- Existing buckets retain their visibility; check that it is private.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-photos', 'event-photos', false, 20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

commit;
