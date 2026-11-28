-- Legacy records for the guest attendance migration test; disposable databases only.
insert into auth.users(id, email) values
  ('00000000-0000-0000-0000-000000000001', 'staff@example.test'),
  ('00000000-0000-0000-0000-000000000002', ' Existing@Example.Test ');
insert into public.staff_users(id, email, full_name)
  values ('00000000-0000-0000-0000-000000000001', 'staff@example.test', 'Staff');
insert into public.events(id, organizer_id, name, location, start_at, end_at, photo_capacity)
  values ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
    'Legacy event', 'Venue', now(), now() + interval '1 hour', 10);
insert into public.participants(id, event_id, auth_user_id, name)
  values ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002', 'Legacy participant');
