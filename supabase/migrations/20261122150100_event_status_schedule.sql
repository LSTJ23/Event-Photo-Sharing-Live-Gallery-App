-- Keep event statuses in sync with the clock.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'event-gallery-refresh-event-statuses',
  '* * * * *',
  'select public.refresh_event_statuses();'
);
