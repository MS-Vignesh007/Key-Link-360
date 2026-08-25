import { getSupabase, isSupabaseConfigured } from "../db/supabase";
import type { QrCodeRecord } from "./repository";

function normalizeCode(code: string): string {
  return String(code || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
}

function routeKey(code: string): string {
  return `qr_route:${normalizeCode(code)}`;
}

type QrRouteValue = {
  id: string;
  name: string;
  status: "Active" | "Paused";
  targetUrl: string;
  targetUpdatedAt?: string;
  publicCode: string;
  scanUrl?: string;
  ownerUserId?: string;
};

/** Tiny durable mapping for /q/:code — avoids huge root blob timeouts. */
export async function upsertQrRouteIndex(row: QrCodeRecord): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return false;
  const publicCode = normalizeCode(row.publicCode || "");
  if (!publicCode || !row.targetUrl) return false;

  const value: QrRouteValue = {
    id: row.id,
    name: row.name || "",
    status: row.status === "Paused" ? "Paused" : "Active",
    targetUrl: String(row.targetUrl || "").trim(),
    targetUpdatedAt: row.targetUpdatedAt || new Date().toISOString(),
    publicCode,
    scanUrl: row.scanUrl,
    ownerUserId: row.ownerUserId
  };
  if (!value.targetUrl) return false;

  const { error } = await supabase.from("app_kv").upsert(
    {
      key: routeKey(publicCode),
      value,
      updated_at: new Date().toISOString()
    },
    { onConflict: "key" }
  );
  if (error) {
    console.error("QR route index upsert failed:", error.message);
    return false;
  }
  return true;
}

export async function findQrRouteByPublicCode(code: string): Promise<QrCodeRecord | null> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return null;
  const publicCode = normalizeCode(code);
  if (!publicCode) return null;

  const { data, error } = await supabase
    .from("app_kv")
    .select("value")
    .eq("key", routeKey(publicCode))
    .maybeSingle();

  if (error) {
    console.error("QR route index lookup failed:", error.message);
    return null;
  }
  const value = data?.value as QrRouteValue | null;
  if (!value || typeof value !== "object" || !value.targetUrl) return null;

  return {
    id: String(value.id || publicCode),
    name: String(value.name || "Smart QR"),
    status: value.status === "Paused" ? "Paused" : "Active",
    scans: "0",
    uniqueScanners: "0",
    qrUrl: "",
    targetUrl: String(value.targetUrl),
    targetUpdatedAt: value.targetUpdatedAt ? String(value.targetUpdatedAt) : undefined,
    publicCode: String(value.publicCode || publicCode),
    scanUrl: value.scanUrl ? String(value.scanUrl) : undefined,
    customDesign: true,
    ownerUserId: value.ownerUserId ? String(value.ownerUserId) : undefined
  };
}

export async function deleteQrRouteIndex(publicCode: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return;
  const code = normalizeCode(publicCode);
  if (!code) return;
  const { error } = await supabase.from("app_kv").delete().eq("key", routeKey(code));
  if (error) console.error("QR route index delete failed:", error.message);
}

/** Optional typed-table upsert when public_code column exists. */
export async function upsertQrCodeRow(row: QrCodeRecord): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return false;
  const publicCode = normalizeCode(row.publicCode || "");
  const payload: Record<string, unknown> = {
    id: row.id,
    name: row.name || "",
    status: row.status || "Active",
    scans: row.scans || "0",
    unique_scanners: row.uniqueScanners || "0",
    top_location: row.topLocation ?? null,
    conversion_rate: row.conversionRate ?? null,
    qr_url: row.qrUrl || "",
    target_url: row.targetUrl || "",
    target_updated_at: row.targetUpdatedAt || new Date().toISOString(),
    custom_design: Boolean(row.customDesign),
    design_color: row.designColor ?? null,
    design_logo: row.designLogo && row.designLogo !== "custom" ? row.designLogo : row.designLogo || null,
    design_pattern: row.designPattern ?? null,
    owner_user_id: row.ownerUserId ?? null,
    public_code: publicCode || null,
    scan_url: row.scanUrl || null,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from("qr_codes").upsert(payload, { onConflict: "id" });
  if (!error) return true;

  if (/public_code|scan_url|target_updated_at|schema cache/i.test(error.message)) {
    delete payload.public_code;
    delete payload.scan_url;
    delete payload.target_updated_at;
    const retry = await supabase.from("qr_codes").upsert(payload, { onConflict: "id" });
    if (retry.error) {
      console.error("Direct QR Supabase upsert failed:", retry.error.message);
      return false;
    }
    return true;
  }

  console.error("Direct QR Supabase upsert failed:", error.message);
  return false;
}

export async function findQrCodeByPublicCode(code: string): Promise<QrCodeRecord | null> {
  // Prefer tiny route index (works without schema migrate).
  const fromIndex = await findQrRouteByPublicCode(code);
  if (fromIndex) return fromIndex;

  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return null;
  const normalized = normalizeCode(code);
  if (!normalized) return null;

  const { data, error } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("public_code", normalized)
    .maybeSingle();

  if (error) {
    if (/public_code|schema cache/i.test(error.message)) return null;
    console.error("QR public_code lookup failed:", error.message);
    return null;
  }
  if (!data) return null;

  return {
    id: String(data.id),
    name: String(data.name || ""),
    status: data.status === "Paused" ? "Paused" : "Active",
    scans: String(data.scans ?? "0"),
    uniqueScanners: String(data.unique_scanners ?? "0"),
    topLocation: data.top_location ? String(data.top_location) : undefined,
    conversionRate: data.conversion_rate ? String(data.conversion_rate) : undefined,
    qrUrl: String(data.qr_url || ""),
    targetUrl: String(data.target_url || ""),
    targetUpdatedAt: data.target_updated_at ? String(data.target_updated_at) : undefined,
    scanUrl: data.scan_url ? String(data.scan_url) : undefined,
    publicCode: data.public_code ? String(data.public_code) : normalized,
    customDesign: Boolean(data.custom_design),
    designColor: data.design_color ? String(data.design_color) : undefined,
    designLogo: data.design_logo ? String(data.design_logo) : undefined,
    designPattern: data.design_pattern ? String(data.design_pattern) : undefined,
    ownerUserId: data.owner_user_id ? String(data.owner_user_id) : undefined
  };
}

export async function deleteQrCodeRow(id: string, publicCode?: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return;
  if (publicCode) await deleteQrRouteIndex(publicCode);
  const { error } = await supabase.from("qr_codes").delete().eq("id", id);
  if (error) console.error("Direct QR Supabase delete failed:", error.message);
}
