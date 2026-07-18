-- Mission Economy V1 hardening. Architecture only: billing and external execution stay disabled.
alter table public.mission_wallets add column if not exists workspace_id uuid references public.mission_workspaces(id) on delete set null;
alter table public.mission_wallets add column if not exists rollover_policy jsonb not null default '{}';
alter table public.mission_wallets add column if not exists reset_date date;
alter table public.mission_wallets add column if not exists status text not null default 'active';

alter table public.mission_coin_ledger rename column event_type to transaction_type;
alter table public.mission_coin_ledger rename column coin_delta to amount;
alter table public.mission_coin_ledger add column if not exists account_id uuid references auth.users(id) on delete set null;
alter table public.mission_coin_ledger add column if not exists workspace_id uuid references public.mission_workspaces(id) on delete set null;
alter table public.mission_coin_ledger add column if not exists balance_before integer;
alter table public.mission_coin_ledger add column if not exists balance_after integer;
alter table public.mission_coin_ledger add column if not exists reason text;
alter table public.mission_coin_ledger add column if not exists subscription_tier text;
alter table public.mission_coin_ledger add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.mission_coin_ledger add column if not exists idempotency_key text;
alter table public.mission_coin_ledger drop constraint if exists mission_coin_ledger_event_type_check;
update public.mission_coin_ledger set transaction_type=case transaction_type when 'monthly_allocation' then 'MONTHLY_ALLOCATION' when 'coins_added' then 'BONUS_CREDIT' when 'mission_completed' then 'MISSION_COMPLETION_DEBIT' when 'expired' then 'EXPIRATION_DEBIT' when 'future_transfer' then 'TRANSFER_OUT_FUTURE' when 'future_gift' then 'TRANSFER_IN_FUTURE' else 'ADMIN_ADJUSTMENT' end;
alter table public.mission_coin_ledger add constraint mission_coin_ledger_transaction_type_check check(transaction_type in('MONTHLY_ALLOCATION','MISSION_COMPLETION_DEBIT','PURCHASED_COIN_CREDIT','BONUS_CREDIT','PROMOTIONAL_CREDIT','REFUND_CREDIT','ADMIN_ADJUSTMENT','EXPIRATION_DEBIT','TRANSFER_IN_FUTURE','TRANSFER_OUT_FUTURE'));
drop index if exists public.mission_coin_once_per_completed_mission;
drop index if exists public.mission_coin_completion_reference_unique;
create unique index mission_coin_once_per_completed_history on public.mission_coin_ledger(wallet_id,idempotency_key) where transaction_type='MISSION_COMPLETION_DEBIT';
create unique index if not exists mission_coin_ledger_idempotency on public.mission_coin_ledger(wallet_id,idempotency_key) where idempotency_key is not null;

create table if not exists public.mission_entitlements(id uuid primary key default gen_random_uuid(),tier_key text not null,entitlement_key text not null,state text not null check(state in('enabled','disabled','limited')),quantity integer,trial_state jsonb not null default '{}',promotional_override jsonb,administrative_override jsonb,feature_flag boolean not null default true,updated_at timestamptz not null default now(),unique(tier_key,entitlement_key));
create table if not exists public.shared_mission_memory(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.mission_workspaces(id) on delete cascade,added_by uuid not null references auth.users(id) on delete cascade,memory_key text not null,memory_category text not null,safe_value jsonb not null,consent_state text not null check(consent_state in('shared','paused','removed')),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.mission_value_scores(mission_id uuid primary key references public.missions(id) on delete cascade,value_score integer not null check(value_score between 0 and 100),complexity_band text not null,reason_factors jsonb not null default '{}',billing_impact boolean not null default false,created_at timestamptz not null default now());
create table if not exists public.support_cases(id uuid primary key default gen_random_uuid(),account_id uuid not null references auth.users(id) on delete cascade,workspace_id uuid references public.mission_workspaces(id) on delete set null,mission_id uuid references public.missions(id) on delete set null,priority text not null,status text not null,assigned_team text,assigned_human_future uuid,escalation_level integer not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now());

alter table public.mission_entitlements enable row level security;
alter table public.shared_mission_memory enable row level security;
alter table public.mission_value_scores enable row level security;
alter table public.support_cases enable row level security;
create policy entitlement_authenticated_read on public.mission_entitlements for select to authenticated using(true);
create policy shared_memory_member_read on public.shared_mission_memory for select using(exists(select 1 from public.mission_workspace_members member where member.workspace_id=shared_mission_memory.workspace_id and member.user_id=auth.uid()));
create policy support_owner_read on public.support_cases for select using(account_id=auth.uid());
revoke insert,update,delete on public.mission_entitlements,public.shared_mission_memory,public.mission_value_scores,public.support_cases from authenticated;
grant select on public.mission_entitlements,public.shared_mission_memory,public.mission_value_scores,public.support_cases to authenticated;
