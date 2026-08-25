import { isCloudflareOAuthConfigured } from "../cloudflare/CloudflareOAuthService";
import { provisionCustomerDns, removeCustomerDns } from "../cloudflare/CloudflareDNSService";
import { resolveCustomerDnsTokens } from "../cloudflare/CloudflareTokenService";
import { buildDnsRecordSet } from "../dnsRecords";
import type { DnsProviderAdapter, ProvisionDnsInput, ProvisionDnsResult } from "./types";

export const cloudflareProvider: DnsProviderAdapter = {
  capability: {
    id: "cloudflare",
    name: "Cloudflare",
    supportsAutoDns: true,
    supportsOAuth: isCloudflareOAuthConfigured(),
    logoUrl: "/dns-providers/cloudflare.svg",
    helpUrl: "https://developers.cloudflare.com/fundamentals/oauth/",
    blurb: "One click — authorize YOUR Cloudflare account and we add DNS for you."
  },

  async provisionDns(input: ProvisionDnsInput): Promise<ProvisionDnsResult> {
    const ownerUserId = input.ownerUserId || "";
    const { tokens, source } = await resolveCustomerDnsTokens({
      ownerUserId,
      preferredToken: input.accessToken
    });

    if (!tokens.length) {
      return {
        success: false,
        message:
          "Connect your Cloudflare account so KEYLINK360 can add DNS automatically. Or use the manual DNS steps below.",
        needsOAuth: isCloudflareOAuthConfigured()
      };
    }

    let lastError = "Could not update DNS automatically.";
    let lastCode: string | undefined;
    for (const token of tokens) {
      const result = await provisionCustomerDns({
        apiToken: token,
        domainName: input.domainName,
        records: input.records
      });
      if (result.success) {
        return {
          success: true,
          message:
            source === "customer"
              ? result.message
              : `${result.message} (token source: ${source})`,
          providerAccountId: result.zoneId || null
        };
      }
      lastError = result.message;
      lastCode = result.code;
    }

    const needsOAuth =
      isCloudflareOAuthConfigured() &&
      (lastCode === "NO_TOKEN" ||
        lastCode === "PERMISSION_DENIED" ||
        lastCode === "NO_ZONE" ||
        source === "none");

    return {
      success: false,
      message:
        lastCode === "NO_ZONE"
          ? `${lastError} This domain is not in the Cloudflare account you approved. ` +
            `Sign in again with the Cloudflare account that owns this domain ` +
            `(click Edit on Cloudflare if the wrong email is shown).`
          : lastError,
      providerAccountId: null,
      needsOAuth
    };
  }
};

/**
 * Best-effort: remove KEY-managed DNS from the customer's Cloudflare zone
 * using their saved OAuth token (never the platform token).
 */
export async function deprovisionCustomerCloudflareDns(input: {
  ownerUserId: string;
  domainName: string;
}): Promise<{ success: boolean; message: string; removed: number; attempted: boolean }> {
  const { tokens } = await resolveCustomerDnsTokens({ ownerUserId: input.ownerUserId });
  if (!tokens.length) {
    return {
      success: false,
      attempted: false,
      removed: 0,
      message:
        "Cloudflare is not connected — KEYLINK360 was removed, but DNS may still exist in Cloudflare."
    };
  }

  const records = buildDnsRecordSet(input.domainName).records;
  let lastMessage = "Could not remove DNS from Cloudflare.";
  for (const token of tokens) {
    const result = await removeCustomerDns({
      apiToken: token,
      domainName: input.domainName,
      records
    });
    if (result.success) {
      return {
        success: true,
        attempted: true,
        removed: result.removed,
        message: result.message
      };
    }
    lastMessage = result.message;
    if (result.code === "PERMISSION_DENIED") continue;
  }

  return {
    success: false,
    attempted: true,
    removed: 0,
    message: lastMessage
  };
}
