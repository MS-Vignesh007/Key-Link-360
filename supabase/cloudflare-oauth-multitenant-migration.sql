-- KEYLINK360 — Cloudflare OAuth multi-tenant (ONE file, run once)
-- Safe to re-run.
-- Fixes: creates dns_provider_connections FIRST, then oauth_states.

-- ---------------------------------------------------------------------------
-- 1) Preferred provider + domain onboarding columns (ignore if tables missing later)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'auth_users'
  ) then
    alter table public.auth_users
      add column if not exists preferred_dns_provider text;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'custom_domains'
  ) then
    alter table public.custom_domains
      add column if not exists dns_provider_id text;
    alter table public.custom_domains
      add column if not exists provider_connected boolean not null default false;
    alter table public.custom_domains
      add column if not exists provider_account_id text;
    alter table public.custom_domains
      add column if not exists dns_last_verified timestamptz;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2) Customer Cloudflare / DNS provider connections (REQUIRED)
-- ---------------------------------------------------------------------------
create table if not exists public.dns_provider_connections (
  id text primary key,
  owner_user_id text not null,
  provider_id text not null,
  provider_account_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  connected boolean not null default false,
  connected_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dns_provider_connections
  add column if not exists refresh_token_encrypted text;

alter table public.dns_provider_connections
  add column if not exists token_expires_at timestamptz;

alter table public.dns_provider_connections
  add column if not exists connected_at timestamptz;

alter table public.dns_provider_connections
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists dns_provider_connections_owner_provider_uidx
  on public.dns_provider_connections (owner_user_id, provider_id);

create index if not exists dns_provider_connections_owner_idx
  on public.dns_provider_connections (owner_user_id);

alter table public.dns_provider_connections enable row level security;

-- ---------------------------------------------------------------------------
-- 3) Durable OAuth PKCE state (Railway multi-instance safe)
-- ---------------------------------------------------------------------------
create table if not exists public.oauth_states (
  state text primary key,
  provider text not null default 'cloudflare',
  owner_user_id text not null,
  payload jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists oauth_states_expires_idx on public.oauth_states (expires_at);
create index if not exists oauth_states_owner_idx on public.oauth_states (owner_user_id);

alter table public.oauth_states enable row level security;

-- Optional cleanup later:
-- delete from public.oauth_states where expires_at < now();
