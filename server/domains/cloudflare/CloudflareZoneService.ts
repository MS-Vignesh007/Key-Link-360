/**
 * CloudflareZoneService — list / resolve zones in the CUSTOMER's Cloudflare account.
 */
const API_BASE = (process.env.CLOUDFLARE_API_BASE || "https://api.cloudflare.com/client/v4").replace(
  /\/$/,
  ""
);

export type CloudflareZone = {
  id: string;
  name: string;
  status?: string;
  account?: { id?: string; name?: string };
};

async function cfGet<T>(apiToken: string, path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json"
    }
  });
  const body = (await response.json().catch(() => null)) as {
    success?: boolean;
    errors?: Array<{ message?: string }>;
    result?: T;
  } | null;
  if (!response.ok || !body?.success) {
    const message =
      body?.errors?.map((e) => e.message).filter(Boolean).join("; ") ||
      `Cloudflare API failed (${response.status})`;
    throw new Error(message);
  }
  return body.result as T;
}

export async function fetchCloudflareAccountId(apiToken: string): Promise<string | null> {
  try {
    const accounts = await cfGet<Array<{ id: string; name?: string }>>(apiToken, "/accounts?per_page=50");
    return accounts?.[0]?.id || null;
  } catch {
    return null;
  }
}

export async function listCustomerZones(apiToken: string): Promise<CloudflareZone[]> {
  const zones = await cfGet<CloudflareZone[]>(apiToken, "/zones?per_page=50&status=active");
  return zones || [];
}

/** Find zone for hostname by walking parent labels (tree.example.com → example.com). */
export async function findZoneForHostname(
  apiToken: string,
  hostname: string
): Promise<CloudflareZone | null> {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  const labels = host.split(".").filter(Boolean);
  if (labels.length < 2) return null;

  for (let i = 0; i <= labels.length - 2; i++) {
    const candidate = labels.slice(i).join(".");
    try {
      const result = await cfGet<CloudflareZone[]>(
        apiToken,
        `/zones?name=${encodeURIComponent(candidate)}&status=active`
      );
      if (result?.[0]?.id) return result[0];
    } catch {
      /* try next parent */
    }
  }
  return null;
}
