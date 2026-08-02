begin;

-- Travel Profile and Loyalty Wallet extension. Non-destructive and not applied by this checkpoint.
alter table public.travel_preferences add column if not exists preferred_name text check (char_length(preferred_name) <= 80);
alter table public.travel_preferences add column if not exists preferred_language text check (char_length(preferred_language) <= 20);
alter table public.travel_preferences add column if not exists home_city_region text check (char_length(home_city_region) <= 120);
alter table public.travel_preferences add column if not exists arrival_airports text[] not null default '{}';
alter table public.travel_preferences add column if not exists avoided_airlines text[] not null default '{}';
alter table public.travel_preferences add column if not exists avoided_hotel_brands text[] not null default '{}';
alter table public.travel_preferences add column if not exists preferred_currencies text[] not null default '{}';
alter table public.travel_preferences add constraint travel_preferences_airports_limit check (cardinality(departure_airports) <= 12 and cardinality(arrival_airports) <= 12) not valid;
alter table public.travel_preferences add constraint travel_preferences_provider_limit check (cardinality(airlines) <= 12 and cardinality(avoided_airlines) <= 12 and cardinality(hotel_brands) <= 12 and cardinality(avoided_hotel_brands) <= 12) not valid;
alter table public.travel_preferences add constraint travel_preferences_currency_limit check (cardinality(preferred_currencies) <= 6) not valid;

alter table public.loyalty_accounts add column if not exists program_category text not null default 'other_travel_program' check (program_category in ('airline','hotel','ota','car_rental','credit_card_rewards','other_travel_program'));
alter table public.loyalty_accounts add column if not exists notes text check (char_length(notes) <= 300);
alter table public.loyalty_accounts add column if not exists last_used_at timestamptz;
alter table public.loyalty_accounts drop constraint if exists loyalty_accounts_preferred_usage_check;
alter table public.loyalty_accounts add constraint loyalty_accounts_preferred_usage_check check (preferred_usage in ('lowest_total_price','maximum_points','best_balance','preferred_brands_first'));
alter table public.loyalty_accounts drop constraint if exists loyalty_accounts_verification_status_check;
alter table public.loyalty_accounts add constraint loyalty_accounts_verification_status_check check (verification_status in ('saved_reference','unverified','verified_connection','live_integration','expired'));
alter table public.loyalty_accounts add constraint loyalty_accounts_masked_limit check (char_length(masked_membership_number) <= 60) not valid;
alter table public.loyalty_accounts add constraint loyalty_accounts_protected_reference_limit check (char_length(protected_membership_reference) between 4 and 120) not valid;
alter table public.loyalty_accounts add constraint loyalty_accounts_protected_reference_safe_prefix check (protected_membership_reference like 'masked-only:%' or protected_membership_reference like 'vault:%' or protected_membership_reference = 'deleted') not valid;

create index if not exists travel_preferences_user_updated_idx on public.travel_preferences(user_id, updated_at desc);
create index if not exists loyalty_accounts_user_category_idx on public.loyalty_accounts(user_id, program_category) where deleted_at is null;
create index if not exists loyalty_accounts_user_provider_idx on public.loyalty_accounts(user_id, provider, program) where deleted_at is null;

alter table public.travel_preferences enable row level security;
alter table public.loyalty_accounts enable row level security;

revoke insert,update,delete on public.loyalty_accounts from authenticated;
revoke all on public.loyalty_accounts from anon;

commit;
