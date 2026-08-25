/**
 * CloudflareDNSService — create/update/delete DNS in the CUSTOMER zone using THEIR token.
 */
import { getDnsZoneDomain, normalizeHostname } from "../hostname";
import { buildDnsRecordSet, type DnsRecordInstruction } from "../dnsRecords";
import { provisionCloudflareDnsRecords, removeCloudflareDnsRecords } from "../cloudflareDns";
import { findZoneForHostname } from "./CloudflareZoneService";

export type ProvisionCustomerDnsResult = {
  success: boolean;
  message: string;
  changes: number;
  zoneId?: string;
  zoneName?: string;
  code?:
    | "NO_TOKEN"
    | "NO_ZONE"
    | "PERMISSION_DENIED"
    | "RATE_LIMIT"
    | "DNS_FAILED"
    | "OK";
};

export type RemoveCustomerDnsResult = {
  success: boolean;
  message: string;
  removed: number;
  code?:
    | "NO_TOKEN"
    | "NO_ZONE"
    | "PERMISSION_DENIED"
    | "RATE_LIMIT"
    | "DNS_FAILED"
    | "OK"
    | "SKIPPED";
};

/**
 * Proxy (orange cloud): default OFF for CF-for-SaaS reliability.
 * Set CLOUDFLARE_CUSTOMER_CNAME_PROXIED=true only if your edge design requires it.
 */
export function customerDnsProxiedPreferred(): boolean {
  return process.env.CLOUDFLARE_CUSTOMER_CNAME_PROXIED === "true";
}

export async function provisionCustomerDns(input: {
  apiToken: string;
  domainName: string;
  records?: DnsRecordInstruction[];
}): Promise<ProvisionCustomerDnsResult> {
  const token = input.apiToken.trim();
  if (!token) {
    return {
      success: false,
      message: "Connect Cloudflare to continue automatic DNS setup.",
      changes: 0,
      code: "NO_TOKEN"
    };
  }

  const host = normalizeHostname(input.domainName);
  const zoneDomain = getDnsZoneDomain(host);

  try {
    const zone = await findZoneForHostname(token, host);
    if (!zone) {
      return {
        success: false,
        message:
          `No matching Cloudflare zone found for ${zoneDomain}. ` +
          `That domain is not in the Cloudflare account you approved. ` +
          `Sign in with the Cloudflare account that owns ${zoneDomain}.`,
        changes: 0,
        code: "NO_ZONE"
      };
    }

    const records = input.records || buildDnsRecordSet(host).records;
    const result = await provisionCloudflareDnsRecords(token, host, records);
    return {
      success: result.success,
      message: result.message,
      changes: result.changes,
      zoneId: zone.id,
      zoneName: zone.name,
      code: result.success ? "OK" : "DNS_FAILED"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const lower = message.toLowerCase();
    let code: ProvisionCustomerDnsResult["code"] = "DNS_FAILED";
    if (/authenticat|authoriz|permission|forbidden|401|403/.test(lower)) code = "PERMISSION_DENIED";
    if (/rate limit|429/.test(lower)) code = "RATE_LIMIT";
    if (/zone not found|no matching/.test(lower)) code = "NO_ZONE";
    return { success: false, message, changes: 0, code };
  }
}

/**
 * Delete KEY-managed CNAME/A records from the customer's Cloudflare zone.
 * Best-effort: callers should still remove the domain from KEY if this fails.
 */
export async function removeCustomerDns(input: {
  apiToken: string;
  domainName: string;
  records?: DnsRecordInstruction[];
}): Promise<RemoveCustomerDnsResult> {
  const token = input.apiToken.trim();
  if (!token) {
    return {
      success: false,
      message: "Cloudflare is not connected — DNS record was not removed from Cloudflare.",
      removed: 0,
      code: "NO_TOKEN"
    };
  }

  const host = normalizeHostname(input.domainName);
  const zoneDomain = getDnsZoneDomain(host);
  const records = input.records || buildDnsRecordSet(host).records;

  try {
    const zone = await findZoneForHostname(token, host);
    if (!zone) {
      return {
        success: false,
        message: `No Cloudflare zone found for ${zoneDomain}. Remove the DNS record manually if it still exists.`,
        removed: 0,
        code: "NO_ZONE"
      };
    }

    const result = await removeCloudflareDnsRecords(token, host, records);
    return {
      success: result.success,
      message: result.message,
      removed: result.removed,
      code: "OK"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const lower = message.toLowerCase();
    let code: RemoveCustomerDnsResult["code"] = "DNS_FAILED";
    if (/authenticat|authoriz|permission|forbidden|401|403/.test(lower)) code = "PERMISSION_DENIED";
    if (/rate limit|429/.test(lower)) code = "RATE_LIMIT";
    if (/zone not found|no matching/.test(lower)) code = "NO_ZONE";
    return { success: false, message, removed: 0, code };
  }
}
