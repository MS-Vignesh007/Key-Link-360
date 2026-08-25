import { normalizeHostname, resolvePlatformHostname } from "../domains/hostname";

export const RESERVED_PLATFORM_SLUGS = new Set([
  "www",
  "api",
  "app",
  "admin",
  "mail",
  "cdn",
  "static",
  "assets",
  "keylink360",
  "keyslink",
  "mindflo",
  "support",
  "help",
  "status",
  "blog",
  "docs"
]);

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function normalizePlatformSlug(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split(".")[0]
    .replace(/[^a-z0-9-]/g, "");
}

export function platformSubdomainBase(): string {
  return resolvePlatformHostname();
}

export function buildPlatformSubdomainHostname(slug: string): string {
  return `${normalizePlatformSlug(slug)}.${platformSubdomainBase()}`;
}

export function parsePlatformSubdomainSlug(hostname: string): string | null {
  const host = normalizeHostname(hostname);
  const base = platformSubdomainBase();
  if (!host.endsWith(`.${base}`)) return null;
  const slug = host.slice(0, -(base.length + 1));
  if (!slug || slug.includes(".")) return null;
  if (RESERVED_PLATFORM_SLUGS.has(slug)) return null;
  if (!SLUG_PATTERN.test(slug)) return null;
  return slug;
}

export function isPlatformSubdomainHostname(hostname: string): boolean {
  return parsePlatformSubdomainSlug(hostname) !== null;
}

export function isPlatformApexHostname(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  if (!host || host === "localhost" || host === "127.0.0.1") return true;
  if (
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovableproject.com") ||
    host.endsWith(".lovable.dev")
  ) {
    return true;
  }
  if (host.endsWith(".up.railway.app")) return true;
  return host === platformSubdomainBase();
}

export function validatePlatformSlug(slug: string): string | null {
  const normalized = normalizePlatformSlug(slug);
  if (!normalized) return "Enter a short name for your free KEY address.";
  if (normalized.length < 3) return "Use at least 3 characters (letters, numbers, hyphens).";
  if (normalized.length > 63) return "Keep the name under 63 characters.";
  if (!SLUG_PATTERN.test(normalized)) {
    return "Use letters, numbers, and hyphens only. Cannot start or end with a hyphen.";
  }
  if (RESERVED_PLATFORM_SLUGS.has(normalized)) {
    return "That name is reserved. Choose another.";
  }
  return null;
}
