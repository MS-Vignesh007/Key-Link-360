-- KEYLINK360 — DNS provider onboarding (run once in Supabase SQL Editor).
-- Safe to re-run: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.

alter table public.auth_users
  add column if not exists preferred_dns_provider text;

alter table public.custom_domains
  add column if not exists dns_provider_id text;

alter table public.custom_domains
  add column if not exists provider_connected boolean not null default false;

alter table public.custom_domains
  add column if not exists provider_account_id text;

alter table public.custom_domains
  add column if not exists dns_last_verified timestamptz;

create table if not exists public.dns_provider_connections (
  id text primary key,
  owner_user_id text not null,
  provider_id text not null,
  provider_account_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  connected boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists dns_provider_connections_owner_provider_uidx
  on public.dns_provider_connections (owner_user_id, provider_id);

create index if not exists dns_provider_connections_owner_idx
  on public.dns_provider_connections (owner_user_id);

alter table public.dns_provider_connections enable row level security;
