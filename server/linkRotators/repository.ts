import { getRootStore, setRootStore } from "../db/rootStore";
import { normalizeLinkRotatorHost } from "./publicUrl";
import type {
  LinkRotatorClickEvent,
  LinkRotatorDestinationRecord,
  LinkRotatorRecord,
  LinkRotatorStatus
} from "./types";

const STORE_KEY = "link_rotators";
const MAX_CLICK_EVENTS = 2500;

function readAll(): LinkRotatorRecord[] {
  const raw = getRootStore()[STORE_KEY];
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is LinkRotatorRecord =>
        Boolean(item) && typeof item === "object" && typeof (item as LinkRotatorRecord).id === "string"
    )
    .map((item) => ({
      ...item,
      hostDomain: normalizeLinkRotatorHost(item.hostDomain)
    }));
}

function writeAll(rows: LinkRotatorRecord[]) {
  const store = getRootStore();
  setRootStore({ ...store, [STORE_KEY]: rows });
}

export function listLinkRotators(ownerUserId: string): LinkRotatorRecord[] {
  return readAll()
    .filter((row) => row.ownerUserId === ownerUserId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function findLinkRotatorById(
  id: string,
  ownerUserId: string
): LinkRotatorRecord | null {
  return readAll().find((row) => row.id === id && row.ownerUserId === ownerUserId) || null;
}

export function findLinkRotatorBySlug(slug: string, hostDomain?: string): LinkRotatorRecord | null {
  const normalized = slug.trim().toLowerCase();
  const host = hostDomain ? normalizeLinkRotatorHost(hostDomain) : "";
  return (
    readAll().find((row) => {
      if (row.slug !== normalized) return false;
      if (!host) return true;
      return normalizeLinkRotatorHost(row.hostDomain) === host;
    }) || null
  );
}

/**
 * Resolve an active rotator for a public /r/:slug hit.
 * Cloudflare Origin Rules may rewrite Host → platform host, so when the request
 * host is the platform we also accept a unique slug match on a custom-domain rotator.
 */
export function resolvePublicLinkRotator(
  slug: string,
  requestHostname: string,
  platformHostname: string
): LinkRotatorRecord | null {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const host = normalizeLinkRotatorHost(requestHostname);
  const platform = normalizeLinkRotatorHost(platformHostname);

  const exact = findLinkRotatorBySlug(normalized, host);
  if (exact?.status === "Active") return exact;

  const matches = readAll().filter(
    (row) => row.slug === normalized && row.status === "Active"
  );
  if (matches.length === 0) return null;

  // Prefer exact host, then platform-bound, then sole active match when Host was rewritten.
  const byHost = matches.find((row) => normalizeLinkRotatorHost(row.hostDomain) === host);
  if (byHost) return byHost;

  if (host === platform) {
    if (matches.length === 1) return matches[0];
    const platformBound = matches.find(
      (row) => normalizeLinkRotatorHost(row.hostDomain) === platform
    );
    if (platformBound) return platformBound;
    // Host rewrite dropped customer host — still serve the only/custom rotator by slug.
    return matches[0];
  }

  return null;
}

export function isLinkRotatorSlugTaken(
  slug: string,
  hostDomain: string,
  excludeId?: string
): boolean {
  const normalized = slug.trim().toLowerCase();
  const host = normalizeLinkRotatorHost(hostDomain);
  return readAll().some(
    (row) =>
      row.slug === normalized &&
      normalizeLinkRotatorHost(row.hostDomain) === host &&
      row.id !== excludeId
  );
}

export function createLinkRotator(input: {
  id: string;
  ownerUserId: string;
  name: string;
  description: string;
  slug: string;
  hostDomain: string;
  status: LinkRotatorStatus;
  destinations: LinkRotatorDestinationRecord[];
}): LinkRotatorRecord {
  const now = new Date().toISOString();
  const record: LinkRotatorRecord = {
    id: input.id,
    ownerUserId: input.ownerUserId,
    name: input.name,
    description: input.description,
    slug: input.slug,
    hostDomain: normalizeLinkRotatorHost(input.hostDomain),
    status: input.status,
    destinations: input.destinations,
    totalClicks: 0,
    createdAt: now,
    updatedAt: now
  };
  writeAll([record, ...readAll()]);
  return record;
}

export function updateLinkRotator(
  id: string,
  ownerUserId: string,
  patch: {
    name?: string;
    description?: string;
    status?: LinkRotatorStatus;
    hostDomain?: string;
    slug?: string;
    destinations?: LinkRotatorDestinationRecord[];
  }
): LinkRotatorRecord | null {
  const rows = readAll();
  const index = rows.findIndex((row) => row.id === id && row.ownerUserId === ownerUserId);
  if (index < 0) return null;

  const current = rows[index];
  let destinations = patch.destinations ?? current.destinations;
  if (patch.destinations) {
    // Keep lifetime click counters when destinations are re-saved with the same id/url.
    destinations = patch.destinations.map((item) => {
      const prior =
        current.destinations.find((row) => row.id === item.id) ||
        current.destinations.find(
          (row) => normalizeDestUrl(row.url) === normalizeDestUrl(item.url)
        );
      // Never let an edit form reset/inflate lifetime counters — keep the higher real total.
      const incoming = Number(item.clicks);
      const previous = Number(prior?.clicks) || 0;
      const clicks =
        Number.isFinite(incoming) && incoming > previous ? Math.floor(incoming) : previous;
      return {
        ...item,
        clicks
      };
    });
  }
  const next: LinkRotatorRecord = {
    ...current,
    name: patch.name ?? current.name,
    description: patch.description ?? current.description,
    status: patch.status ?? current.status,
    slug: patch.slug ?? current.slug,
    hostDomain:
      patch.hostDomain !== undefined
        ? normalizeLinkRotatorHost(patch.hostDomain)
        : current.hostDomain,
    destinations,
    updatedAt: new Date().toISOString()
  };
  rows[index] = next;
  writeAll(rows);
  return next;
}

export function removeLinkRotator(id: string, ownerUserId: string): boolean {
  const rows = readAll();
  const next = rows.filter((row) => !(row.id === id && row.ownerUserId === ownerUserId));
  if (next.length === rows.length) return false;
  writeAll(next);
  return true;
}

export function incrementLinkRotatorClicks(id: string): LinkRotatorRecord | null {
  return recordLinkRotatorClick(id);
}

function normalizeDestUrl(value: string): string {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "")
    .toLowerCase();
}

/** Record one real redirect against exactly one destination. Never invents clicks. */
export function recordLinkRotatorClick(
  id: string,
  destination?: { id?: string; url?: string } | null
): LinkRotatorRecord | null {
  const rows = readAll();
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) return null;

  const current = rows[index];
  const now = new Date().toISOString();
  const destId = String(destination?.id || "").trim();
  const destUrl = String(destination?.url || "").trim();

  // Match exactly one row — id first, then normalized URL (ignore trailing slash).
  let matchedIndex = -1;
  if (destId) {
    matchedIndex = current.destinations.findIndex((item) => item.id === destId);
  }
  if (matchedIndex < 0 && destUrl) {
    const needle = normalizeDestUrl(destUrl);
    matchedIndex = current.destinations.findIndex(
      (item) => normalizeDestUrl(item.url) === needle
    );
  }

  // Do not bump totalClicks when destination cannot be attributed — avoids ghost totals.
  if (matchedIndex < 0) {
    return current;
  }

  const destinations = current.destinations.map((item, i) => {
    if (i !== matchedIndex) return item;
    return { ...item, clicks: (Number(item.clicks) || 0) + 1 };
  });

  const matched = destinations[matchedIndex];
  const event: LinkRotatorClickEvent = {
    destinationId: matched.id,
    url: matched.url,
    at: now
  };

  const prevEvents = Array.isArray(current.clickEvents) ? current.clickEvents : [];
  const clickEvents = [event, ...prevEvents].slice(0, MAX_CLICK_EVENTS);

  const next: LinkRotatorRecord = {
    ...current,
    destinations,
    clickEvents,
    totalClicks: destinations.reduce((sum, item) => sum + (Number(item.clicks) || 0), 0),
    updatedAt: now
  };
  rows[index] = next;
  writeAll(rows);
  return next;
}
