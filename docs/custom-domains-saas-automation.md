# KEYLINK360 — automatic custom domains (Cloudflare for SaaS)

## User experience (no admin work)

1. Login → create bio page  
2. Connect Domain → enter `tree.example.com`  
3. Choose where the domain is managed (Cloudflare, GoDaddy, …)  
4. **Cloudflare:** click **Connect Cloudflare** → approve in Cloudflare → DNS created automatically (no API token)  
5. **Other providers:** guided copy steps (manual fallback)  
6. Progress: Checking DNS → SSL → **LIVE**

### Cloudflare one-click (admin once)

1. Cloudflare Dashboard → **Manage Account → OAuth clients** → Create public client  
2. Redirect URI: `https://keylink360.mindflo.today/api/domains/providers/cloudflare/oauth/callback`  
3. Scopes on the client: **Zone Read** + **DNS Write** (enable `refresh_token` grant; do not invent `zone.dns.write`)  
4. Visibility must be **Public** (not Private). Private clients can only be authorized by members of the OAuth app’s parent Cloudflare account (e.g. always shows that account). Public + Verified lets any customer authorize with **their** Cloudflare login.  
5. Railway env:

```text
CLOUDFLARE_OAUTH_CLIENT_ID=...
CLOUDFLARE_OAUTH_CLIENT_SECRET=...
CLOUDFLARE_OAUTH_REDIRECT_URI=https://keylink360.mindflo.today/api/domains/providers/cloudflare/oauth/callback
# Optional; defaults are correct:
# CLOUDFLARE_OAUTH_SCOPES=zone.read dns.write
```

### Cloudflare DNS must be DNS-only (gray cloud)

Auto-DNS creates CNAMEs with **Proxied = off**. If a customer record is orange-cloud (Proxied), HTTPS can redirect-loop and LIVE checks fail randomly.

In Cloudflare DNS for the subdomain: cloud icon must be **gray** (DNS only), value `keylink360.mindflo.today`.

## Multi-tenant rule (critical)

Customer DNS is written **only** with that customer’s OAuth token (stored encrypted per user in `dns_provider_connections`).

- `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ZONE_ID` → **your** zone only (Cloudflare for SaaS custom hostnames + SSL).
- Never use the platform token to modify Customer A/B/C zones (default).
- Legacy same-account testing only: `ALLOW_PLATFORM_CUSTOMER_DNS=true` (not for production SaaS).

### Fix “We couldn't update DNS automatically”

Cause: the customer has not connected **their** Cloudflare account yet, or OAuth scopes/zone missing.

**Option A — Connect Cloudflare (correct for SaaS):**

Customer clicks **Connect Cloudflare** → OAuth → DNS auto-created in **their** account.

**Option A-legacy — same Cloudflare account (NOT multi-tenant):**

1. Cloudflare → My Profile → **API Tokens** → Create Token  
2. Permissions: **Zone → DNS → Edit**, **Zone → Zone → Read**  
3. Zone Resources: **Include → All zones** (or add each shop zone)  
4. Railway / `.env` with `ALLOW_PLATFORM_CUSTOMER_DNS=true`:

```text
CLOUDFLARE_DNS_API_TOKEN=paste_new_token_here
```

Redeploy / restart. Connect Cloudflare should auto-add CNAME.

**Option B — other customers’ Cloudflare accounts:** finish OAuth client setup (`CLOUDFLARE_OAUTH_*`) so Connect Cloudflare opens Approve → then DNS is written with their token.

No Worker routes per customer.  
No Railway custom domains per customer.  
Railway keeps **only** `keylink360.mindflo.today`.

Run once: `supabase/dns-provider-onboarding-migration.sql` for preferred provider + connection storage.

## Architecture

```text
Customer browser
  → DNS CNAME → keylink360.mindflo.today
  → Cloudflare for SaaS (SSL on customer hostname)
  → Origin Rule (mindflo.today, one-time):
       key-customer-host = original host
       Host / SNI → keylink360.mindflo.today
  → Railway (single hostname)
  → Express routes bio page via key-customer-host / X-Forwarded-Host
```

## Railway environment

```text
CLOUDFLARE_ZONE_ID=<mindflo.today zone id>
CLOUDFLARE_API_TOKEN=<token: SSL and Certificates Edit + Zone Read + Zone Rulesets Edit>
CLOUDFLARE_ACCOUNT_ID=<optional>
CLOUDFLARE_CUSTOM_HOSTNAME_ENABLED=true
CLOUDFLARE_SSL_VALIDATION_METHOD=http
CUSTOM_DOMAIN_CNAME_TARGET=keylink360.mindflo.today
CUSTOM_DOMAIN_A_TARGET=69.46.46.90
```

Set `CLOUDFLARE_CUSTOM_HOSTNAME_ENABLED=false` only if you intentionally disable SaaS registration.

## One-time Cloudflare setup (admin, once)

1. Enable **Cloudflare for SaaS** on `mindflo.today`.  
2. Fallback Origin = `keylink360.mindflo.today` (Active).  
3. Deploy KEYLINK360 — on boot the server upserts Origin Rules automatically:
   - Transform: set `key-customer-host` + `X-Forwarded-Host` from `http.host`
   - Origin: set Host header + SNI to `keylink360.mindflo.today` when host ≠ platform  
4. If API lacks Rulesets permission, create the same Origin Rule manually under  
   **Rules → Origin Rules** / **Transform Rules**.

Token needs at least:

- Zone → SSL and Certificates → Edit  
- Zone → Zone → Read  
- Zone → Zone WAF / Zone Rulesets → Edit (for Origin Rule automation)

## Status machine

| Status | Meaning |
|--------|---------|
| Pending DNS / Connecting | DNS not detected yet |
| DNS Verified / DNS OK | CNAME/A correct |
| Provisioning SSL | Cloudflare custom hostname / cert in progress |
| Waiting SSL | Cert active, waiting for live route |
| Verified / LIVE | `https://domain/api/health` returns KEY `status: ok` |
| Error / Failed | Provider or validation error — Retry |

SSL poller retries every ~2 minutes for pending domains.

## Free-plan Host rewrite (no Enterprise Origin Rules)

Host Header rewrite in Origin Rules is **Enterprise-only**.

Use this instead (one-time):

1. DNS: `cf-saas-origin` → CNAME → `keylink360.mindflo.today` (Proxied)
2. Fallback Origin = `cf-saas-origin.mindflo.today` (Active)
3. Worker `keylink360-custom-domain-proxy` with code from `workers/custom-domain-proxy.js`
4. Worker route on **mindflo.today**:

```text
*/*
```

   (Not only `cf-saas-origin…/*` — SaaS requests use the **customer** Host header.)

5. Custom Hostnames auto-register via API when users Connect Domain.

Traffic:

```text
tree.customer.com
  → Cloudflare for SaaS (SSL Active)
  → Worker */* on mindflo.today (Host → keylink360.mindflo.today)
  → Railway
  → KEY bio page
```

## Fix intermittent Chrome 403 (“Access denied”)

Chrome text like **“Access to … was denied / HTTP ERROR 403”** (then works after refresh
or a few minutes) is almost never KEY app code. KEY Express returns **404/503** for
domain routing problems, not that Chrome interstitial.

Usual cause: **Cloudflare Bot Fight / WAF** on `mindflo.today` (or on the customer zone
if their CNAME is Proxied/orange). HTML may load while `/assets/*.js` is blocked → blank
or broken UI until refresh.

### One-time checks on `mindflo.today`

1. **Security → Bots** → turn **Bot Fight Mode** OFF (or add a skip rule for Custom Hostnames).
2. **Security → Settings** → **Browser Integrity Check** OFF (or Low impact).
3. **Security → Settings** → Security Level **Essentially Off** or **Low**.
4. **Security → Events** → filter status `403` → confirm rule name / Ray ID.
5. **SSL/TLS → Custom Hostnames** → hostname **Active** + certificate **Active**.

### Customer DNS (e.g. `rog` on ezysellonline.com)

- CNAME → `keylink360.mindflo.today` is correct.
- If 403 persists only on that brand domain, check **that zone’s** Bot Fight / WAF too
  (orange-cloud CNAME runs customer-zone security first).

### Deploy Worker after code changes

Cloudflare Dashboard → Workers → `keylink360-custom-domain-proxy` → paste
`workers/custom-domain-proxy.js` → Save & Deploy. Route must stay `*/*` on `mindflo.today`.

