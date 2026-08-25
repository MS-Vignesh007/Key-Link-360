import { getSupabase, isSupabaseConfigured } from "../db/supabase";
import { getRootStore, setRootStore } from "../db/rootStore";

export type PageDocument = {
  blocks: unknown[];
  details: Record<string, unknown>;
  updatedAt?: string;
};

function isPageDocument(value: unknown): value is PageDocument {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const doc = value as Record<string, unknown>;
  return "blocks" in doc || "details" in doc;
}

function asPageDocument(value: unknown): PageDocument | null {
  if (!isPageDocument(value)) return null;
  return {
    blocks: Array.isArray(value.blocks) ? value.blocks : [],
    details:
      value.details && typeof value.details === "object" && !Array.isArray(value.details)
        ? (value.details as Record<string, unknown>)
        : {},
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : undefined
  };
}

function updatedAtMs(value?: string): number {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function pickNewerDocument(a: PageDocument | null, b: PageDocument | null): PageDocument | null {
  if (!a) return b;
  if (!b) return a;
  return updatedAtMs(b.updatedAt) > updatedAtMs(a.updatedAt) ? b : a;
}

async function fetchSupabasePageDocument(pageId: string): Promise<PageDocument | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("bio_page_documents")
      .select("blocks, details, updated_at")
      .eq("page_id", pageId)
      .maybeSingle();
    if (error || !data) return null;

    return {
      blocks: Array.isArray(data.blocks) ? data.blocks : [],
      details:
        data.details && typeof data.details === "object" && !Array.isArray(data.details)
          ? (data.details as Record<string, unknown>)
          : {},
      updatedAt: typeof data.updated_at === "string" ? data.updated_at : undefined
    };
  } catch (error) {
    console.error("fetchSupabasePageDocument failed:", error);
    return null;
  }
}

/**
 * Read page UI document.
 * Prefer the newest copy between in-memory root and Supabase so custom domains
 * (production) pick up publishes done from localhost / another instance.
 */
export async function getPageDocument(pageId: string): Promise<PageDocument | null> {
  const id = String(pageId || "").trim();
  if (!id) return null;

  const store = getRootStore();
  const memoryDoc = asPageDocument(store[id]);
  const remoteDoc = await fetchSupabasePageDocument(id);
  const winner = pickNewerDocument(memoryDoc, remoteDoc);

  if (!winner) return null;

  // Keep memory hot with the newest document for subsequent requests on this instance.
  if (
    !memoryDoc ||
    updatedAtMs(winner.updatedAt) > updatedAtMs(memoryDoc.updatedAt) ||
    winner === remoteDoc
  ) {
    store[id] = winner;
  }

  return winner;
}

/** Persist page document to root + typed table (fast path for public domains). */
export async function savePageDocument(
  pageId: string,
  blocks: unknown[],
  details: Record<string, unknown>
): Promise<PageDocument> {
  const id = String(pageId || "").trim();
  const doc: PageDocument = {
    blocks: Array.isArray(blocks) ? blocks : [],
    details: details && typeof details === "object" ? details : {},
    updatedAt: new Date().toISOString()
  };

  const store = getRootStore();
  store[id] = doc;
  setRootStore(store);

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from("bio_page_documents").upsert(
        {
          page_id: id,
          blocks: doc.blocks,
          details: doc.details,
          updated_at: doc.updatedAt
        },
        { onConflict: "page_id" }
      );
      if (error) console.error("bio_page_documents upsert failed:", error.message);
    }
  }

  return doc;
}

export type BioPageMeta = {
  id: string;
  title: string;
  slug: string;
  status: string;
  bio?: string;
  coverPhoto?: string;
};

function safePublicCover(cover: unknown): string | undefined {
  if (typeof cover !== "string" || !cover.trim()) return undefined;
  // Skip huge base64 covers on public lookup — they bloat JSON and slow domains.
  if (cover.startsWith("data:")) return undefined;
  return cover;
}

export async function getBioPageMeta(pageId: string): Promise<BioPageMeta | null> {
  const id = String(pageId || "").trim();
  if (!id) return null;

  const store = getRootStore();
  const pages = Array.isArray(store["pages_list"]) ? (store["pages_list"] as any[]) : [];
  const local = pages.find((page) => page?.id === id);
  if (local) {
    return {
      id,
      title: String(local.title || "BioLink"),
      slug: String(local.slug || "biolink"),
      status: String(local.status || "Draft"),
      bio: typeof local.bio === "string" ? local.bio : undefined,
      coverPhoto: safePublicCover(local.coverPhoto)
    };
  }

  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("bio_pages")
      .select("id, title, slug, status, bio, cover_photo")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: String(data.id),
      title: String(data.title || "BioLink"),
      slug: String(data.slug || "biolink"),
      status: String(data.status || "Draft"),
      bio: typeof data.bio === "string" ? data.bio : undefined,
      coverPhoto: safePublicCover(data.cover_photo)
    };
  } catch (error) {
    console.error("getBioPageMeta failed:", error);
    return null;
  }
}
