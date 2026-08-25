import { normalizeHostname, resolvePlatformHostname } from "../domains/hostname";

export function linkRotatorPlatformHostname(): string {
  return resolvePlatformHostname();
}

export function normalizeLinkRotatorHost(value: unknown): string {
  const host = normalizeHostname(value);
  return host || linkRotatorPlatformHostname();
}

export function isPlatformLinkRotatorHost(hostname: string): boolean {
  return normalizeLinkRotatorHost(hostname) === linkRotatorPlatformHostname();
}

export function buildLinkRotatorPublicUrl(slug: string, hostDomain?: string): string {
  const host = normalizeLinkRotatorHost(hostDomain);
  return `https://${host}/r/${slug}`;
}
