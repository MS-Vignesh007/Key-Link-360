import { getSupabase } from "../db/supabase";
import { resolveRoutableHostnameAlias, getCustomDomainKind } from "./hostname";

export type DomainStatus =
  | "Pending DNS"
  | "DNS Verified"
  | "Provisioning SSL"
  | "Verified"
  | "Error";

export type CustomDomainRecord = {
  id: string;
  ownerUserId: string;
  pageId: string;
  domainName: string;
  status: DomainStatus;
  dnsTarget: string;
  dnsVerifiedAt: string | null;
  provider: "cloudflare" | "manual";
  providerHostnameId: string | null;
  providerStatus: string;
  sslStatus: string;
  ownershipVerification: Record<string, unknown> | null;
  lastCheckedAt: string | null;
  errorMessage: string | null;
  dnsProviderId: string | null;
  providerConnected: boolean;
  providerAccountId: string | null;
  dnsLastVerified: string | null;
  createdAt: string;
  updatedAt: string;
};

type DomainRow = {
  id: string;
  owner_user_id: string;
  page_id: string;
  domain_name: string;
  status: DomainStatus;
  dns_target: string;
  dns_verified_at: string | null;
  provider: "cloudflare" | "manual";
  provider_hostname_id: string | null;
  provider_status: string;
  ssl_status: string;
  ownership_verification: Record<string, unknown> | null;
  last_checked_at: string | null;
  error_message: string | null;
  dns_provider_id?: string | null;
  provider_connected?: boolean | null;
  provider_account_id?: string | null;
  dns_last_verified?: string | null;
  created_at: string;
  updated_at: string;
};

function db() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function mapRow(row: DomainRow): CustomDomainRecord {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    pageId: row.page_id,
    domainName: row.domain_name,
    status: row.status,
    dnsTarget: row.dns_target,
    dnsVerifiedAt: row.dns_verified_at,
    provider: row.provider,
    providerHostnameId: row.provider_hostname_id,
    providerStatus: row.provider_status,
    sslStatus: row.ssl_status,
    ownershipVerification: row.ownership_verification,
    lastCheckedAt: row.last_checked_at,
    errorMessage: row.error_message,
    dnsProviderId: row.dns_provider_id ?? null,
    providerConnected: Boolean(row.provider_connected),
    providerAccountId: row.provider_account_id ?? null,
    dnsLastVerified: row.dns_last_verified ?? row.dns_verified_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listDomains(ownerUserId: string): Promise<CustomDomainRecord[]> {
  const { data, error } = await db()
    .from("custom_domains")
    .select("*")
    .eq("owner_user_id", ownerUserId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data || []) as DomainRow[]).map(mapRow);
}

export async function findDomainById(
  id: string,
  ownerUserId: string
): Promise<CustomDomainRecord | null> {
  const { data, error } = await db()
    .from("custom_domains")
    .select("*")
    .eq("id", id)
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data as DomainRow) : null;
}

export async function findDomainByPageId(
  pageId: string,
  ownerUserId: string
): Promise<CustomDomainRecord | null> {
  const { data, error } = await db()
    .from("custom_domains")
    .select("*")
    .eq("page_id", pageId)
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data as DomainRow) : null;
}

/** Hostnames that may serve a published page (full SSL or DNS-only + customer proxy). */
export const ROUTABLE_DOMAIN_STATUSES: DomainStatus[] = ["Verified", "DNS Verified"];

export async function findDomainByHostname(
  hostname: string
): Promise<CustomDomainRecord | null> {
  const normalized = hostname.toLowerCase();
  const { data, error } = await db()
    .from("custom_domains")
    .select("*")
    .eq("domain_name", normalized)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return mapRow(data as DomainRow);

  const alias = resolveRoutableHostnameAlias(normalized);
  if (alias === normalized) return null;

  const { data: aliased, error: aliasError } = await db()
    .from("custom_domains")
    .select("*")
    .eq("domain_name", alias)
    .maybeSingle();
  if (aliasError) throw new Error(aliasError.message);
  return aliased ? mapRow(aliased as DomainRow) : null;
}

async function findRoutableRowByStoredHostname(hostname: string): Promise<DomainRow | null> {
  const normalized = hostname.toLowerCase();
  const { data, error } = await db()
    .from("custom_domains")
    .select("*")
    .eq("domain_name", normalized)
    .in("status", ROUTABLE_DOMAIN_STATUSES)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return data as DomainRow;

  const alias = resolveRoutableHostnameAlias(normalized);
  if (alias === normalized) return null;

  const { data: aliased, error: aliasError } = await db()
    .from("custom_domains")
    .select("*")
    .eq("domain_name", alias)
    .in("status", ROUTABLE_DOMAIN_STATUSES)
    .maybeSingle();
  if (aliasError) throw new Error(aliasError.message);
  return (aliased as DomainRow | null) ?? null;
}

export async function findRoutableDomainByHostname(
  hostname: string
): Promise<CustomDomainRecord | null> {
  const row = await findRoutableRowByStoredHostname(hostname);
  if (row) return mapRow(row);

  // Keep serving after a successful verify even if status was reset to Pending DNS.
  const normalized = hostname.toLowerCase();
  const candidates = [normalized, resolveRoutableHostnameAlias(normalized)];
  for (const candidate of [...new Set(candidates)]) {
    const { data: fallback, error: fallbackError } = await db()
      .from("custom_domains")
      .select("*")
      .eq("domain_name", candidate)
      .not("dns_verified_at", "is", null)
      .maybeSingle();
    if (fallbackError) throw new Error(fallbackError.message);
    if (fallback) return mapRow(fallback as DomainRow);
  }

  return null;
}

/** @deprecated Use findRoutableDomainByHostname */
export const findVerifiedDomainByHostname = findRoutableDomainByHostname;

export async function createDomain(input: {
  id: string;
  ownerUserId: string;
  pageId: string;
  domainName: string;
  dnsTarget: string;
  provider: "cloudflare" | "manual";
}): Promise<CustomDomainRecord> {
  const now = new Date().toISOString();
  const kind = getCustomDomainKind(input.domainName);
  const recordType = kind === "subdomain" ? "A" : "A";
  const { data, error } = await db()
    .from("custom_domains")
    .insert({
      id: input.id,
      owner_user_id: input.ownerUserId,
      page_id: input.pageId,
      domain_name: input.domainName,
      type: recordType,
      target_ip: input.dnsTarget,
      status: "Pending DNS",
      dns_target: input.dnsTarget,
      provider: input.provider,
      provider_status: "pending",
      ssl_status: "pending",
      created_at: now,
      updated_at: now
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as DomainRow);
}

export async function updateDomain(
  id: string,
  ownerUserId: string,
  patch: Record<string, unknown>
): Promise<CustomDomainRecord> {
  const { data, error } = await db()
    .from("custom_domains")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_user_id", ownerUserId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as DomainRow);
}

/** System updates (SSL poller) without owner scoping on the write path. */
export async function updateDomainById(
  id: string,
  patch: Record<string, unknown>
): Promise<CustomDomainRecord> {
  const { data, error } = await db()
    .from("custom_domains")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as DomainRow);
}

export async function listDomainsForSslPolling(): Promise<CustomDomainRecord[]> {
  const { data, error } = await db()
    .from("custom_domains")
    .select("*")
    .in("status", ["DNS Verified", "Provisioning SSL", "Pending DNS"])
    .not("dns_verified_at", "is", null);
  if (error) throw new Error(error.message);
  return ((data || []) as DomainRow[]).map(mapRow);
}

export async function removeDomain(id: string, ownerUserId: string): Promise<void> {
  const { data, error } = await db()
    .from("custom_domains")
    .delete()
    .eq("id", id)
    .eq("owner_user_id", ownerUserId)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) {
    throw new Error("Domain not found or you do not have permission to remove it.");
  }
}

export async function appendDomainVerificationLog(input: {
  domainId: string;
  ownerUserId: string;
  event: string;
  status: string;
  message?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const { error } = await db().from("domain_verification_logs").insert({
      domain_id: input.domainId,
      owner_user_id: input.ownerUserId,
      event: input.event,
      status: input.status,
      message: input.message ?? null,
      metadata: input.metadata ?? {},
      created_at: new Date().toISOString()
    });
    if (error) console.warn("[domains] verification log insert failed:", error.message);
  } catch (error) {
    console.warn("[domains] verification log unavailable:", error);
  }
}
