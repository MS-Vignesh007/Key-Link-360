import type { PlatformSubdomain } from "../types";
import { apiUrl } from "./apiBase";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  isPreviewToken,
  refreshSession
} from "./authApi";

export class PlatformSubdomainApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "PLATFORM_SUBDOMAIN_FAILED") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function fetchJson<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = getAccessToken();
  if (isPreviewToken(token)) {
    throw new PlatformSubdomainApiError(
      "Sign in with a real account to claim a free KEY address.",
      401,
      "PREVIEW_SESSION"
    );
  }

  const headers = new Headers(init.headers || {});
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(apiUrl(path), { ...init, headers, credentials: "include" });
  } catch {
    throw new PlatformSubdomainApiError("Could not reach KEYLINK360.", 0, "NETWORK_ERROR");
  }

  if (response.status === 401 && retry && getRefreshToken()) {
    try {
      await refreshSession();
      return fetchJson<T>(path, init, false);
    } catch {
      clearAuthSession("session_expired");
    }
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new PlatformSubdomainApiError(
      data?.error || "Request failed.",
      response.status,
      data?.code || "PLATFORM_SUBDOMAIN_FAILED"
    );
  }
  return data as T;
}

export async function fetchPlatformSubdomains(): Promise<PlatformSubdomain[]> {
  const result = await fetchJson<{ subdomains: PlatformSubdomain[] }>("/api/platform-subdomains");
  return result.subdomains;
}

export async function checkPlatformSlugAvailability(
  slug: string
): Promise<{ available: boolean; hostname: string; reason: string | null }> {
  const response = await fetch(
    apiUrl(`/api/platform-subdomains/check-slug?slug=${encodeURIComponent(slug.trim().toLowerCase())}`),
    { headers: { Accept: "application/json" } }
  );
  const data = (await response.json().catch(() => null)) as {
    available?: boolean;
    hostname?: string;
    reason?: string | null;
  } | null;
  if (!response.ok) {
    throw new PlatformSubdomainApiError(data?.reason || "Could not check name.", response.status);
  }
  return {
    available: Boolean(data?.available),
    hostname: data?.hostname || "",
    reason: data?.reason ?? null
  };
}

export async function createPlatformSubdomain(
  slug: string,
  pageId: string
): Promise<PlatformSubdomain> {
  const result = await fetchJson<{ subdomain: PlatformSubdomain }>("/api/platform-subdomains", {
    method: "POST",
    body: JSON.stringify({ slug, pageId })
  });
  return result.subdomain;
}

export async function deletePlatformSubdomain(id: string): Promise<void> {
  await fetchJson<{ success: boolean }>(`/api/platform-subdomains/${id}`, { method: "DELETE" });
}

export async function fetchPlatformSubdomainConfig(): Promise<{
  baseHostname: string;
  pattern: string;
  example: string;
}> {
  const response = await fetch(apiUrl("/api/platform-subdomains/config"), {
    headers: { Accept: "application/json" }
  });
  const data = (await response.json().catch(() => null)) as {
    baseHostname?: string;
    pattern?: string;
    example?: string;
  } | null;
  if (!response.ok || !data?.baseHostname) {
    throw new PlatformSubdomainApiError("Could not load free address settings.", response.status);
  }
  return {
    baseHostname: data.baseHostname,
    pattern: data.pattern || `{slug}.${data.baseHostname}`,
    example: data.example || `yourname.${data.baseHostname}`
  };
}
