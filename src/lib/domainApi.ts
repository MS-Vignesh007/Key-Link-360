import type { CustomDomain, CustomDomainDnsRecordTemplate, CustomDomainPlatformConfig } from "../types";
import { analyzeDomainClient } from "./detectDnsProvider";
import { sanitizeARecordTarget } from "./customDomainDns";
import { apiUrl } from "./apiBase";
import {
  clearAuthSession,
  ensureAuthSession,
  getAccessToken,
  getRefreshToken,
  isPreviewToken,
  refreshSession
} from "./authApi";

export class DomainApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "DOMAIN_REQUEST_FAILED") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function domainFetch<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = getAccessToken();
  if (isPreviewToken(token)) {
    throw new DomainApiError(
      "Custom domains need a full sign-in. Sign out, then log in with your email and password (not preview/demo mode).",
      401,
      "PREVIEW_SESSION"
    );
  }

  const headers = new Headers(init.headers || {});
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const controller = new AbortController();
  const timeoutMs = 20_000;
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  if (init.signal) {
    if (init.signal.aborted) controller.abort();
    else init.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...init,
      headers,
      credentials: "include",
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new DomainApiError(
        "Domain service timed out (database busy). Tap Retry — if it keeps failing, Supabase is slow.",
        0,
        "TIMEOUT"
      );
    }
    throw new DomainApiError("Could not reach the domain service.", 0, "NETWORK_ERROR");
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (response.status === 401 && retry && getRefreshToken()) {
    try {
      await refreshSession();
      return domainFetch<T>(path, init, false);
    } catch {
      clearAuthSession("session_expired");
    }
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const code = data?.code || "DOMAIN_REQUEST_FAILED";
    const authExpired =
      response.status === 401 &&
      (code === "SESSION_EXPIRED" ||
        code === "TOKEN_EXPIRED" ||
        code === "NO_TOKEN" ||
        code === "REFRESH_EXPIRED" ||
        /session expired|unauthorized|sign in/i.test(String(data?.error || "")));
    throw new DomainApiError(
      authExpired
        ? "Your login expired. Please sign in again, then tap Connect Cloudflare."
        : data?.error || "Domain request failed.",
      response.status,
      authExpired ? "SESSION_EXPIRED" : code
    );
  }
  return data as T;
}

let platformConfigCache: CustomDomainPlatformConfig | null = null;
let platformConfigInflight: Promise<CustomDomainPlatformConfig> | null = null;

export async function fetchCustomDomainPlatformConfig(force = false): Promise<CustomDomainPlatformConfig> {
  if (!force && platformConfigCache) {
    return platformConfigCache;
  }
  if (!force && platformConfigInflight) return platformConfigInflight;

  platformConfigInflight = (async () => {
    let response: Response;
    try {
      response = await fetch(apiUrl("/api/domains/config"), {
        method: "GET",
        headers: { Accept: "application/json" }
      });
    } catch {
      throw new DomainApiError("Could not reach the domain service.", 0, "NETWORK_ERROR");
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new DomainApiError(
        data?.error || "Could not load domain settings.",
        response.status,
        data?.code || "DOMAIN_CONFIG_FAILED"
      );
    }
    const rawTarget = (data as CustomDomainPlatformConfig).aRecordTarget;
    const sanitizedTarget = sanitizeARecordTarget(rawTarget);
    const config = {
      ...(data as CustomDomainPlatformConfig),
      aRecordTarget: sanitizedTarget
    };
    platformConfigCache = config;
    return config;
  })();

  try {
    return await platformConfigInflight;
  } finally {
    platformConfigInflight = null;
  }
}

export async function fetchDomains(): Promise<CustomDomain[]> {
  const result = await domainFetch<{ domains: CustomDomain[] }>("/api/domains");
  return result.domains;
}

export type DomainAnalysis = {
  domainName: string;
  providerId: string;
  providerName: string;
  nameservers: string[];
};

export async function analyzeDomain(domainName: string): Promise<DomainAnalysis> {
  const host = domainName.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\.$/, "");

  let serverResult: DomainAnalysis | null = null;
  try {
    const response = await fetch(
      apiUrl(`/api/domains/analyze?domainName=${encodeURIComponent(host)}`),
      { headers: { Accept: "application/json" } }
    );
    if (response.ok) {
      const data = (await response.json()) as { analysis?: DomainAnalysis };
      serverResult = data.analysis ?? null;
    }
  } catch {
    // fall through to client-side lookup
  }

  const clientResult = await analyzeDomainClient(host);

  if (serverResult && serverResult.providerId !== "unknown") return serverResult;
  if (clientResult.providerId !== "unknown") return clientResult;
  if (serverResult && serverResult.providerName !== "your DNS provider") return serverResult;
  return clientResult;
}

export async function checkDomainDns(domainName: string): Promise<{
  verified: boolean;
  message: string;
}> {
  const result = await domainFetch<{ dns: { verified: boolean; message: string } }>(
    "/api/domains/check-dns",
    {
      method: "POST",
      body: JSON.stringify({ domainName })
    }
  );
  return { verified: result.dns.verified, message: result.dns.message };
}

export type DomainConnectResult = {
  domain: CustomDomain;
  dnsAutoProvisioned?: boolean;
  dnsProvisionMessage?: string | null;
  dnsProviderId?: string;
  providerConnected?: boolean;
  needsOAuth?: boolean;
  oauthAuthorizeUrl?: string | null;
  fallbackManual?: boolean;
};

export async function connectDomain(
  domainName: string,
  pageId: string,
  options?: {
    cloudflareApiToken?: string;
    accessToken?: string;
    dnsProviderId?: string;
    rememberProvider?: boolean;
  }
): Promise<DomainConnectResult> {
  const result = await domainFetch<DomainConnectResult>("/api/domains", {
    method: "POST",
    body: JSON.stringify({
      domainName,
      pageId,
      cloudflareApiToken: options?.cloudflareApiToken?.trim() || options?.accessToken?.trim() || undefined,
      accessToken: options?.accessToken?.trim() || options?.cloudflareApiToken?.trim() || undefined,
      dnsProviderId: options?.dnsProviderId || undefined,
      rememberProvider: options?.rememberProvider
    })
  });
  return result;
}

export async function fetchDomainPreferences() {
  return domainFetch<{
    preferredDnsProvider: string | null;
    cloudflareOAuthEnabled?: boolean;
    connections: Array<{
      id: string;
      providerId: string;
      providerAccountId?: string | null;
      connected: boolean;
      hasToken: boolean;
      hasRefreshToken?: boolean;
      tokenExpiresAt?: string | null;
      connectedAt?: string | null;
      updatedAt?: string;
      providerName?: string;
    }>;
    providers: import("../types").DnsProviderCapability[];
  }>("/api/domains/preferences");
}

export async function disconnectCloudflareConnection() {
  return domainFetch<{ success: boolean; connected: boolean; message: string }>(
    "/api/domains/providers/cloudflare/connection",
    { method: "DELETE" }
  );
}

export async function saveDomainPreferences(preferredDnsProvider: string) {
  return domainFetch<{ success: boolean; preferredDnsProvider: string }>("/api/domains/preferences", {
    method: "PUT",
    body: JSON.stringify({ preferredDnsProvider })
  });
}

export type CloudflareBeginResult =
  | {
      mode: "oauth";
      authorizeUrl: string;
      accountMismatch?: boolean;
      sameAccount?: boolean;
      message?: string;
    }
  | { mode: "manual"; message: string };

/** One-click Cloudflare connect — never asks the customer for an API token. */
export async function beginCloudflareConnect(domainName: string, pageId: string) {
  const ok = await ensureAuthSession();
  if (!ok) {
    clearAuthSession("session_expired");
    throw new DomainApiError(
      "Your login expired. Please sign in again, then tap Connect Cloudflare.",
      401,
      "SESSION_EXPIRED"
    );
  }
  return domainFetch<CloudflareBeginResult>("/api/domains/providers/cloudflare/begin", {
    method: "POST",
    body: JSON.stringify({ domainName, pageId })
  });
}

export type DomainConnectionTest = {
  dnsVerified: boolean;
  dnsMessage: string;
  servesKey: boolean;
  sslAutomatic: boolean;
  connectionState: "live" | "connecting" | "offline";
  summary: string;
  nextStep: string | null;
};

export async function testDomainConnection(
  id: string
): Promise<{ test: DomainConnectionTest; domain: CustomDomain }> {
  return domainFetch<{ test: DomainConnectionTest; domain: CustomDomain }>(
    `/api/domains/${id}/test-connection`,
    { method: "POST" }
  );
}

export async function repairDomainDns(
  id: string,
  cloudflareApiToken: string
): Promise<DomainConnectResult & { dns?: { verified: boolean; message: string } }> {
  return domainFetch(`/api/domains/${id}/repair-dns`, {
    method: "POST",
    body: JSON.stringify({ cloudflareApiToken: cloudflareApiToken.trim() })
  });
}

export async function checkDomainServesKey(id: string): Promise<{ servesKey: boolean; message: string | null }> {
  return domainFetch<{ servesKey: boolean; message: string | null }>(`/api/domains/${id}/serves-key`);
}

export type DomainVerifyResult = {
  domain: CustomDomain;
  dns?: {
    verified: boolean;
    message: string;
  };
};

export async function verifyDomain(id: string): Promise<DomainVerifyResult> {
  const result = await domainFetch<{
    domain: CustomDomain;
    dns?: { verified: boolean; message: string };
  }>(`/api/domains/${id}/verify`, {
    method: "POST"
  });
  return { domain: result.domain, dns: result.dns };
}

export type DeleteDomainResult = {
  success: boolean;
  domainName: string;
  dnsCleanup?: {
    success: boolean;
    attempted: boolean;
    removed: number;
    message: string;
  };
};

export async function deleteDomain(id: string): Promise<DeleteDomainResult> {
  return domainFetch<DeleteDomainResult>(`/api/domains/${id}`, { method: "DELETE" });
}

export async function patchDomainPage(id: string, pageId: string): Promise<CustomDomain> {
  const result = await domainFetch<{ domain: CustomDomain }>(`/api/domains/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ pageId })
  });
  return result.domain;
}

export async function fetchDomainDnsRecords(id: string): Promise<{
  domainName: string;
  kind: "root" | "subdomain";
  records: CustomDomainDnsRecordTemplate[];
  ownershipVerification: Record<string, unknown> | null;
}> {
  return domainFetch(`/api/domains/${id}/dns-records`);
}
