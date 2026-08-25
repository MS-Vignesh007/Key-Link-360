import { Router, type Request, type Response } from "express";
import { randomBytes } from "node:crypto";
import { requireAuth } from "../auth/routes";
import { flushRootStore } from "../db/rootStore";
import { findDomainByHostname, listDomains } from "../domains/repository";
import { normalizeHostname } from "../domains/hostname";
import { buildShortLinkAnalytics } from "./analytics";
import {
  buildShortLinkPublicUrl,
  isPlatformShortLinkHost,
  normalizeShortLinkHost,
  shortLinkPlatformHostname
} from "./publicUrl";
import {
  createShortLink,
  findShortLinkById,
  isShortLinkSlugTaken,
  listShortLinks,
  removeShortLink,
  updateShortLink
} from "./repository";
import { generateShortLinkSlug, normalizeShortLinkSlug, validateShortLinkSlug } from "./slug";
import type { ShortLinkRecord, ShortLinkRetarget, ShortLinkStatus } from "./types";
import { toAbsoluteHttpUrl } from "./validation";

type AuthedRequest = Request & {
  authUser?: { id: string; email: string };
};

const RETARGET_SET = new Set<ShortLinkRetarget>(["fb", "google", "tiktok", "snapchat"]);

function recordId() {
  return `sl_${Date.now()}_${randomBytes(4).toString("hex")}`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function parseStatus(value: unknown): ShortLinkStatus {
  return String(value || "").trim() === "Paused" ? "Paused" : "Live";
}

function parseRetargeting(value: unknown): ShortLinkRetarget[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim().toLowerCase())
    .filter((item): item is ShortLinkRetarget => RETARGET_SET.has(item as ShortLinkRetarget));
}

function publicRecord(record: ShortLinkRecord) {
  const hostDomain = normalizeShortLinkHost(record.hostDomain);
  return {
    id: record.id,
    title: record.title,
    slug: record.slug,
    hostDomain,
    shortUrl: buildShortLinkPublicUrl(record.slug, hostDomain),
    destinationUrl: record.destinationUrl,
    status: record.status,
    retargeting: record.retargeting || [],
    clicks: record.totalClicks || 0,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function allocateUniqueSlug(hostDomain: string, preferred?: string): string {
  let slug = preferred ? normalizeShortLinkSlug(preferred) : generateShortLinkSlug();
  if (!slug) slug = generateShortLinkSlug();
  let attempt = 0;
  while (isShortLinkSlugTaken(slug, hostDomain) && attempt < 12) {
    slug =
      preferred && attempt === 0
        ? `${slug}-${generateShortLinkSlug(4)}`
        : generateShortLinkSlug();
    attempt += 1;
  }
  return slug;
}

const ALLOWED_HOST_STATUSES = new Set(["Verified", "DNS Verified", "Provisioning SSL"]);

async function resolveAllowedHostDomain(
  ownerUserId: string,
  requestedHost: unknown
): Promise<{ hostDomain?: string; error?: string }> {
  const platformHost = shortLinkPlatformHostname();
  const host = normalizeHostname(requestedHost) || platformHost;

  if (host === platformHost || isPlatformShortLinkHost(host)) {
    return { hostDomain: platformHost };
  }

  try {
    const domains = await listDomains(ownerUserId);
    const match = domains.find(
      (domain) =>
        normalizeHostname(domain.domainName) === host &&
        domain.ownerUserId === ownerUserId &&
        ALLOWED_HOST_STATUSES.has(domain.status)
    );
    if (match) {
      return { hostDomain: normalizeHostname(match.domainName) };
    }

    const byHostname = await findDomainByHostname(host);
    if (
      byHostname &&
      byHostname.ownerUserId === ownerUserId &&
      ALLOWED_HOST_STATUSES.has(byHostname.status)
    ) {
      return { hostDomain: normalizeHostname(byHostname.domainName) };
    }

    return {
      error: "Select KEYSLINK or one of your verified custom domains."
    };
  } catch (error) {
    if (host.includes(".") && host !== platformHost) {
      console.warn("[short-links] host validation fallback:", errorMessage(error));
      return { hostDomain: host };
    }
    return { error: errorMessage(error) };
  }
}

export function createShortLinksRouter() {
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
      const rows = listShortLinks(req.authUser!.id);
      res.json({ links: rows.map(publicRecord) });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "SHORT_LINK_LIST_FAILED" });
    }
  });

  router.get("/:id/analytics", (req: AuthedRequest, res: Response) => {
    try {
      const record = findShortLinkById(req.params.id, req.authUser!.id);
      if (!record) {
        res.status(404).json({ error: "Short link not found." });
        return;
      }
      const analytics = buildShortLinkAnalytics(record);
      res.json({
        link: publicRecord(record),
        summary: analytics.summary,
        devices: analytics.devices,
        daily: analytics.daily
      });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "SHORT_LINK_ANALYTICS_FAILED" });
    }
  });

  router.get("/:id", (req: AuthedRequest, res: Response) => {
    try {
      const record = findShortLinkById(req.params.id, req.authUser!.id);
      if (!record) {
        res.status(404).json({ error: "Short link not found." });
        return;
      }
      res.json({ link: publicRecord(record) });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error) });
    }
  });

  router.post("/", async (req: AuthedRequest, res: Response) => {
    try {
      const title = String(req.body?.title || "").trim();
      const destinationUrl = toAbsoluteHttpUrl(String(req.body?.destinationUrl || ""));
      const status = parseStatus(req.body?.status);
      const retargeting = parseRetargeting(req.body?.retargeting);
      const hostResult = await resolveAllowedHostDomain(req.authUser!.id, req.body?.hostDomain);

      if (!title) {
        res.status(400).json({ error: "Link title is required." });
        return;
      }
      if (!destinationUrl) {
        res.status(400).json({ error: "Enter a valid destination URL." });
        return;
      }
      if (hostResult.error || !hostResult.hostDomain) {
        res.status(400).json({ error: hostResult.error || "Select a valid host domain." });
        return;
      }

      const preferredSlug = normalizeShortLinkSlug(req.body?.slug || title);
      const slugError = preferredSlug ? validateShortLinkSlug(preferredSlug) : "Slug is required.";
      if (slugError && preferredSlug) {
        // Prefer generated slug when title isn't slug-friendly
      }

      let slugCandidate =
        preferredSlug && !validateShortLinkSlug(preferredSlug) ? preferredSlug : "";
      if (slugCandidate && isShortLinkSlugTaken(slugCandidate, hostResult.hostDomain)) {
        res.status(409).json({
          error: `A short link "${slugCandidate}" already exists on ${hostResult.hostDomain}.`
        });
        return;
      }

      const slug = allocateUniqueSlug(hostResult.hostDomain, slugCandidate || undefined);
      const record = createShortLink({
        id: recordId(),
        ownerUserId: req.authUser!.id,
        title,
        slug,
        hostDomain: hostResult.hostDomain,
        destinationUrl,
        status,
        retargeting
      });

      void flushRootStore().catch((error) =>
        console.error("[short-links] flush after create failed:", errorMessage(error))
      );
      res.status(201).json({ link: publicRecord(record) });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "SHORT_LINK_CREATE_FAILED" });
    }
  });

  router.patch("/:id", async (req: AuthedRequest, res: Response) => {
    try {
      const existing = findShortLinkById(req.params.id, req.authUser!.id);
      if (!existing) {
        res.status(404).json({ error: "Short link not found." });
        return;
      }

      const title =
        req.body?.title !== undefined ? String(req.body.title || "").trim() : existing.title;
      const status =
        req.body?.status !== undefined ? parseStatus(req.body.status) : existing.status;
      const retargeting =
        req.body?.retargeting !== undefined
          ? parseRetargeting(req.body.retargeting)
          : existing.retargeting;

      if (!title) {
        res.status(400).json({ error: "Link title is required." });
        return;
      }

      let destinationUrl = existing.destinationUrl;
      if (req.body?.destinationUrl !== undefined) {
        const absolute = toAbsoluteHttpUrl(String(req.body.destinationUrl || ""));
        if (!absolute) {
          res.status(400).json({ error: "Enter a valid destination URL." });
          return;
        }
        destinationUrl = absolute;
      }

      let hostDomain = normalizeShortLinkHost(existing.hostDomain);
      if (req.body?.hostDomain !== undefined) {
        const hostResult = await resolveAllowedHostDomain(req.authUser!.id, req.body.hostDomain);
        if (hostResult.error || !hostResult.hostDomain) {
          res.status(400).json({ error: hostResult.error || "Select a valid host domain." });
          return;
        }
        hostDomain = hostResult.hostDomain;
      }

      let slug = existing.slug;
      if (req.body?.slug !== undefined || req.body?.title !== undefined) {
        const preferred = normalizeShortLinkSlug(
          req.body?.slug !== undefined ? req.body.slug : title
        );
        if (preferred && !validateShortLinkSlug(preferred)) {
          if (isShortLinkSlugTaken(preferred, hostDomain, existing.id)) {
            res.status(409).json({
              error: `A short link "${preferred}" already exists on ${hostDomain}.`
            });
            return;
          }
          slug = preferred;
        }
      }

      const updated = updateShortLink(existing.id, req.authUser!.id, {
        title,
        slug,
        hostDomain,
        destinationUrl,
        status,
        retargeting
      });
      if (!updated) {
        res.status(404).json({ error: "Short link not found." });
        return;
      }

      void flushRootStore().catch((error) =>
        console.error("[short-links] flush after update failed:", errorMessage(error))
      );
      res.json({ link: publicRecord(updated) });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "SHORT_LINK_UPDATE_FAILED" });
    }
  });

  router.delete("/:id", (req: AuthedRequest, res: Response) => {
    try {
      const removed = removeShortLink(req.params.id, req.authUser!.id);
      if (!removed) {
        res.status(404).json({ error: "Short link not found." });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "SHORT_LINK_DELETE_FAILED" });
    }
  });

  return router;
}
