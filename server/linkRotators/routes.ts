import { Router, type Request, type Response } from "express";
import { randomBytes } from "node:crypto";
import { requireAuth } from "../auth/routes";
import { flushRootStore } from "../db/rootStore";
import { findDomainByHostname, listDomains } from "../domains/repository";
import { normalizeHostname } from "../domains/hostname";
import {
  buildLinkRotatorPublicUrl,
  isPlatformLinkRotatorHost,
  linkRotatorPlatformHostname,
  normalizeLinkRotatorHost
} from "./publicUrl";
import { buildRotatorAnalytics } from "./analytics";
import {
  createLinkRotator,
  findLinkRotatorById,
  isLinkRotatorSlugTaken,
  listLinkRotators,
  removeLinkRotator,
  updateLinkRotator
} from "./repository";
import { generateRotatorSlug, normalizeRotatorSlug, validateRotatorSlug } from "./slug";
import type { LinkRotatorRecord, LinkRotatorStatus } from "./types";
import { normalizeDestinations } from "./validation";
import { checkResourceQuota } from "../billing/quotaGuard";

type AuthedRequest = Request & {
  authUser?: { id: string; email: string };
};

function recordId() {
  return `lr_${Date.now()}_${randomBytes(4).toString("hex")}`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function parseStatus(value: unknown): LinkRotatorStatus {
  return String(value || "").trim() === "Inactive" ? "Inactive" : "Active";
}

function publicRecord(record: LinkRotatorRecord) {
  const hostDomain = normalizeLinkRotatorHost(record.hostDomain);
  return {
    id: record.id,
    name: record.name,
    description: record.description || "",
    slug: record.slug,
    hostDomain,
    rotatorUrl: buildLinkRotatorPublicUrl(record.slug, hostDomain),
    status: record.status,
    destinations: record.destinations.map((destination) => ({
      id: destination.id,
      url: destination.url,
      probability: destination.probability,
      clicks: destination.clicks || 0
    })),
    totalClicks: record.totalClicks || 0,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function allocateUniqueSlug(hostDomain: string, preferred?: string): string {
  let slug = preferred ? normalizeRotatorSlug(preferred) : generateRotatorSlug();
  if (!slug) slug = generateRotatorSlug();
  let attempt = 0;
  while (isLinkRotatorSlugTaken(slug, hostDomain) && attempt < 12) {
    slug = preferred && attempt === 0 ? `${slug}${generateRotatorSlug(4)}` : generateRotatorSlug();
    attempt += 1;
  }
  return slug;
}

const ALLOWED_ROTATOR_HOST_STATUSES = new Set([
  "Verified",
  "DNS Verified",
  "Provisioning SSL"
]);

async function resolveAllowedHostDomain(
  ownerUserId: string,
  requestedHost: unknown
): Promise<{ hostDomain?: string; error?: string }> {
  const platformHost = linkRotatorPlatformHostname();
  const host = normalizeHostname(requestedHost) || platformHost;

  if (host === platformHost || isPlatformLinkRotatorHost(host)) {
    return { hostDomain: platformHost };
  }

  try {
    const domains = await listDomains(ownerUserId);
    const match = domains.find(
      (domain) =>
        normalizeHostname(domain.domainName) === host &&
        domain.ownerUserId === ownerUserId &&
        ALLOWED_ROTATOR_HOST_STATUSES.has(domain.status)
    );
    if (match) {
      return { hostDomain: normalizeHostname(match.domainName) };
    }

    // Fallback when list filtering misses an alias / casing edge case.
    const byHostname = await findDomainByHostname(host);
    if (
      byHostname &&
      byHostname.ownerUserId === ownerUserId &&
      ALLOWED_ROTATOR_HOST_STATUSES.has(byHostname.status)
    ) {
      return { hostDomain: normalizeHostname(byHostname.domainName) };
    }

    return {
      error: "Select KEYLINK360 or one of your verified custom domains from Custom Domains."
    };
  } catch (error) {
    // If domain lookup is temporarily unavailable, still allow a well-formed custom host
    // so Edit → Save changes is not blocked after the UI already listed that domain.
    if (host.includes(".") && host !== platformHost) {
      console.warn("[link-rotators] host validation fallback:", errorMessage(error));
      return { hostDomain: host };
    }
    return { error: errorMessage(error) };
  }
}

export function createLinkRotatorsRouter() {
  const router = Router();

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

  router.get("/", (req: AuthedRequest, res: Response) => {
    try {
      const rows = listLinkRotators(req.authUser!.id);
      res.json({ rotators: rows.map(publicRecord) });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "LINK_ROTATOR_LIST_FAILED" });
    }
  });

  // Register before `/:id` so nested paths are never swallowed by proxies/routers.
  router.get("/:id/analytics", (req: AuthedRequest, res: Response) => {
    try {
      const record = findLinkRotatorById(req.params.id, req.authUser!.id);
      if (!record) {
        res.status(404).json({ error: "Link rotator not found." });
        return;
      }
      const analytics = buildRotatorAnalytics(record);
      res.json({
        rotator: publicRecord(record),
        summary: analytics.summary,
        destinations: analytics.destinations
      });
    } catch (error) {
      res.status(500).json({
        error: errorMessage(error),
        code: "LINK_ROTATOR_ANALYTICS_FAILED"
      });
    }
  });

  router.get("/:id", (req: AuthedRequest, res: Response) => {
    try {
      const record = findLinkRotatorById(req.params.id, req.authUser!.id);
      if (!record) {
        res.status(404).json({ error: "Link rotator not found." });
        return;
      }
      const includeAnalytics =
        String(req.query.analytics || "") === "1" ||
        String(req.query.include || "") === "analytics";
      if (includeAnalytics) {
        const analytics = buildRotatorAnalytics(record);
        res.json({
          rotator: publicRecord(record),
          summary: analytics.summary,
          destinations: analytics.destinations
        });
        return;
      }
      res.json({ rotator: publicRecord(record) });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error) });
    }
  });

  router.post("/", async (req: AuthedRequest, res: Response) => {
    try {
      const quota = checkResourceQuota(req.authUser!.id, "rotators", 1);
      if (!quota.allowed) {
        res.status(403).json({
          error: quota.error,
          code: "QUOTA_EXCEEDED",
          quota
        });
        return;
      }

      const name = String(req.body?.name || "").trim();
      const description = String(req.body?.description || "").trim();
      const status = parseStatus(req.body?.status);
      const destinationResult = normalizeDestinations(req.body?.destinations);
      const hostResult = await resolveAllowedHostDomain(req.authUser!.id, req.body?.hostDomain);

      if (!name) {
        res.status(400).json({ error: "Rotator name is required." });
        return;
      }
      if (hostResult.error || !hostResult.hostDomain) {
        res.status(400).json({ error: hostResult.error || "Select a valid host domain." });
        return;
      }
      if (destinationResult.error || !destinationResult.destinations) {
        res.status(400).json({ error: destinationResult.error || "Invalid destinations." });
        return;
      }

      const preferredSlug = normalizeRotatorSlug(req.body?.slug || name);
      if (preferredSlug) {
        const slugError = validateRotatorSlug(preferredSlug);
        if (slugError) {
          // Fall back to generated slug when name is not slug-friendly
        }
      }

      let slugCandidate = preferredSlug && !validateRotatorSlug(preferredSlug) ? preferredSlug : "";
      if (slugCandidate && isLinkRotatorSlugTaken(slugCandidate, hostResult.hostDomain)) {
        res.status(409).json({
          error: `A rotator named "${slugCandidate}" already exists on ${hostResult.hostDomain}.`
        });
        return;
      }

      const slug = allocateUniqueSlug(hostResult.hostDomain, slugCandidate || undefined);
      const record = createLinkRotator({
        id: recordId(),
        ownerUserId: req.authUser!.id,
        name,
        description,
        slug,
        hostDomain: hostResult.hostDomain,
        status,
        destinations: destinationResult.destinations
      });

      // Do not block the API response on slow Supabase flush — that freezes Save changes in the UI.
      void flushRootStore().catch((error) =>
        console.error("[link-rotators] flush after create failed:", errorMessage(error))
      );
      res.status(201).json({ rotator: publicRecord(record) });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "LINK_ROTATOR_CREATE_FAILED" });
    }
  });

  router.patch("/:id", async (req: AuthedRequest, res: Response) => {
    try {
      const existing = findLinkRotatorById(req.params.id, req.authUser!.id);
      if (!existing) {
        res.status(404).json({ error: "Link rotator not found." });
        return;
      }

      const name =
        req.body?.name !== undefined ? String(req.body.name || "").trim() : existing.name;
      const description =
        req.body?.description !== undefined
          ? String(req.body.description || "").trim()
          : existing.description;
      const status =
        req.body?.status !== undefined ? parseStatus(req.body.status) : existing.status;

      if (!name) {
        res.status(400).json({ error: "Rotator name is required." });
        return;
      }

      let hostDomain = normalizeLinkRotatorHost(existing.hostDomain);
      if (req.body?.hostDomain !== undefined) {
        const hostResult = await resolveAllowedHostDomain(req.authUser!.id, req.body.hostDomain);
        if (hostResult.error || !hostResult.hostDomain) {
          res.status(400).json({ error: hostResult.error || "Select a valid host domain." });
          return;
        }
        hostDomain = hostResult.hostDomain;
      }

      // Keep public URL in sync with edits: slug comes from rotator name (same as create preview).
      const preferredSlug = normalizeRotatorSlug(
        req.body?.slug !== undefined ? req.body.slug : name
      );
      let slug = existing.slug;
      if (preferredSlug && !validateRotatorSlug(preferredSlug)) {
        if (isLinkRotatorSlugTaken(preferredSlug, hostDomain, existing.id)) {
          res.status(409).json({
            error: `A rotator named "${preferredSlug}" already exists on ${hostDomain}.`
          });
          return;
        }
        slug = preferredSlug;
      } else if (
        hostDomain !== normalizeLinkRotatorHost(existing.hostDomain) &&
        isLinkRotatorSlugTaken(existing.slug, hostDomain, existing.id)
      ) {
        res.status(409).json({
          error: `A rotator with this name already exists on ${hostDomain}.`
        });
        return;
      }

      let destinations = existing.destinations;
      if (req.body?.destinations !== undefined) {
        const destinationResult = normalizeDestinations(req.body.destinations);
        if (destinationResult.error || !destinationResult.destinations) {
          res.status(400).json({ error: destinationResult.error || "Invalid destinations." });
          return;
        }
        destinations = destinationResult.destinations;
      }

      const updated = updateLinkRotator(existing.id, req.authUser!.id, {
        name,
        description,
        status,
        hostDomain,
        slug,
        destinations
      });
      if (!updated) {
        res.status(404).json({ error: "Link rotator not found." });
        return;
      }
      void flushRootStore().catch((error) =>
        console.error("[link-rotators] flush after update failed:", errorMessage(error))
      );
      res.json({ rotator: publicRecord(updated) });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "LINK_ROTATOR_UPDATE_FAILED" });
    }
  });

  router.delete("/:id", (req: AuthedRequest, res: Response) => {
    try {
      const removed = removeLinkRotator(req.params.id, req.authUser!.id);
      if (!removed) {
        res.status(404).json({ error: "Link rotator not found." });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "LINK_ROTATOR_DELETE_FAILED" });
    }
  });

  return router;
}
