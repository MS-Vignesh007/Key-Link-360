# Custom domain DNS rules (KEYLINK360 default)

Customers must configure DNS at **their domain registrar or DNS host** (e.g. GoDaddy, Namecheap, Cloudflare, Hostinger, Amazon Route 53, Google Domains / Squarespace).

---

## 1. Root / Apex Domain (e.g. `yourbrand.com`)

When connecting the bare root domain:

- **Type:** `A`
- **Name / Host:** `@` (or leave blank depending on the DNS provider)
- **Value / Target:** Platform IPv4 address (e.g. `69.46.46.90` or `76.76.21.21` depending on deployment)
- **TTL:** `Auto` or `300`–`3600` seconds

> **Tip:** If the user also wants `www.yourbrand.com` to resolve, they should add a second record:
> - **Type:** `A` (with same IP) or `CNAME` pointing to `yourbrand.com` or `@`.

---

## 2. Subdomain (e.g. `bio.yourbrand.com`, `shop.yourbrand.com`, `link.yourbrand.com`)

When connecting a subdomain prefix:

- **Type:** `CNAME`
- **Name / Host:** prefix only (e.g. `bio`, `shop`, `link`, `studio`, `tree`)
- **Value / Target:** Platform CNAME target (e.g. `keylink360.mindflo.today`)

Do **not** show or accept A records for subdomains.

Do **not** show Cloudflare ownership TXT (or any TXT) in Connect Domain / Show DNS.
Users only add A (root) or CNAME (subdomain). SSL ownership is handled by the platform.

---

## Implementation map

| Layer | File |
|-------|------|
| Record builder (server) | `server/domains/dnsRecords.ts` |
| DNS verification (server) | `server/domains/dns.ts` |
| Record builder (client) | `src/lib/customDomainDns.ts` |
| Connect wizard | `src/components/customDomains/ConnectDomainWizard.tsx` |
| Domain list / Show DNS | `src/components/CustomDomainsScreen.tsx`, `DomainDnsPanel.tsx` |
| Auto DNS (Cloudflare) | `server/domains/cloudflareDns.ts` |
