import { apiUrl } from "./apiBase";
import {
  isPlatformApexHostname,
  isPlatformSubdomainHostname,
  parsePlatformSubdomainSlug
} from "./platformSubdomain";

export type BrandedPageResolve = {
  pageId: string;
  title?: string | null;
  slug?: string | null;
  bio?: string | null;
  coverPhoto?: string | null;
};

export function currentHostname() {
  return window.location.hostname.toLowerCase().replace(/:\d+$/, "");
}

export function isPlatformHostname(hostname = currentHostname()) {
  if (isPlatformSubdomainHostname(hostname)) return false;
  return isPlatformApexHostname(hostname);
}

/**
 * Resolve which published bio page a branded hostname should open.
 * Always hits the public API for the current hostname (never trust a stale cookie).
 */
export async function resolveBrandedDomainPageId(
  hostname = currentHostname()
): Promise<string | null> {
  const resolved = await resolveBrandedDomain(hostname);
  return resolved?.pageId || null;
}

export async function resolveBrandedDomain(
  hostname = currentHostname()
): Promise<BrandedPageResolve | null> {
  if (isPlatformHostname(hostname)) return null;

  const platformSlug = parsePlatformSubdomainSlug(hostname);
  if (platformSlug) {
    try {
      const response = await fetch(
        apiUrl(`/api/public/platform-subdomain/${encodeURIComponent(platformSlug)}`),
        { headers: { Accept: "application/json" } }
      );
      if (response.ok) {
        const data = (await response.json()) as BrandedPageResolve & { pageId?: string };
        if (!data.pageId) return null;
        return {
          pageId: data.pageId,
          title: data.title ?? null,
          slug: data.slug ?? null,
          bio: data.bio ?? null,
          coverPhoto: data.coverPhoto ?? null
        };
      }
    } catch {
      /* fall through */
    }
  }

  try {
    const response = await fetch(
      apiUrl(`/api/public/custom-domain/${encodeURIComponent(hostname)}`),
      { headers: { Accept: "application/json" } }
    );
    if (!response.ok) return null;
    const data = (await response.json()) as BrandedPageResolve & { pageId?: string };
    if (!data.pageId) return null;
    return {
      pageId: data.pageId,
      title: data.title ?? null,
      slug: data.slug ?? null,
      bio: data.bio ?? null,
      coverPhoto: data.coverPhoto ?? null
    };
  } catch {
    return null;
  }
}

export function stripPreviewQueryFromUrl() {
  if (!window.location.search.includes("previewPageId")) return;
  window.history.replaceState({}, "", window.location.pathname);
}
