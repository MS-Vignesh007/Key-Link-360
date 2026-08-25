/** Default A record target for KEYLINK360 on Railway (override with CUSTOM_DOMAIN_A_TARGET). */
export const DEFAULT_CUSTOM_DOMAIN_A_TARGET = "69.46.46.90";

/** Lovable/Vercel demo IP — must never be shown to KEYLINK360 customers. */
export const LOVABLE_DEMO_A_RECORD_TARGET = "76.76.21.21";

const BLOCKED_A_RECORD_TARGETS = new Set([LOVABLE_DEMO_A_RECORD_TARGET]);

export function sanitizeARecordTarget(value: string | undefined | null): string {
  const trimmed = String(value || "").trim();
  if (!trimmed || BLOCKED_A_RECORD_TARGETS.has(trimmed)) {
    if (trimmed && BLOCKED_A_RECORD_TARGETS.has(trimmed)) {
      console.warn(
        `[custom-domains] Ignoring demo IP ${trimmed} (Lovable/Vercel). Using KEYLINK360 IP ${DEFAULT_CUSTOM_DOMAIN_A_TARGET}.`
      );
    }
    return DEFAULT_CUSTOM_DOMAIN_A_TARGET;
  }
  return trimmed;
}

export function normalizeHostname(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .replace(/\.$/, "");
}

function getLabels(hostname: string): string[] {
  return normalizeHostname(hostname).split(".").filter(Boolean);
}

export function isRootDomain(hostname: string): boolean {
  const labels = getLabels(hostname);
  return labels.length === 2 && labels[0] !== "www";
}

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

export function getDnsZoneDomain(hostname: string): string {
  const labels = getLabels(hostname);
  if (labels.length <= 2) return labels.join(".");
  return labels.slice(-2).join(".");
}

export function getSubdomainHostLabel(hostname: string): string {
  const labels = getLabels(hostname);
  if (labels.length <= 2) return "@";
  return labels.slice(0, -2).join(".");
}

/** Map www.yourdomain.com → yourdomain.com for routing lookups. */
export function resolveRoutableHostnameAlias(hostname: string): string {
  const host = normalizeHostname(hostname);
  const labels = getLabels(host);
  if (labels.length === 3 && labels[0] === "www" && isRootDomain(labels.slice(1).join("."))) {
    return labels.slice(1).join(".");
  }
  return host;
}

export function getWwwCompanionHostname(apexHostname: string): string | null {
  const apex = normalizeHostname(apexHostname);
  if (!isRootDomain(apex)) return null;
  return `www.${apex}`;
}

export function resolveCnameTarget(): string {
  const explicit = process.env.CUSTOM_DOMAIN_CNAME_TARGET?.trim();
  if (explicit) {
    return explicit.replace(/^https?:\/\//, "").split("/")[0];
  }

  const candidates = [process.env.API_URL, process.env.APP_URL].filter(Boolean);
  for (const raw of candidates) {
    try {
      const hostname = new URL(raw!.includes("://") ? raw! : `https://${raw}`).hostname.toLowerCase();
      if (hostname && hostname !== "localhost" && !hostname.startsWith("127.")) {
        return hostname;
      }
    } catch {
      /* ignore */
    }
  }
  return "keylink360.mindflo.today";
}

export function resolvePlatformHostname(): string {
  return resolveCnameTarget();
}

export function resolveCustomDomainATarget(): string {
  return sanitizeARecordTarget(process.env.CUSTOM_DOMAIN_A_TARGET);
}

export const CUSTOM_DOMAIN_PATTERN =
  /^(?=.{1,253}$)(?:(?!-)[a-z0-9-]{1,63}(?<!-)\.)+(?!-)[a-z0-9-]{2,63}(?<!-)$/i;

export function customDomainValidationError(hostname: string): string | null {
  const host = normalizeHostname(hostname);
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

export function assertSupportedCustomDomain(hostname: string): string | null {
  if (!CUSTOM_DOMAIN_PATTERN.test(hostname)) {
    return "Enter a valid root domain or subdomain, for example yourdomain.com or name.yourdomain.com.";
  }
  return customDomainValidationError(hostname);
}
