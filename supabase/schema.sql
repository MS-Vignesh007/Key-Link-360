-- KEYLINK360 — FULL schema (all project fields)
-- Run once: Supabase Dashboard → SQL Editor → Run
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT).

-- ---------------------------------------------------------------------------
-- Key-value blob (backward compatible with Railway backend)
-- ---------------------------------------------------------------------------
create table if not exists public.app_kv (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Auth
-- ---------------------------------------------------------------------------
create table if not exists public.auth_users (
  id text primary key,
  email text not null unique,
  password_hash text,
  password_salt text,
  first_name text not null default '',
  last_name text not null default '',
  company_name text not null default '',
  business_name text not null default '',
  phone text not null default '',
  country text not null default '',
  avatar_url text not null default '',
  plan text not null default 'Free Plan',
  is_verified boolean not null default false,
  email_verified boolean not null default false,
  status text not null default 'active',
  mfa_enabled boolean not null default false,
  newsletter_opt_in boolean not null default false,
  failed_login_attempts int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.auth_sessions (
  id text primary key,
  user_id text not null references public.auth_users(id) on delete cascade,
  refresh_token_hash text not null,
  remember_me boolean not null default false,
  user_agent text not null default '',
  ip text not null default '',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create table if not exists public.auth_password_resets (
  id text primary key,
  user_id text not null references public.auth_users(id) on delete cascade,
  email text not null,
  otp_hash text not null,
  token_hash text not null,
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create table if not exists public.auth_email_verifications (
  id text primary key,
  user_id text not null references public.auth_users(id) on delete cascade,
  email text not null,
  token_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create table if not exists public.auth_oauth_accounts (
  id text primary key,
  user_id text not null references public.auth_users(id) on delete cascade,
  provider text not null,
  provider_user_id text not null,
  email text not null default '',
  name text not null default '',
  avatar_url text not null default '',
  created_at timestamptz not null default now(),
  unique (provider, provider_user_id)
);

create table if not exists public.auth_login_history (
  id text primary key,
  user_id text,
  email text not null default '',
  success boolean not null default false,
  reason text not null default '',
  ip text not null default '',
  user_agent text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.auth_audit_logs (
  id text primary key,
  user_id text,
  action text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.auth_rate_limits (
  rate_key text primary key,
  count int not null default 0,
  window_start bigint not null default 0
);

-- ---------------------------------------------------------------------------
-- Bio pages & builder
-- ---------------------------------------------------------------------------
create table if not exists public.bio_pages (
  id text primary key,
  title text not null default '',
  slug text not null default '',
  status text not null default 'Draft',
  views int not null default 0,
  created_at timestamptz,
  bio text,
  cover_photo text,
  owner_user_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.bio_page_documents (
  page_id text primary key,
  blocks jsonb not null default '[]'::jsonb,
  details jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.bio_page_drafts (
  id text primary key,
  page_id text not null,
  page_slug text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  owner_user_id text
);

create table if not exists public.bio_page_templates (
  id text primary key,
  name text not null default '',
  source_page_id text,
  preview_image text,
  description text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_built_in boolean not null default false,
  owner_user_id text
);

-- ---------------------------------------------------------------------------
-- Workspace collections (formerly browser localStorage)
-- ---------------------------------------------------------------------------
create table if not exists public.contacts (
  id text primary key,
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  source text not null default '',
  tags jsonb not null default '[]'::jsonb,
  captured_at timestamptz,
  masked_email text not null default '',
  masked_phone text not null default '',
  marketing_opt_in boolean,
  owner_user_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_campaigns (
  id text primary key,
  name text not null default '',
  status text not null default 'Draft',
  recipients text not null default '',
  open_rate text not null default '',
  template_id text,
  created_at timestamptz,
  owner_user_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_templates (
  id text primary key,
  name text not null default '',
  status text not null default 'Pending',
  body text,
  created_at timestamptz,
  owner_user_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.smart_links (
  id text primary key,
  title text not null default '',
  slug text not null default '',
  short_url text not null default '',
  destination_url text,
  status text not null default 'Live',
  clicks int not null default 0,
  retargeting jsonb not null default '[]'::jsonb,
  owner_user_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.qr_codes (
  id text primary key,
  name text not null default '',
  status text not null default 'Active',
  scans text not null default '0',
  unique_scanners text not null default '0',
  top_location text,
  conversion_rate text,
  qr_url text not null default '',
  target_url text not null default '',
  /** Fixed public path code for /q/:code — unique per Smart QR. */
  public_code text,
  /** Frozen scan URL encoded into the QR matrix. */
  scan_url text,
  custom_design boolean not null default false,
  design_color text,
  design_logo text,
  design_pattern text,
  owner_user_id text,
  updated_at timestamptz not null default now()
);

alter table public.qr_codes add column if not exists public_code text;
alter table public.qr_codes add column if not exists scan_url text;
create unique index if not exists qr_codes_public_code_uidx
  on public.qr_codes (public_code)
  where public_code is not null and public_code <> '';

create table if not exists public.catalog_templates (
  id text primary key,
  name text not null default '',
  category text not null default 'Marketing',
  widgets int not null default 0,
  used_count text not null default '0',
  image_url text not null default '',
  description text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.integrations (
  id text primary key,
  name text not null default '',
  type text not null default 'Messaging',
  status text not null default 'Coming Soon',
  description text not null default '',
  upgrade_message text not null default '',
  waitlisted boolean,
  api_key_hint text,
  connected_at timestamptz,
  owner_user_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.integration_votes (
  id text primary key,
  name text not null default '',
  votes int not null default 0,
  voted boolean not null default false,
  owner_user_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.tracking_pixels (
  id text primary key,
  name text not null default '',
  type text not null default '',
  pixel_id text not null default '',
  status text not null default 'Inactive',
  owner_user_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.media_files (
  id text primary key,
  name text not null default '',
  type text not null default 'image',
  size text not null default '',
  url text not null default '',
  uploaded_at timestamptz,
  dimensions text,
  duration text,
  owner_user_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_domains (
  id text primary key,
  domain_name text not null,
  type text not null default 'A',
  target_ip text not null default '',
  status text not null default 'Pending DNS',
  owner_user_id text,
  page_id text,
  dns_target text not null default '',
  dns_verified_at timestamptz,
  provider text not null default 'manual',
  provider_hostname_id text,
  provider_status text not null default 'pending',
  ssl_status text not null default 'pending',
  ownership_verification jsonb,
  last_checked_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Existing projects may already have the earlier minimal custom_domains table.
alter table public.custom_domains add column if not exists page_id text;
alter table public.custom_domains add column if not exists dns_target text not null default '';
alter table public.custom_domains add column if not exists dns_verified_at timestamptz;
alter table public.custom_domains add column if not exists provider text not null default 'manual';
alter table public.custom_domains add column if not exists provider_hostname_id text;
alter table public.custom_domains add column if not exists provider_status text not null default 'pending';
alter table public.custom_domains add column if not exists ssl_status text not null default 'pending';
alter table public.custom_domains add column if not exists ownership_verification jsonb;
alter table public.custom_domains add column if not exists last_checked_at timestamptz;
alter table public.custom_domains add column if not exists error_message text;
alter table public.custom_domains add column if not exists created_at timestamptz not null default now();
create unique index if not exists custom_domains_hostname_unique
  on public.custom_domains (lower(domain_name));
create index if not exists custom_domains_owner_idx
  on public.custom_domains (owner_user_id);

create table if not exists public.platform_subdomains (
  id text primary key,
  slug text not null,
  page_id text not null,
  owner_user_id text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists platform_subdomains_slug_unique
  on public.platform_subdomains (lower(slug));

create index if not exists platform_subdomains_owner_idx
  on public.platform_subdomains (owner_user_id);

create unique index if not exists platform_subdomains_page_owner_unique
  on public.platform_subdomains (owner_user_id, page_id);

create table if not exists public.help_articles (
  id text primary key,
  title text not null default '',
  category text not null default '',
  excerpt text not null default '',
  read_time text not null default '',
  content text,
  updated_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id text primary key,
  subject text not null default '',
  message text not null default '',
  status text not null default 'open',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  owner_user_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.publish_settings (
  id text primary key default 'default',
  primary_url text not null default '',
  custom_domains jsonb not null default '[]'::jsonb,
  visibility text not null default 'public',
  selected_member_ids jsonb not null default '[]'::jsonb,
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  owner_user_id text
);

create table if not exists public.app_notifications (
  id text primary key,
  type text not null default 'general',
  title text not null default '',
  message text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now(),
  target_screen text,
  meta jsonb not null default '{}'::jsonb,
  owner_user_id text
);

create table if not exists public.tracking_events (
  id text primary key,
  page_id text not null default 'unknown',
  event_type text not null default 'visit',
  event_label text not null default '',
  device text,
  os text,
  browser text,
  domain text,
  port text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS: deny anon; service_role (Railway) bypasses RLS
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'app_kv','auth_users','auth_sessions','auth_password_resets','auth_email_verifications',
    'auth_oauth_accounts','auth_login_history','auth_audit_logs','auth_rate_limits',
    'bio_pages','bio_page_documents','bio_page_drafts','bio_page_templates',
    'contacts','whatsapp_campaigns','whatsapp_templates','smart_links','qr_codes',
    'catalog_templates','integrations','integration_votes','tracking_pixels','media_files',
    'custom_domains','platform_subdomains','help_articles','support_tickets','publish_settings','app_notifications',
    'tracking_events'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists app_kv_set_updated_at on public.app_kv;
create trigger app_kv_set_updated_at before update on public.app_kv
for each row execute function public.set_updated_at();

insert into public.app_kv (key, value)
values ('root', '{}'::jsonb)
on conflict (key) do nothing;
