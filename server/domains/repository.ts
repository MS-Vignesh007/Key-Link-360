import { getSupabase } from "../db/supabase";
import { getRootStore, setRootStore, flushRootStore } from "../db/rootStore";
import {
  getCustomDomainKind,
  resolveRoutableHostnameAlias
} from "./hostname";

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
  providerHostnameId?: string | null;
  providerStatus?: string | null;
  sslStatus?: string | null;
  ownershipVerification?: Record<string, unknown> | null;
  lastCheckedAt?: string | null;
  errorMessage?: string | null;
  dnsProviderId?: string | null;
  providerConnected?: boolean;
  providerAccountId?: string | null;
  dnsLastVerified?: string | null;
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
  provider_hostname_id?: string | null;
  provider_status?: string | null;
  ssl_status?: string | null;
  ownership_verification?: Record<string, unknown> | null;
  last_checked_at?: string | null;
  error_message?: string | null;
  dns_provider_id?: string | null;
  provider_connected?: boolean | null;
  provider_account_id?: string | null;
  dns_last_verified?: string | null;
  created_at: string;
  updated_at: string;
};

function getLocalDomains(): CustomDomainRecord[] {
  const store = getRootStore();
  return (Array.isArray(store["custom_domains"]) ? store["custom_domains"] : []) as CustomDomainRecord[];
}

function saveLocalDomains(domains: CustomDomainRecord[]): void {
  const store = getRootStore();
  store["custom_domains"] = domains;
  setRootStore(store);
  void flushRootStore();
}

function withTimeout<T>(promise: Promise<T>, ms = 1200): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
  ]);
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

export const ROUTABLE_DOMAIN_STATUSES: DomainStatus[] = ["Verified", "DNS Verified"];

export async function listDomains(ownerUserId: string): Promise<CustomDomainRecord[]> {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await withTimeout(
        supabase
          .from("custom_domains")
          .select("*")
          .eq("owner_user_id", ownerUserId)
          .order("created_at", { ascending: false })
      );
      if (!error && data) {
        return (data as DomainRow[]).map(mapRow);
      }
    }
  } catch {
    // fallback to local rootStore
  }
  return getLocalDomains().filter((d) => d.ownerUserId === ownerUserId);
}

export async function findDomainById(
  id: string,
  ownerUserId: string
): Promise<CustomDomainRecord | null> {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await withTimeout(
        supabase
          .from("custom_domains")
          .select("*")
          .eq("id", id)
          .eq("owner_user_id", ownerUserId)
          .maybeSingle()
      );
      if (!error && data) {
        return mapRow(data as DomainRow);
      }
    }
  } catch {
    // fallback
  }
  return getLocalDomains().find((d) => d.id === id && d.ownerUserId === ownerUserId) || null;
}

export async function findDomainByPageId(
  pageId: string,
  ownerUserId: string
): Promise<CustomDomainRecord | null> {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await withTimeout(
        supabase
          .from("custom_domains")
          .select("*")
          .eq("page_id", pageId)
          .eq("owner_user_id", ownerUserId)
          .maybeSingle()
      );
      if (!error && data) {
        return mapRow(data as DomainRow);
      }
    }
  } catch {
    // fallback
  }
  return getLocalDomains().find((d) => d.pageId === pageId && d.ownerUserId === ownerUserId) || null;
}

export async function findDomainByHostname(
  hostname: string
): Promise<CustomDomainRecord | null> {
  const normalized = hostname.toLowerCase();
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await withTimeout(
        supabase
          .from("custom_domains")
          .select("*")
          .eq("domain_name", normalized)
          .maybeSingle()
      );
      if (!error && data) {
        return mapRow(data as DomainRow);
      }
    }
  } catch {
    // fallback
  }
  const match = getLocalDomains().find((d) => d.domainName.toLowerCase() === normalized);
  if (match) return match;

  const alias = resolveRoutableHostnameAlias(normalized);
  if (alias !== normalized) {
    return getLocalDomains().find((d) => d.domainName.toLowerCase() === alias.toLowerCase()) || null;
  }
  return null;
}

export async function findRoutableDomainByHostname(
  hostname: string
): Promise<CustomDomainRecord | null> {
  const normalized = hostname.toLowerCase();
  const candidates = [normalized, resolveRoutableHostnameAlias(normalized)];
  const localList = getLocalDomains();

  for (const candidate of [...new Set(candidates)]) {
    const match = localList.find(
      (d) =>
        d.domainName.toLowerCase() === candidate.toLowerCase() &&
        (ROUTABLE_DOMAIN_STATUSES.includes(d.status) || Boolean(d.dnsVerifiedAt))
    );
    if (match) return match;
  }

  try {
    const supabase = getSupabase();
    if (supabase) {
      for (const candidate of [...new Set(candidates)]) {
        const { data, error } = await withTimeout(
          supabase
            .from("custom_domains")
            .select("*")
            .eq("domain_name", candidate)
            .maybeSingle()
        );
        if (!error && data) {
          const mapped = mapRow(data as DomainRow);
          if (ROUTABLE_DOMAIN_STATUSES.includes(mapped.status) || Boolean(mapped.dnsVerifiedAt)) {
            return mapped;
          }
        }
      }
    }
  } catch {
    // fallback
  }

  return null;
}

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
  const record: CustomDomainRecord = {
    id: input.id,
    ownerUserId: input.ownerUserId,
    pageId: input.pageId,
    domainName: input.domainName,
    status: "Pending DNS",
    dnsTarget: input.dnsTarget,
    dnsVerifiedAt: null,
    provider: input.provider,
    providerStatus: "pending",
    sslStatus: "pending",
    createdAt: now,
    updatedAt: now
  };

  const list = getLocalDomains();
  list.unshift(record);
  saveLocalDomains(list);

  try {
    const supabase = getSupabase();
    if (supabase) {
      const kind = getCustomDomainKind(input.domainName);
      const recordType = kind === "subdomain" ? "A" : "A";
      void supabase.from("custom_domains").insert({
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
      });
    }
  } catch (e) {
    console.warn("[domains] Supabase insert fallback to rootStore:", e);
  }

  return record;
}

export async function updateDomain(
  id: string,
  ownerUserId: string,
  patch: Record<string, unknown>
): Promise<CustomDomainRecord> {
  const list = getLocalDomains();
  const idx = list.findIndex((d) => d.id === id && d.ownerUserId === ownerUserId);
  if (idx < 0) {
    throw new Error("Domain not found.");
  }

  const existing = list[idx];
  const updated: CustomDomainRecord = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString()
  };
  list[idx] = updated;
  saveLocalDomains(list);

  try {
    const supabase = getSupabase();
    if (supabase) {
      void supabase
        .from("custom_domains")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("owner_user_id", ownerUserId);
    }
  } catch (e) {
    console.warn("[domains] Supabase update fallback to rootStore:", e);
  }

  return updated;
}

export async function updateDomainById(
  id: string,
  patch: Record<string, unknown>
): Promise<CustomDomainRecord> {
  const list = getLocalDomains();
  const idx = list.findIndex((d) => d.id === id);
  if (idx < 0) {
    throw new Error("Domain not found.");
  }

  const existing = list[idx];
  const updated: CustomDomainRecord = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString()
  };
  list[idx] = updated;
  saveLocalDomains(list);

  try {
    const supabase = getSupabase();
    if (supabase) {
      void supabase
        .from("custom_domains")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id);
    }
  } catch {
    // fallback
  }

  return updated;
}

export async function listDomainsForSslPolling(): Promise<CustomDomainRecord[]> {
  return getLocalDomains().filter(
    (d) =>
      ["DNS Verified", "Provisioning SSL", "Pending DNS"].includes(d.status) &&
      Boolean(d.dnsVerifiedAt)
  );
}

export async function removeDomain(id: string, ownerUserId: string): Promise<void> {
  const list = getLocalDomains();
  const filtered = list.filter((d) => !(d.id === id && d.ownerUserId === ownerUserId));
  if (filtered.length === list.length) {
    throw new Error("Domain not found or you do not have permission to remove it.");
  }
  saveLocalDomains(filtered);

  try {
    const supabase = getSupabase();
    if (supabase) {
      void supabase
        .from("custom_domains")
        .delete()
        .eq("id", id)
        .eq("owner_user_id", ownerUserId);
    }
  } catch {
    // fallback
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
    const supabase = getSupabase();
    if (supabase) {
      void supabase.from("domain_verification_logs").insert({
        domain_id: input.domainId,
        owner_user_id: input.ownerUserId,
        event: input.event,
        status: input.status,
        message: input.message ?? null,
        metadata: input.metadata ?? {},
        created_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.warn("[domains] verification log unavailable:", error);
  }
}
