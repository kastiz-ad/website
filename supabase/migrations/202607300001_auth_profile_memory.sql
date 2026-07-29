begin;

alter table public.profiles drop constraint if exists profiles_preferred_language_check;
alter table public.profiles add constraint profiles_preferred_language_check check (preferred_language in ('en','ko','es'));
alter table public.profiles add column if not exists country text check (country is null or char_length(country) <= 120);
alter table public.profiles add column if not exists city text check (city is null or char_length(city) <= 120);
alter table public.profiles add column if not exists preferred_airport text check (preferred_airport is null or char_length(preferred_airport) <= 120);
alter table public.profiles add column if not exists preferred_airlines text[] not null default '{}';
alter table public.profiles add column if not exists preferred_hotel_types text[] not null default '{}';
alter table public.profiles add column if not exists seat_preference text check (seat_preference is null or char_length(seat_preference) <= 80);
alter table public.profiles add column if not exists travel_style text check (travel_style is null or char_length(travel_style) <= 120);
alter table public.profiles add column if not exists dietary_preferences text[] not null default '{}';
alter table public.profiles add column if not exists accessibility_preferences text[] not null default '{}';
alter table public.profiles add column if not exists favorite_cuisines text[] not null default '{}';
alter table public.profiles add column if not exists disliked_foods text[] not null default '{}';
alter table public.profiles add column if not exists budget_preference text check (budget_preference is null or char_length(budget_preference) <= 120);
alter table public.profiles add column if not exists time_format text check (time_format is null or time_format in ('12h','24h'));
alter table public.profiles add column if not exists currency_preference text check (currency_preference is null or currency_preference ~ '^[A-Z]{3}$');
alter table public.profiles add column if not exists emergency_contact jsonb not null default '{}'::jsonb check (pg_column_size(emergency_contact) <= 4096);
alter table public.profiles add column if not exists memory_enabled boolean not null default true;

alter table public.user_preferences add column if not exists memory_scope text not null default 'permanent_profile' check (memory_scope in ('permanent_profile','mission_specific'));
alter table public.user_preferences add column if not exists source_mission_id uuid references public.missions(id) on delete set null;
alter table public.user_preferences add column if not exists user_confirmed boolean not null default true;
alter table public.user_preferences add column if not exists expires_at timestamptz;

create table if not exists public.user_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  domain text not null check (char_length(domain) between 1 and 40 and domain !~* '(password|passport|resident|card|cvv|bank|token|secret|otp|biometric|medical|document)'),
  memory_key text not null check (char_length(memory_key) between 1 and 80 and memory_key ~ '^[A-Za-z0-9_.-]+$' and memory_key !~* '(password|passport|resident|card|cvv|bank|token|secret|otp|biometric|medical|document)'),
  memory_value jsonb not null check (pg_column_size(memory_value) <= 8192),
  memory_type text not null check (memory_type in ('permanent_profile','mission_specific')),
  source_mission_id uuid references public.missions(id) on delete set null,
  explanation text check (explanation is null or char_length(explanation) <= 500),
  user_confirmed boolean not null default false,
  expires_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,domain,memory_key,memory_type)
);

alter table public.user_memories enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_memories' and policyname='memory_owner_all') then
    create policy memory_owner_all on public.user_memories for all using(user_id=auth.uid()) with check(user_id=auth.uid());
  end if;
end $$;
create index if not exists user_memories_user_domain_idx on public.user_memories(user_id,domain) where disabled_at is null;
do $$
begin
  if not exists (select 1 from pg_trigger where tgname='user_memories_updated') then
    create trigger user_memories_updated before update on public.user_memories for each row execute function public.set_updated_at();
  end if;
end $$;

commit;
