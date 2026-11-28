-- Preserve existing verified memberships while matching attendance by event and email.
begin;

alter table public.participants add column email text;
update public.participants p
set email = lower(btrim(u.email))
from auth.users u
where u.id = p.auth_user_id and u.email is not null and btrim(u.email) <> '';

do $$
begin
  if exists (select 1 from public.participants where email is null) then
    raise exception 'Cannot migrate attendance: a participant has no Auth email';
  end if;
end;
$$;
alter table public.participants alter column email set not null;
alter table public.participants alter column auth_user_id drop not null;
alter table public.participants
  add constraint participants_normalized_email check (email = lower(btrim(email)) and email <> ''),
  add constraint participants_event_email_key unique (event_id, email);

create table public.participant_sessions (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  participant_id uuid not null,
  event_id uuid not null,
  foreign key (participant_id, event_id) references public.participants(id, event_id) on delete cascade
);
alter table public.participant_sessions enable row level security;
revoke all on public.participant_sessions from public, anon, authenticated;
grant select, insert, delete on public.participant_sessions to service_role;

create function public.join_event_guest(p_event_id uuid, p_auth_user_id uuid, p_email text, p_name text)
returns public.participants
language plpgsql
as $$
declare
  participant public.participants;
begin
  insert into public.participants(event_id, email, name)
  values (p_event_id, p_email, p_name)
  on conflict (event_id, email) do update set email = excluded.email
  returning * into participant;

  insert into public.participant_sessions(auth_user_id, participant_id, event_id)
  values (p_auth_user_id, participant.id, p_event_id);
  return participant;
end;
$$;
revoke execute on function public.join_event_guest(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.join_event_guest(uuid, uuid, text, text) to service_role;

commit;
