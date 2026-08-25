-- KEYLINK360 — Platform Subdomains (Free Tier)
-- Enables {slug}.keylink360.mindflo.today → bio page routing.

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

alter table public.platform_subdomains enable row level security;
