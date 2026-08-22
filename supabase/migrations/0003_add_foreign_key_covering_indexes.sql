-- Cover the foreign keys reported by the Supabase performance advisor.
-- These indexes support relationship lookups and restrictive deletes without
-- changing application behavior or exposing any application data.

create index if not exists bug_reports_device_id_idx
  on public.bug_reports(device_id);

create index if not exists bug_reports_duplicate_of_id_idx
  on public.bug_reports(duplicate_of_id);

create index if not exists bug_reports_triaged_by_idx
  on public.bug_reports(triaged_by);

create index if not exists reputation_events_bug_report_id_idx
  on public.reputation_events(bug_report_id);
