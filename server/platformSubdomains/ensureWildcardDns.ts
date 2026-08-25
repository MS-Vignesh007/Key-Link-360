/**
 * Free KEY URLs are `{slug}.keylink360.mindflo.today`.
 * That requires a Cloudflare DNS wildcard on mindflo.today:
 *   CNAME  *.keylink360  →  keylink360.mindflo.today  (Proxied)
 * Without it, browsers get DNS_PROBE_FINISHED_NXDOMAIN.
 */
import { resolvePlatformHostname } from "../domains/hostname";

const API_BASE = (process.env.CLOUDFLARE_API_BASE || "https://api.cloudflare.com/client/v4").replace(
  /\/$/,
  ""
);

type CfResult<T> = {
  success?: boolean;
  errors?: Array<{ message?: string; code?: number }>;
  result?: T;
};

type DnsRecord = {
  id: string;
  type: string;
  name: string;
  content: string;
  proxied?: boolean;
};

function zoneConfig() {
  return {
    token: process.env.CLOUDFLARE_API_TOKEN?.trim() || "",
    zoneId: process.env.CLOUDFLARE_ZONE_ID?.trim() || ""
  };
}

async function cfApi<T>(
  token: string,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });
  const body = (await response.json().catch(() => null)) as CfResult<T> | null;
  if (!response.ok || !body?.success) {
    const message =
      body?.errors?.map((e) => e.message).filter(Boolean).join("; ") ||
      `Cloudflare API failed (${response.status})`;
    throw new Error(message);
  }
  return body.result as T;
}

/**
 * Platform host `keylink360.mindflo.today` in zone `mindflo.today`
 * → wildcard relative name `*.keylink360`.
 */
export function platformWildcardRelativeName(
  platformHost: string,
  zoneName: string
): string | null {
  const host = platformHost.trim().toLowerCase().replace(/\.$/, "");
  const zone = zoneName.trim().toLowerCase().replace(/\.$/, "");
  if (!host || !zone || host === zone) return null;
  if (!host.endsWith(`.${zone}`)) return null;
  const relative = host.slice(0, -(zone.length + 1));
  if (!relative || relative.includes(".")) {
    // Unexpected multi-label relative (e.g. a.b.zone) — still wildcard the full relative.
    return `*.${relative}`;
  }
  return `*.${relative}`;
}

/**
 * Ensure `{slug}.{platformHost}` resolves via Cloudflare wildcard CNAME (proxied).
 */
export async function ensurePlatformFreeUrlWildcardDns(): Promise<{
  ok: boolean;
  message: string;
  recordName?: string;
}> {
  const { token, zoneId } = zoneConfig();
  const platformHost = resolvePlatformHostname();

  if (!token || !zoneId) {
    return {
      ok: false,
      message:
        "Skipped free-URL wildcard DNS — set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID."
    };
  }
  if (process.env.CLOUDFLARE_SKIP_PLATFORM_WILDCARD_DNS === "true") {
    return {
      ok: true,
      message: "Skipped free-URL wildcard DNS — CLOUDFLARE_SKIP_PLATFORM_WILDCARD_DNS=true."
    };
  }

  try {
    const zone = await cfApi<{ id: string; name: string }>(token, `/zones/${zoneId}`);
    const zoneName = zone?.name || "";
    const relative = platformWildcardRelativeName(platformHost, zoneName);
    if (!relative) {
      return {
        ok: false,
        message: `Cannot derive wildcard for platform host ${platformHost} in zone ${zoneName || zoneId}.`
      };
    }

    // Cloudflare stores names as FQDN, e.g. *.keyslink.mindflo.today
    const fqdn = `${relative}.${zoneName}`;
    const listPath =
      `/zones/${zoneId}/dns_records?type=CNAME&name=${encodeURIComponent(fqdn)}&per_page=5`;
    const existing = (await cfApi<DnsRecord[]>(token, listPath)) || [];
    const match =
      existing.find(
        (item) =>
          item.name.replace(/\.$/, "").toLowerCase() === fqdn.toLowerCase() ||
          item.name.replace(/\.$/, "").toLowerCase() === relative.toLowerCase()
      ) || existing[0];

    const desired = {
      type: "CNAME" as const,
      name: relative,
      content: platformHost,
      ttl: 1,
      proxied: true,
      comment: `KEYLINK360 free URLs {slug}.${platformHost}`
    };

    if (match?.id) {
      const needsUpdate =
        match.content.replace(/\.$/, "").toLowerCase() !== platformHost.toLowerCase() ||
        match.proxied !== true;
      if (needsUpdate) {
        await cfApi(token, `/zones/${zoneId}/dns_records/${match.id}`, {
          method: "PUT",
          body: JSON.stringify(desired)
        });
        return {
          ok: true,
          recordName: relative,
          message: `Updated free-URL wildcard DNS ${relative} → ${platformHost} (proxied).`
        };
      }
      return {
        ok: true,
        recordName: relative,
        message: `Free-URL wildcard DNS OK: ${relative} → ${platformHost} (proxied).`
      };
    }

    await cfApi(token, `/zones/${zoneId}/dns_records`, {
      method: "POST",
      body: JSON.stringify(desired)
    });

    // Best-effort: Total TLS issues certs for proxied nested hostnames.
    try {
      await fetch(`${API_BASE}/zones/${zoneId}/ssl/total_tls`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ enabled: true, certificate_authority: "lets_encrypt" })
      });
    } catch {
      /* Total TLS may already be on or plan-limited */
    }

    return {
      ok: true,
      recordName: relative,
      message: `Created free-URL wildcard DNS ${relative} → ${platformHost} (proxied).`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[platform-wildcard-dns] Failed:", message);
    console.error(
      `[platform-wildcard-dns] Manual fix (mindflo.today DNS): CNAME name=*.keylink360 ` +
        `target=${platformHost} Proxied=ON. Token needs Zone → DNS → Edit.`
    );
    return { ok: false, message };
  }
}
