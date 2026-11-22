-- Run only against a disposable PostgreSQL database with the Supabase test
-- stubs and the initial schema migration already loaded. All test rows are rolled back.
begin;

do $$
#variable_conflict use_variable
declare
  staff_id uuid := gen_random_uuid();
  user_id uuid := gen_random_uuid();
  other_user_id uuid := gen_random_uuid();
  event_id uuid;
  other_event_id uuid;
  participant_id uuid;
  other_participant_id uuid;
  photo_id uuid;
  second_photo_id uuid;
  report_id uuid;
  n bigint;
begin
  insert into auth.users(id) values (staff_id), (user_id), (other_user_id);
  insert into public.staff_users(id, email, full_name) values (staff_id, 'staff@example.test', 'Staff');
  insert into public.events(organizer_id, name, location, start_at, end_at, photo_capacity)
    values (staff_id, 'Event', 'Venue', now() - interval '1 hour', now() + interval '1 hour', 1)
    returning id into event_id;
  insert into public.events(organizer_id, name, location, start_at, end_at, photo_capacity)
    values (staff_id, 'Other event', 'Venue', now(), now() + interval '1 hour', 1)
    returning id into other_event_id;
  insert into public.participants(event_id, auth_user_id, name)
    values (event_id, user_id, 'Participant') returning id into participant_id;
  insert into public.participants(event_id, auth_user_id, name)
    values (other_event_id, other_user_id, 'Other') returning id into other_participant_id;

  begin
    insert into public.participants(event_id, auth_user_id, name)
      values (event_id, user_id, 'Duplicate');
    raise exception 'Duplicate event membership was accepted';
  exception when unique_violation then null;
  end;
  begin
    insert into public.participants(event_id, auth_user_id, name)
      values (event_id, gen_random_uuid(), 'Not a user');
    raise exception 'Missing Auth user was accepted';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into public.photos(event_id, participant_id, storage_path)
      values (event_id, other_participant_id, 'wrong-event.jpg');
    raise exception 'Cross-event upload was accepted';
  exception when foreign_key_violation then null;
  end;

  insert into public.photos(event_id, participant_id, storage_path, is_anonymous)
    values (event_id, participant_id, 'anonymous.jpg', true) returning id into photo_id;
  if not exists (select 1 from public.photos ph
                 where ph.id = photo_id and ph.participant_id = participant_id and ph.is_anonymous) then
    raise exception 'Anonymous photo did not retain its participant';
  end if;
  begin
    insert into public.photos(event_id, participant_id, storage_path)
      values (event_id, participant_id, 'over-capacity.jpg');
    raise exception 'Over-capacity upload was accepted';
  exception when raise_exception then
    if sqlerrm <> 'Photo capacity reached for this event' then raise; end if;
  end;
  update public.photos set status = 'removed' where id = photo_id;
  insert into public.photos(event_id, participant_id, storage_path)
    values (event_id, participant_id, 'replacement.jpg') returning id into second_photo_id;
  begin
    update public.photos set status = 'visible' where id = photo_id;
    raise exception 'Over-capacity restoration was accepted';
  exception when raise_exception then
    if sqlerrm <> 'Photo capacity reached for this event' then raise; end if;
  end;
  update public.events set photo_capacity = 2 where id = event_id;
  update public.photos set status = 'visible' where id = photo_id;
  begin
    update public.events set photo_capacity = 1 where id = event_id;
    raise exception 'Capacity reduction below photo count was accepted';
  exception when raise_exception then
    if sqlerrm <> 'Photo capacity cannot be lower than the current photo count' then raise; end if;
  end;

  insert into public.photo_likes(photo_id, participant_id, event_id)
    values (photo_id, participant_id, event_id);
  select like_count into n from public.photos where id = photo_id;
  if n <> 1 then raise exception 'Like count was not incremented'; end if;
  update public.photo_likes set photo_id = second_photo_id
    where photo_likes.photo_id = photo_id and photo_likes.participant_id = participant_id;
  select like_count into n from public.photos where id = photo_id;
  if n <> 0 then raise exception 'Old photo like count was not decremented'; end if;
  select like_count into n from public.photos where id = second_photo_id;
  if n <> 1 then raise exception 'New photo like count was not incremented'; end if;
  delete from public.photo_likes where photo_likes.photo_id = second_photo_id;
  select like_count into n from public.photos where id = second_photo_id;
  if n <> 0 then raise exception 'Like count was not decremented'; end if;
  begin
    insert into public.photo_likes(photo_id, participant_id, event_id)
      values (photo_id, other_participant_id, event_id);
    raise exception 'Cross-event like was accepted';
  exception when foreign_key_violation then null;
  end;

  insert into public.reports(photo_id, event_id) values (photo_id, event_id) returning id into report_id;
  begin
    insert into public.report_entries(report_id, participant_id, event_id, reason)
      values (report_id, participant_id, event_id, 'other');
    raise exception 'Other reason without a description was accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.report_entries(report_id, participant_id, event_id, reason, description)
      values (report_id, participant_id, event_id, 'other', E' \t\n');
    raise exception 'Blank other reason was accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.report_entries(report_id, participant_id, event_id, reason)
      values (report_id, other_participant_id, event_id, 'spam');
    raise exception 'Cross-event report was accepted';
  exception when foreign_key_violation then null;
  end;
  insert into public.report_entries(report_id, participant_id, event_id, reason, description)
    values (report_id, participant_id, event_id, 'other', 'Specific reason');

  select photo_count into n from public.event_stats where event_stats.event_id = event_id;
  if n <> 2 then raise exception 'Event photo count is incorrect'; end if;
  perform public.refresh_event_statuses();
  if (select status from public.events where id = event_id) <> 'ongoing' then
    raise exception 'Event status was not refreshed';
  end if;
  if has_table_privilege('anon', 'public.photos', 'select')
    or has_table_privilege('authenticated', 'public.event_stats', 'select')
    or has_function_privilege('anon', 'public.refresh_event_statuses()', 'execute') then
    raise exception 'Application data or status function is exposed to public clients';
  end if;
  if not has_table_privilege('service_role', 'public.photos', 'insert')
    or not has_table_privilege('service_role', 'public.event_stats', 'select') then
    raise exception 'Backend service role is missing access';
  end if;
end $$;

rollback;
