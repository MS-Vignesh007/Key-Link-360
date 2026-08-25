import {
  BioEditorBlock,
  BioEditorState,
  BioPage,
  BioPageDraft,
  BioPagePreviewDetails,
  BioPagePreviewTheme,
  BioPageTemplate
} from "../types";
import { normalizePageTheme } from "../lib/bioPageThemes";
import { apiUrl } from "../lib/apiBase";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  isPreviewToken,
  refreshSession
} from "../lib/authApi";

export type ServerSyncReason =
  | "ok"
  | "no_token"
  | "preview_session"
  | "network_error"
  | "unauthorized"
  | "page_not_found"
  | "server_error"
  | "timeout";

export interface ServerSyncResult {
  ok: boolean;
  reason: ServerSyncReason;
  status?: number;
}

export function describeServerSyncFailure(reason: ServerSyncReason): string {
  switch (reason) {
    case "preview_session":
      return "Preview login only saves in this browser. Sign in with email & password to sync to the cloud.";
    case "no_token":
      return "Sign in to save drafts and publish to the cloud.";
    case "unauthorized":
      return "Your session expired. Please sign in again.";
    case "page_not_found":
      return "This page is not registered on the server yet. Try again in a moment.";
    case "network_error":
      return "Could not reach the server. Check your connection.";
    case "timeout":
      return "The server took too long to respond.";
    default:
      return "Could not save to the server right now.";
  }
}

const SYNC_TIMEOUT_MS = 12_000;

/** Timed fetch with one shared refresh retry — prevents Save/Publish from hanging forever. */
async function bioFetch(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);
  try {
    const headers = new Headers(init.headers || {});
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(apiUrl(path), {
      ...init,
      headers,
      credentials: "include",
      signal: controller.signal
    });

    if (
      response.status === 401 &&
      retry &&
      getRefreshToken() &&
      !isPreviewToken(getAccessToken())
    ) {
      try {
        await refreshSession();
        return bioFetch(path, init, false);
      } catch {
        clearAuthSession("session_expired");
      }
    }

    return response;
  } finally {
    clearTimeout(timer);
  }
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

export const DRAFTS_STORAGE_KEY = "keylink360_bio_page_drafts";
export const TEMPLATES_STORAGE_KEY = "keylink360_bio_page_templates";
const OLD_DRAFTS_KEY = "keyslink_bio_page_drafts";
const OLD_TEMPLATES_KEY = "keyslink_bio_page_templates";
const LEGACY_DRAFTS_KEY = "savedDrafts";
const LEGACY_TEMPLATES_KEY = "savedTemplates";

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800";

export { DEFAULT_COVER };

export function createUniquePageId(): string {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultHandleFromTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/\s+/g, "") || "profile";
}

export function normalizeHandleInput(value: string): string {
  return value.trim().replace(/^@+/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function formatDisplayHandle(
  raw?: string,
  fallbackTitle?: string,
  options?: { fallbackToTitle?: boolean }
): string {
  const cleaned = normalizeHandleInput(raw || "");
  if (cleaned) return `@${cleaned}`;
  if (options?.fallbackToTitle === false) return "";
  const source = fallbackTitle ? defaultHandleFromTitle(fallbackTitle) : "profile";
  return `@${source}`;
}

/** Placeholder derived from page title — e.g. "Marvel Toys" → "marveltoys" */
export function suggestedHandlePlaceholder(title: string): string {
  const fromTitle = defaultHandleFromTitle(title || "");
  return fromTitle !== "profile" ? fromTitle : "yourbrand";
}

export function getStoredHandle(raw?: string): string {
  return normalizeHandleInput(raw || "");
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    return safeParse(localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn(
        `Local storage is full; "${key}" will continue syncing through the server instead.`
      );
      pruneLocalBioCache();
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    }

    console.error(`Failed to persist "${key}" to local storage:`, error);
    return false;
  }
}

function authJsonHeaders(): Record<string, string> {
  const token = getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

/** Free browser quota — drop slug duplicates, legacy keys, and old page caches. */
export function pruneLocalBioCache(activePageId?: string): void {
  try {
    localStorage.removeItem(LEGACY_DRAFTS_KEY);
    localStorage.removeItem(LEGACY_TEMPLATES_KEY);
    localStorage.removeItem("pageBlocksMap");

    const keysToRemove: string[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key) continue;
      if (
        key.startsWith("biolink_blocks_") ||
        key.startsWith("biolink_details_") ||
        key.startsWith("biolink_synced_at_") ||
        key.startsWith("biolink_preview_at_")
      ) {
        const suffix = key.replace(/^biolink_(blocks|details|synced_at|preview_at)_/, "");
        if (!suffix.startsWith("p_") && !suffix.startsWith("page_")) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    const syncedEntries: Array<{ pageId: string; at: number }> = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith("biolink_synced_at_")) continue;
      const pageId = key.slice("biolink_synced_at_".length);
      if (!pageId.startsWith("p_") && !pageId.startsWith("page_")) continue;
      const raw = localStorage.getItem(key);
      const parsed = raw ? Date.parse(raw) : 0;
      syncedEntries.push({ pageId, at: Number.isFinite(parsed) ? parsed : 0 });
    }

    syncedEntries.sort((a, b) => b.at - a.at);
    const keepCount = activePageId ? 4 : 3;
    const keepIds = new Set(syncedEntries.slice(0, keepCount).map((entry) => entry.pageId));
    if (activePageId) keepIds.add(activePageId);

    for (const entry of syncedEntries) {
      if (keepIds.has(entry.pageId)) continue;
      localStorage.removeItem(`biolink_blocks_${entry.pageId}`);
      localStorage.removeItem(`biolink_details_${entry.pageId}`);
      localStorage.removeItem(`biolink_synced_at_${entry.pageId}`);
      localStorage.removeItem(`biolink_preview_at_${entry.pageId}`);
    }
  } catch {
    /* ignore */
  }
}

function readLocalPagesList(): BioPage[] {
  try {
    const raw = localStorage.getItem("biolinks_pages_list");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BioPage[]) : [];
  } catch {
    return [];
  }
}

export async function syncPagesListToServer(pages: BioPage[]): Promise<boolean> {
  const token = getAccessToken();
  if (!token || isPreviewToken(token)) return false;
  try {
    const response = await bioFetch("/api/pages", {
      method: "POST",
      body: JSON.stringify({ pages })
    });
    return response.ok;
  } catch (err) {
    console.error("Failed to sync pages list to server:", err);
    return false;
  }
}

/** Deep-clone blocks so nested widget config is persisted safely */
export function cloneBlocks(blocks: BioEditorBlock[]): BioEditorBlock[] {
  return JSON.parse(JSON.stringify(blocks)) as BioEditorBlock[];
}

export function buildEditorState(
  title: string,
  shortBio: string,
  coverImage: string,
  blocks: BioEditorBlock[],
  slug?: string,
  handle?: string,
  pageTheme: BioPagePreviewTheme = "dark",
  coverSettings?: BioPagePreviewDetails["coverSettings"],
  thankYou?: {
    title?: string;
    message?: string;
    emoji?: string;
    blocks?: BioEditorBlock[];
  },
  payment?: {
    enabled?: boolean;
    amountInr?: number;
    description?: string;
  }
): BioEditorState {
  return {
    pageMeta: {
      title: title || "Untitled Page",
      slug,
      shortBio: shortBio || "Write a short bio...",
      coverImage: coverImage || DEFAULT_COVER,
      handle: normalizeHandleInput(handle || ""),
      pageTheme,
      ...(coverSettings ? { coverSettings } : {}),
      ...(thankYou?.title ? { thankYouTitle: thankYou.title } : {}),
      ...(thankYou?.message ? { thankYouMessage: thankYou.message } : {}),
      ...(thankYou?.emoji ? { thankYouEmoji: thankYou.emoji } : {}),
      ...(payment?.enabled ? { paymentEnabled: true } : {}),
      ...(typeof payment?.amountInr === "number" && payment.amountInr > 0
        ? { paymentAmountInr: payment.amountInr }
        : {}),
      ...(payment?.description ? { paymentDescription: payment.description } : {})
    },
    blocks: cloneBlocks(blocks),
    ...(thankYou?.blocks?.length ? { thankYouBlocks: cloneBlocks(thankYou.blocks) } : {})
  };
}

export function readStoredPageDetails(pageId: string, pageSlug: string): BioPagePreviewDetails | null {
  try {
    const raw =
      localStorage.getItem(`biolink_details_${pageId}`) ||
      localStorage.getItem(`biolink_details_${pageSlug}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BioPagePreviewDetails;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readStoredPageTheme(pageId: string, pageSlug: string): BioPagePreviewTheme {
  const details = readStoredPageDetails(pageId, pageSlug);
  return normalizePageTheme(details?.pageTheme);
}

function isBioEditorState(value: unknown): value is BioEditorState {
  if (!value || typeof value !== "object") return false;
  const state = value as BioEditorState;
  return (
    !!state.pageMeta &&
    typeof state.pageMeta.title === "string" &&
    Array.isArray(state.blocks)
  );
}

/** Normalize legacy flat draft/template records into typed models */
function legacyToEditorState(record: Record<string, unknown>): BioEditorState {
  if (isBioEditorState(record.data)) {
    return {
      pageMeta: { ...record.data.pageMeta },
      blocks: cloneBlocks(record.data.blocks)
    };
  }

  const title = (record.title as string) || (record.name as string) || "Untitled";
  return buildEditorState(
    title,
    (record.bio as string) || "Write a short bio...",
    (record.coverPhoto as string) || DEFAULT_COVER,
    cloneBlocks((record.blocks as BioEditorBlock[]) || []),
    record.slug as string | undefined
  );
}

export function normalizeDraft(record: Record<string, unknown>): BioPageDraft {
  const pageId =
    (record.pageId as string) ||
    (record.id as string)?.replace(/^draft_/, "") ||
    `page_${Date.now()}`;
  const now = new Date().toISOString();

  return {
    id: (record.id as string) || `draft_${pageId}`,
    pageId,
    pageSlug: record.pageSlug as string | undefined,
    data: legacyToEditorState(record),
    createdAt: (record.createdAt as string) || now,
    updatedAt: (record.updatedAt as string) || now
  };
}

export function normalizeTemplate(record: Record<string, unknown>): BioPageTemplate {
  const data = legacyToEditorState(record);
  const now = new Date().toISOString();
  const name =
    (record.name as string) ||
    (record.title as string) ||
    data.pageMeta.title ||
    "Untitled Template";

  return {
    id: (record.id as string) || `tpl_${Date.now()}`,
    name,
    sourcePageId: record.sourcePageId as string | undefined,
    previewImage:
      (record.previewImage as string) ||
      (record.coverPhoto as string) ||
      data.pageMeta.coverImage,
    description: (record.description as string) || undefined,
    data,
    createdAt: (record.createdAt as string) || now,
    updatedAt: (record.updatedAt as string) || now,
    isBuiltIn: !!record.isBuiltIn
  };
}

export function migrateLegacyStorage(): void {
  pruneLocalBioCache();
  const existingDrafts = readStorage<BioPageDraft[]>(DRAFTS_STORAGE_KEY, []);
  const existingTemplates = readStorage<BioPageTemplate[]>(TEMPLATES_STORAGE_KEY, []);

  if (existingDrafts.length === 0) {
    const oldDrafts = readStorage<BioPageDraft[]>(OLD_DRAFTS_KEY, []);
    if (oldDrafts.length > 0) {
      writeStorage(DRAFTS_STORAGE_KEY, oldDrafts);
    } else {
      const legacyDrafts = readStorage<Record<string, unknown>[]>(LEGACY_DRAFTS_KEY, []);
      if (legacyDrafts.length > 0) {
        const migrated = legacyDrafts.map(normalizeDraft);
        if (writeStorage(DRAFTS_STORAGE_KEY, migrated)) {
          localStorage.removeItem(LEGACY_DRAFTS_KEY);
        }
      }
    }
  }

  if (existingTemplates.length === 0) {
    const oldTemplates = readStorage<BioPageTemplate[]>(OLD_TEMPLATES_KEY, []);
    if (oldTemplates.length > 0) {
      writeStorage(TEMPLATES_STORAGE_KEY, oldTemplates);
    } else {
      const legacyTemplates = readStorage<Record<string, unknown>[]>(LEGACY_TEMPLATES_KEY, []);
      if (legacyTemplates.length > 0) {
        const migrated = legacyTemplates.map(normalizeTemplate);
        if (writeStorage(TEMPLATES_STORAGE_KEY, migrated)) {
          localStorage.removeItem(LEGACY_TEMPLATES_KEY);
        }
      }
    }
  }
}

export function getAllDrafts(): BioPageDraft[] {
  migrateLegacyStorage();
  return readStorage<BioPageDraft[]>(DRAFTS_STORAGE_KEY, []);
}

export function getDraftByPageId(pageId: string): BioPageDraft | null {
  return getAllDrafts().find((draft) => draft.pageId === pageId) ?? null;
}

/** Best-effort offline cache — Railway/Supabase is the source of truth when logged in. */
export function persistDraftsLocalCache(drafts: BioPageDraft[]): boolean {
  localStorage.removeItem(LEGACY_DRAFTS_KEY);
  return writeStorage(DRAFTS_STORAGE_KEY, drafts);
}

/** @deprecated Use persistDraftsLocalCache — kept for existing imports */
export function persistDrafts(drafts: BioPageDraft[]): boolean {
  return persistDraftsLocalCache(drafts);
}

export function upsertDraft(draft: BioPageDraft, drafts: BioPageDraft[]): BioPageDraft[] {
  const index = drafts.findIndex((item) => item.pageId === draft.pageId);
  if (index >= 0) {
    const next = [...drafts];
    next[index] = { ...draft, id: drafts[index].id, createdAt: drafts[index].createdAt };
    return next;
  }
  return [...drafts, draft];
}

export function deleteDraftByPageId(pageId: string, drafts: BioPageDraft[]): BioPageDraft[] {
  return drafts.filter((draft) => draft.pageId !== pageId);
}

export function getAllUserTemplates(): BioPageTemplate[] {
  migrateLegacyStorage();
  return readStorage<BioPageTemplate[]>(TEMPLATES_STORAGE_KEY, []);
}

export function getTemplateById(id: string): BioPageTemplate | null {
  return getAllUserTemplates().find((template) => template.id === id) ?? null;
}

export function persistTemplatesLocalCache(templates: BioPageTemplate[]): boolean {
  localStorage.removeItem(LEGACY_TEMPLATES_KEY);
  const persisted = writeStorage(TEMPLATES_STORAGE_KEY, templates);
  if (!persisted) {
    try {
      localStorage.removeItem(TEMPLATES_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  return persisted;
}

/** @deprecated Use persistTemplatesLocalCache */
export function persistTemplates(templates: BioPageTemplate[]): boolean {
  return persistTemplatesLocalCache(templates);
}

export function upsertTemplate(
  template: BioPageTemplate,
  templates: BioPageTemplate[]
): BioPageTemplate[] {
  const index = templates.findIndex((item) => item.id === template.id);
  if (index >= 0) {
    const next = [...templates];
    next[index] = { ...template, createdAt: templates[index].createdAt };
    return next;
  }
  return [...templates, template];
}

export function deleteTemplateById(id: string, templates: BioPageTemplate[]): BioPageTemplate[] {
  return templates.filter((template) => template.id !== id);
}

export function getTemplateEditorPayload(template: BioPageTemplate | Record<string, unknown>): BioEditorState {
  return normalizeTemplate(template as Record<string, unknown>).data;
}

export function formatStorageDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return iso;
  }
}

function readTimestampKey(pageId: string, pageSlug: string | undefined, suffix: "synced_at" | "preview_at") {
  const prefix = `biolink_${suffix}_`;
  const stamps = [
    localStorage.getItem(`${prefix}${pageId}`),
    pageSlug ? localStorage.getItem(`${prefix}${pageSlug}`) : null
  ].filter((value): value is string => Boolean(value));
  if (!stamps.length) return null;
  return stamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}

/** Best-effort local preview cache (single pageId key — no slug duplicate). */
export function persistPagePreviewLocalCache(
  pageId: string,
  pageSlug: string,
  blocks: BioEditorBlock[],
  details: BioPagePreviewDetails,
  options?: { skipBlocks?: boolean; localOnly?: boolean }
): boolean {
  try {
    const updatedAt = new Date().toISOString();
    const detailsJson = JSON.stringify(details);
    const timestampKey = options?.localOnly ? "preview_at" : "synced_at";

    localStorage.removeItem(`biolink_blocks_${pageSlug}`);
    localStorage.removeItem(`biolink_details_${pageSlug}`);
    localStorage.removeItem(`biolink_synced_at_${pageSlug}`);
    localStorage.removeItem(`biolink_preview_at_${pageSlug}`);

    if (options?.skipBlocks) {
      localStorage.removeItem(`biolink_blocks_${pageId}`);
    } else {
      localStorage.setItem(`biolink_blocks_${pageId}`, JSON.stringify(blocks));
    }

    localStorage.setItem(`biolink_details_${pageId}`, detailsJson);
    localStorage.setItem(`biolink_${timestampKey}_${pageId}`, updatedAt);
    persistPageSessionCache(pageId, blocks, details);
    try {
      // Force public Open view to reload details (Pay ₹ UI) instead of stale session cache.
      sessionStorage.removeItem(`keys_public_page_${pageId}`);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(
      new CustomEvent("key-page-preview-updated", {
        detail: { pageId, pageSlug, details, updatedAt, blocks: options?.skipBlocks ? undefined : blocks }
      })
    );
    return true;
  } catch (err) {
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      pruneLocalBioCache(pageId);
      try {
        if (!options?.skipBlocks) {
          localStorage.setItem(`biolink_blocks_${pageId}`, JSON.stringify(blocks));
        }
        localStorage.setItem(`biolink_details_${pageId}`, JSON.stringify(details));
        localStorage.setItem(`biolink_synced_at_${pageId}`, new Date().toISOString());
        return true;
      } catch {
        try {
          localStorage.setItem(`biolink_details_${pageId}`, JSON.stringify(details));
          localStorage.setItem(`biolink_synced_at_${pageId}`, new Date().toISOString());
          return true;
        } catch {
          return false;
        }
      }
    }
    console.error("Failed to persist page preview storage:", err);
    return false;
  }
}

/** @deprecated Use persistPagePreviewLocalCache */
export function persistPagePreviewStorage(
  pageId: string,
  pageSlug: string,
  blocks: BioEditorBlock[],
  details: BioPagePreviewDetails
): void {
  persistPagePreviewLocalCache(pageId, pageSlug, blocks, details);
}

export function readLocalPageUpdatedAt(pageId: string, pageSlug?: string): string | null {
  try {
    const stamps = [
      readTimestampKey(pageId, pageSlug, "synced_at"),
      readTimestampKey(pageId, pageSlug, "preview_at")
    ].filter((value): value is string => Boolean(value));
    if (!stamps.length) return null;
    return stamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  } catch {
    return null;
  }
}

export function readLocalPublishedUpdatedAt(pageId: string, pageSlug?: string): string | null {
  try {
    return readTimestampKey(pageId, pageSlug, "synced_at");
  } catch {
    return null;
  }
}

export function readLocalPreviewUpdatedAt(pageId: string, pageSlug?: string): string | null {
  try {
    return readTimestampKey(pageId, pageSlug, "preview_at");
  } catch {
    return null;
  }
}

export function readLocalPageDocument(
  pageId: string,
  pageSlug?: string
): { blocks: BioEditorBlock[]; details: BioPagePreviewDetails | null; updatedAt: string | null } | null {
  try {
    const blocksRaw =
      localStorage.getItem(`biolink_blocks_${pageId}`) ||
      (pageSlug ? localStorage.getItem(`biolink_blocks_${pageSlug}`) : null);
    if (!blocksRaw) return null;
    const blocks = JSON.parse(blocksRaw) as BioEditorBlock[];
    if (!Array.isArray(blocks)) return null;

    const detailsRaw =
      localStorage.getItem(`biolink_details_${pageId}`) ||
      (pageSlug ? localStorage.getItem(`biolink_details_${pageSlug}`) : null);
    const details = detailsRaw ? (JSON.parse(detailsRaw) as BioPagePreviewDetails) : null;

    return {
      blocks,
      details,
      updatedAt: readLocalPageUpdatedAt(pageId, pageSlug)
    };
  } catch {
    return null;
  }
}

/** Push the latest browser preview document to the server (custom domains read this). */
export async function syncLocalPageDocumentToServer(
  pageId: string,
  pageSlug?: string,
  pages?: BioPage[]
): Promise<boolean> {
  const local = readLocalPageDocument(pageId, pageSlug);
  if (!local) return false;

  const server = await fetchPageDocumentFromServer(pageId);
  if (server) {
    const serverUpdatedAt =
      typeof server.updatedAt === "string" ? new Date(server.updatedAt).getTime() : 0;
    const localPublishedAt = readLocalPublishedUpdatedAt(pageId, pageSlug);
    const localPreviewAt = readLocalPreviewUpdatedAt(pageId, pageSlug);
    const localPublishedTime = localPublishedAt ? new Date(localPublishedAt).getTime() : 0;
    const localPreviewTime = localPreviewAt ? new Date(localPreviewAt).getTime() : 0;
    const localEditTime = Math.max(localPublishedTime, localPreviewTime, local.updatedAt ? new Date(local.updatedAt).getTime() : 0);
    const serverBlockCount = Array.isArray(server.blocks) ? server.blocks.length : 0;

    if (
      serverUpdatedAt > 0 &&
      localEditTime <= serverUpdatedAt &&
      local.blocks.length <= serverBlockCount
    ) {
      return true;
    }
  }

  const pageList = pages?.length ? pages : readLocalPagesList();
  const result = await syncPageDocumentToServer(
    pageId,
    local.blocks,
    local.details || {
      title: "",
      bio: "",
      coverPhoto: DEFAULT_COVER,
      handle: "",
      pageTheme: "dark"
    },
    { pages: pageList }
  );
  return result.ok;
}

export async function syncAllLocalPageDocumentsToServer(
  pages: Array<{ id: string; slug?: string }>
): Promise<number> {
  let synced = 0;
  const pageList = readLocalPagesList();
  for (const page of pages) {
    const ok = await syncLocalPageDocumentToServer(page.id, page.slug, pageList);
    if (ok) synced += 1;
  }
  return synced;
}

/** Push published page content to Railway so custom domains and mobile visitors see the latest UI. */
export async function syncPageDocumentToServer(
  pageId: string,
  blocks: BioEditorBlock[],
  details: BioPagePreviewDetails,
  options?: { pages?: BioPage[] }
): Promise<ServerSyncResult> {
  const token = getAccessToken();
  if (!token) return { ok: false, reason: "no_token" };
  if (isPreviewToken(token)) return { ok: false, reason: "preview_session" };

  const postBody = JSON.stringify({
    blocks,
    details,
    updatedAt: new Date().toISOString()
  });

  try {
    let response = await bioFetch(`/api/page/${pageId}`, {
      method: "POST",
      body: postBody
    });

    if (response.status === 404) {
      const pages = options?.pages?.length ? options.pages : readLocalPagesList();
      if (pages.length > 0) {
        await syncPagesListToServer(pages);
        response = await bioFetch(`/api/page/${pageId}`, {
          method: "POST",
          body: postBody
        });
      }
    }

    if (response.ok) return { ok: true, reason: "ok", status: response.status };
    if (response.status === 401) return { ok: false, reason: "unauthorized", status: 401 };
    if (response.status === 404) return { ok: false, reason: "page_not_found", status: 404 };
    return { ok: false, reason: "server_error", status: response.status };
  } catch (err) {
    console.error("Failed to sync page document to server:", err);
    if (isAbortError(err)) return { ok: false, reason: "timeout" };
    return { ok: false, reason: "network_error" };
  }
}

export async function fetchPageDocumentFromServer(pageId: string): Promise<{
  blocks?: BioEditorBlock[];
  details?: BioPagePreviewDetails;
  updatedAt?: string;
} | null> {
  try {
    const response = await fetch(apiUrl(`/api/page/${pageId}`), { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as {
      blocks?: BioEditorBlock[];
      details?: BioPagePreviewDetails;
      updatedAt?: string;
    };
  } catch {
    return null;
  }
}

/** Fast sessionStorage mirror so visit/preview tabs paint blocks immediately. */
export function persistPageSessionCache(
  pageId: string,
  blocks: BioEditorBlock[],
  details: BioPagePreviewDetails
): void {
  try {
    sessionStorage.setItem(
      `keys_public_page_${pageId}`,
      JSON.stringify({ blocks, details, cachedAt: Date.now() })
    );
  } catch {
    /* ignore quota */
  }
}

/** Local-only preview cache for editor keystrokes — never hits the server. */
export function persistPagePreviewLocalOnly(
  pageId: string,
  pageSlug: string,
  blocks: BioEditorBlock[],
  details: BioPagePreviewDetails
): boolean {
  persistPageSessionCache(pageId, blocks, details);
  return persistPagePreviewLocalCache(pageId, pageSlug, blocks, details, { localOnly: true });
}

/** Server-first save for live pages — always mirror blocks locally for fast revisit. */
export async function persistAndSyncPagePreview(
  pageId: string,
  pageSlug: string,
  blocks: BioEditorBlock[],
  details: BioPagePreviewDetails,
  options?: { pages?: BioPage[] }
): Promise<{ serverOk: boolean; localOk: boolean; sync: ServerSyncResult }> {
  persistPageSessionCache(pageId, blocks, details);
  const sync = await syncPageDocumentToServer(pageId, blocks, details, options);
  if (sync.ok) {
    pruneLocalBioCache(pageId);
  }
  const localOk = persistPagePreviewLocalCache(pageId, pageSlug, blocks, details, { localOnly: false });
  return { serverOk: sync.ok, localOk, sync };
}

/** Resolve saved blocks for a page: memory → localStorage → null (caller may fall back to templates). */
export function resolveStoredPageBlocks(
  pageId: string,
  pageSlug?: string,
  memoryMap?: Record<string, BioEditorBlock[]>
): BioEditorBlock[] | null {
  if (memoryMap && pageId in memoryMap && Array.isArray(memoryMap[pageId])) {
    return cloneBlocks(memoryMap[pageId]);
  }
  if (pageSlug && memoryMap && pageSlug in memoryMap && Array.isArray(memoryMap[pageSlug])) {
    return cloneBlocks(memoryMap[pageSlug]);
  }
  const local = readLocalPageDocument(pageId, pageSlug);
  if (local) {
    return cloneBlocks(local.blocks);
  }
  return null;
}

/** Save one draft to Railway (primary store). */
export async function syncDraftToServer(draft: BioPageDraft): Promise<ServerSyncResult> {
  const token = getAccessToken();
  if (!token) return { ok: false, reason: "no_token" };
  if (isPreviewToken(token)) return { ok: false, reason: "preview_session" };

  try {
    const response = await bioFetch("/api/drafts", {
      method: "POST",
      body: JSON.stringify({ draft })
    });
    if (response.ok) return { ok: true, reason: "ok", status: response.status };
    if (response.status === 401) return { ok: false, reason: "unauthorized", status: 401 };
    return { ok: false, reason: "server_error", status: response.status };
  } catch (err) {
    console.error("Failed to sync draft to server:", err);
    if (isAbortError(err)) return { ok: false, reason: "timeout" };
    return { ok: false, reason: "network_error" };
  }
}

/** Save all drafts to Railway, then optionally mirror to local cache. */
export async function syncAllDraftsToServer(drafts: BioPageDraft[]): Promise<boolean> {
  try {
    if (!getAccessToken() || isPreviewToken(getAccessToken())) return false;
    const response = await bioFetch("/api/drafts", {
      method: "POST",
      body: JSON.stringify({ drafts })
    });
    return response.ok;
  } catch (err) {
    console.error("Failed to bulk sync drafts:", err);
    return false;
  }
}

export async function persistAndSyncDrafts(drafts: BioPageDraft[]): Promise<{
  serverOk: boolean;
  localOk: boolean;
}> {
  const serverOk = await syncAllDraftsToServer(drafts);
  const localOk = persistDraftsLocalCache(drafts);
  return { serverOk, localOk };
}

export function mergeTemplates(
  local: BioPageTemplate[],
  remote: BioPageTemplate[]
): BioPageTemplate[] {
  const map = new Map<string, BioPageTemplate>();
  for (const tpl of remote) {
    map.set(tpl.id, tpl);
  }
  for (const tpl of local) {
    const existing = map.get(tpl.id);
    if (!existing || new Date(tpl.updatedAt) >= new Date(existing.updatedAt)) {
      map.set(tpl.id, tpl);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function mergeDrafts(local: BioPageDraft[], remote: BioPageDraft[]): BioPageDraft[] {
  const map = new Map<string, BioPageDraft>();
  for (const draft of remote) {
    map.set(draft.pageId, draft);
  }
  for (const draft of local) {
    const existing = map.get(draft.pageId);
    if (!existing || new Date(draft.updatedAt) >= new Date(existing.updatedAt)) {
      map.set(draft.pageId, draft);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export interface WorkspaceExportPayload {
  pages?: Array<{ id: string; slug?: string; title?: string; [key: string]: unknown }>;
  bio_page_drafts?: BioPageDraft[];
  page_documents?: Record<
    string,
    { blocks?: BioEditorBlock[]; details?: BioPagePreviewDetails; updatedAt?: string }
  >;
  publish_settings?: unknown;
}

export async function fetchServerTemplates(): Promise<BioPageTemplate[]> {
  try {
    const res = await fetch(apiUrl("/api/templates"));
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((item) => normalizeTemplate(item as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function syncTemplateToServer(template: BioPageTemplate): Promise<boolean> {
  try {
    const response = await fetch(apiUrl("/api/templates"), {
      method: "POST",
      headers: authJsonHeaders(),
      credentials: "include",
      body: JSON.stringify({ template })
    });
    return response.ok;
  } catch (err) {
    console.error("Failed to sync template to server:", err);
    return false;
  }
}

export async function deleteTemplateOnServer(id: string): Promise<void> {
  try {
    await fetch(apiUrl(`/api/templates/${id}`), { method: "DELETE" });
  } catch (err) {
    console.error("Failed to delete template on server:", err);
  }
}

export async function syncAllTemplatesToServer(templates: BioPageTemplate[]): Promise<boolean> {
  try {
    const response = await fetch(apiUrl("/api/templates"), {
      method: "POST",
      headers: authJsonHeaders(),
      credentials: "include",
      body: JSON.stringify({ templates })
    });
    return response.ok;
  } catch (err) {
    console.error("Failed to bulk sync templates:", err);
    return false;
  }
}

export async function persistAndSyncTemplates(templates: BioPageTemplate[]): Promise<{
  serverOk: boolean;
  localOk: boolean;
}> {
  const serverOk = await syncAllTemplatesToServer(templates);
  const localOk = persistTemplatesLocalCache(templates);
  return { serverOk, localOk };
}

export async function fetchServerDrafts(): Promise<BioPageDraft[]> {
  try {
    const token = getAccessToken();
    const res = await fetch(apiUrl("/api/drafts"), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: "include"
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((item) => normalizeDraft(item as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function fetchWorkspaceExport(): Promise<WorkspaceExportPayload | null> {
  try {
    const token = getAccessToken();
    const res = await fetch(apiUrl("/api/workspace/export"), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: "include"
    });
    if (!res.ok) return null;
    return (await res.json()) as WorkspaceExportPayload;
  } catch {
    return null;
  }
}
