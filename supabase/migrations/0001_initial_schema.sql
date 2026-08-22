-- Mizan Al Jawda / Crowd Testing Platform
-- Apply with the Supabase SQL editor or Supabase CLI to an empty target project.

create extension if not exists pgcrypto;

create type public.user_role as enum ('user', 'tester', 'client', 'admin');
create type public.payout_method as enum ('instapay', 'vodafone_cash', 'paypal', 'bank_transfer');
create type public.device_kind as enum ('mobile', 'desktop', 'tablet');
create type public.operating_system as enum ('android', 'ios', 'windows', 'macos', 'linux');
create type public.cycle_status as enum ('draft', 'active', 'in_review', 'completed');
create type public.bug_category as enum ('functional', 'ui', 'performance', 'crash');
create type public.severity_level as enum ('critical', 'major', 'minor');
create type public.bug_status as enum ('submitted', 'under_review', 'request_changes', 'triaged', 'approved', 'rejected', 'duplicate');
create type public.transaction_type as enum ('bounty_pending', 'bounty_released', 'payout_debit', 'payout_reversal');
create type public.payout_status as enum ('pending', 'processed', 'rejected');
create type public.notification_type as enum ('bug_status', 'payout', 'system');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email varchar(320),
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tester_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  country varchar(80),
  phone_number varchar(32),
  payout_method public.payout_method,
  payout_details text,
  reputation_score integer not null default 0,
  completed_at timestamptz
);

create table public.tester_devices (
  id uuid primary key default gen_random_uuid(),
  tester_id uuid not null references public.profiles(id) on delete cascade,
  device_type public.device_kind not null,
  brand_model varchar(180) not null,
  os_name public.operating_system not null,
  os_version varchar(60) not null,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete restrict,
  name varchar(180) not null,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.test_cycles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title varchar(180) not null,
  scope_description text not null,
  out_of_scope text,
  build_url varchar(2048) not null,
  status public.cycle_status not null default 'draft',
  start_at timestamptz not null,
  end_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint test_cycle_dates_valid check (end_at > start_at)
);

create table public.cycle_bounty_rates (
  id uuid primary key default gen_random_uuid(),
  test_cycle_id uuid not null references public.test_cycles(id) on delete cascade,
  severity public.severity_level not null,
  bounty_amount numeric(12,2) not null check (bounty_amount > 0),
  unique (test_cycle_id, severity)
);

create table public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  test_cycle_id uuid not null references public.test_cycles(id) on delete restrict,
  tester_id uuid not null references public.profiles(id) on delete restrict,
  device_id uuid not null references public.tester_devices(id) on delete restrict,
  title varchar(240) not null,
  category public.bug_category not null,
  severity public.severity_level not null,
  steps_to_reproduce text not null,
  expected_result text not null,
  actual_result text not null,
  status public.bug_status not null default 'submitted',
  duplicate_of_id uuid references public.bug_reports(id) on delete restrict,
  duplicate_reason text,
  rejection_reason text,
  request_changes_reason text,
  triaged_by uuid references public.profiles(id) on delete restrict,
  triaged_at timestamptz,
  client_decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint duplicate_requires_reference_and_reason check (
    status <> 'duplicate' or (duplicate_of_id is not null and char_length(trim(coalesce(duplicate_reason, ''))) >= 12)
  ),
  constraint rejection_requires_reason check (
    status <> 'rejected' or char_length(trim(coalesce(rejection_reason, ''))) >= 12
  ),
  constraint duplicate_cannot_self_reference check (duplicate_of_id is null or duplicate_of_id <> id)
);

create table public.bug_attachments (
  id uuid primary key default gen_random_uuid(),
  bug_report_id uuid references public.bug_reports(id) on delete cascade,
  file_key varchar(512) not null unique,
  original_name varchar(255) not null,
  mime_type varchar(120) not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  available_balance numeric(12,2) not null default 0.00 check (available_balance >= 0),
  pending_balance numeric(12,2) not null default 0.00 check (pending_balance >= 0),
  updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete restrict,
  amount numeric(12,2) not null,
  type public.transaction_type not null,
  reference_type varchar(60) not null,
  reference_id uuid not null,
  note varchar(255),
  created_at timestamptz not null default now()
);

create table public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  tester_id uuid not null references public.profiles(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  method public.payout_method not null,
  payment_target_info varchar(300) not null,
  status public.payout_status not null default 'pending',
  processing_note text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

create table public.reputation_events (
  id uuid primary key default gen_random_uuid(),
  tester_id uuid not null references public.profiles(id) on delete restrict,
  bug_report_id uuid references public.bug_reports(id) on delete set null,
  points integer not null,
  reason varchar(180) not null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title varchar(180) not null,
  body text not null,
  entity_type varchar(60),
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index tester_devices_tester_id_idx on public.tester_devices(tester_id);
create index projects_client_id_idx on public.projects(client_id);
create index test_cycles_project_id_idx on public.test_cycles(project_id);
create index test_cycles_status_idx on public.test_cycles(status);
create index bug_reports_tester_id_idx on public.bug_reports(tester_id);
create index bug_reports_cycle_id_idx on public.bug_reports(test_cycle_id);
create index bug_reports_status_idx on public.bug_reports(status);
create index bug_attachments_report_id_idx on public.bug_attachments(bug_report_id);
create index bug_attachments_uploader_idx on public.bug_attachments(uploaded_by);
create index transactions_wallet_id_idx on public.transactions(wallet_id);
create index payout_requests_tester_id_idx on public.payout_requests(tester_id);
create index payout_requests_status_idx on public.payout_requests(status);
create index reputation_events_tester_id_idx on public.reputation_events(tester_id);
create index notifications_user_read_idx on public.notifications(user_id, read_at);

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger bug_reports_set_updated_at before update on public.bug_reports for each row execute function public.set_updated_at();
create trigger wallets_set_updated_at before update on public.wallets for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, nullif(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do update set email = excluded.email, name = coalesce(excluded.name, public.profiles.name);
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- The browser never reads or writes application data directly. All workflows use
-- the server with a service-role client after it verifies the Supabase user token.
alter table public.profiles enable row level security;
alter table public.tester_profiles enable row level security;
alter table public.tester_devices enable row level security;
alter table public.projects enable row level security;
alter table public.test_cycles enable row level security;
alter table public.cycle_bounty_rates enable row level security;
alter table public.bug_reports enable row level security;
alter table public.bug_attachments enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.payout_requests enable row level security;
alter table public.reputation_events enable row level security;
alter table public.notifications enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bug-evidence', 'bug-evidence', false, 10485760, array['image/png', 'image/jpeg', 'video/mp4', 'text/plain', 'application/zip'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = excluded.allowed_mime_types;

-- No storage.objects policies are intentionally created: browser access is denied
-- by default and the backend issues short-lived signed URLs after authorization.
