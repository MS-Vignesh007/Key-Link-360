import { getRootStore, setRootStore } from "../db/rootStore";
import { normalizeShortLinkHost } from "./publicUrl";
import type {
  ShortLinkClickEvent,
  ShortLinkRecord,
  ShortLinkRetarget,
  ShortLinkStatus
} from "./types";

const STORE_KEY = "short_links";
const MAX_CLICK_EVENTS = 2500;

function readAll(): ShortLinkRecord[] {
  const raw = getRootStore()[STORE_KEY];
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is ShortLinkRecord =>
        Boolean(item) && typeof item === "object" && typeof (item as ShortLinkRecord).id === "string"
    )
    .map((item) => ({
      ...item,
      hostDomain: normalizeShortLinkHost(item.hostDomain),
      retargeting: Array.isArray(item.retargeting) ? item.retargeting : [],
      totalClicks: item.totalClicks || 0
    }));
}

function writeAll(rows: ShortLinkRecord[]) {
  const store = getRootStore();
  setRootStore({ ...store, [STORE_KEY]: rows });
}

export function listShortLinks(ownerUserId: string): ShortLinkRecord[] {
  return readAll()
    .filter((row) => row.ownerUserId === ownerUserId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function findShortLinkById(id: string, ownerUserId: string): ShortLinkRecord | null {
  return readAll().find((row) => row.id === id && row.ownerUserId === ownerUserId) || null;
}

export function findShortLinkBySlug(slug: string, hostDomain?: string): ShortLinkRecord | null {
  const normalized = slug.trim().toLowerCase();
  const host = hostDomain ? normalizeShortLinkHost(hostDomain) : "";
  return (
    readAll().find((row) => {
      if (row.slug !== normalized) return false;
      if (!host) return true;
      return normalizeShortLinkHost(row.hostDomain) === host;
    }) || null
  );
}

export function resolvePublicShortLink(
  slug: string,
  requestHostname: string,
  platformHostname: string
): ShortLinkRecord | null {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const host = normalizeShortLinkHost(requestHostname);
  const platform = normalizeShortLinkHost(platformHostname);

  const exact = findShortLinkBySlug(normalized, host);
  if (exact?.status === "Live") return exact;

  const matches = readAll().filter((row) => row.slug === normalized && row.status === "Live");
  if (matches.length === 0) return null;

  const byHost = matches.find((row) => normalizeShortLinkHost(row.hostDomain) === host);
  if (byHost) return byHost;

  if (host === platform) {
    if (matches.length === 1) return matches[0];
    const platformBound = matches.find(
      (row) => normalizeShortLinkHost(row.hostDomain) === platform
    );
    if (platformBound) return platformBound;
    return matches[0];
  }

  return null;
}

export function isShortLinkSlugTaken(
  slug: string,
  hostDomain: string,
  excludeId?: string
): boolean {
  const normalized = slug.trim().toLowerCase();
  const host = normalizeShortLinkHost(hostDomain);
  return readAll().some(
    (row) =>
      row.slug === normalized &&
      normalizeShortLinkHost(row.hostDomain) === host &&
      row.id !== excludeId
  );
}

export function createShortLink(input: {
  id: string;
  ownerUserId: string;
  title: string;
  slug: string;
  hostDomain: string;
  destinationUrl: string;
  status: ShortLinkStatus;
  retargeting: ShortLinkRetarget[];
}): ShortLinkRecord {
  const now = new Date().toISOString();
  const record: ShortLinkRecord = {
    id: input.id,
    ownerUserId: input.ownerUserId,
    title: input.title,
    slug: input.slug,
    hostDomain: normalizeShortLinkHost(input.hostDomain),
    destinationUrl: input.destinationUrl,
    status: input.status,
    retargeting: input.retargeting,
    totalClicks: 0,
    clickEvents: [],
    createdAt: now,
    updatedAt: now
  };
  writeAll([record, ...readAll()]);
  return record;
}

export function updateShortLink(
  id: string,
  ownerUserId: string,
  patch: {
    title?: string;
    slug?: string;
    hostDomain?: string;
    destinationUrl?: string;
    status?: ShortLinkStatus;
    retargeting?: ShortLinkRetarget[];
  }
): ShortLinkRecord | null {
  const rows = readAll();
  const index = rows.findIndex((row) => row.id === id && row.ownerUserId === ownerUserId);
  if (index < 0) return null;

  const current = rows[index];
  const next: ShortLinkRecord = {
    ...current,
    title: patch.title ?? current.title,
    slug: patch.slug ?? current.slug,
    hostDomain:
      patch.hostDomain !== undefined
        ? normalizeShortLinkHost(patch.hostDomain)
        : current.hostDomain,
    destinationUrl: patch.destinationUrl ?? current.destinationUrl,
    status: patch.status ?? current.status,
    retargeting: patch.retargeting ?? current.retargeting,
    updatedAt: new Date().toISOString()
  };
  rows[index] = next;
  writeAll(rows);
  return next;
}

export function removeShortLink(id: string, ownerUserId: string): boolean {
  const rows = readAll();
  const next = rows.filter((row) => !(row.id === id && row.ownerUserId === ownerUserId));
  if (next.length === rows.length) return false;
  writeAll(next);
  return true;
}

export function recordShortLinkClick(
  id: string,
  meta?: { userAgent?: string; referer?: string } | null
): ShortLinkRecord | null {
  const rows = readAll();
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) return null;

  const current = rows[index];
  const now = new Date().toISOString();
  const event: ShortLinkClickEvent = {
    at: now,
    userAgent: String(meta?.userAgent || "").slice(0, 400) || undefined,
    referer: String(meta?.referer || "").slice(0, 500) || undefined
  };
  const prevEvents = Array.isArray(current.clickEvents) ? current.clickEvents : [];
  const next: ShortLinkRecord = {
    ...current,
    totalClicks: (current.totalClicks || 0) + 1,
    clickEvents: [event, ...prevEvents].slice(0, MAX_CLICK_EVENTS),
    updatedAt: now
  };
  rows[index] = next;
  writeAll(rows);
  return next;
}
