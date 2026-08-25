# KEYLINK360 Custom Domains — Production Implementation Plan

Reference: `docs/keyscdplan.md` + `docs/keyscdplan-screenshots.pdf` (Lovable.dev workflow)

## Current state (audit summary)

| Area | Status |
|------|--------|
| Connect wizard UI | ~80% Lovable parity |
| DNS verification backend | Strong (A, CNAME, Cloudflare proxied) |
| Cloudflare for SaaS SSL | Implemented when env configured |
| Multi-tenant routing | Client-side via `/api/public/custom-domain/:hostname` |
| Root domain on Railway | **Broken without Cloudflare Worker or SaaS** |
| www routing | **Fixed in Phase 1** (alias lookup) |
| Fake registrar login | **Removed in Phase 1** |
| Unverified routing fallback | **Removed in Phase 1** |
| Free subdomain URLs | Not implemented (`?previewPageId=` only) |
| `.key` namespace | Not possible (.key is not a public TLD) |

## Architecture target

```
Visitor → Customer DNS (Cloudflare/registrar)
       → Railway (single KEYLINK360 service)
       → Host header / X-Forwarded-Host
       → Supabase custom_domains lookup
       → Render published Bio Page (pageId)
```

**SSL:** Cloudflare for SaaS on `mindflo.today` zone (production). Customer proxied root domains use `workers/custom-domain-proxy.js` until SaaS is fully rolled out.

**Scale (100k+ sites):** Single Railway service + Supabase indexed lookups + Cloudflare edge. Future: dedicated routing worker + read replicas.

## Phased delivery

### Phase 1 — Critical fixes (in progress)

- [x] `www.yourbrand.com` → apex alias in routing lookup
- [x] Remove routing unverified domains fallback
- [x] Register apex + www with Cloudflare for SaaS on root connect
- [x] Wizard: skip fake login, verify DNS before success screen
- [x] Resume DNS setup from pending domain rows
- [x] `domain_verification_logs` table + server logging
- [x] `GET /api/domains/:id/status` verification snapshot

### Phase 2 — Routing & SSL hardening

- [x] Server-side `keys_routed_page` cookie in middleware (reduce double lookup)
- [x] SSL polling job: `Provisioning SSL` → `Verified` via Cloudflare API
- [x] Surface ownership TXT records from Cloudflare in wizard when needed
- [x] Rate-limit `/api/public/custom-domain/:hostname`
- [x] `PATCH /api/domains/:id` reassign linked page
- [x] `GET /api/domains/:id/dns-records` (server-side record set)
- [x] Publish modal sync: update `primaryUrl` when domain Verified

### Phase 3 — Free KEY subdomains

**Namespace:** `{slug}.keylink360.mindflo.today` (replaces ugly `?previewPageId=` for free users)

- [x] `platform_subdomains` table (slug, page_id, owner_user_id)
- [x] `POST/GET/PATCH/DELETE /api/platform-subdomains`
- [x] `GET /api/public/platform-subdomain/:slug` public routing lookup
- [x] Server middleware routes `{slug}.keylink360.mindflo.today` → bio page
- [x] Bio Pages UI: **Get free URL** claim modal
- [x] `bioPagePublicUrl` uses free KEY address when claimed
- [x] Wildcard DNS `*.keylink360.mindflo.today` → `keylink360.mindflo.today` (boot upsert + docs)

### Phase 4 — Admin & observability

- Admin dashboard: all domains, failures, SSL status
- `domain_verification_logs` viewer
- Analytics: connects, verifies, failures per day
- Domain reclaim for abandoned hostnames

### Phase 5 — Shopify-grade extras

- Primary domain selection
- Apex ↔ www redirect rules
- Domain purchase (registrar API — optional)
- Email DNS (MX) conflict warnings

## Database schema (target)

| Table | Purpose |
|-------|---------|
| `custom_domains` | Premium custom domains (exists) |
| `domain_verification_logs` | Audit trail (Phase 1) |
| `platform_subdomains` | Free `{slug}.keylink360.mindflo.today` (Phase 3) |
| `domain_ssl_events` | SSL lifecycle (Phase 2) |

## API surface (target)

| Method | Path | Status |
|--------|------|--------|
| POST | `/api/domains` | Done |
| POST | `/api/domains/:id/verify` | Done |
| POST | `/api/domains/:id/test-connection` | Done |
| GET | `/api/domains/:id/status` | Done |
| GET | `/api/domains/:id/dns-records` | Done |
| DELETE | `/api/domains/:id` | Done |
| GET | `/api/domains/config` | Done |
| POST | `/api/domains/check-dns` | Done |
| PATCH | `/api/domains/:id` | Done |
| GET | `/api/platform-subdomains` | Done |
| POST | `/api/platform-subdomains` | Done |
| GET | `/api/public/platform-subdomain/:slug` | Done |

## Root domain production checklist (customer)

1. Connect domain in KEYLINK360 wizard
2. Add DNS records (A `@` + `www` or CNAME subdomain)
3. For proxied root on Railway: deploy Cloudflare Worker (`workers/custom-domain-proxy.js`)
4. Click Test / Verify in KEYLINK360
5. Status → Verified → site live

## Environment (Railway)

```text
APP_URL=https://keylink360.mindflo.today
CUSTOM_DOMAIN_A_TARGET=<Railway IP>
CUSTOM_DOMAIN_CNAME_TARGET=keylink360.mindflo.today
CLOUDFLARE_ZONE_ID=...
CLOUDFLARE_API_TOKEN=...
```

Run `supabase/custom-domains-migration.sql` after deploy.
