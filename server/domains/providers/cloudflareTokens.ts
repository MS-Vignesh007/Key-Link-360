/**
 * @deprecated Customer DNS must use CloudflareTokenService.resolveCustomerDnsTokens.
 * Platform tokens are for SaaS custom hostnames only (see cloudflare.ts).
 */
import { allowPlatformDnsFallback } from "../cloudflare/CloudflareTokenService";

/** Legacy helper — returns platform tokens ONLY when ALLOW_PLATFORM_CUSTOMER_DNS=true. */
export function cloudflareDnsApiTokens(preferredCustomerToken?: string): string[] {
  const preferred = (preferredCustomerToken || "").trim();
  if (preferred) return [preferred];
  if (!allowPlatformDnsFallback()) return [];
  const tokens = [
    (process.env.CLOUDFLARE_DNS_API_TOKEN || "").trim(),
    (process.env.CLOUDFLARE_API_TOKEN || "").trim()
  ].filter(Boolean);
  return [...new Set(tokens)];
}

export async function cloudflareZoneAccessible(
  apiToken: string,
  zoneDomain: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones?name=${encodeURIComponent(zoneDomain)}&status=active`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        }
      }
    );
    const body = (await response.json().catch(() => null)) as {
      success?: boolean;
      result?: Array<{ id?: string }>;
    } | null;
    return Boolean(response.ok && body?.success && body.result?.[0]?.id);
  } catch {
    return false;
  }
}

export async function findWorkingDnsTokenForZone(zoneDomain: string): Promise<string | null> {
  for (const token of cloudflareDnsApiTokens()) {
    if (await cloudflareZoneAccessible(token, zoneDomain)) return token;
  }
  return null;
}
