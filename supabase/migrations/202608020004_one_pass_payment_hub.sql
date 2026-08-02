begin;

alter table public.payment_method_references add column if not exists method_category text;
alter table public.payment_method_references add column if not exists display_name text;
alter table public.payment_method_references add column if not exists connection_status text not null default 'setup_required';
alter table public.payment_method_references add column if not exists capability_status text not null default 'setup_required';
alter table public.payment_method_references add column if not exists default_for_category boolean not null default false;
alter table public.payment_method_references add column if not exists supported_currencies text[] not null default '{}';
alter table public.payment_method_references add column if not exists supported_countries text[] not null default '{}';
alter table public.payment_method_references add column if not exists requires_provider_redirect boolean not null default true;
alter table public.payment_method_references add column if not exists requires_device_wallet boolean not null default false;
alter table public.payment_method_references add column if not exists expires_at timestamptz;
alter table public.payment_method_references add column if not exists provider_metadata jsonb not null default '{}';

alter table public.payment_method_references drop constraint if exists payment_method_references_method_category_chk;
alter table public.payment_method_references add constraint payment_method_references_method_category_chk check(method_category is null or method_category in('toss_payments','kakao_pay','apple_pay_device_wallet','tokenized_card_reference','carrier_billing','other_approved_provider'));
alter table public.payment_method_references drop constraint if exists payment_method_references_connection_status_chk;
alter table public.payment_method_references add constraint payment_method_references_connection_status_chk check(connection_status in('demo','setup_required','connected','revoked','expired','unavailable'));
alter table public.payment_method_references drop constraint if exists payment_method_references_capability_status_chk;
alter table public.payment_method_references add constraint payment_method_references_capability_status_chk check(capability_status in('demo_only','setup_required','device_capability','configured','unavailable'));
alter table public.payment_method_references drop constraint if exists payment_method_references_metadata_size_chk;
alter table public.payment_method_references add constraint payment_method_references_metadata_size_chk check(pg_column_size(provider_metadata) <= 4096);
alter table public.payment_method_references drop constraint if exists payment_method_references_safe_reference_chk;
alter table public.payment_method_references add constraint payment_method_references_safe_reference_chk check(provider_reference = 'deleted' or provider_reference like 'mock-only:%' or provider_reference like 'not-connected:%' or provider_reference like 'vault:%' or provider_reference like 'provider:%') not valid;

create unique index if not exists one_default_payment_per_category on public.payment_method_references(user_id, method_category) where default_for_category and revoked_at is null;
create index if not exists payment_method_user_category_idx on public.payment_method_references(user_id, method_category, connection_status) where revoked_at is null;

create table if not exists public.payment_transactions(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_package_id uuid references public.approval_packages(id) on delete set null,
  payment_method_reference_id uuid references public.payment_method_references(id) on delete restrict,
  provider text not null,
  provider_transaction_reference text,
  state text not null default 'DRAFT' check(state in('DRAFT','PRICE_RECHECK_REQUIRED','READY_FOR_REVIEW','AWAITING_APPROVAL','APPROVED','PAYMENT_INTENT_CREATED','PAYMENT_AUTHORIZATION_REQUIRED','AUTHORIZED','CAPTURE_PENDING','CAPTURED','COMPLETED','REJECTED','EXPIRED','INVALIDATED','PRICE_CHANGED','AUTHORIZATION_FAILED','CAPTURE_FAILED','CANCELLED','VOID_REQUIRED','VOIDED','REFUND_REQUIRED','REFUND_PENDING','PARTIALLY_REFUNDED','REFUNDED','MANUAL_REVIEW')),
  amount numeric(14,2),
  currency char(3),
  idempotency_key text not null,
  request_hash text,
  safe_summary jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz,
  check(pg_column_size(safe_summary) <= 8192),
  unique(user_id,idempotency_key),
  unique(provider,provider_transaction_reference)
);

create table if not exists public.payment_events(
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  payment_transaction_id uuid references public.payment_transactions(id) on delete cascade,
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  processing_status text not null default 'received' check(processing_status in('received','verified','processed','duplicate','rejected','failed')),
  signature_verified boolean not null default false,
  safe_metadata jsonb not null default '{}',
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  check(pg_column_size(safe_metadata) <= 8192),
  unique(provider,provider_event_id)
);

create table if not exists public.payment_idempotency_records(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  request_hash text not null,
  entity_type text not null,
  entity_id uuid,
  status text not null default 'recorded' check(status in('recorded','completed','failed','expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  unique(user_id,idempotency_key)
);

alter table public.payment_transactions enable row level security;
alter table public.payment_events enable row level security;
alter table public.payment_idempotency_records enable row level security;

drop policy if exists owner_select_payment_transactions on public.payment_transactions;
create policy owner_select_payment_transactions on public.payment_transactions for select using(auth.uid() = user_id);
drop policy if exists owner_select_payment_events on public.payment_events;
create policy owner_select_payment_events on public.payment_events for select using(user_id is null or auth.uid() = user_id);
drop policy if exists owner_select_payment_idempotency_records on public.payment_idempotency_records;
create policy owner_select_payment_idempotency_records on public.payment_idempotency_records for select using(auth.uid() = user_id);

revoke all on public.payment_transactions from anon;
revoke all on public.payment_events from anon;
revoke all on public.payment_idempotency_records from anon;
revoke insert,update,delete on public.payment_transactions,public.payment_events,public.payment_idempotency_records from authenticated;

create index if not exists payment_transactions_user_state_idx on public.payment_transactions(user_id,state,created_at desc);
create index if not exists payment_events_transaction_idx on public.payment_events(payment_transaction_id,received_at desc);
create index if not exists payment_idempotency_user_idx on public.payment_idempotency_records(user_id,created_at desc);

commit;
