import { getDnsZoneDomain, normalizeHostname } from "./hostname";
import type { DnsRecordInstruction } from "./dnsRecords";

type CloudflareResult<T> = {
  success: boolean;
  errors?: Array<{ code?: number; message?: string }>;
  result?: T;
};

type CloudflareZone = { id: string; name: string };

type CloudflareDnsRecord = {
  id: string;
  type: string;
  name: string;
  content: string;
  proxied?: boolean;
};

const API_BASE = (process.env.CLOUDFLARE_API_BASE || "https://api.cloudflare.com/client/v4").replace(
  /\/$/,
  ""
);

async function customerCloudflareRequest<T>(
  apiToken: string,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });
  const body = (await response.json().catch(() => null)) as CloudflareResult<T> | null;
  const method = (init.method || "GET").toUpperCase();
  const ok =
    method === "DELETE" ? body?.success === true : body?.success === true && body.result !== undefined;

  if (!response.ok || !ok) {
    const message =
      body?.errors?.map((error) => error.message || `Cloudflare error ${error.code}`).join("; ") ||
      `Cloudflare DNS request failed (${response.status})`;
    throw new Error(message);
  }
  return body!.result as T;
}

async function findCustomerZoneId(apiToken: string, zoneDomain: string): Promise<string> {
  const result = await customerCloudflareRequest<CloudflareZone[]>(
    apiToken,
    `/zones?name=${encodeURIComponent(zoneDomain)}&status=active`,
    { method: "GET" }
  );
  const zone = result[0];
  if (!zone?.id) {
    throw new Error(
      `Cloudflare zone not found for ${zoneDomain}. Use an API token with Zone.DNS Edit for that zone.`
    );
  }
  return zone.id;
}

function cloudflareRecordName(zoneDomain: string, hostLabel: string): string {
  if (hostLabel === "@" || hostLabel === zoneDomain) return zoneDomain;
  return `${hostLabel}.${zoneDomain}`;
}

async function listExistingRecords(
  apiToken: string,
  zoneId: string,
  zoneDomain: string,
  record: DnsRecordInstruction
): Promise<CloudflareDnsRecord[]> {
  const fqdn = cloudflareRecordName(zoneDomain, record.hostLabel);
  const result = await customerCloudflareRequest<CloudflareDnsRecord[]>(
    apiToken,
    `/zones/${zoneId}/dns_records?type=${encodeURIComponent(record.type)}&name=${encodeURIComponent(fqdn)}`,
    { method: "GET" }
  );
  return result || [];
}

async function deleteRecordsAtName(
  apiToken: string,
  zoneId: string,
  fqdn: string,
  type: string
): Promise<number> {
  const result = await customerCloudflareRequest<CloudflareDnsRecord[]>(
    apiToken,
    `/zones/${zoneId}/dns_records?type=${encodeURIComponent(type)}&name=${encodeURIComponent(fqdn)}`,
    { method: "GET" }
  );
  let removed = 0;
  for (const item of result || []) {
    if (!item.id) continue;
    await customerCloudflareRequest<CloudflareDnsRecord>(
      apiToken,
      `/zones/${zoneId}/dns_records/${item.id}`,
      { method: "DELETE" }
    );
    removed += 1;
  }
  return removed;
}

async function upsertRecord(
  apiToken: string,
  zoneId: string,
  zoneDomain: string,
  record: DnsRecordInstruction
): Promise<"created" | "updated"> {
  const name = cloudflareRecordName(zoneDomain, record.hostLabel);

  if (record.type === "CNAME") {
    await deleteRecordsAtName(apiToken, zoneId, name, "A");
  } else if (record.type === "A") {
    await deleteRecordsAtName(apiToken, zoneId, name, "CNAME");
  }

  const existing = await listExistingRecords(apiToken, zoneId, zoneDomain, record);
  // Default DNS-only (gray cloud). Orange-cloud CNAMEs to another CF zone often
  // break Host/SSL for CF-for-SaaS. Opt in with CLOUDFLARE_CUSTOMER_CNAME_PROXIED=true.
  const proxied =
    process.env.CLOUDFLARE_CUSTOMER_CNAME_PROXIED === "true" && record.type === "CNAME";
  const payload = {
    type: record.type,
    name,
    content: record.value,
    ttl: 1,
    proxied
  };

  if (existing[0]?.id) {
    await customerCloudflareRequest<CloudflareDnsRecord>(
      apiToken,
      `/zones/${zoneId}/dns_records/${existing[0].id}`,
      { method: "PATCH", body: JSON.stringify(payload) }
    );
    return "updated";
  }

  await customerCloudflareRequest<CloudflareDnsRecord>(apiToken, `/zones/${zoneId}/dns_records`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return "created";
}

export async function provisionCloudflareDnsRecords(
  apiToken: string,
  domainName: string,
  records: DnsRecordInstruction[]
): Promise<{ success: boolean; message: string; changes: number }> {
  const host = normalizeHostname(domainName);
  const zoneDomain = getDnsZoneDomain(host);
  const token = apiToken.trim();
  if (!token) {
    return { success: false, message: "Cloudflare API token is required for automatic DNS.", changes: 0 };
  }

  const zoneId = await findCustomerZoneId(token, zoneDomain);
  let changes = 0;

  for (const record of records) {
    await upsertRecord(token, zoneId, zoneDomain, record);
    changes += 1;
  }

  return {
    success: true,
    message: `KEY updated ${changes} DNS record${changes === 1 ? "" : "s"} at Cloudflare for ${zoneDomain}.`,
    changes
  };
}

/**
 * Remove KEY-managed DNS records from the customer's Cloudflare zone
 * (same type+name set we create on Connect Domain).
 */
export async function removeCloudflareDnsRecords(
  apiToken: string,
  domainName: string,
  records: DnsRecordInstruction[]
): Promise<{ success: boolean; message: string; removed: number }> {
  const host = normalizeHostname(domainName);
  const zoneDomain = getDnsZoneDomain(host);
  const token = apiToken.trim();
  if (!token) {
    return { success: false, message: "Cloudflare API token is required to remove DNS.", removed: 0 };
  }
  if (!records.length) {
    return { success: true, message: "No DNS records to remove.", removed: 0 };
  }

  const zoneId = await findCustomerZoneId(token, zoneDomain);
  let removed = 0;

  for (const record of records) {
    const fqdn = cloudflareRecordName(zoneDomain, record.hostLabel);
    removed += await deleteRecordsAtName(token, zoneId, fqdn, record.type);
    // Clean conflicting opposite type at the same name (A vs CNAME) left from older setups.
    if (record.type === "CNAME") {
      removed += await deleteRecordsAtName(token, zoneId, fqdn, "A");
    } else if (record.type === "A") {
      removed += await deleteRecordsAtName(token, zoneId, fqdn, "CNAME");
    }
  }

  return {
    success: true,
    message:
      removed > 0
        ? `Removed ${removed} DNS record${removed === 1 ? "" : "s"} from Cloudflare for ${host}.`
        : `No matching DNS records found in Cloudflare for ${host}.`,
    removed
  };
}
