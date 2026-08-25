import { getSupabase } from "../db/supabase";
import { buildPlatformSubdomainHostname, normalizePlatformSlug } from "./slug";

export type PlatformSubdomainRecord = {
  id: string;
  slug: string;
  pageId: string;
  ownerUserId: string;
  status: "active" | "disabled";
  hostname: string;
  createdAt: string;
  updatedAt: string;
};

type Row = {
  id: string;
  slug: string;
  page_id: string;
  owner_user_id: string;
  status: "active" | "disabled";
  created_at: string;
  updated_at: string;
};

function db() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function mapRow(row: Row): PlatformSubdomainRecord {
  const slug = normalizePlatformSlug(row.slug);
  return {
    id: row.id,
    slug,
    pageId: row.page_id,
    ownerUserId: row.owner_user_id,
    status: row.status,
    hostname: buildPlatformSubdomainHostname(slug),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listPlatformSubdomains(ownerUserId: string): Promise<PlatformSubdomainRecord[]> {
  const { data, error } = await db()
    .from("platform_subdomains")
    .select("*")
    .eq("owner_user_id", ownerUserId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data || []) as Row[]).map(mapRow);
}

export async function findPlatformSubdomainById(
  id: string,
  ownerUserId: string
): Promise<PlatformSubdomainRecord | null> {
  const { data, error } = await db()
    .from("platform_subdomains")
    .select("*")
    .eq("id", id)
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data as Row) : null;
}

export async function findPlatformSubdomainBySlug(slug: string): Promise<PlatformSubdomainRecord | null> {
  const normalized = normalizePlatformSlug(slug);
  const { data, error } = await db()
    .from("platform_subdomains")
    .select("*")
    .eq("slug", normalized)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data as Row) : null;
}

export async function findPlatformSubdomainByPageId(
  pageId: string,
  ownerUserId: string
): Promise<PlatformSubdomainRecord | null> {
  const { data, error } = await db()
    .from("platform_subdomains")
    .select("*")
    .eq("page_id", pageId)
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data as Row) : null;
}

export async function isPlatformSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const normalized = normalizePlatformSlug(slug);
  let query = db().from("platform_subdomains").select("id").eq("slug", normalized);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function createPlatformSubdomain(input: {
  id: string;
  slug: string;
  pageId: string;
  ownerUserId: string;
}): Promise<PlatformSubdomainRecord> {
  const now = new Date().toISOString();
  const slug = normalizePlatformSlug(input.slug);
  const { data, error } = await db()
    .from("platform_subdomains")
    .insert({
      id: input.id,
      slug,
      page_id: input.pageId,
      owner_user_id: input.ownerUserId,
      status: "active",
      created_at: now,
      updated_at: now
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as Row);
}

export async function updatePlatformSubdomain(
  id: string,
  ownerUserId: string,
  patch: Record<string, unknown>
): Promise<PlatformSubdomainRecord> {
  const { data, error } = await db()
    .from("platform_subdomains")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_user_id", ownerUserId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as Row);
}

export async function removePlatformSubdomain(id: string, ownerUserId: string): Promise<void> {
  const { error } = await db()
    .from("platform_subdomains")
    .delete()
    .eq("id", id)
    .eq("owner_user_id", ownerUserId);
  if (error) throw new Error(error.message);
}
