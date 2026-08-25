/**
 * One-time platform Origin Rule on mindflo.today:
 * - Copy customer hostname → key-customer-host (+ X-Forwarded-Host)
 * - Rewrite Host → keylink360.mindflo.today before Railway
 *
 * This replaces per-customer Worker routes for Cloudflare for SaaS.
 */

import { resolveCnameTarget, resolvePlatformHostname } from "./hostname";

type CloudflareResult<T> = {
  success: boolean;
  errors?: Array<{ code?: number; message?: string }>;
  result?: T;
};

const RULE_DESCRIPTION = "KEYLINK360: preserve customer host + rewrite Host for Railway";

function apiBase() {
  return (process.env.CLOUDFLARE_API_BASE || "https://api.cloudflare.com/client/v4").replace(/\/$/, "");
}

function zoneConfig() {
  return {
    token: process.env.CLOUDFLARE_API_TOKEN?.trim() || "",
    zoneId: process.env.CLOUDFLARE_ZONE_ID?.trim() || ""
  };
}

function platformHost() {
  return (resolveCnameTarget() || resolvePlatformHostname() || "keylink360.mindflo.today")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

async function cfZoneRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { token, zoneId } = zoneConfig();
  if (!token || !zoneId) {
    throw new Error("CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID required for Origin Rule setup.");
  }
  const response = await fetch(`${apiBase()}/zones/${zoneId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });
  const body = (await response.json().catch(() => null)) as CloudflareResult<T> | null;
  if (!response.ok || body?.success === false) {
    const message =
      body?.errors?.map((error) => error.message || `Cloudflare error ${error.code}`).join("; ") ||
      `Cloudflare request failed (${response.status})`;
    throw new Error(message);
  }
  return body!.result as T;
}

type RulesetRule = {
  id?: string;
  description?: string;
  expression?: string;
  action?: string;
  action_parameters?: Record<string, unknown>;
  enabled?: boolean;
};

type Ruleset = {
  id: string;
  phase?: string;
  rules?: RulesetRule[];
};

function customerHostExpression(host: string) {
  // Custom hostnames are customer brands (not on mindflo.today).
  // Never rewrite Host for platform / zone hostnames.
  return (
    `not http.host eq "${host}" and not http.host eq "www.${host}" ` +
    `and not ends_with(http.host, ".mindflo.today") and http.host ne "mindflo.today"`
  );
}

function buildTransformRule(host: string): RulesetRule {
  return {
    description: RULE_DESCRIPTION,
    expression: customerHostExpression(host),
    action: "rewrite",
    action_parameters: {
      headers: {
        "key-customer-host": {
          operation: "set",
          expression: "http.host"
        },
        "x-forwarded-host": {
          operation: "set",
          expression: "http.host"
        }
      }
    },
    enabled: true
  };
}

function buildOriginRule(host: string): RulesetRule {
  return {
    description: RULE_DESCRIPTION,
    expression: customerHostExpression(host),
    action: "route",
    action_parameters: {
      host_header: host,
      sni: { value: host }
    },
    enabled: true
  };
}

async function upsertPhaseRule(phase: string, rule: RulesetRule): Promise<void> {
  let ruleset: Ruleset;
  try {
    ruleset = await cfZoneRequest<Ruleset>(`/rulesets/phases/${phase}/entrypoint`, { method: "GET" });
  } catch (error) {
    // Entry point may not exist yet — create via PUT with rules only.
    const message = error instanceof Error ? error.message : String(error);
    if (!/not found|does not exist|404/i.test(message)) throw error;
    await cfZoneRequest<Ruleset>(`/rulesets/phases/${phase}/entrypoint`, {
      method: "PUT",
      body: JSON.stringify({ rules: [rule] })
    });
    console.log(`[origin-rewrite] Created ${phase} ruleset with KEYLINK360 Host rewrite`);
    return;
  }

  const existing = Array.isArray(ruleset.rules) ? [...ruleset.rules] : [];
  const idx = existing.findIndex(
    (item) => item.description === RULE_DESCRIPTION || item.description?.includes("KEYLINK360") || item.description?.includes("KEYSLINK")
  );
  if (idx >= 0) {
    existing[idx] = { ...existing[idx], ...rule, id: existing[idx].id };
  } else {
    existing.push(rule);
  }

  await cfZoneRequest<Ruleset>(`/rulesets/phases/${phase}/entrypoint`, {
    method: "PUT",
    body: JSON.stringify({ rules: existing })
  });
  console.log(`[origin-rewrite] Upserted ${phase} rule for Host rewrite → ${platformHost()}`);
}

/**
 * Ensure platform zone rewrites customer Host → Railway platform host.
 * Safe to call on every boot (idempotent).
 */
export async function ensurePlatformOriginHostRewrite(): Promise<{
  ok: boolean;
  platformHost: string;
  message: string;
}> {
  const { token, zoneId } = zoneConfig();
  const host = platformHost();
  if (!token || !zoneId) {
    return {
      ok: false,
      platformHost: host,
      message: "Skipped Origin Rule — CLOUDFLARE_ZONE_ID / CLOUDFLARE_API_TOKEN not set."
    };
  }
  if (process.env.CLOUDFLARE_SKIP_ORIGIN_REWRITE === "true") {
    return {
      ok: true,
      platformHost: host,
      message: "Skipped Origin Rule — CLOUDFLARE_SKIP_ORIGIN_REWRITE=true."
    };
  }

  try {
    // 1) Preserve original customer hostname for Express routing.
    await upsertPhaseRule("http_request_late_transform", buildTransformRule(host));
    // 2) Send Host: keylink360.mindflo.today to Railway (single custom domain).
    await upsertPhaseRule("http_request_origin", buildOriginRule(host));
    return {
      ok: true,
      platformHost: host,
      message: `Origin Host rewrite active → ${host}`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[origin-rewrite] Failed to ensure Origin Rule:", message);
    console.error(
      "[origin-rewrite] Manual one-time setup: Cloudflare → mindflo.today → Rules → Origin Rules: " +
        `when hostname ≠ ${host}, set Host header / SNI to ${host}, and set request headers ` +
        "key-customer-host and X-Forwarded-Host from http.host."
    );
    return { ok: false, platformHost: host, message };
  }
}
