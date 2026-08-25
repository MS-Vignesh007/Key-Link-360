import { getRootStore, setRootStore } from "../db/rootStore";

export type QrCodeRecord = {
  id: string;
  name: string;
  status: "Active" | "Paused";
  scans: string;
  uniqueScanners: string;
  topLocation?: string;
  conversionRate?: string;
  qrUrl: string;
  targetUrl: string;
  /** ISO time when destination URL last changed — used to win redirects after Edit URL. */
  targetUpdatedAt?: string;
  /** Fixed public URL encoded into the QR matrix — never rewrite after create. */
  scanUrl?: string;
  /** Short code in /q/:code — never rewrite after create. */
  publicCode?: string;
  customDesign: boolean;
  designColor?: string;
  designLogo?: string;
  designLogoUrl?: string;
  designPattern?: string;
  ownerUserId?: string;
};

const STORE_KEY = "qr_codes";
const MAX_SCAN_EVENTS = 2000;

type ScanEvent = { code: string; ip: string; at: string };

function readAll(): QrCodeRecord[] {
  const raw = getRootStore()[STORE_KEY];
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is QrCodeRecord =>
      Boolean(item) && typeof item === "object" && typeof (item as QrCodeRecord).id === "string"
  );
}

function writeAll(rows: QrCodeRecord[]) {
  const store = getRootStore();
  setRootStore({ ...store, [STORE_KEY]: rows });
}

function readScanEvents(): ScanEvent[] {
  const raw = getRootStore().qr_scan_events;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is ScanEvent =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as ScanEvent).code === "string" &&
      typeof (item as ScanEvent).ip === "string"
  );
}

function writeScanEvents(events: ScanEvent[]) {
  const store = getRootStore();
  setRootStore({ ...store, qr_scan_events: events.slice(0, MAX_SCAN_EVENTS) });
}

function normalizeCode(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
}

function parseCount(value: string | undefined): number {
  const n = Number(String(value || "").replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function listQrCodes(): QrCodeRecord[] {
  return readAll();
}

export function resolvePublicQrCode(code: string): QrCodeRecord | null {
  const normalized = normalizeCode(code);
  if (!normalized) return null;
  const rows = readAll();
  return (
    rows.find((row) => normalizeCode(row.publicCode || "") === normalized) ||
    rows.find((row) => normalizeCode(row.id) === normalized) ||
    null
  );
}

function targetUpdatedMs(row?: Pick<QrCodeRecord, "targetUpdatedAt"> | null): number {
  const ms = Date.parse(String(row?.targetUpdatedAt || ""));
  return Number.isFinite(ms) ? ms : 0;
}

/** Prefer the destination that was edited most recently (Edit URL rule). */
export function pickFresherQrDestination(
  a?: QrCodeRecord | null,
  b?: QrCodeRecord | null
): Pick<QrCodeRecord, "targetUrl" | "status" | "targetUpdatedAt"> | null {
  if (!a?.targetUrl && !b?.targetUrl) return null;
  if (!a?.targetUrl && b?.targetUrl) {
    return { targetUrl: b.targetUrl, status: b.status, targetUpdatedAt: b.targetUpdatedAt };
  }
  if (a?.targetUrl && !b?.targetUrl) {
    return { targetUrl: a.targetUrl, status: a.status, targetUpdatedAt: a.targetUpdatedAt };
  }
  const aMs = targetUpdatedMs(a);
  const bMs = targetUpdatedMs(b);
  if (bMs > aMs) {
    return { targetUrl: b!.targetUrl, status: b!.status, targetUpdatedAt: b!.targetUpdatedAt };
  }
  if (aMs > bMs) {
    return { targetUrl: a!.targetUrl, status: a!.status, targetUpdatedAt: a!.targetUpdatedAt };
  }
  // No timestamps (legacy): prefer durable route-index/table row when passed as `b`.
  if (bMs === 0 && aMs === 0 && b?.targetUrl) {
    return { targetUrl: b.targetUrl, status: b.status || a!.status, targetUpdatedAt: b.targetUpdatedAt };
  }
  return { targetUrl: a!.targetUrl, status: a!.status, targetUpdatedAt: a!.targetUpdatedAt };
}

/**
 * Resolve Smart QR for public scan/redirect.
 * Printed matrix (/q/:code) stays fixed.
 * Destination ALWAYS follows the durable route index (Edit URL), not a stale server blob.
 */
export async function resolveQrForPublicRedirect(code: string): Promise<QrCodeRecord | null> {
  const normalized = normalizeCode(code);
  if (!normalized) return null;

  // 1) Destination source of truth — written on every Edit URL / create.
  let route: QrCodeRecord | null = null;
  try {
    const { findQrRouteByPublicCode } = await import("./supabaseSync");
    route = await findQrRouteByPublicCode(normalized);
  } catch {
    /* ignore */
  }

  // 2) Local memory / root blob for identity + scan counters.
  let memory = resolvePublicQrCode(normalized);
  if (!memory) {
    try {
      const { reloadQrCodesFromSupabase } = await import("../db/rootStore");
      await reloadQrCodesFromSupabase();
      memory = resolvePublicQrCode(normalized);
    } catch {
      /* ignore */
    }
  }

  // 3) Typed table fallback only when route index missing.
  if (!route) {
    try {
      const { findQrCodeByPublicCode } = await import("./supabaseSync");
      route = await findQrCodeByPublicCode(normalized);
    } catch {
      /* ignore */
    }
  }

  if (!memory && !route) return null;

  if (route?.targetUrl) {
    const base = memory || route;
    const routeMs = targetUpdatedMs(route);
    const memMs = targetUpdatedMs(memory);
    // Route index is the Edit URL source of truth for mobile scans.
    // Memory wins only when it has a strictly newer stamp (same-server save in flight).
    const useMemoryDestination =
      Boolean(memory?.targetUrl) && memMs > routeMs && memMs > 0;
    const targetUrl = useMemoryDestination ? String(memory!.targetUrl) : route.targetUrl;
    const status = useMemoryDestination
      ? memory!.status
      : route.status || base.status;
    const targetUpdatedAt = useMemoryDestination
      ? memory!.targetUpdatedAt
      : route.targetUpdatedAt || base.targetUpdatedAt;

    if (!memory) {
      upsertQrCode({ ...route, targetUrl, targetUpdatedAt, status });
    } else if (memory.targetUrl !== targetUrl) {
      upsertQrCode({
        ...memory,
        targetUrl,
        targetUpdatedAt,
        status
      });
    }

    return {
      ...base,
      targetUrl,
      status,
      targetUpdatedAt,
      publicCode: base.publicCode || route.publicCode,
      scanUrl: base.scanUrl || route.scanUrl
    };
  }

  return memory;
}

export function recordQrScan(
  code: string,
  ip: string
): { record: QrCodeRecord; scans: number; uniqueScanners: number } | null {
  const rows = readAll();
  const normalized = normalizeCode(code);
  const index = rows.findIndex(
    (row) =>
      normalizeCode(row.publicCode || "") === normalized || normalizeCode(row.id) === normalized
  );
  if (index < 0) return null;

  const current = rows[index];
  if (current.status !== "Active") {
    return {
      record: current,
      scans: parseCount(current.scans),
      uniqueScanners: parseCount(current.uniqueScanners)
    };
  }

  const now = new Date().toISOString();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayStartMs = dayStart.getTime();
  const clientIp = String(ip || "unknown").slice(0, 64);

  const events = readScanEvents();
  const alreadyUniqueToday = events.some(
    (event) =>
      normalizeCode(event.code) === normalized &&
      event.ip === clientIp &&
      new Date(event.at).getTime() >= dayStartMs
  );

  const nextScans = parseCount(current.scans) + 1;
  const nextUnique = parseCount(current.uniqueScanners) + (alreadyUniqueToday ? 0 : 1);

  const next: QrCodeRecord = {
    ...current,
    scans: String(nextScans),
    uniqueScanners: String(nextUnique),
    conversionRate: `${((nextUnique / nextScans) * 100).toFixed(1)}%`
  };
  rows[index] = next;
  writeAll(rows);
  writeScanEvents([{ code: normalized, ip: clientIp, at: now }, ...events]);

  return { record: next, scans: nextScans, uniqueScanners: nextUnique };
}

export function mergeQrCodeLists(
  existingRaw: unknown,
  incomingRaw: unknown,
  options?: { pruneToIncomingForOwner?: string }
): QrCodeRecord[] {
  const existing = Array.isArray(existingRaw)
    ? existingRaw.filter(
        (item): item is QrCodeRecord =>
          Boolean(item) && typeof item === "object" && typeof (item as QrCodeRecord).id === "string"
      )
    : [];
  const incoming = Array.isArray(incomingRaw)
    ? incomingRaw.filter(
        (item): item is QrCodeRecord =>
          Boolean(item) && typeof item === "object" && typeof (item as QrCodeRecord).id === "string"
      )
    : [];

  const byId = new Map(existing.map((row) => [row.id, row]));
  for (const item of incoming) {
    const prev = byId.get(item.id);
    const prevScans = parseCount(prev?.scans);
    const nextScans = parseCount(item.scans);
    const prevUnique = parseCount(prev?.uniqueScanners);
    const nextUnique = parseCount(item.uniqueScanners);
    const picked = pickFresherQrDestination(prev, item);
    byId.set(item.id, {
      ...prev,
      ...item,
      ownerUserId: item.ownerUserId || prev?.ownerUserId || options?.pruneToIncomingForOwner,
      scans: String(Math.max(prevScans, nextScans)),
      uniqueScanners: String(Math.max(prevUnique, nextUnique)),
      // Destination follows the freshest Edit URL — never a stale blob overwrite.
      targetUrl: picked?.targetUrl || item.targetUrl || prev?.targetUrl || "",
      targetUpdatedAt: picked?.targetUpdatedAt || item.targetUpdatedAt || prev?.targetUpdatedAt,
      status: picked?.status || item.status || prev?.status || "Active",
      // Frozen payload wins — never rewrite a printed scan URL/code.
      scanUrl: prev?.scanUrl || item.scanUrl,
      publicCode: prev?.publicCode || item.publicCode
    });
  }

  const merged = Array.from(byId.values());
  const ownerId = options?.pruneToIncomingForOwner;
  if (!ownerId) return merged;

  const incomingIds = new Set(incoming.map((item) => item.id));
  return merged.filter((row) => {
    if (incomingIds.has(row.id)) return true;
    // Only prune codes that clearly belong to this owner.
    if (!row.ownerUserId || row.ownerUserId !== ownerId) return true;
    return false;
  });
}

export function upsertQrCode(item: QrCodeRecord): QrCodeRecord {
  const rows = readAll();
  const index = rows.findIndex((row) => row.id === item.id);
  const prev = index >= 0 ? rows[index] : undefined;
  const targetChanged =
    Boolean(item.targetUrl) && Boolean(prev?.targetUrl) && item.targetUrl !== prev?.targetUrl;
  const picked = pickFresherQrDestination(prev, item);
  const next: QrCodeRecord = {
    ...prev,
    ...item,
    scans: String(Math.max(parseCount(prev?.scans), parseCount(item.scans))),
    uniqueScanners: String(Math.max(parseCount(prev?.uniqueScanners), parseCount(item.uniqueScanners))),
    targetUrl: picked?.targetUrl || item.targetUrl || prev?.targetUrl || "",
    targetUpdatedAt:
      picked?.targetUpdatedAt ||
      item.targetUpdatedAt ||
      (targetChanged ? new Date().toISOString() : prev?.targetUpdatedAt),
    status: picked?.status || item.status || prev?.status || "Active",
    // Frozen forever after create — printed QR matrix identity must not change on Edit URL.
    scanUrl: prev?.scanUrl || item.scanUrl,
    publicCode: prev?.publicCode || item.publicCode,
    // Design may refresh the image URL only when the encoded scan payload stays the same.
    qrUrl: (() => {
      if (!prev) return item.qrUrl;
      const prevScan = prev.scanUrl || "";
      const nextScan = item.scanUrl || prevScan;
      if (prevScan && nextScan === prevScan && item.qrUrl) return item.qrUrl;
      return prev.qrUrl || item.qrUrl;
    })()
  };
  if (index >= 0) rows[index] = next;
  else rows.unshift(next);
  writeAll(rows);
  // Durable public route + optional typed table (survives app_kv root timeouts).
  void import("./supabaseSync")
    .then(async ({ upsertQrRouteIndex, upsertQrCodeRow }) => {
      await upsertQrRouteIndex(next);
      await upsertQrCodeRow(next);
    })
    .catch((error) => console.error("QR table sync failed:", error));
  return next;
}

export function deleteQrCode(id: string): boolean {
  const rows = readAll();
  const removed = rows.find((row) => row.id === id);
  const next = rows.filter((row) => row.id !== id);
  if (next.length === rows.length) return false;
  writeAll(next);
  void import("./supabaseSync")
    .then(({ deleteQrCodeRow }) => deleteQrCodeRow(id, removed?.publicCode))
    .catch((error) => console.error("QR table delete failed:", error));
  return true;
}

export function upsertQrCodesFromWorkspace(items: unknown): void {
  writeAll(mergeQrCodeLists(readAll(), items));
}
