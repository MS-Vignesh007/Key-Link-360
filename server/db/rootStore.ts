import fs from "fs";
import path from "path";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import { syncRootToNormalizedTables } from "./syncNormalized";

const STORE_FILE = path.join(process.cwd(), "data-store.json");
const ROOT_KEY = "root";
/** Cap remote upsert wait so Cloudflare/Supabase 520s cannot stall the HTTP server. */
const SUPABASE_TIMEOUT_MS = 8_000;
const SUPABASE_COOLDOWN_MS = 5 * 60_000;
/** Batch disk writes — pretty 5MB sync writes freeze Express + Vite for seconds. */
const DISK_DEBOUNCE_MS = 400;

let memory: Record<string, unknown> = {};
let initialized = false;
let writeChain: Promise<void> = Promise.resolve();
let backend: "supabase" | "file" = "file";
let lastError: string | null = null;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let diskTimer: ReturnType<typeof setTimeout> | null = null;
let lastNormalizedSyncError: string | null = null;
let supabaseCooldownUntil = 0;
let supabaseFailCount = 0;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function readFileRoot(): Record<string, unknown> {
  try {
    if (fs.existsSync(STORE_FILE)) {
      return JSON.parse(fs.readFileSync(STORE_FILE, "utf-8")) as Record<string, unknown>;
    }
  } catch (error) {
    console.error("Error reading data store file:", error);
  }
  return {};
}

function writeFileRootNow(data: Record<string, unknown>) {
  try {
    // Compact JSON — null,2 on a multi‑MB store blocks the event loop for seconds.
    fs.writeFileSync(STORE_FILE, JSON.stringify(data), "utf-8");
  } catch (error) {
    console.error("Error writing data store file:", error);
  }
}

function scheduleDiskWrite() {
  if (diskTimer) clearTimeout(diskTimer);
  diskTimer = setTimeout(() => {
    diskTimer = null;
    writeFileRootNow(memory);
  }, DISK_DEBOUNCE_MS);
}

function supabaseAvailable(): boolean {
  return isSupabaseConfigured() && Date.now() >= supabaseCooldownUntil;
}

function openSupabaseCircuit(reason: string) {
  supabaseFailCount += 1;
  lastError = reason;
  if (supabaseFailCount >= 2) {
    supabaseCooldownUntil = Date.now() + SUPABASE_COOLDOWN_MS;
    backend = "file";
    console.warn(
      `Data store: Supabase circuit open for ${Math.round(SUPABASE_COOLDOWN_MS / 1000)}s — ${reason}`
    );
  }
}

async function loadFromSupabase(): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await withTimeout(
      Promise.resolve(supabase.from("app_kv").select("value").eq("key", ROOT_KEY).maybeSingle()),
      SUPABASE_TIMEOUT_MS,
      "Supabase load"
    );
    if (error) {
      openSupabaseCircuit(error.message);
      console.error("Supabase load failed:", error.message);
      return null;
    }
    supabaseFailCount = 0;
    lastError = null;
    if (data?.value && typeof data.value === "object" && !Array.isArray(data.value)) {
      return data.value as Record<string, unknown>;
    }
    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    openSupabaseCircuit(message);
    console.error("Supabase load failed:", message);
    return null;
  }
}

async function persistToSupabase(data: Record<string, unknown>): Promise<void> {
  if (!supabaseAvailable()) return;
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const { error } = await withTimeout(
      Promise.resolve(
        supabase.from("app_kv").upsert(
          { key: ROOT_KEY, value: data, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        )
      ),
      SUPABASE_TIMEOUT_MS,
      "Supabase persist"
    );
    if (error) {
      openSupabaseCircuit(error.message);
      console.error("Supabase persist failed:", error.message);
      return;
    }
    supabaseFailCount = 0;
    lastError = null;
    if (backend === "file" && isSupabaseConfigured()) {
      backend = "supabase";
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    openSupabaseCircuit(message);
    console.error("Supabase persist failed:", message);
  }
}

function scheduleNormalizedSync() {
  if (!supabaseAvailable()) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    writeChain = writeChain
      .then(async () => {
        if (!supabaseAvailable()) return;
        const supabase = getSupabase();
        if (!supabase) return;
        const result = await withTimeout(
          syncRootToNormalizedTables(supabase, memory),
          SUPABASE_TIMEOUT_MS * 2,
          "Normalized sync"
        );
        if (!result.ok) {
          lastNormalizedSyncError = result.error;
          console.error("Normalized table sync failed:", result.error);
        } else {
          lastNormalizedSyncError = null;
        }
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        openSupabaseCircuit(message);
        console.error("Normalized sync queue error:", err);
      });
  }, 1500);
}

/**
 * Prefer local file so HTTP can serve immediately. Remote load is best-effort with timeouts.
 */
export async function initRootStore(): Promise<void> {
  if (initialized) return;

  memory = readFileRoot();
  backend = "file";
  initialized = true;
  console.log(
    `Data store: local file ready (${Math.round(Buffer.byteLength(JSON.stringify(memory)) / 1024)} KB)`
  );

  if (!isSupabaseConfigured()) {
    console.log("Data store: Supabase not configured — file only");
    return;
  }

  const remote = await loadFromSupabase();
  if (!remote) {
    console.warn("Data store: staying on file (Supabase unavailable or timed out)");
    return;
  }

  const remoteKeys = Object.keys(remote).length;
  const localKeys = Object.keys(memory).length;
  if (remoteKeys > 0) {
    memory = remote;
    backend = "supabase";
    scheduleDiskWrite();
    console.log("Data store: Supabase (app_kv)");
  } else if (localKeys > 0) {
    backend = "supabase";
    console.log("Migrating local data-store.json → Supabase app_kv (background)");
    writeChain = writeChain.then(() => persistToSupabase(memory));
  } else {
    backend = "supabase";
    console.log("Data store: Supabase (empty)");
  }

  // Never block startup on full normalized migration.
  scheduleNormalizedSync();

  // Login reads root.auth.users — recover accounts from auth_users if that bucket is empty.
  try {
    const { hydrateAuthUsersFromSupabase } = await import("../auth/store");
    await hydrateAuthUsersFromSupabase();
  } catch (error) {
    console.error("Auth user hydrate on startup failed:", error);
  }
}

export function getRootStore(): Record<string, unknown> {
  if (!initialized) {
    memory = readFileRoot();
    initialized = true;
    backend = "file";
  }
  return memory;
}

export function setRootStore(data: Record<string, unknown>): void {
  memory = data;
  scheduleDiskWrite();

  if (backend === "supabase" || (isSupabaseConfigured() && supabaseAvailable())) {
    writeChain = writeChain
      .then(() => persistToSupabase(memory))
      .catch((err) => console.error("Queued Supabase write failed:", err));
    scheduleNormalizedSync();
  }
}

export async function flushRootStore(): Promise<void> {
  if (diskTimer) {
    clearTimeout(diskTimer);
    diskTimer = null;
    writeFileRootNow(memory);
  }
  await writeChain;
}

export async function reloadQrCodesFromSupabase(): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabaseAvailable()) return false;
  try {
    const remote = await loadFromSupabase();
    if (!remote) return false;
    const remoteQr = remote.qr_codes;
    if (!Array.isArray(remoteQr)) return false;
    const localQr = Array.isArray(memory.qr_codes) ? memory.qr_codes : [];
    const { mergeQrCodeLists } = await import("../qrCodes/repository");
    memory = {
      ...memory,
      qr_codes: mergeQrCodeLists(localQr, remoteQr)
    };
    return true;
  } catch (error) {
    console.error("reloadQrCodesFromSupabase failed:", error);
    return false;
  }
}

export function getDataStoreStatus(): {
  backend: "supabase" | "file";
  supabaseConfigured: boolean;
  lastError: string | null;
  lastNormalizedSyncError: string | null;
  supabaseCooldownUntil: number | null;
} {
  return {
    backend,
    supabaseConfigured: isSupabaseConfigured(),
    lastError,
    lastNormalizedSyncError,
    supabaseCooldownUntil: supabaseCooldownUntil > Date.now() ? supabaseCooldownUntil : null
  };
}
