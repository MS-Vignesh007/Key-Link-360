/**
 * CloudflareOAuthService — customer authorizes THEIR Cloudflare account (PKCE).
 * OAuth state is stored in Supabase so multi-instance Railway restarts are safe.
 */
import { createHash, randomBytes } from "crypto";
import { getSupabase } from "../../db/supabase";
import { resolvePlatformHostname } from "../hostname";

const AUTH_URL = "https://dash.cloudflare.com/oauth2/auth";
const TOKEN_URL = "https://dash.cloudflare.com/oauth2/token";
const STATE_TTL_MS = 1000 * 60 * 15;

export type OAuthPendingState = {
  userId: string;
  domainName: string;
  pageId: string;
  codeVerifier: string;
  createdAt: number;
};

/** In-memory fallback when Supabase oauth_states table is unavailable. */
const memoryStates = new Map<string, OAuthPendingState>();

export function isCloudflareOAuthConfigured() {
  return Boolean(
    process.env.CLOUDFLARE_OAUTH_CLIENT_ID?.trim() &&
      process.env.CLOUDFLARE_OAUTH_CLIENT_SECRET?.trim()
  );
}

export function cloudflareOAuthRedirectUri() {
  const explicit = process.env.CLOUDFLARE_OAUTH_REDIRECT_URI?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const app =
    process.env.APP_URL?.trim() ||
    process.env.API_URL?.trim() ||
    `https://${resolvePlatformHostname()}`;
  const base = app.includes("://") ? app.replace(/\/$/, "") : `https://${app}`;
  return `${base}/api/domains/providers/cloudflare/oauth/callback`;
}

/**
 * Cloudflare OAuth scope IDs use dot notation matching API permissions.
 * Correct IDs: `zone.read` + `dns.write` (NOT `zone.dns.write`).
 * Do not request `offline_access` here — Cloudflare adds/removes protocol
 * scopes automatically from the client's grant_types (include refresh_token).
 */
function oauthScopes() {
  const fromEnv = (process.env.CLOUDFLARE_OAUTH_SCOPES || "").trim();
  if (fromEnv) return fromEnv.split(/[\s,]+/).filter(Boolean);
  return ["zone.read", "dns.write"];
}

function base64Url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function pkceChallenge(verifier: string) {
  return base64Url(createHash("sha256").update(verifier).digest());
}

async function persistState(state: string, payload: OAuthPendingState): Promise<void> {
  memoryStates.set(state, payload);
  const supabase = getSupabase();
  if (!supabase) return;
  const expiresAt = new Date(payload.createdAt + STATE_TTL_MS).toISOString();
  const { error } = await supabase.from("oauth_states").upsert(
    {
      state,
      provider: "cloudflare",
      owner_user_id: payload.userId,
      payload: {
        domainName: payload.domainName,
        pageId: payload.pageId,
        codeVerifier: payload.codeVerifier
      },
      expires_at: expiresAt,
      created_at: new Date(payload.createdAt).toISOString()
    },
    { onConflict: "state" }
  );
  if (error) {
    console.warn("[CloudflareOAuthService] oauth_states upsert failed (using memory):", error.message);
  }
}

async function consumeState(state: string): Promise<OAuthPendingState | null> {
  const mem = memoryStates.get(state);
  if (mem) {
    memoryStates.delete(state);
    if (Date.now() - mem.createdAt <= STATE_TTL_MS) return mem;
  }

  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("oauth_states")
    .select("owner_user_id, payload, expires_at")
    .eq("state", state)
    .eq("provider", "cloudflare")
    .maybeSingle();

  await supabase.from("oauth_states").delete().eq("state", state);

  if (error || !data) return null;
  if (data.expires_at && Date.parse(String(data.expires_at)) < Date.now()) return null;

  const payload = (data.payload || {}) as Record<string, unknown>;
  return {
    userId: String(data.owner_user_id),
    domainName: String(payload.domainName || ""),
    pageId: String(payload.pageId || ""),
    codeVerifier: String(payload.codeVerifier || ""),
    createdAt: Date.now()
  };
}

export async function createCloudflareOAuthAuthorizeUrl(input: {
  userId: string;
  domainName: string;
  pageId: string;
  /**
   * When true, Cloudflare should show Sign in (other account / first link).
   * When false, an already-signed-in session can go straight to the permission screen.
   */
  forceLogin?: boolean;
}): Promise<{ authorizeUrl: string; state: string }> {
  if (!isCloudflareOAuthConfigured()) {
    throw new Error("Cloudflare OAuth is not configured on this server.");
  }

  const state = base64Url(randomBytes(24));
  const codeVerifier = base64Url(randomBytes(32));
  await persistState(state, {
    userId: input.userId,
    domainName: input.domainName,
    pageId: input.pageId,
    codeVerifier,
    createdAt: Date.now()
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.CLOUDFLARE_OAUTH_CLIENT_ID!.trim(),
    redirect_uri: cloudflareOAuthRedirectUri(),
    state,
    code_challenge: pkceChallenge(codeVerifier),
    code_challenge_method: "S256",
    scope: oauthScopes().join(" ")
  });
  // Only force Sign in when the domain is not in the linked account (or no link yet).
  // Same-account reconnects must reach the permission/Approve screen without re-login.
  if (input.forceLogin !== false) {
    params.set("prompt", "login");
  }

  const authorizeUrl = `${AUTH_URL}?${params.toString()}`;
  return { authorizeUrl, state };
}

/** Sync wrapper kept for call sites that cannot await — prefers durable consume. */
export function takeOAuthState(state: string): OAuthPendingState | null {
  const mem = memoryStates.get(state);
  if (mem) {
    memoryStates.delete(state);
    if (Date.now() - mem.createdAt <= STATE_TTL_MS) return mem;
  }
  return null;
}

export async function takeOAuthStateAsync(state: string): Promise<OAuthPendingState | null> {
  return consumeState(state);
}

export async function exchangeCloudflareOAuthCode(input: {
  code: string;
  codeVerifier: string;
}): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  const clientId = process.env.CLOUDFLARE_OAUTH_CLIENT_ID!.trim();
  const clientSecret = process.env.CLOUDFLARE_OAUTH_CLIENT_SECRET!.trim();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: cloudflareOAuthRedirectUri(),
    code: input.code,
    code_verifier: input.codeVerifier
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
  const json = (await response.json().catch(() => null)) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  } | null;

  if (!response.ok || !json?.access_token) {
    throw new Error(
      json?.error_description || json?.error || `Cloudflare OAuth token exchange failed (${response.status})`
    );
  }

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresIn: json.expires_in
  };
}

export async function refreshCloudflareAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  const clientId = process.env.CLOUDFLARE_OAUTH_CLIENT_ID!.trim();
  const clientSecret = process.env.CLOUDFLARE_OAUTH_CLIENT_SECRET!.trim();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
  const json = (await response.json().catch(() => null)) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  } | null;

  if (!response.ok || !json?.access_token) {
    throw new Error(
      json?.error_description || json?.error || `Cloudflare token refresh failed (${response.status})`
    );
  }

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresIn: json.expires_in
  };
}

export function oauthReturnAppUrl(input: {
  domainName: string;
  pageId: string;
  ok: boolean;
  error?: string;
}) {
  const app =
    process.env.APP_URL?.trim() ||
    process.env.API_URL?.trim() ||
    `https://${resolvePlatformHostname()}`;
  const base = app.includes("://") ? app.replace(/\/$/, "") : `https://${app}`;
  const params = new URLSearchParams({
    cf_oauth: input.ok ? "1" : "0",
    domain: input.domainName,
    pageId: input.pageId
  });
  if (input.error) params.set("cf_oauth_error", input.error.slice(0, 180));
  return `${base}/custom-domains?${params.toString()}`;
}
