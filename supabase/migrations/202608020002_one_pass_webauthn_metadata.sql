-- ONE Pass real WebAuthn verifier metadata and local/staging RLS hardening.
-- Non-destructive: adds nullable metadata columns and indexes only.

alter table public.passkey_credentials add column if not exists credential_device_type text check (credential_device_type is null or credential_device_type in ('singleDevice','multiDevice'));
alter table public.passkey_credentials add column if not exists credential_backed_up boolean not null default false;
alter table public.passkey_credentials add column if not exists aaguid text;
alter table public.passkey_credentials add column if not exists clone_warning_at timestamptz;
alter table public.passkey_credentials add column if not exists last_verification_origin text;
alter table public.passkey_credentials add column if not exists last_verification_rp_id text;

alter table public.passkey_challenges add column if not exists rp_id text;
alter table public.passkey_challenges add column if not exists expected_origins text[] not null default '{}';
alter table public.passkey_challenges add column if not exists verified_at timestamptz;
alter table public.passkey_challenges add column if not exists verification_error_code text;

create index if not exists passkey_credentials_user_active_idx on public.passkey_credentials(user_id, created_at desc) where revoked_at is null;
create index if not exists passkey_challenges_user_purpose_idx on public.passkey_challenges(user_id, purpose, created_at desc);

alter table public.passkey_credentials enable row level security;
alter table public.passkey_challenges enable row level security;

revoke insert,update,delete on public.passkey_credentials from authenticated;
revoke insert,update,delete on public.passkey_challenges from authenticated;
revoke all on public.passkey_credentials from anon;
revoke all on public.passkey_challenges from anon;
