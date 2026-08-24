-- V3: server-enforced test-cycle membership, per-cycle TTL authority, and three report outcomes.
-- This migration keeps direct browser access denied; the verified backend remains the only writer.

alter type public.user_role add value if not exists 'community_manager';

alter table public.bug_reports drop constraint if exists duplicate_requires_reference_and_reason;
alter table public.bug_reports drop constraint if exists duplicate_cannot_self_reference;
alter table public.bug_reports drop constraint if exists rejection_requires_reason;

alter type public.bug_status rename to bug_status_legacy;
create type public.bug_status as enum ('pending', 'accepted', 'rejected');

alter table public.bug_reports alter column status drop default;
alter table public.bug_reports
  alter column status type public.bug_status
  using (
    case status::text
      when 'approved' then 'accepted'::public.bug_status
      when 'rejected' then 'rejected'::public.bug_status
      when 'duplicate' then 'rejected'::public.bug_status
      else 'pending'::public.bug_status
    end
  );
alter table public.bug_reports alter column status set default 'pending'::public.bug_status;
drop type public.bug_status_legacy;

alter table public.bug_reports add constraint bug_report_rejection_requires_reason
  check (status::text <> 'rejected' or char_length(trim(coalesce(rejection_reason, ''))) >= 12);
alter table public.bug_reports rename column triaged_by to reviewed_by;
alter table public.bug_reports rename column triaged_at to reviewed_at;
alter table public.bug_reports drop column if exists client_decided_at;
alter table public.bug_reports drop column if exists duplicate_of_id;
alter table public.bug_reports drop column if exists duplicate_reason;

create type public.application_status as enum ('pending', 'accepted', 'rejected');
create type public.invitation_status as enum ('pending', 'applied', 'expired');
create type public.report_event_type as enum ('submitted', 'information_requested', 'accepted', 'rejected');

create table public.test_cycle_applications (
  id uuid primary key default gen_random_uuid(),
  test_cycle_id uuid not null references public.test_cycles(id) on delete cascade,
  tester_id uuid not null references public.profiles(id) on delete restrict,
  status public.application_status not null default 'pending',
  applied_at timestamptz not null default now(),
  decided_by uuid references public.profiles(id) on delete restrict,
  decided_at timestamptz,
  decision_reason text,
  unique (test_cycle_id, tester_id),
  constraint application_rejection_requires_reason check (
    status <> 'rejected' or char_length(trim(coalesce(decision_reason, ''))) >= 12
  )
);

create table public.test_cycle_invitations (
  id uuid primary key default gen_random_uuid(),
  test_cycle_id uuid not null references public.test_cycles(id) on delete cascade,
  tester_id uuid not null references public.profiles(id) on delete restrict,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  status public.invitation_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (test_cycle_id, tester_id)
);

create table public.test_cycle_ttls (
  id uuid primary key default gen_random_uuid(),
  test_cycle_id uuid not null references public.test_cycles(id) on delete cascade,
  tester_id uuid not null references public.profiles(id) on delete restrict,
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (test_cycle_id, tester_id)
);

create table public.bug_report_events (
  id uuid primary key default gen_random_uuid(),
  bug_report_id uuid not null references public.bug_reports(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  type public.report_event_type not null,
  message text,
  created_at timestamptz not null default now()
);

create index test_cycle_applications_tester_status_idx on public.test_cycle_applications(tester_id, status);
create index test_cycle_applications_cycle_status_idx on public.test_cycle_applications(test_cycle_id, status);
create index test_cycle_invitations_tester_status_idx on public.test_cycle_invitations(tester_id, status);
create index test_cycle_invitations_cycle_idx on public.test_cycle_invitations(test_cycle_id);
create index test_cycle_ttls_tester_active_idx on public.test_cycle_ttls(tester_id) where revoked_at is null;
create index test_cycle_ttls_cycle_active_idx on public.test_cycle_ttls(test_cycle_id) where revoked_at is null;
create index bug_report_events_report_created_idx on public.bug_report_events(bug_report_id, created_at);

alter table public.test_cycle_applications enable row level security;
alter table public.test_cycle_invitations enable row level security;
alter table public.test_cycle_ttls enable row level security;
alter table public.bug_report_events enable row level security;

create policy test_cycle_applications_backend_only on public.test_cycle_applications as restrictive for all to anon, authenticated using (false) with check (false);
create policy test_cycle_invitations_backend_only on public.test_cycle_invitations as restrictive for all to anon, authenticated using (false) with check (false);
create policy test_cycle_ttls_backend_only on public.test_cycle_ttls as restrictive for all to anon, authenticated using (false) with check (false);
create policy bug_report_events_backend_only on public.bug_report_events as restrictive for all to anon, authenticated using (false) with check (false);
