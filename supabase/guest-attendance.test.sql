-- Run after the initial schema and the guest attendance migration on a disposable database.
begin;

do $$
#variable_conflict use_variable
declare
  staff_id uuid := gen_random_uuid();
  legacy_id uuid := gen_random_uuid();
  guest_one uuid := gen_random_uuid();
  guest_two uuid := gen_random_uuid();
  other_guest uuid := gen_random_uuid();
  event_id uuid;
  other_event_id uuid;
  participant_id uuid;
  second_id uuid;
  n bigint;
begin
  if not exists (
    select 1 from public.participants
    where id = '00000000-0000-0000-0000-000000000004'
      and email = 'existing@example.test'
      and auth_user_id = '00000000-0000-0000-0000-000000000002'
  ) then raise exception 'Legacy participant email was not migrated'; end if;
  insert into auth.users(id, email) values
    (staff_id, 'test-staff@example.test'), (legacy_id, 'legacy@example.test'),
    (guest_one, null), (guest_two, null), (other_guest, null);
  insert into public.staff_users(id, email, full_name) values (staff_id, 'test-staff@example.test', 'Staff');
  insert into public.events(organizer_id, name, location, start_at, end_at, photo_capacity)
    values (staff_id, 'Event', 'Venue', now(), now() + interval '1 hour', 10)
    returning id into event_id;
  insert into public.events(organizer_id, name, location, start_at, end_at, photo_capacity)
    values (staff_id, 'Other', 'Venue', now(), now() + interval '1 hour', 10)
    returning id into other_event_id;

  insert into public.participants(event_id, auth_user_id, email, name)
    values (event_id, legacy_id, 'legacy@example.test', 'Original') returning id into participant_id;
  select id into second_id from public.join_event_guest(event_id, guest_one, 'legacy@example.test', 'Changed');
  if second_id <> participant_id then raise exception 'Existing attendance was not reused'; end if;
  if (select name from public.participants where id = participant_id) <> 'Original' then
    raise exception 'Re-entry changed the original name';
  end if;
  select id into second_id from public.join_event_guest(event_id, guest_two, 'legacy@example.test', 'Changed');
  if second_id <> participant_id then raise exception 'Second guest created duplicate attendance'; end if;
  select count(*) into n from public.participant_sessions where participant_sessions.participant_id = participant_id;
  if n <> 2 then raise exception 'Guest sessions were not linked'; end if;
  select id into second_id from public.join_event_guest(other_event_id, other_guest, 'legacy@example.test', 'Other');
  if second_id = participant_id then raise exception 'Attendance was shared across events'; end if;
  if has_function_privilege('authenticated', 'public.join_event_guest(uuid,uuid,text,text)', 'execute')
    or has_function_privilege('anon', 'public.join_event_guest(uuid,uuid,text,text)', 'execute') then
    raise exception 'Guest join function is publicly callable';
  end if;
end;
$$;

rollback;
