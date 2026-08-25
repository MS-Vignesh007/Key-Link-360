import { resolve4, resolve6, resolveNs, resolveCname } from "node:dns/promises";
import https from "node:https";
import {
  getCustomDomainKind,
  getDnsZoneDomain,
  getSubdomainHostLabel,
  normalizeHostname,
  resolveCnameTarget,
  resolveCustomDomainATarget
} from "./hostname";

async function safeResolve<T>(resolver: () => Promise<T>): Promise<T | null> {
  try {
    return await resolver();
  } catch {
    return null;
  }
}

const NS_SUFFIX_TO_PROVIDER: { suffix: string; id: string; name: string }[] = [
  { suffix: "domaincontrol.com", id: "godaddy", name: "GoDaddy" },
  { suffix: "godaddy.com", id: "godaddy", name: "GoDaddy" },
  { suffix: "registrar-servers.com", id: "namecheap", name: "Namecheap" },
  { suffix: "namecheap.com", id: "namecheap", name: "Namecheap" },
  { suffix: "cloudflare.com", id: "cloudflare", name: "Cloudflare" },
  { suffix: "hostinger.com", id: "hostinger", name: "Hostinger" },
  { suffix: "hostinger.net", id: "hostinger", name: "Hostinger" },
  { suffix: "porkbun.com", id: "porkbun", name: "Porkbun" },
  { suffix: "dynadot.com", id: "dynadot", name: "Dynadot" },
  { suffix: "name.com", id: "namecom", name: "Name.com" },
  { suffix: "bluehost.com", id: "bluehost", name: "Bluehost" },
  { suffix: "siteground.net", id: "siteground", name: "SiteGround" },
  { suffix: "siteground.com", id: "siteground", name: "SiteGround" },
  { suffix: "hostgator.com", id: "hostgator", name: "HostGator" },
  { suffix: "wixdns.net", id: "wix", name: "Wix" },
  { suffix: "squarespace.com", id: "squarespace", name: "Squarespace" },
  { suffix: "google.com", id: "google", name: "Google Domains" },
  { suffix: "googledomains.com", id: "google", name: "Google Domains" },
  { suffix: "awsdns", id: "route53", name: "Amazon Route 53" },
  { suffix: "ionos.com", id: "ionos", name: "IONOS" },
  { suffix: "1and1.com", id: "ionos", name: "IONOS" }
];

function matchProvider(nameservers: string[]) {
  for (const nameserver of nameservers) {
    const lowered = nameserver.toLowerCase().replace(/\.$/, "");
    for (const entry of NS_SUFFIX_TO_PROVIDER) {
      if (lowered === entry.suffix || lowered.endsWith(`.${entry.suffix}`) || lowered.includes(entry.suffix)) {
        return entry;
      }
    }
  }
  return null;
}

const REGISTRAR_LABEL_HINTS: { pattern: RegExp; id: string; name: string }[] = [
  { pattern: /godaddy/i, id: "godaddy", name: "GoDaddy" },
  { pattern: /namecheap/i, id: "namecheap", name: "Namecheap" },
  { pattern: /cloudflare/i, id: "cloudflare", name: "Cloudflare" },
  { pattern: /hostinger/i, id: "hostinger", name: "Hostinger" },
  { pattern: /porkbun/i, id: "porkbun", name: "Porkbun" },
  { pattern: /dynadot/i, id: "dynadot", name: "Dynadot" },
  { pattern: /name\.com/i, id: "namecom", name: "Name.com" },
  { pattern: /bluehost/i, id: "bluehost", name: "Bluehost" },
  { pattern: /siteground/i, id: "siteground", name: "SiteGround" },
  { pattern: /hostgator/i, id: "hostgator", name: "HostGator" },
  { pattern: /wix/i, id: "wix", name: "Wix" },
  { pattern: /squarespace/i, id: "squarespace", name: "Squarespace" },
  { pattern: /google/i, id: "google", name: "Google Domains" },
  { pattern: /amazon|route\s*53|aws/i, id: "route53", name: "Amazon Route 53" },
  { pattern: /ionos|1&1|1and1/i, id: "ionos", name: "IONOS" }
];

function matchRegistrarLabel(label: string) {
  for (const hint of REGISTRAR_LABEL_HINTS) {
    if (hint.pattern.test(label)) return hint;
  }
  return null;
}

function titleCase(value: string) {
  return value
    .split(/[\s.-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function inferFromNameserver(nameserver: string) {
  const lowered = nameserver.toLowerCase().replace(/\.$/, "");
  const parts = lowered.split(".").filter(Boolean);
  if (parts.length < 2) return null;
  const root = parts.slice(-2).join(".");
  const direct = NS_SUFFIX_TO_PROVIDER.find((entry) => entry.suffix === root || lowered.includes(entry.suffix));
  if (direct) return direct;
  const labelMatch = matchRegistrarLabel(root);
  if (labelMatch) return labelMatch;
  const brand = titleCase(parts[parts.length - 2]);
  if (brand.length >= 3) return { suffix: root, id: root.replace(/\./g, "-"), name: brand };
  return null;
}

async function fetchRdap(url: string): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(url, { headers: { Accept: "application/rdap+json, application/json" } });
    if (!response.ok) return null;
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function detectViaRdap(domainName: string) {
  const tld = domainName.split(".").pop() || "com";
  const urls = [
    `https://rdap.org/domain/${encodeURIComponent(domainName)}`,
    `https://rdap.verisign.com/${tld}/v1/domain/${encodeURIComponent(domainName)}`
  ];

  for (const url of urls) {
    const data = await fetchRdap(url);
    if (!data) continue;
    const entities = Array.isArray(data.entities) ? data.entities : [];
    for (const entity of entities) {
      if (!entity || typeof entity !== "object") continue;
      const roles = (entity as { roles?: string[] }).roles;
      if (!roles?.includes("registrar")) continue;
      const vcard = (entity as { vcardArray?: unknown[] }).vcardArray?.[1];
      if (!Array.isArray(vcard)) continue;
      for (const row of vcard) {
        if (!Array.isArray(row) || row[0] !== "fn") continue;
        const match = matchRegistrarLabel(String(row[3] || ""));
        if (match) return match;
      }
    }
  }
  return null;
}

async function resolveNsViaDoh(domainName: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domainName)}&type=NS`,
      { headers: { Accept: "application/dns-json" } }
    );
    if (!response.ok) return [];
    const data = (await response.json()) as { Answer?: { type: number; data: string }[] };
    return (data.Answer || [])
      .filter((answer) => answer.type === 2)
      .map((answer) => answer.data.replace(/\.$/, "").toLowerCase());
  } catch {
    return [];
  }
}

/** Proxied Cloudflare CNAMEs often hide from Node resolveCname — DoH still returns the target. */
async function resolveCnameViaDoh(hostname: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=CNAME`,
      { headers: { Accept: "application/dns-json" } }
    );
    if (!response.ok) return [];
    const data = (await response.json()) as { Answer?: { type: number; data: string }[] };
    return (data.Answer || [])
      .filter((answer) => answer.type === 5)
      .map((answer) => answer.data.replace(/\.$/, "").toLowerCase());
  } catch {
    return [];
  }
}

/** Proxied orange-cloud records expose Cloudflare edge A answers, not CNAME, in public DNS. */
async function resolve4ViaDoh(hostname: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`,
      { headers: { Accept: "application/dns-json" } }
    );
    if (!response.ok) return [];
    const data = (await response.json()) as { Answer?: { type: number; data: string }[] };
    return (data.Answer || [])
      .filter((answer) => answer.type === 1)
      .map((answer) => answer.data.trim());
  } catch {
    return [];
  }
}

export type DnsProviderDetection = {
  domainName: string;
  providerId: string;
  providerName: string;
  nameservers: string[];
};

export async function detectDnsProvider(hostname: string): Promise<DnsProviderDetection> {
  const domainName = normalizeHostname(hostname);
  const zoneDomain = getDnsZoneDomain(domainName);
  let nameservers = (await safeResolve(() => resolveNs(zoneDomain))) || [];
  if (nameservers.length === 0) {
    nameservers = await resolveNsViaDoh(zoneDomain);
  }
  nameservers = nameservers.map((item) => item.toLowerCase().replace(/\.$/, ""));

  const match = matchProvider(nameservers);
  if (match) {
    return { domainName, providerId: match.id, providerName: match.name, nameservers };
  }

  const rdapMatch = await detectViaRdap(zoneDomain);
  if (rdapMatch) {
    return { domainName, providerId: rdapMatch.id, providerName: rdapMatch.name, nameservers };
  }

  if (nameservers.length > 0) {
    const inferred = inferFromNameserver(nameservers[0]);
    if (inferred) {
      return { domainName, providerId: inferred.id, providerName: inferred.name, nameservers };
    }
  }

  return {
    domainName,
    providerId: "unknown",
    providerName: "DNS Provider",
    nameservers
  };
}

export type DnsVerification = {
  verified: boolean;
  expectedTarget: string;
  cnames: string[];
  addresses: string[];
  txtRecords: string[];
  checkedAt: string;
  message: string;
};

/** Cloudflare orange-cloud returns anycast edge IPs, not the origin A record value. */
function isLikelyCloudflareProxyIp(ip: string): boolean {
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return false;
  const [a, b] = ip.split(".").map(Number);
  if (a === 104 && b >= 16 && b <= 31) return true;
  if (a === 172 && b >= 64 && b <= 71) return true;
  if (a === 103 && (b === 21 || b === 22 || b === 31)) return true;
  if (a === 141 && b === 101) return true;
  if (a === 108 && b === 162) return true;
  if (a === 190 && b === 93) return true;
  if (a === 188 && b === 114) return true;
  if (a === 197 && b === 234) return true;
  if (a === 198 && b === 41) return true;
  return false;
}

/**
 * Root: A @ → platform IP. Subdomain: CNAME → platform hostname.
 */
export async function verifyDomainDns(hostname: string): Promise<DnsVerification> {
  const host = normalizeHostname(hostname);
  const expectedARecord = resolveCustomDomainATarget();
  const kind = getCustomDomainKind(host);

  if (!kind) {
    return {
      verified: false,
      expectedTarget: expectedARecord,
      cnames: [],
      addresses: [],
      txtRecords: [],
      checkedAt: new Date().toISOString(),
      message: "Enter a root domain or subdomain, for example yourdomain.com or name.yourdomain.com."
    };
  }

  if (kind === "subdomain") {
    const expectedCname = resolveCnameTarget();
    const [nodeCnames, dohCnames, reachable, nodeA, dohA] = await Promise.all([
      safeResolve(() => resolveCname(host)),
      resolveCnameViaDoh(host),
      verifyHostnameReachability(host),
      safeResolve(() => resolve4(host)),
      resolve4ViaDoh(host)
    ]);
    const resolvedCnames = [...new Set([...(nodeCnames || []), ...dohCnames])];
    const aRecords = [...new Set([...(nodeA || []), ...dohA])];
    let cnameOk = cnameMatchesTarget(resolvedCnames, expectedCname);

    // Orange-cloud proxied CNAMEs flatten to Cloudflare edge A records in public DNS.
    if (!cnameOk && aRecords.some(isLikelyCloudflareProxyIp)) {
      cnameOk = true;
    }

    let verified = cnameOk || reachable;
    const hostLabel = getSubdomainHostLabel(host);
    let message = verified
      ? cnameOk
        ? resolvedCnames.length > 0
          ? "DNS CNAME points to KEYLINK360."
          : "DNS CNAME configured at Cloudflare (proxied)."
        : "DNS routes to KEYLINK360 (live HTTPS check passed)."
      : `Add a CNAME record at your DNS provider: Host ${hostLabel} → ${expectedCname}. Do not use an A record for subdomains.`;

    if (!verified) {
      const detection = await detectDnsProvider(getDnsZoneDomain(host));
      const label =
        detection.providerId !== "unknown" && detection.providerName !== "DNS Provider"
          ? detection.providerName
          : "your DNS provider";
      message += ` At ${label}, set CNAME ${hostLabel} → ${expectedCname} and remove any A record for ${hostLabel}.`;
    }

  return {
      verified,
      expectedTarget: expectedCname,
      cnames: resolvedCnames,
      addresses: aRecords,
      txtRecords: [],
      checkedAt: new Date().toISOString(),
      message
    };
  }

  const [apexV4, apexV6, aTargetV4] = await Promise.all([
    safeResolve(() => resolve4(host)),
    safeResolve(() => resolve6(host)),
    safeResolve(() => resolve4(expectedARecord))
  ]);

  const aRecordAddresses = new Set([
    ...(aTargetV4 || []),
    ...(expectedARecord.match(/^\d+\.\d+\.\d+\.\d+$/) ? [expectedARecord] : [])
  ]);

  const apexAddresses = [...(apexV4 || []), ...(apexV6 || [])];
  const addresses = apexAddresses;

  const apexMatches =
    apexAddresses.some((address) => aRecordAddresses.has(address)) ||
    apexAddresses.some(isLikelyCloudflareProxyIp);

  let verified = apexMatches;
  let message = verified
    ? "DNS A record points to KEYLINK360."
    : `Add an A record at your DNS provider: Host @ → ${expectedARecord}. Root domains use A records only.`;

  if (!verified) {
    verified = await verifyHostnameReachability(host);
    if (verified) {
      message = "DNS points to KEYLINK360 (live HTTPS check passed).";
    }
  }

  if (!verified) {
    const detection = await detectDnsProvider(getDnsZoneDomain(host));
    const label =
      detection.providerId !== "unknown" && detection.providerName !== "DNS Provider"
        ? detection.providerName
        : "your DNS provider";
    message += ` At ${label}, set @ A → ${expectedARecord} and remove conflicting records.`;
  }

  return {
    verified,
    expectedTarget: expectedARecord,
    cnames: [],
    addresses,
    txtRecords: [],
    checkedAt: new Date().toISOString(),
    message
  };
}

function normalizeDnsTarget(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

function cnameMatchesTarget(cnames: string[], expectedHost: string): boolean {
  const expected = normalizeDnsTarget(expectedHost);
  return cnames.some((entry) => {
    const normalized = normalizeDnsTarget(entry);
    return normalized === expected || normalized.endsWith(`.${expected}`);
  });
}

export async function domainServesKeyBio(hostname: string): Promise<boolean> {
  return verifyHostnameReachability(normalizeHostname(hostname));
}

export async function verifyHostnameReachability(hostname: string): Promise<boolean> {
  if (await fetchHealthJson(hostname)) return true;
  return fetchHealthJsonNode(hostname);
}

async function readHealthOk(response: Response): Promise<boolean> {
  if (!response.ok) return false;
  const data = (await response.json().catch(() => null)) as { status?: string } | null;
  return data?.status === "ok";
}

async function fetchHealthJson(hostname: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    // Manual redirects — "follow" can throw on Cloudflare/Railway same-URL loops.
    const response = await fetch(`https://${hostname}/api/health`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "KEYLINK360-DNS-Verify/1.0"
      },
      signal: controller.signal,
      redirect: "manual"
    });
    clearTimeout(timeout);

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location") || "";
      try {
        const loc = new URL(location, `https://${hostname}/api/health`);
        // Same-path bounce (common with orange-cloud CNAMEs) — not live yet.
        if (loc.hostname === hostname && loc.pathname === "/api/health") {
          return false;
        }
      } catch {
        return false;
      }
      return false;
    }

    return readHealthOk(response);
  } catch {
    return false;
  }
}

function fetchHealthJsonNode(hostname: string): Promise<boolean> {
  return new Promise((resolve) => {
    const request = https.get(
      `https://${hostname}/api/health`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "KEYLINK360-DNS-Verify/1.0"
        },
        timeout: 15_000
      },
      (response) => {
        let body = "";
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if ((response.statusCode || 0) < 200 || (response.statusCode || 0) >= 300) {
            resolve(false);
            return;
          }
          try {
            const data = JSON.parse(body) as { status?: string };
            resolve(data.status === "ok");
          } catch {
            resolve(false);
          }
        });
      }
    );
    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });
    request.on("error", () => resolve(false));
  });
}
