begin;
alter table public.provider_connections add column if not exists provider_id text;
alter table public.provider_connections add column if not exists provider_category text;
alter table public.provider_connections add column if not exists connection_type text;
alter table public.provider_connections add column if not exists safe_display_name text;
alter table public.provider_connections add column if not exists authorization_started_at timestamptz;
alter table public.provider_connections add column if not exists connected_at timestamptz;
alter table public.provider_connections add column if not exists last_verified_at timestamptz;
alter table public.provider_connections add column if not exists expires_at timestamptz;
alter table public.provider_connections add column if not exists provider_token_reference text;
alter table public.provider_connections add column if not exists token_key_version text;
alter table public.provider_connections add column if not exists metadata jsonb not null default '{}';
update public.provider_connections set provider_id = coalesce(provider_id, provider), provider_category = coalesce(provider_category, 'legacy_provider'), connection_type = coalesce(connection_type, 'secure_handoff'), provider_token_reference = coalesce(provider_token_reference, secret_manager_reference, 'not-connected:' || gen_random_uuid()::text) where provider_id is null or provider_category is null or connection_type is null or provider_token_reference is null;
alter table public.provider_connections alter column provider_id set not null;
alter table public.provider_connections alter column provider_category set not null;
alter table public.provider_connections alter column connection_type set not null;
alter table public.provider_connections alter column external_account_reference set default ('not-connected:' || gen_random_uuid()::text);
alter table public.provider_connections alter column provider_token_reference set default ('not-connected:' || gen_random_uuid()::text);
alter table public.provider_connections drop constraint if exists provider_connections_status_check;
alter table public.provider_connections add constraint provider_connections_state_chk check(status in('pending','connected','disabled','error','NOT_CONNECTED','AUTHORIZATION_PREPARED','AUTHORIZATION_PENDING','CALLBACK_RECEIVED','TOKEN_VERIFICATION_REQUIRED','CONNECTED','REAUTH_REQUIRED','EXPIRED','REVOKE_PENDING','REVOKED','FAILED','revoked'));
alter table public.provider_connections drop constraint if exists provider_connections_safe_external_reference_chk;
alter table public.provider_connections add constraint provider_connections_safe_external_reference_chk check(external_account_reference is null or external_account_reference = 'deleted' or external_account_reference like 'not-connected:%' or external_account_reference like 'demo-only:%' or external_account_reference like 'handoff-only:%') not valid;
alter table public.provider_connections drop constraint if exists provider_connections_safe_token_reference_chk;
alter table public.provider_connections add constraint provider_connections_safe_token_reference_chk check(provider_token_reference is null or provider_token_reference = 'deleted' or provider_token_reference like 'not-connected:%' or provider_token_reference like 'demo-only:%' or provider_token_reference like 'handoff-only:%' or provider_token_reference like 'vault:%') not valid;
alter table public.provider_connections drop constraint if exists provider_connections_metadata_size_chk;
alter table public.provider_connections add constraint provider_connections_metadata_size_chk check(pg_column_size(metadata) <= 4096);
create table if not exists public.provider_connections(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_id text not null,
  provider_category text not null,
  connection_type text not null,
  external_account_reference text not null default ('not-connected:' || gen_random_uuid()::text),
  safe_display_name text,
  scopes text[] not null default '{}',
  status text not null default 'NOT_CONNECTED' check(status in('NOT_CONNECTED','AUTHORIZATION_PREPARED','AUTHORIZATION_PENDING','CALLBACK_RECEIVED','TOKEN_VERIFICATION_REQUIRED','CONNECTED','REAUTH_REQUIRED','EXPIRED','REVOKE_PENDING','REVOKED','FAILED')),
  authorization_started_at timestamptz,
  connected_at timestamptz,
  last_verified_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  provider_token_reference text not null default ('not-connected:' || gen_random_uuid()::text),
  token_key_version text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(external_account_reference = 'deleted' or external_account_reference like 'not-connected:%' or external_account_reference like 'demo-only:%' or external_account_reference like 'handoff-only:%'),
  check(provider_token_reference = 'deleted' or provider_token_reference like 'not-connected:%' or provider_token_reference like 'demo-only:%' or provider_token_reference like 'handoff-only:%' or provider_token_reference like 'vault:%'),
  check(pg_column_size(metadata) <= 4096),
  unique(user_id, provider_id, connection_type)
);

create table if not exists public.provider_authorization_states(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_id text not null,
  provider_category text not null,
  connection_type text not null,
  state text not null unique,
  nonce text not null unique,
  state_hash text not null,
  code_verifier_reference text not null,
  code_challenge text not null,
  redirect_uri text not null,
  scopes text[] not null default '{}',
  status text not null default 'AUTHORIZATION_PREPARED' check(status in('AUTHORIZATION_PREPARED','AUTHORIZATION_PENDING','CALLBACK_RECEIVED','TOKEN_VERIFICATION_REQUIRED','EXPIRED','FAILED','REVOKED')),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  safe_metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  check(code_verifier_reference like 'not-connected:%' or code_verifier_reference like 'demo-only:%' or code_verifier_reference like 'vault:%'),
  check(redirect_uri not like '%access_token%' and redirect_uri not like '%refresh_token%' and redirect_uri not like '%provider_password%' and redirect_uri not like '%client_secret%'),
  check(pg_column_size(safe_metadata) <= 4096)
);

create table if not exists public.provider_handoff_intents(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id text,
  provider_id text not null,
  provider_category text not null,
  selected_option_reference text not null,
  target_url text not null,
  return_url text not null,
  nonce text not null unique,
  state_hash text not null,
  status text not null default 'PREPARED' check(status in('DRAFT','PREPARED','OPENED','RETURNED','AWAITING_CONFIRMATION','CONFIRMED','FAILED','EXPIRED','CANCELLED')),
  expires_at timestamptz not null,
  opened_at timestamptz,
  returned_at timestamptz,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  consumed_at timestamptz,
  confirmation_reference text,
  safe_summary jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(selected_option_reference like 'handoff-only:%' or selected_option_reference !~* '(password|token|secret|passport|card|cvv)'),
  check(target_url like 'https://%' and return_url like 'http%'),
  check(target_url !~* '(access_token|refresh_token|provider_password|client_secret|payment_token|passport)' and return_url !~* '(access_token|refresh_token|provider_password|client_secret|payment_token|passport)'),
  check(pg_column_size(safe_summary) <= 8192)
);

create table if not exists public.provider_connection_events(
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  provider_connection_id uuid references public.provider_connections(id) on delete cascade,
  provider_handoff_intent_id uuid references public.provider_handoff_intents(id) on delete cascade,
  provider_id text not null,
  event_type text not null,
  status text not null default 'recorded' check(status in('recorded','duplicate','rejected','failed')),
  safe_metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  check(pg_column_size(safe_metadata) <= 4096)
);

create table if not exists public.provider_token_references(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_connection_id uuid references public.provider_connections(id) on delete cascade,
  provider_id text not null,
  provider_token_reference text not null,
  token_key_version text,
  status text not null default 'setup_required' check(status in('setup_required','development_reference','stored_in_vault','revoked','deleted','failed')),
  created_at timestamptz not null default now(),
  last_accessed_at timestamptz,
  revoked_at timestamptz,
  deleted_at timestamptz,
  check(provider_token_reference = 'deleted' or provider_token_reference like 'not-connected:%' or provider_token_reference like 'demo-only:%' or provider_token_reference like 'vault:%'),
  unique(user_id, provider_id, provider_token_reference)
);

alter table public.provider_connections enable row level security;
alter table public.provider_authorization_states enable row level security;
alter table public.provider_handoff_intents enable row level security;
alter table public.provider_connection_events enable row level security;
alter table public.provider_token_references enable row level security;

drop policy if exists owner_select_provider_connections on public.provider_connections;
create policy owner_select_provider_connections on public.provider_connections for select using(auth.uid() = user_id);
drop policy if exists owner_select_provider_authorization_states on public.provider_authorization_states;
create policy owner_select_provider_authorization_states on public.provider_authorization_states for select using(auth.uid() = user_id);
drop policy if exists owner_select_provider_handoff_intents on public.provider_handoff_intents;
create policy owner_select_provider_handoff_intents on public.provider_handoff_intents for select using(auth.uid() = user_id);
drop policy if exists owner_select_provider_connection_events on public.provider_connection_events;
create policy owner_select_provider_connection_events on public.provider_connection_events for select using(auth.uid() = user_id);
drop policy if exists owner_select_provider_token_references on public.provider_token_references;
create policy owner_select_provider_token_references on public.provider_token_references for select using(auth.uid() = user_id);

revoke all on public.provider_connections from anon;
revoke all on public.provider_authorization_states from anon;
revoke all on public.provider_handoff_intents from anon;
revoke all on public.provider_connection_events from anon;
revoke all on public.provider_token_references from anon;
revoke insert,update,delete on public.provider_connections,public.provider_authorization_states,public.provider_handoff_intents,public.provider_connection_events,public.provider_token_references from authenticated;

create index if not exists provider_connections_user_status_idx on public.provider_connections(user_id,status,updated_at desc);
create index if not exists provider_authorization_user_provider_idx on public.provider_authorization_states(user_id,provider_id,created_at desc);
create index if not exists provider_authorization_expiry_idx on public.provider_authorization_states(expires_at) where consumed_at is null;
create index if not exists provider_handoff_user_status_idx on public.provider_handoff_intents(user_id,status,created_at desc);
create index if not exists provider_connection_events_user_idx on public.provider_connection_events(user_id,created_at desc);
create index if not exists provider_token_references_user_idx on public.provider_token_references(user_id,provider_id,status);

commit;
