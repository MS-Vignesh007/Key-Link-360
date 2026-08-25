export function labelCount(hostname: string): number {
  return hostname.trim().toLowerCase().replace(/\.$/, "").split(".").filter(Boolean).length;
}

/** KEYLINK360 production server IP for root domain A records (@). */
export const KEYLINK360_A_RECORD_TARGET = "69.46.46.90";
export const KEYS_LINK_A_RECORD_TARGET = KEYLINK360_A_RECORD_TARGET;

/** Lovable/Vercel demo IP copied from reference docs — never show to KEY users. */
const LOVABLE_DEMO_A_RECORD_TARGET = "76.76.21.21";

export function sanitizeARecordTarget(value: string | undefined | null): string {
  const trimmed = String(value || "").trim();
  if (!trimmed || trimmed === LOVABLE_DEMO_A_RECORD_TARGET) {
    return KEYLINK360_A_RECORD_TARGET;
  }
  return trimmed;
}

function getLabels(hostname: string): string[] {
  return hostname.trim().toLowerCase().replace(/\.$/, "").split(".").filter(Boolean);
}

export function normalizeCustomHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0].replace(/\.$/, "");
}

/** Root domain: yourdomain.com (exactly two labels, not starting with www). */
export function isRootDomain(hostname: string): boolean {
  const labels = getLabels(hostname);
  return labels.length === 2 && labels[0] !== "www";
}

/** Subdomain: name.yourdomain.com, www.yourdomain.com, shop.yourdomain.com */
export function isSubdomain(hostname: string): boolean {
  const labels = getLabels(hostname);
  return labels.length >= 3;
}

export function getCustomDomainKind(hostname: string): "root" | "subdomain" | null {
  if (isSubdomain(hostname)) return "subdomain";
  if (isRootDomain(hostname)) return "root";
  return null;
}

/** Root domain or subdomain (e.g. yourdomain.com or name.yourdomain.com). */
export function isSupportedCustomDomain(hostname: string): boolean {
  return isRootDomain(hostname) || isSubdomain(hostname);
}

/** DNS zone for provider login (yourdomain.com for name.yourdomain.com). */
export function getDnsZoneDomain(hostname: string): string {
  const labels = getLabels(hostname);
  if (labels.length <= 2) return labels.join(".");
  return labels.slice(-2).join(".");
}

/** Host label to enter at the DNS provider for a subdomain record. */
export function getSubdomainHostLabel(hostname: string): string {
  const labels = getLabels(hostname);
  if (labels.length <= 2) return "@";
  return labels.slice(0, -2).join(".");
}

export function getDnsRootDomain(hostname: string): string {
  return normalizeCustomHostname(hostname);
}

export type DnsRecordType = "A" | "CNAME" | "TXT";

export interface DnsRecordInstruction {
  id: string;
  type: DnsRecordType;
  hostLabel: string;
  hostDisplay: string;
  value: string;
}

export interface DnsInstructionSet {
  domainName: string;
  rootDomain: string;
  kind: "root" | "subdomain";
  records: DnsRecordInstruction[];
}

export function resolveCnameTarget(explicitTarget?: string, platformUrl?: string): string {
  const fromEnv = explicitTarget?.trim().replace(/^https?:\/\//, "").split("/")[0];
  if (fromEnv) return fromEnv;

  const candidates = [
    platformUrl,
    typeof import.meta !== "undefined" ? (import.meta.env.VITE_API_URL as string | undefined) : undefined,
    typeof import.meta !== "undefined" ? (import.meta.env.VITE_APP_URL as string | undefined) : undefined
  ].filter(Boolean);

  for (const raw of candidates) {
    try {
      const hostname = new URL(String(raw).includes("://") ? String(raw) : `https://${raw}`).hostname.toLowerCase();
      if (hostname && hostname !== "localhost" && !hostname.startsWith("127.")) {
        return hostname;
      }
    } catch {
      /* ignore */
    }
  }
  return "keylink360.mindflo.today";
}

/**
 * DNS rules:
 * - Root (example.com): A @ → hosting IP
 * - Subdomain (king.example.com, www.example.com): CNAME → hosting hostname
 */
export function buildDnsRecordSet(
  domainName: string,
  aRecordTarget: string,
  options?: { cnameTarget?: string }
): DnsInstructionSet {
  const host = normalizeCustomHostname(domainName);
  const kind = getCustomDomainKind(host);
  const aTarget = sanitizeARecordTarget(aRecordTarget);
  const cnameTarget = resolveCnameTarget(options?.cnameTarget);

  if (kind === "root") {
    return {
      domainName: host,
      rootDomain: host,
      kind: "root",
      records: [
        {
          id: "root-apex-a",
          type: "A",
          hostLabel: "@",
          hostDisplay: "@ (root)",
          value: aTarget
        }
      ]
    };
  }

  const hostLabel = getSubdomainHostLabel(host);
  return {
    domainName: host,
    rootDomain: getDnsZoneDomain(host),
    kind: "subdomain",
    records: [
      {
        id: "subdomain-cname",
        type: "CNAME",
        hostLabel,
        hostDisplay: hostLabel,
        value: cnameTarget
      }
    ]
  };
}

export function customDomainValidationError(hostname: string): string | null {
  const host = normalizeCustomHostname(hostname);
  const labels = getLabels(host);
  if (labels.length === 0) {
    return "Enter your root domain or subdomain, for example yourdomain.com or name.yourdomain.com.";
  }
  if (labels.length === 1) {
    return "Enter a full address like yourdomain.com or name.yourdomain.com.";
  }
  if (labels[0] === "www" && labels.length === 2) {
    return "Enter the full domain, for example yourdomain.com (root) or www.yourdomain.com (subdomain).";
  }
  if (!isSupportedCustomDomain(host)) {
    return "Enter a valid root domain (yourdomain.com) or subdomain (name.yourdomain.com).";
  }
  return null;
}

export function formatDnsVerifyError(
  hostname: string,
  message: string | null | undefined,
  _aRecordTarget: string
): string | null {
  if (!message?.trim()) return null;
  const host = normalizeCustomHostname(hostname);
  const kind = getCustomDomainKind(host);
  if (kind === "subdomain") {
    const hostLabel = getSubdomainHostLabel(host);
    const cnameTarget = resolveCnameTarget();
    if (/do not use an a record/i.test(message)) return null;
    if (/dns cname points/i.test(message) || /dns cname configured/i.test(message)) return null;
    if (
      new RegExp(`Host ${hostLabel} → \\d+\\.\\d+\\.\\d+\\.\\d+`, "i").test(message) ||
      /Add an A record/i.test(message)
    ) {
      return `Subdomains use CNAME only: Host ${hostLabel} → ${cnameTarget}. Remove any A record for this host.`;
    }
  }
  if (kind === "root" && /cname/i.test(message) && !/@/.test(message)) {
    const aTarget = sanitizeARecordTarget(_aRecordTarget);
    return `Root domains use A record only: Host @ → ${aTarget}.`;
  }
  return message;
}

export function parseOwnershipTxtRecord(
  ownership: Record<string, unknown> | null | undefined
): DnsRecordInstruction | null {
  if (!ownership) return null;
  const type = String(ownership.type || "txt").toLowerCase();
  if (type !== "txt") return null;
  const name = String(ownership.name || ownership.host || "").trim();
  const value = String(ownership.value || "").trim();
  if (!name || !value) return null;
  return {
    id: "ownership-txt",
    type: "TXT",
    hostLabel: name,
    hostDisplay: name,
    value
  };
}
