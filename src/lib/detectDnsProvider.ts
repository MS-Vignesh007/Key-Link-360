export type DnsProviderMatch = {
  id: string;
  name: string;
  suffix: string;
};

/** Nameserver suffix → registrar/DNS host. Longer / specific entries first. */
export const DNS_PROVIDER_MATCHERS: DnsProviderMatch[] = [
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

export function matchProviderFromNameservers(nameservers: string[]): DnsProviderMatch | null {
  for (const nameserver of nameservers) {
    const lowered = nameserver.toLowerCase().replace(/\.$/, "");
    for (const entry of DNS_PROVIDER_MATCHERS) {
      if (lowered === entry.suffix || lowered.endsWith(`.${entry.suffix}`) || lowered.includes(entry.suffix)) {
        return entry;
      }
    }
  }
  return null;
}

function matchRegistrarLabel(label: string): DnsProviderMatch | null {
  for (const hint of REGISTRAR_LABEL_HINTS) {
    if (hint.pattern.test(label)) {
      return { suffix: "", id: hint.id, name: hint.name };
    }
  }
  return null;
}

function titleCase(value: string): string {
  return value
    .split(/[\s.-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function inferFromNameserver(nameserver: string): DnsProviderMatch | null {
  const lowered = nameserver.toLowerCase().replace(/\.$/, "");
  const parts = lowered.split(".").filter(Boolean);
  if (parts.length < 2) return null;

  const root = parts.slice(-2).join(".");
  const direct = DNS_PROVIDER_MATCHERS.find((entry) => entry.suffix === root || lowered.includes(entry.suffix));
  if (direct) return direct;

  const labelMatch = matchRegistrarLabel(root);
  if (labelMatch) return labelMatch;

  const brand = titleCase(parts[parts.length - 2]);
  if (brand.length >= 3) {
    return { suffix: root, id: root.replace(/\./g, "-"), name: brand };
  }
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

async function detectViaRdap(domainName: string): Promise<DnsProviderMatch | null> {
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
        const label = String(row[3] || "");
        const match = matchRegistrarLabel(label);
        if (match) return match;
      }
    }
  }

  return null;
}

export async function fetchNameserversViaDoh(domainName: string): Promise<string[]> {
  const query = encodeURIComponent(domainName.replace(/\.$/, ""));
  const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${query}&type=NS`, {
    headers: { Accept: "application/dns-json" }
  });
  if (!response.ok) return [];
  const data = (await response.json()) as {
    Answer?: { type: number; data: string }[];
  };
  return (data.Answer || [])
    .filter((answer) => answer.type === 2)
    .map((answer) => answer.data.replace(/\.$/, "").toLowerCase());
}

export type DomainAnalysisResult = {
  domainName: string;
  providerId: string;
  providerName: string;
  nameservers: string[];
};

export async function analyzeDomainClient(domainName: string): Promise<DomainAnalysisResult> {
  const host = domainName.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\.$/, "");
  const nameservers = await fetchNameserversViaDoh(host);

  let match = matchProviderFromNameservers(nameservers);
  if (!match) {
    match = await detectViaRdap(host);
  }
  if (!match && nameservers.length > 0) {
    match = inferFromNameserver(nameservers[0]);
  }

  const providerId = match?.id ?? "unknown";
  const providerName = match?.name ?? "DNS Provider";

  return {
    domainName: host,
    providerId,
    providerName,
    nameservers
  };
}

export async function resolveDomainAnalysis(domainName: string): Promise<DomainAnalysisResult> {
  return analyzeDomainClient(domainName);
}
