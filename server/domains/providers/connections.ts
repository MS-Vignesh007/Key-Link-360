import { randomBytes } from "crypto";
import { getSupabase } from "../../db/supabase";
import { decryptSecret, encryptSecret } from "./tokenVault";
import type { DnsProviderId } from "./types";

export type DnsProviderConnection = {
  id: string;
  ownerUserId: string;
  providerId: DnsProviderId;
  providerAccountId: string | null;
  connected: boolean;
  hasToken: boolean;
  hasRefreshToken: boolean;
  tokenExpiresAt: string | null;
  connectedAt: string | null;
  updatedAt: string;
  /** Populated only in server-side getDnsProviderConnection — never sent to clients. */
  accessToken?: string;
  refreshToken?: string;
};

function dbOrNull() {
  try {
    return getSupabase();
  } catch {
    return null;
  }
}

const SELECT_COLS =
  "id, owner_user_id, provider_id, provider_account_id, connected, access_token_encrypted, refresh_token_encrypted, token_expires_at, connected_at, updated_at, metadata";

export async function upsertDnsProviderConnection(input: {
  ownerUserId: string;
  providerId: DnsProviderId;
  accessToken?: string;
  refreshToken?: string | null;
  tokenExpiresAt?: string | null;
  providerAccountId?: string | null;
  connected?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<DnsProviderConnection | null> {
  const supabase = dbOrNull();
  if (!supabase) return null;

  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("dns_provider_connections")
    .select("id, access_token_encrypted, refresh_token_encrypted, connected_at")
    .eq("owner_user_id", input.ownerUserId)
    .eq("provider_id", input.providerId)
    .maybeSingle();

  const connected = input.connected ?? Boolean(input.accessToken);
  const patch: Record<string, unknown> = {
    provider_account_id: input.providerAccountId ?? null,
    connected,
    updated_at: now
  };

  if (input.accessToken) {
    patch.access_token_encrypted = encryptSecret(input.accessToken);
  }
  if (input.refreshToken !== undefined) {
    patch.refresh_token_encrypted = input.refreshToken ? encryptSecret(input.refreshToken) : null;
  }
  if (input.tokenExpiresAt !== undefined) {
    patch.token_expires_at = input.tokenExpiresAt;
  }
  if (input.metadata) {
    patch.metadata = input.metadata;
  }
  if (connected && !existing?.connected_at) {
    patch.connected_at = now;
  }

  if (existing?.id) {
    const { data, error } = await supabase
      .from("dns_provider_connections")
      .update(patch)
      .eq("id", existing.id)
      .select(SELECT_COLS)
      .single();
    if (error) {
      console.warn("[dns-providers] upsert update failed:", error.message);
      return null;
    }
    return mapConnection(data);
  }

  const row = {
    id: `dpc_${randomBytes(8).toString("hex")}`,
    owner_user_id: input.ownerUserId,
    provider_id: input.providerId,
    provider_account_id: input.providerAccountId || null,
    access_token_encrypted: input.accessToken ? encryptSecret(input.accessToken) : null,
    refresh_token_encrypted: input.refreshToken ? encryptSecret(input.refreshToken) : null,
    token_expires_at: input.tokenExpiresAt || null,
    connected,
    connected_at: connected ? now : null,
    metadata: input.metadata || {},
    updated_at: now,
    created_at: now
  };

  const { data, error } = await supabase.from("dns_provider_connections").insert(row).select(SELECT_COLS).single();
  if (error) {
    console.warn("[dns-providers] upsert insert failed:", error.message);
    return null;
  }
  return mapConnection(data);
}

export async function getDnsProviderConnection(
  ownerUserId: string,
  providerId: DnsProviderId
): Promise<DnsProviderConnection | null> {
  const supabase = dbOrNull();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("dns_provider_connections")
    .select(SELECT_COLS)
    .eq("owner_user_id", ownerUserId)
    .eq("provider_id", providerId)
    .maybeSingle();
  if (error || !data) {
    if (error) console.warn("[dns-providers] get connection failed:", error.message);
    return null;
  }

  const mapped = mapConnection(data);
  if (data.access_token_encrypted) {
    try {
      mapped.accessToken = decryptSecret(String(data.access_token_encrypted));
    } catch {
      mapped.accessToken = undefined;
    }
  }
  if (data.refresh_token_encrypted) {
    try {
      mapped.refreshToken = decryptSecret(String(data.refresh_token_encrypted));
    } catch {
      mapped.refreshToken = undefined;
    }
  }
  return mapped;
}

export async function listDnsProviderConnections(ownerUserId: string): Promise<DnsProviderConnection[]> {
  const supabase = dbOrNull();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("dns_provider_connections")
    .select(SELECT_COLS)
    .eq("owner_user_id", ownerUserId)
    .order("updated_at", { ascending: false });
  if (error) {
    console.warn("[dns-providers] list connections failed:", error.message);
    return [];
  }
  return (data || []).map(mapConnection);
}

export async function disconnectDnsProviderConnection(
  ownerUserId: string,
  providerId: DnsProviderId
): Promise<boolean> {
  const supabase = dbOrNull();
  if (!supabase) return false;
  const { error } = await supabase
    .from("dns_provider_connections")
    .update({
      connected: false,
      access_token_encrypted: null,
      refresh_token_encrypted: null,
      token_expires_at: null,
      updated_at: new Date().toISOString()
    })
    .eq("owner_user_id", ownerUserId)
    .eq("provider_id", providerId);
  if (error) {
    console.warn("[dns-providers] disconnect failed:", error.message);
    return false;
  }
  return true;
}

function mapConnection(row: Record<string, unknown>): DnsProviderConnection {
  return {
    id: String(row.id),
    ownerUserId: String(row.owner_user_id),
    providerId: String(row.provider_id) as DnsProviderId,
    providerAccountId: row.provider_account_id ? String(row.provider_account_id) : null,
    connected: Boolean(row.connected),
    hasToken: Boolean(row.access_token_encrypted),
    hasRefreshToken: Boolean(row.refresh_token_encrypted),
    tokenExpiresAt: row.token_expires_at ? String(row.token_expires_at) : null,
    connectedAt: row.connected_at ? String(row.connected_at) : null,
    updatedAt: String(row.updated_at || "")
  };
}
