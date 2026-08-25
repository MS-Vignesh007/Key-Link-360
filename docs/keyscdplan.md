# keyscdplan — Custom Domain Reference (Lovable.dev Workflow)

Reference plan for KEYLINK360 custom domains — **root domain only** (`yourbrand.com`).

PDF (30 screenshots): `docs/keyscdplan-screenshots.pdf`

Example: `searchablehowto.com` · DNS: A record `@` → platform IP

---

## KEY rule

- **Root domain:** `yourbrand.com` — A record `@` → platform IP only
- **Subdomain:** `king.yourbrand.com`, `www.yourbrand.com`, etc. — CNAME → platform hostname only
- User adds records at their registrar (GoDaddy, Namecheap, Cloudflare, etc.)

---

## User flow (step by step)

1. Login KEYLINK360 → publish bio page  
2. Custom Domains → **Connect Domain**  
3. **What domain would you like to connect with KEYLINK360?** → enter `yourbrand.com` → Continue  
4. **Analyzing your domain** → Analyzed · Detected DNS provider · Getting setup details  
5. **Provider login** (e.g. GoDaddy) → Continue (or add records manually)  
6. **Please add these records** → copy A records → add at registrar  
7. **I have added 2/2 records…** → **You're all set!**  
8. Choose **Which published page should open on this address?** → **Done**  
9. Toast: *Connecting domain…* → success or *Domain not connected*  
10. Click domain name → bio page opens  

---

## Screenshot order (1–30)

See PDF. Covers Lovable Domains UI, wizard, GoDaddy DNS, success/error states.

---

## Production env

```text
CUSTOM_DOMAIN_A_TARGET=69.46.46.90
APP_URL=https://keylink360.mindflo.today
CLOUDFLARE_ZONE_ID=...
CLOUDFLARE_API_TOKEN=...
```

See `docs/custom-domains-production.md`.
