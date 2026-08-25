import { normalizeHostname, resolvePlatformHostname } from "../domains/hostname";

export function shortLinkPlatformHostname(): string {
  return resolvePlatformHostname();
}

export function normalizeShortLinkHost(value: unknown): string {
  const host = normalizeHostname(value);
  return host || shortLinkPlatformHostname();
}

export function isPlatformShortLinkHost(hostname: string): boolean {
  return normalizeShortLinkHost(hostname) === shortLinkPlatformHostname();
}

export function buildShortLinkPublicUrl(slug: string, hostDomain?: string): string {
  const host = normalizeShortLinkHost(hostDomain);
  return `https://${host}/l/${slug}`;
}
