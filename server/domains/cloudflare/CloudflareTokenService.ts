/**
 * CloudflareTokenService — multi-tenant customer tokens ONLY.
 * Platform CLOUDFLARE_API_TOKEN must never write customer DNS.
 */
import {
  getDnsProviderConnection,
  upsertDnsProviderConnection,
  disconnectDnsProviderConnection,
  type DnsProviderConnection
} from "../providers/connections";
import { refreshCloudflareAccessToken } from "./CloudflareOAuthService";

export type CustomerCloudflareToken = {
  accessToken: string;
  accountId: string | null;
  connection: DnsProviderConnection;
  refreshed: boolean;
};

/** True only when explicitly enabling legacy same-account automation (NOT for SaaS multi-tenant). */
export function allowPlatformDnsFallback(): boolean {
  return process.env.ALLOW_PLATFORM_CUSTOMER_DNS === "true";
}

/** Platform tokens — SaaS custom hostnames / Origin Rules only. Never for customer zones by default. */
export function platformCloudflareApiToken(): string {
  return (process.env.CLOUDFLARE_API_TOKEN || "").trim();
}

/**
 * Resolve the access token for THIS customer's Cloudflare account.
 * Does not fall back to platform tokens unless ALLOW_PLATFORM_CUSTOMER_DNS=true.
 */
export async function getCustomerCloudflareToken(
  ownerUserId: string
): Promise<CustomerCloudflareToken | null> {
  const connection = await getDnsProviderConnection(ownerUserId, "cloudflare");
  if (!connection?.connected || !connection.accessToken) return null;

  let accessToken = connection.accessToken;
  let refreshed = false;

  const expiresAt = connection.tokenExpiresAt ? Date.parse(connection.tokenExpiresAt) : NaN;
  const needsRefresh =
    connection.refreshToken &&
    Number.isFinite(expiresAt) &&
    expiresAt - Date.now() < 5 * 60 * 1000;

  if (needsRefresh && connection.refreshToken) {
    try {
      const next = await refreshCloudflareAccessToken(connection.refreshToken);
      accessToken = next.accessToken;
      refreshed = true;
      await upsertDnsProviderConnection({
        ownerUserId,
        providerId: "cloudflare",
        accessToken: next.accessToken,
        refreshToken: next.refreshToken || connection.refreshToken,
        tokenExpiresAt: next.expiresIn
          ? new Date(Date.now() + next.expiresIn * 1000).toISOString()
          : null,
        providerAccountId: connection.providerAccountId,
        connected: true
      });
    } catch (error) {
      console.warn("[CloudflareTokenService] refresh failed:", error);
      // Keep existing access token; caller may get 401 and prompt reconnect.
    }
  }

  return {
    accessToken,
    accountId: connection.providerAccountId,
    connection,
    refreshed
  };
}

/**
 * Tokens to try for customer DNS writes.
 * 1) Explicit request token (rare power-user)
 * 2) Saved OAuth token for this user
 * 3) Platform tokens ONLY if ALLOW_PLATFORM_CUSTOMER_DNS=true (legacy)
 */
export async function resolveCustomerDnsTokens(input: {
  ownerUserId: string;
  preferredToken?: string;
}): Promise<{ tokens: string[]; source: "customer" | "request" | "platform_legacy" | "none" }> {
  const preferred = (input.preferredToken || "").trim();
  if (preferred) {
    return { tokens: [preferred], source: "request" };
  }

  const customer = await getCustomerCloudflareToken(input.ownerUserId);
  if (customer?.accessToken) {
    return { tokens: [customer.accessToken], source: "customer" };
  }

  if (allowPlatformDnsFallback()) {
    const legacy = [
      (process.env.CLOUDFLARE_DNS_API_TOKEN || "").trim(),
      (process.env.CLOUDFLARE_API_TOKEN || "").trim()
    ].filter(Boolean);
    if (legacy.length) {
      console.warn(
        "[CloudflareTokenService] ALLOW_PLATFORM_CUSTOMER_DNS=true — using platform token (not multi-tenant safe)"
      );
      return { tokens: [...new Set(legacy)], source: "platform_legacy" };
    }
  }

  return { tokens: [], source: "none" };
}

export async function disconnectCustomerCloudflare(ownerUserId: string): Promise<boolean> {
  return disconnectDnsProviderConnection(ownerUserId, "cloudflare");
}
