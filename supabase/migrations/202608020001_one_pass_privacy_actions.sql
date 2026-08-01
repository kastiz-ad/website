-- ONE Pass privacy actions hardening.
-- Sensitive exports and deletions are requested by the signed-in owner, confirmed by a recent passkey/device challenge,
-- and written by trusted backend code only. Raw secrets are never stored here.

create table if not exists public.one_pass_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('one_pass','identity_pass','export')),
  status text not null default 'requested' check (status in ('requested','processing','completed','cancelled')),
  target_entity_type text,
  target_entity_id uuid,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  correlation_id text,
  privacy_safe_reason jsonb not null default '{}'::jsonb
);

alter table public.one_passes add column if not exists deleted_at timestamptz;
alter table public.passkey_challenges add column if not exists completed_action_at timestamptz;

create index if not exists one_pass_deletion_requests_user_idx on public.one_pass_deletion_requests(user_id, requested_at desc);
create index if not exists one_pass_deletion_requests_status_idx on public.one_pass_deletion_requests(status, requested_at desc);
create unique index if not exists one_pass_deletion_requests_one_open_idx on public.one_pass_deletion_requests(user_id) where request_type = 'one_pass' and status in ('requested','processing');

alter table public.one_pass_deletion_requests enable row level security;

drop policy if exists one_pass_deletion_requests_owner_select on public.one_pass_deletion_requests;
create policy one_pass_deletion_requests_owner_select on public.one_pass_deletion_requests
  for select using (auth.uid() = user_id);

revoke insert,update,delete on public.one_pass_deletion_requests from authenticated;
revoke all on public.one_pass_deletion_requests from anon;
