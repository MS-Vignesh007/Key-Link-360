import type { QrCodeRecord } from "./repository";
import { isSupabaseConfigured } from "../db/supabase";
import { getDataStoreStatus } from "../db/rootStore";

/** Retry durable destination publish so mobile /q scans hit the latest Edit URL. */
export async function publishQrDestination(
  row: QrCodeRecord,
  attempts = 2
): Promise<{ ok: boolean; error?: string; localOnly?: boolean }> {
  if (!isSupabaseConfigured() || getDataStoreStatus().supabaseCooldownUntil) {
    return { ok: true, localOnly: true };
  }
  const { upsertQrRouteIndex, upsertQrCodeRow } = await import("./supabaseSync");
  let lastError = "";

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const indexed = await upsertQrRouteIndex(row);
      if (indexed) {
        // Best-effort typed row — route index is enough for redirects.
        await upsertQrCodeRow(row).catch(() => false);
        return { ok: true };
      }
      lastError = "QR route index upsert returned false";
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.error(`QR destination publish attempt ${attempt}/${attempts} failed:`, lastError);
    }
    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
    }
  }

  // Graceful degraded mode fallback: Local store already has the updated QR
  return { ok: true, error: lastError, localOnly: true };
}
