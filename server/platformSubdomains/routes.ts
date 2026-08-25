import { Router, type Request, type Response } from "express";
import { randomBytes } from "node:crypto";
import { requireAuth } from "../auth/routes";
import { getRootStore } from "../db/rootStore";
import { isSupabaseConfigured } from "../db/supabase";
import {
  createPlatformSubdomain,
  findPlatformSubdomainById,
  findPlatformSubdomainByPageId,
  isPlatformSlugTaken,
  listPlatformSubdomains,
  removePlatformSubdomain,
  updatePlatformSubdomain
} from "./repository";
import {
  buildPlatformSubdomainHostname,
  normalizePlatformSlug,
  platformSubdomainBase,
  validatePlatformSlug
} from "./slug";

type AuthedRequest = Request & {
  authUser?: { id: string; email: string };
};

function recordId() {
  return `psub_${Date.now()}_${randomBytes(5).toString("hex")}`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function pageBelongsToUser(pageId: string, userId: string) {
  const pages = getRootStore().pages_list;
  return (
    Array.isArray(pages) &&
    pages.some(
      (page) =>
        page &&
        typeof page === "object" &&
        page.id === pageId &&
        page.ownerUserId === userId
    )
  );
}

function publicRecord(record: Awaited<ReturnType<typeof listPlatformSubdomains>>[number]) {
  return {
    id: record.id,
    slug: record.slug,
    pageId: record.pageId,
    hostname: record.hostname,
    publicUrl: `https://${record.hostname}`,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

export function createPlatformSubdomainsRouter() {
  const router = Router();

  router.get("/config", (_req, res: Response) => {
    const base = platformSubdomainBase();
    res.json({
      baseHostname: base,
      pattern: `{slug}.${base}`,
      example: `yourname.${base}`,
      minLength: 3,
      maxLength: 63
    });
  });

  router.get("/check-slug", (req, res: Response) => {
    const slug = normalizePlatformSlug(req.query.slug);
    const validationError = validatePlatformSlug(slug);
    if (validationError) {
      res.json({ slug, available: false, reason: validationError });
      return;
    }
    void isPlatformSlugTaken(slug)
      .then((taken) => {
        res.json({
          slug,
          available: !taken,
          hostname: buildPlatformSubdomainHostname(slug),
          reason: taken ? "That name is already taken." : null
        });
      })
      .catch((error) => {
        res.status(500).json({ error: errorMessage(error) });
      });
  });

  router.use(requireAuth);
  router.use((req, res, next) => {
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
      next();
      return;
    }
    if (!req.headers.authorization?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Bearer token required.", code: "BEARER_REQUIRED" });
      return;
    }
    next();
  });

  router.get("/", async (req: AuthedRequest, res: Response) => {
    if (!isSupabaseConfigured()) {
      // Local/dev environments without Supabase have no subdomain store yet.
      res.json({ subdomains: [], supabaseConfigured: false });
      return;
    }
    try {
      const rows = await listPlatformSubdomains(req.authUser!.id);
      res.json({ subdomains: rows.map(publicRecord) });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "PLATFORM_SUBDOMAIN_LIST_FAILED" });
    }
  });

  router.post("/", async (req: AuthedRequest, res: Response) => {
    const slug = normalizePlatformSlug(req.body?.slug);
    const pageId = String(req.body?.pageId || "").trim();
    const validationError = validatePlatformSlug(slug);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }
    if (!pageId || !pageBelongsToUser(pageId, req.authUser!.id)) {
      res.status(400).json({ error: "Select a valid bio page for this free KEY address." });
      return;
    }

    try {
      const existingForPage = await findPlatformSubdomainByPageId(pageId, req.authUser!.id);
      if (existingForPage) {
        res.status(409).json({
          error: `This page already has ${existingForPage.hostname}. Each page can use one free KEY address.`
        });
        return;
      }
      if (await isPlatformSlugTaken(slug)) {
        res.status(409).json({ error: "That name is already taken. Try another." });
        return;
      }

      const record = await createPlatformSubdomain({
        id: recordId(),
        slug,
        pageId,
        ownerUserId: req.authUser!.id
      });
      res.status(201).json({ subdomain: publicRecord(record) });
    } catch (error) {
      const message = errorMessage(error);
      const duplicate = /duplicate|unique/i.test(message);
      res.status(duplicate ? 409 : 500).json({
        error: duplicate ? "That name is already taken." : message,
        code: duplicate ? "SLUG_EXISTS" : "PLATFORM_SUBDOMAIN_CREATE_FAILED"
      });
    }
  });

  router.patch("/:id", async (req: AuthedRequest, res: Response) => {
    const slug = req.body?.slug !== undefined ? normalizePlatformSlug(req.body.slug) : null;
    const pageId = req.body?.pageId !== undefined ? String(req.body.pageId || "").trim() : null;

    try {
      const record = await findPlatformSubdomainById(req.params.id, req.authUser!.id);
      if (!record) {
        res.status(404).json({ error: "Free KEY address not found." });
        return;
      }

      const patch: Record<string, unknown> = {};
      if (slug !== null) {
        const validationError = validatePlatformSlug(slug);
        if (validationError) {
          res.status(400).json({ error: validationError });
          return;
        }
        if (slug !== record.slug && (await isPlatformSlugTaken(slug, record.id))) {
          res.status(409).json({ error: "That name is already taken." });
          return;
        }
        patch.slug = slug;
      }

      if (pageId !== null) {
        if (!pageId || !pageBelongsToUser(pageId, req.authUser!.id)) {
          res.status(400).json({ error: "Select a valid bio page." });
          return;
        }
        const existingForPage = await findPlatformSubdomainByPageId(pageId, req.authUser!.id);
        if (existingForPage && existingForPage.id !== record.id) {
          res.status(409).json({
            error: `That page already uses ${existingForPage.hostname}.`
          });
          return;
        }
        patch.page_id = pageId;
      }

      if (Object.keys(patch).length === 0) {
        res.json({ subdomain: publicRecord(record) });
        return;
      }

      const updated = await updatePlatformSubdomain(record.id, req.authUser!.id, patch);
      res.json({ subdomain: publicRecord(updated) });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "PLATFORM_SUBDOMAIN_PATCH_FAILED" });
    }
  });

  router.delete("/:id", async (req: AuthedRequest, res: Response) => {
    try {
      const record = await findPlatformSubdomainById(req.params.id, req.authUser!.id);
      if (!record) {
        res.status(404).json({ error: "Free KEY address not found." });
        return;
      }
      await removePlatformSubdomain(record.id, req.authUser!.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "PLATFORM_SUBDOMAIN_DELETE_FAILED" });
    }
  });

  return router;
}
