begin;
create extension if not exists pgcrypto;

create type public.mission_status as enum ('draft','prepared','awaiting_approval','approved','rejected','executing','completed','failed','cancelled','expired');
create type public.risk_level as enum ('low','medium','high','critical');
create type public.approval_status as enum ('awaiting_approval','approved','rejected','expired','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) between 2 and 80),
  preferred_language text not null default 'en' check (preferred_language in ('en','ko')),
  timezone text not null default 'Asia/Seoul' check (char_length(timezone) <= 64),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table public.user_preferences (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (char_length(category) <= 40), preference_key text not null check (char_length(preference_key) <= 80),
  preference_value jsonb not null check (pg_column_size(preference_value) <= 8192), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_id,category,preference_key)
);
create table public.missions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  mission_type text not null check (mission_type in ('travel','shopping','tutor','business','general')), title text not null check (char_length(title) between 1 and 160),
  original_request text not null check (char_length(original_request) between 1 and 4000), normalized_request text check (char_length(normalized_request) <= 4000),
  status public.mission_status not null default 'draft', risk_level public.risk_level not null default 'low', metadata jsonb not null default '{}'::jsonb check (pg_column_size(metadata) <= 32768),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), completed_at timestamptz, deleted_at timestamptz
);
create table public.mission_steps (
  id uuid primary key default gen_random_uuid(), mission_id uuid not null references public.missions(id) on delete cascade,
  sequence integer not null check (sequence between 1 and 1000), step_type text not null check (char_length(step_type) <= 60), title text not null check (char_length(title) <= 160),
  description text check (char_length(description) <= 2000), status public.mission_status not null default 'draft', provider text check (char_length(provider) <= 100), result_summary text check (char_length(result_summary) <= 2000),
  metadata jsonb not null default '{}'::jsonb check (pg_column_size(metadata) <= 32768), requires_approval boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(mission_id,sequence)
);
create table public.mission_results (
  id uuid primary key default gen_random_uuid(), mission_id uuid not null references public.missions(id) on delete cascade,
  mission_step_id uuid references public.mission_steps(id) on delete cascade, result_type text not null check (char_length(result_type) <= 60),
  structured_data jsonb not null check (pg_column_size(structured_data) <= 131072), source_reference text check (char_length(source_reference) <= 500), created_at timestamptz not null default now(), expires_at timestamptz
);
create table public.approval_requests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade, mission_step_id uuid references public.mission_steps(id) on delete cascade,
  action_type text not null check (action_type in ('payment','purchase','booking','reservation','transfer','external_message','legal_submission','government_submission','contract_acceptance','account_change','external_delete','sensitive_data_share')),
  action_description text not null check (char_length(action_description) between 1 and 2000), protected_action_reference text not null check (char_length(protected_action_reference) <= 500),
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'), provider text check (char_length(provider) <= 100), amount numeric(14,2) check (amount >= 0), currency char(3), cancellation_terms text check (char_length(cancellation_terms) <= 2000),
  risk_level public.risk_level not null, status public.approval_status not null default 'awaiting_approval', requested_at timestamptz not null default now(), expires_at timestamptz not null, decided_at timestamptz, consumed_at timestamptz,
  check (expires_at > requested_at)
);
create table public.approval_decisions (
  id uuid primary key default gen_random_uuid(), approval_request_id uuid not null references public.approval_requests(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade, decision text not null check (decision in ('approved','rejected')), confirmation_method text not null check (confirmation_method in ('explicit_button','reauthenticated')),
  expected_payload_hash text not null check (expected_payload_hash ~ '^[a-f0-9]{64}$'), decision_context jsonb not null default '{}'::jsonb check (pg_column_size(decision_context) <= 8192), created_at timestamptz not null default now(), unique(approval_request_id)
);
create table public.consent_records (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (consent_type in ('analytics','preferences','marketing','profile_memory','provider_sharing')), policy_version text not null check (char_length(policy_version) <= 40),
  granted boolean not null, granted_at timestamptz, revoked_at timestamptz, metadata jsonb not null default '{}'::jsonb check (pg_column_size(metadata) <= 4096), created_at timestamptz not null default now()
);
create table public.provider_connections (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (char_length(provider) <= 100), external_account_reference text check (char_length(external_account_reference) <= 255), secret_manager_reference text check (char_length(secret_manager_reference) <= 500),
  scopes text[] not null default '{}', status text not null default 'pending' check (status in ('pending','connected','disabled','revoked','error')), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), revoked_at timestamptz, unique(user_id,provider)
);
create table public.audit_events (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete set null, actor_type text not null check (actor_type in ('user','system','founder','provider')),
  event_type text not null check (char_length(event_type) <= 100), entity_type text check (char_length(entity_type) <= 80), entity_id uuid, correlation_id text check (char_length(correlation_id) <= 128), privacy_safe_metadata jsonb not null default '{}'::jsonb check (pg_column_size(privacy_safe_metadata) <= 8192), created_at timestamptz not null default now()
);
create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, status text not null default 'pending_confirmation' check(status in ('pending_confirmation','confirmed','processing','completed','cancelled')), requested_at timestamptz not null default now(), confirmed_at timestamptz, completed_at timestamptz
);
create table public.idempotency_keys (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, approval_request_id uuid not null references public.approval_requests(id) on delete cascade,
  idempotency_key text not null check(char_length(idempotency_key) between 16 and 128), request_hash text not null check(request_hash ~ '^[a-f0-9]{64}$'), response_reference text, created_at timestamptz not null default now(), expires_at timestamptz not null, unique(user_id,idempotency_key)
);

create index missions_user_created_idx on public.missions(user_id,created_at desc) where deleted_at is null;
create index mission_steps_mission_sequence_idx on public.mission_steps(mission_id,sequence);
create index mission_results_mission_idx on public.mission_results(mission_id,created_at desc);
create index approvals_user_status_idx on public.approval_requests(user_id,status,requested_at desc);
create index audit_events_entity_idx on public.audit_events(entity_type,entity_id,created_at desc);

create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at=now(); return new; end $$;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger preferences_updated before update on public.user_preferences for each row execute function public.set_updated_at();
create trigger missions_updated before update on public.missions for each row execute function public.set_updated_at();
create trigger steps_updated before update on public.mission_steps for each row execute function public.set_updated_at();
create trigger connections_updated before update on public.provider_connections for each row execute function public.set_updated_at();
create function public.create_profile_for_user() returns trigger language plpgsql security definer set search_path = '' as $$ begin insert into public.profiles(id,display_name,preferred_language) values(new.id,coalesce(new.raw_user_meta_data->>'display_name','Kastiz user'),coalesce(new.raw_user_meta_data->>'preferred_language','en')); return new; end $$;
create trigger auth_user_profile after insert on auth.users for each row execute function public.create_profile_for_user();

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.missions enable row level security;
alter table public.mission_steps enable row level security;
alter table public.mission_results enable row level security;
alter table public.approval_requests enable row level security;
alter table public.approval_decisions enable row level security;
alter table public.consent_records enable row level security;
alter table public.provider_connections enable row level security;
alter table public.audit_events enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.idempotency_keys enable row level security;

create policy profile_owner_all on public.profiles for all using(id=auth.uid()) with check(id=auth.uid());
create policy preference_owner_all on public.user_preferences for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy mission_owner_all on public.missions for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy step_owner_select on public.mission_steps for select using(exists(select 1 from public.missions m where m.id=mission_id and m.user_id=auth.uid()));
create policy step_owner_insert on public.mission_steps for insert with check(exists(select 1 from public.missions m where m.id=mission_id and m.user_id=auth.uid()));
create policy step_owner_update on public.mission_steps for update using(exists(select 1 from public.missions m where m.id=mission_id and m.user_id=auth.uid())) with check(exists(select 1 from public.missions m where m.id=mission_id and m.user_id=auth.uid()));
create policy result_owner_select on public.mission_results for select using(exists(select 1 from public.missions m where m.id=mission_id and m.user_id=auth.uid()));
create policy approval_owner_select on public.approval_requests for select using(user_id=auth.uid());
create policy decision_owner_select on public.approval_decisions for select using(user_id=auth.uid());
create policy consent_owner_all on public.consent_records for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy connection_owner_select on public.provider_connections for select using(user_id=auth.uid());
create policy connection_owner_update on public.provider_connections for update using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy audit_owner_select on public.audit_events for select using(user_id=auth.uid());
create policy deletion_owner_insert on public.account_deletion_requests for insert with check(user_id=auth.uid());
create policy deletion_owner_select on public.account_deletion_requests for select using(user_id=auth.uid());
create policy idempotency_owner_select on public.idempotency_keys for select using(user_id=auth.uid());

revoke all on public.audit_events from authenticated;
grant select on public.audit_events to authenticated;
revoke insert, update, delete on public.approval_requests from authenticated;
revoke insert, update, delete on public.approval_decisions from authenticated;
commit;
