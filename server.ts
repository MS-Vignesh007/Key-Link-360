import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import { createAuthRouter, requireAuth } from "./server/auth/routes";
import { verifyAccessToken } from "./server/auth/crypto";
import { flushRootStore, getDataStoreStatus, getRootStore, initRootStore, setRootStore } from "./server/db/rootStore";
import { getSupabase, isSupabaseConfigured } from "./server/db/supabase";
import {
  mergeBioPageDrafts,
  mergeWorkspaceIntoRoot,
  syncRootToNormalizedTables
} from "./server/db/syncNormalized";
import { createDomainsRouter } from "./server/domains/routes";
import { findRoutableDomainByHostname } from "./server/domains/repository";
import { getBioPageMeta, getPageDocument, savePageDocument } from "./server/pages/documents";
import { isCloudflareForSaasConfigured } from "./server/domains/cloudflare";
import { resolveCnameTarget, resolveCustomDomainATarget } from "./server/domains/hostname";
import { clientIp, consumeRateLimit } from "./server/domains/rateLimit";
import { startSslPollingLoop } from "./server/domains/sslPoller";
import { ensurePlatformOriginHostRewrite } from "./server/domains/originHostRewrite";
import { ensurePlatformFreeUrlWildcardDns } from "./server/platformSubdomains/ensureWildcardDns";
import { shouldRegisterCloudflareCustomHostnames } from "./server/domains/saasConfig";
import { createPlatformSubdomainsRouter } from "./server/platformSubdomains/routes";
import { findPlatformSubdomainBySlug } from "./server/platformSubdomains/repository";
import {
  isPlatformApexHostname,
  isPlatformSubdomainHostname,
  parsePlatformSubdomainSlug
} from "./server/platformSubdomains/slug";
import { createLinkRotatorsRouter } from "./server/linkRotators/routes";
import { createPaymentsRouter } from "./server/payments/routes";
import { createAdminRouter } from "./server/admin/routes";
import { createBillingRouter } from "./server/billing/routes";
import { checkResourceQuota } from "./server/billing/quotaGuard";
import {
  recordLinkRotatorClick,
  resolvePublicLinkRotator
} from "./server/linkRotators/repository";
import {
  claimRotatorClickSlot,
  shouldCountRotatorHit
} from "./server/linkRotators/clickGuard";
import {
  pickDestinationByProbability,
  toAbsoluteHttpUrl
} from "./server/linkRotators/validation";
import { normalizeRotatorSlug } from "./server/linkRotators/slug";
import {
  linkRotatorPlatformHostname,
  normalizeLinkRotatorHost
} from "./server/linkRotators/publicUrl";
import { buildLinkRotatorRedirectHtml } from "./server/linkRotators/redirectPage";
import { createShortLinksRouter } from "./server/shortLinks/routes";
import {
  recordShortLinkClick,
  resolvePublicShortLink
} from "./server/shortLinks/repository";
import { toAbsoluteHttpUrl as toShortLinkAbsoluteUrl } from "./server/shortLinks/validation";
import { normalizeShortLinkSlug } from "./server/shortLinks/slug";
import {
  normalizeShortLinkHost,
  shortLinkPlatformHostname
} from "./server/shortLinks/publicUrl";
import { buildShortLinkRedirectHtml } from "./server/shortLinks/redirectPage";
import { buildLeadContact, upsertOwnerContact, mergeContactLists } from "./server/leads";
import {
  resolveQrForPublicRedirect,
  recordQrScan,
  listQrCodes,
  upsertQrCode,
  deleteQrCode
} from "./server/qrCodes/repository";
import { normalizeQrPublicCode } from "./server/qrCodes/publicUrl";
import { toAbsoluteHttpUrl as toQrAbsoluteUrl } from "./server/shortLinks/validation";

const app = express();
app.disable("x-powered-by");
const PORT = Number(process.env.PORT) || 3000;

function allowedCorsOrigins(): Set<string> {
  const origins = new Set<string>();
  const appUrl = (process.env.APP_URL || "").trim().replace(/\/$/, "");
  if (appUrl) {
    try {
      origins.add(new URL(appUrl).origin);
    } catch {
      /* ignore */
    }
  }
  for (const raw of (process.env.CORS_ORIGINS || "").split(",")) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    try {
      origins.add(new URL(trimmed).origin);
    } catch {
      /* ignore */
    }
  }
  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
    origins.add("http://localhost:5173");
    origins.add("http://127.0.0.1:5173");
  }
  return origins;
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed = allowedCorsOrigins();
  if (origin && allowed.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type, Cookie"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  }
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("X-XSS-Protection", "0");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Lightweight endpoint for the dashboard footer health indicator.
app.get("/api/health", (_req, res) => {
  const storeStatus = getDataStoreStatus();
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: storeStatus,
    customDomains: {
      provider: isCloudflareForSaasConfigured() ? "cloudflare" : "manual",
      aRecordTarget: resolveCustomDomainATarget(),
      cnameTarget: process.env.CUSTOM_DOMAIN_CNAME_TARGET?.trim() || resolveCnameTarget(),
      rootDomainOnly: false,
      subdomainSupport: true
    }
  });
});

/** Public lookup used by the customer Cloudflare Worker to map hostnames → pages. */
app.get("/api/public/custom-domain/:hostname", async (req, res) => {
  const rateKey = `public-domain:${clientIp(req)}`;
  if (!consumeRateLimit(rateKey, 120, 60_000)) {
    res.status(429).json({ error: "Too many requests. Try again shortly." });
    return;
  }

  try {
    const hostname = String(req.params.hostname || "")
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      .replace(/\.$/, "");
    if (!hostname) {
      res.status(400).json({ error: "Hostname required." });
      return;
    }
    const domain = await findRoutableDomainByHostname(hostname);
    if (!domain) {
      res.status(404).json({ error: "Domain not connected.", pageId: null });
      return;
    }
    const meta = await getBioPageMeta(domain.pageId);
    res.json({
      pageId: domain.pageId,
      domainName: domain.domainName,
      status: domain.status,
      title: meta?.title || null,
      slug: meta?.slug || null,
      bio: meta?.bio || null,
      coverPhoto: meta?.coverPhoto || null
    });
  } catch (error) {
    console.error("Public custom-domain lookup failed:", error);
    res.status(503).json({ error: "Lookup unavailable." });
  }
});

/** Public lookup: {slug}.keylink360.mindflo.today → pageId */
app.get("/api/public/platform-subdomain/:slug", async (req, res) => {
  const rateKey = `public-psub:${clientIp(req)}`;
  if (!consumeRateLimit(rateKey, 120, 60_000)) {
    res.status(429).json({ error: "Too many requests. Try again shortly." });
    return;
  }

  try {
    const slug = String(req.params.slug || "").trim().toLowerCase();
    if (!slug) {
      res.status(400).json({ error: "Slug required." });
      return;
    }
    const record = await findPlatformSubdomainBySlug(slug);
    if (!record) {
      res.status(404).json({ error: "Address not found.", pageId: null });
      return;
    }
    const meta = await getBioPageMeta(record.pageId);
    res.json({
      pageId: record.pageId,
      slug: record.slug,
      hostname: record.hostname,
      status: record.status,
      title: meta?.title || null,
      bio: meta?.bio || null,
      coverPhoto: meta?.coverPhoto || null
    });
  } catch (error) {
    console.error("Public platform-subdomain lookup failed:", error);
    res.status(503).json({ error: "Lookup unavailable." });
  }
});

app.use("/api/auth", createAuthRouter());
app.use("/api/domains", createDomainsRouter());
app.use("/api/platform-subdomains", createPlatformSubdomainsRouter());
app.use("/api/link-rotators", createLinkRotatorsRouter());
app.use("/api/short-links", createShortLinksRouter());
app.use("/api/payments", createPaymentsRouter());
app.use("/api/admin", createAdminRouter());
app.use("/api/billing", createBillingRouter());

/** Authenticated QR list — includes exact server-side scan counts. */
app.get("/api/qr-codes", requireAuth, (req, res) => {
  try {
    const userId = (req as any).authUser?.id as string;
    const all = listQrCodes();
    const filtered = all.filter(
      (item) => !item.ownerUserId || item.ownerUserId === userId || item.ownerUserId === "local"
    );
    res.json({ items: filtered });
  } catch (error) {
    console.error("List QR codes failed:", error);
    res.status(500).json({ error: "Failed to load QR codes." });
  }
});

/** Upsert Smart QR so /q/:code redirects work immediately after create/edit. */
app.post("/api/qr-codes", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).authUser.id as string;
    const body = (req.body || {}) as Record<string, unknown>;
    const id = String(body.id || "").trim();
    if (!id) {
      res.status(400).json({ error: "QR id is required." });
      return;
    }
    const targetUrl = toQrAbsoluteUrl(String(body.targetUrl || ""));
    if (!targetUrl) {
      res.status(400).json({ error: "Valid destination URL is required." });
      return;
    }
    const publicCode = normalizeQrPublicCode(String(body.publicCode || id));
    const existing = listQrCodes().find((row) => row.id === id);
    if (!existing) {
      const quota = checkResourceQuota(userId, "qrCodes", 1);
      if (!quota.allowed) {
        res.status(403).json({
          error: quota.error,
          code: "QUOTA_EXCEEDED",
          quota
        });
        return;
      }
    } else if (existing.ownerUserId && existing.ownerUserId !== userId && existing.ownerUserId !== "local") {
      res.status(403).json({ error: "You do not have permission to modify this QR code." });
      return;
    }
    const targetChanged = !existing || existing.targetUrl !== targetUrl;
    const targetUpdatedAt =
      String(body.targetUpdatedAt || "").trim() ||
      (targetChanged ? new Date().toISOString() : existing?.targetUpdatedAt);
    const saved = upsertQrCode({
      id,
      name: String(body.name || "Smart QR").slice(0, 120),
      status: body.status === "Paused" ? "Paused" : "Active",
      scans: String(body.scans ?? "0"),
      uniqueScanners: String(body.uniqueScanners ?? "0"),
      topLocation: body.topLocation ? String(body.topLocation) : undefined,
      conversionRate: body.conversionRate ? String(body.conversionRate) : undefined,
      qrUrl: String(body.qrUrl || ""),
      targetUrl,
      ...(targetUpdatedAt ? { targetUpdatedAt } : {}),
      scanUrl: body.scanUrl ? String(body.scanUrl) : undefined,
      publicCode,
      customDesign: Boolean(body.customDesign),
      designColor: body.designColor ? String(body.designColor) : undefined,
      designLogo: body.designLogo ? String(body.designLogo) : undefined,
      designLogoUrl: body.designLogoUrl ? String(body.designLogoUrl) : undefined,
      designPattern: body.designPattern ? String(body.designPattern) : undefined,
      ownerUserId: userId
    });
    // Publish destination to durable route index (what mobile /q/:code reads on production).
    const { publishQrDestination } = await import("./server/qrCodes/destinationSync");
    const published = await publishQrDestination(saved).catch(() => ({ ok: true, localOnly: true }));
    res.json({ item: saved, destinationSynced: Boolean(published?.ok) });
  } catch (error) {
    console.error("Upsert QR code failed:", error);
    res.status(500).json({ error: "Failed to save QR code." });
  }
});

app.delete("/api/qr-codes/:id", requireAuth, (req, res) => {
  try {
    const userId = (req as any).authUser?.id as string;
    const id = String(req.params.id || "").trim();
    if (!id) {
      res.status(400).json({ error: "QR id is required." });
      return;
    }
    const existing = listQrCodes().find((row) => row.id === id);
    if (!existing || (existing.ownerUserId && existing.ownerUserId !== userId && existing.ownerUserId !== "local")) {
      res.status(404).json({ error: "QR code not found." });
      return;
    }
    deleteQrCode(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete QR code failed:", error);
    res.status(500).json({ error: "Failed to delete QR code." });
  }
});

/** Public lookup for SPA fallback redirect (no auth). */
app.get("/api/public/qr/:code", async (req, res) => {
  const rateKey = `qr-public:${clientIp(req)}`;
  if (!consumeRateLimit(rateKey, 180, 60_000)) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }
  const code = normalizeQrPublicCode(req.params.code);
  if (!code) {
    res.status(404).json({ error: "QR code not found" });
    return;
  }
  try {
    const record = await resolveQrForPublicRedirect(code);
    if (!record) {
      res.status(404).json({ error: "QR code not found" });
      return;
    }
    if (record.status !== "Active") {
      res.status(404).json({ error: "This QR code is paused", status: "Paused" });
      return;
    }
    const target = toQrAbsoluteUrl(record.targetUrl);
    if (!target) {
      res.status(503).json({ error: "Destination unavailable" });
      return;
    }
    const fetchPurpose = String(req.get("Sec-Fetch-Purpose") || req.get("Purpose") || "").toLowerCase();
    const isPrefetch = fetchPurpose === "prefetch" || fetchPurpose === "prerender";
    if (!isPrefetch) {
      recordQrScan(code, clientIp(req));
    }
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.json({ targetUrl: target, publicCode: record.publicCode || code });
  } catch (error) {
    console.error("Public QR lookup failed:", error);
    res.status(503).json({ error: "Temporarily unavailable" });
  }
});

/** Public Smart QR redirect: /q/:code → current destination (matrix stays fixed). */
app.get("/q/:code", async (req, res) => {
  const rateKey = `qr-scan:${clientIp(req)}`;
  if (!consumeRateLimit(rateKey, 180, 60_000)) {
    res.status(429).type("html").send("<!doctype html><title>Too many requests</title><h1>Too many requests</h1>");
    return;
  }

  const code = normalizeQrPublicCode(req.params.code);
  if (!code) {
    res.status(404).type("html").send("<!doctype html><title>Not found</title><h1>QR code not found</h1>");
    return;
  }

  try {
    const record = await resolveQrForPublicRedirect(code);
    if (!record) {
      res.status(404).type("html").send("<!doctype html><title>Not found</title><h1>QR code not found</h1>");
      return;
    }
    if (record.status !== "Active") {
      res
        .status(404)
        .type("html")
        .send("<!doctype html><title>Unavailable</title><h1>This QR code is paused</h1>");
      return;
    }

    const target = toQrAbsoluteUrl(record.targetUrl);
    if (!target) {
      res
        .status(503)
        .type("html")
        .send("<!doctype html><title>Unavailable</title><h1>Destination unavailable</h1>");
      return;
    }

    const wantsHeadersOnly = req.method === "HEAD";
    const fetchPurpose = String(req.get("Sec-Fetch-Purpose") || req.get("Purpose") || "").toLowerCase();
    const isPrefetch = fetchPurpose === "prefetch" || fetchPurpose === "prerender";
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Referrer-Policy", "no-referrer");
    if (wantsHeadersOnly) {
      res.setHeader("Location", target);
      res.status(302).end();
      return;
    }
    if (!isPrefetch) {
      recordQrScan(code, clientIp(req));
    }
    res.redirect(302, target);
  } catch (error) {
    console.error("QR redirect failed:", error);
    res.status(503).type("html").send("<!doctype html><title>Unavailable</title><h1>Temporarily unavailable</h1>");
  }
});

function pickRequestHostname(req: express.Request) {
  const pick = (value: unknown) =>
    String(value || "")
      .split(",")[0]
      .trim()
      .toLowerCase()
      .replace(/:\d+$/, "");

  return (
    pick(req.headers["key-customer-host"]) ||
    pick(req.headers["x-forwarded-host"]) ||
    pick(req.headers.host)
  );
}

/** Public link rotator redirect: /r/:slug → weighted destination (platform or custom domain host) */
app.get("/r/:slug", (req, res) => {
  const rateKey = `link-rotator:${clientIp(req)}`;
  if (!consumeRateLimit(rateKey, 180, 60_000)) {
    res.status(429).type("html").send("<!doctype html><title>Too many requests</title><h1>Too many requests</h1>");
    return;
  }

  const slug = normalizeRotatorSlug(req.params.slug);
  if (!slug) {
    res.status(404).type("html").send("<!doctype html><title>Not found</title><h1>Rotator not found</h1>");
    return;
  }

  try {
    const hostname = normalizeLinkRotatorHost(pickRequestHostname(req));
    const record = resolvePublicLinkRotator(slug, hostname, linkRotatorPlatformHostname());
    if (!record || record.status !== "Active") {
      res
        .status(404)
        .type("html")
        .send(
          "<!doctype html><title>Rotator unavailable</title><h1>This link rotator is not available</h1>"
        );
      return;
    }

    const destination = pickDestinationByProbability(record.destinations);
    const target = destination?.url ? toAbsoluteHttpUrl(destination.url) : null;
    if (!target) {
      res
        .status(503)
        .type("html")
        .send("<!doctype html><title>Unavailable</title><h1>No destinations configured</h1>");
      return;
    }

    // Prefer HTML/JS redirect over bare 302:
    // Custom-domain edges sometimes follow 302 and serve destination HTML under
    // the customer host (broken CSS). Browser-only location.replace avoids that.
    const wantsHeadersOnly = req.method === "HEAD";
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Referrer-Policy", "no-referrer");
    if (wantsHeadersOnly) {
      // Do not count HEAD probes — browsers/link checkers often HEAD then GET.
      res.setHeader("Location", target);
      res.status(302).end();
      return;
    }

    // Real clicks only: document navigations, no bots, 5s IP dedupe (kills double/triple counts).
    if (
      shouldCountRotatorHit(req) &&
      claimRotatorClickSlot(record.id, clientIp(req))
    ) {
      recordLinkRotatorClick(record.id, {
        id: destination.id,
        url: destination.url || target
      });
    }
    res.status(200).type("html").send(buildLinkRotatorRedirectHtml(target));
  } catch (error) {
    console.error("Link rotator redirect failed:", error);
    res.status(503).type("html").send("<!doctype html><title>Unavailable</title><h1>Temporarily unavailable</h1>");
  }
});

/** Public short link redirect: /l/:slug → destination URL */
app.get("/l/:slug", (req, res) => {
  const rateKey = `short-link:${clientIp(req)}`;
  if (!consumeRateLimit(rateKey, 180, 60_000)) {
    res.status(429).type("html").send("<!doctype html><title>Too many requests</title><h1>Too many requests</h1>");
    return;
  }

  const slug = normalizeShortLinkSlug(req.params.slug);
  if (!slug) {
    res.status(404).type("html").send("<!doctype html><title>Not found</title><h1>Short link not found</h1>");
    return;
  }

  try {
    const hostname = normalizeShortLinkHost(pickRequestHostname(req));
    const record = resolvePublicShortLink(slug, hostname, shortLinkPlatformHostname());
    if (!record || record.status !== "Live") {
      res
        .status(404)
        .type("html")
        .send("<!doctype html><title>Unavailable</title><h1>This short link is not available</h1>");
      return;
    }

    const target = toShortLinkAbsoluteUrl(record.destinationUrl);
    if (!target) {
      res
        .status(503)
        .type("html")
        .send("<!doctype html><title>Unavailable</title><h1>Destination not configured</h1>");
      return;
    }

    recordShortLinkClick(record.id, {
      userAgent: String(req.headers["user-agent"] || ""),
      referer: String(req.headers.referer || req.headers.referrer || "")
    });

    const wantsHeadersOnly = req.method === "HEAD";
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Referrer-Policy", "no-referrer");
    if (wantsHeadersOnly) {
      res.setHeader("Location", target);
      res.status(302).end();
      return;
    }
    res.status(200).type("html").send(buildShortLinkRedirectHtml(target));
  } catch (error) {
    console.error("Short link redirect failed:", error);
    res.status(503).type("html").send("<!doctype html><title>Unavailable</title><h1>Temporarily unavailable</h1>");
  }
});

/** Pull workspace collections for the signed-in user (cross-device hydration). */
app.get("/api/workspace/export", requireAuth, (req, res) => {
  const userId = (req as any).authUser.id as string;
  const store = readStore();
  const pages = (Array.isArray(store["pages_list"]) ? store["pages_list"] : []).filter(
    (page: any) => page.ownerUserId === userId
  );
  const drafts = mergeBioPageDrafts(store["bio_page_drafts"], [], userId).filter(
    (draft) => !draft.ownerUserId || draft.ownerUserId === userId
  );
  const pageDocuments: Record<string, unknown> = {};
  for (const page of pages) {
    if (store[page.id]) {
      pageDocuments[page.id] = store[page.id];
    }
  }
  res.json({
    pages,
    bio_page_drafts: drafts,
    page_documents: pageDocuments,
    publish_settings: store["publish_settings"] ?? null
  });
});

/** Import browser localStorage workspace collections → root + normalized Supabase tables */
app.post("/api/workspace/import", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).authUser.id as string;
    const workspace = (req.body?.workspace || req.body || {}) as Record<string, unknown>;
    const root = mergeWorkspaceIntoRoot(getRootStore(), workspace, userId);
    setRootStore(root);

    // Respond immediately — normalized sync runs in the background via setRootStore queue.
    res.json({
      success: true,
      backend: getDataStoreStatus().backend,
      normalized: { ok: true, deferred: true }
    });
  } catch (error) {
    console.error("workspace import failed:", error);
    res.status(500).json({ error: "Workspace import failed." });
  }
});

/** Force re-migrate root blob → all typed tables */
app.post("/api/admin/migrate-normalized", requireAuth, async (_req, res) => {
  if (!isSupabaseConfigured()) {
    res.status(400).json({ error: "Supabase is not configured." });
    return;
  }
  const supabase = getSupabase();
  if (!supabase) {
    res.status(400).json({ error: "Supabase client unavailable." });
    return;
  }
  const result = await syncRootToNormalizedTables(supabase, getRootStore());
  if (!result.ok) {
    res.status(500).json({ error: result.error });
    return;
  }
  res.json({ success: true, counts: result.counts });
});

// Helper to read store
function readStore(): any {
  return getRootStore();
}

// Helper to write store
function writeStore(data: any) {
  setRootStore(data);
}

// API Routes
app.get("/api/pages", requireAuth, (req, res) => {
  const store = readStore();
  const userId = (req as any).authUser.id as string;
  const pages = Array.isArray(store["pages_list"]) ? store["pages_list"] : [];
  let changed = false;
  const claimed = pages.map((page: any) => {
    if (!page.ownerUserId) {
      changed = true;
      return { ...page, ownerUserId: userId };
    }
    return page;
  });
  if (changed) {
    store["pages_list"] = claimed;
    writeStore(store);
  }
  res.json(claimed.filter((page: any) => page.ownerUserId === userId));
});

app.post("/api/pages", requireAuth, (req, res) => {
  const { pages } = req.body;
  if (!Array.isArray(pages)) {
    res.status(400).json({ error: "pages must be an array" });
    return;
  }
  const userId = (req as any).authUser.id as string;
  const store = readStore();
  const existing = Array.isArray(store["pages_list"]) ? store["pages_list"] : [];
  const userExistingPages = existing.filter((page: any) => page.ownerUserId === userId);

  // If user is expanding their total page count, verify quota
  if (pages.length > userExistingPages.length) {
    const quota = checkResourceQuota(userId, "pages", pages.length - userExistingPages.length);
    if (!quota.allowed) {
      res.status(403).json({
        error: quota.error,
        code: "QUOTA_EXCEEDED",
        quota
      });
      return;
    }
  }

  const otherUsers = existing.filter((page: any) => page.ownerUserId && page.ownerUserId !== userId);
  store["pages_list"] = [
    ...otherUsers,
    ...pages.map((page: any) => ({ ...page, ownerUserId: userId }))
  ];
  writeStore(store);
  res.json({ success: true });
});

app.get("/api/page/:id", async (req, res) => {
  const { id } = req.params;
  const pageData = await getPageDocument(id);
  if (!pageData) {
    res.set("Cache-Control", "no-store");
    res.status(404).json({ error: "Page not found" });
    return;
  }

  const meta = await getBioPageMeta(id);
  const status = String(meta?.status || "Draft");
  if (status !== "Live") {
    // Owners can still load drafts in the editor; public visitors cannot.
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    let ownerOk = false;
    if (token) {
      const payload = verifyAccessToken(token);
      const store = readStore();
      const pages = Array.isArray(store["pages_list"]) ? store["pages_list"] : [];
      const localMeta = pages.find((item: any) => item.id === id);
      ownerOk = Boolean(payload && localMeta?.ownerUserId && payload.sub === localMeta.ownerUserId);
    }
    if (!ownerOk) {
      res.set("Cache-Control", "no-store");
      res.status(404).json({ error: "Page not published", code: "PAGE_NOT_PUBLISHED" });
      return;
    }
  }

  const details =
    pageData.details && Object.keys(pageData.details).length > 0
      ? pageData.details
      : {
          title: meta?.title || "BioLink",
          bio: meta?.bio || "",
          coverPhoto: meta?.coverPhoto || ""
        };

  const updatedAt = typeof pageData.updatedAt === "string" ? pageData.updatedAt : "";
  const etag = `"${id}-${updatedAt}-pay-${String((pageData.details as any)?.paymentEnabled)}-${String((pageData.details as any)?.paymentAmountInr)}"`;
  res.set("ETag", etag);
  // Bio pages change often in the editor — avoid sticky browser caches hiding Pay UI.
  res.set("Cache-Control", "no-store");
  if (req.headers["if-none-match"] === etag) {
    res.status(304).end();
    return;
  }
  res.json({
    blocks: pageData.blocks,
    details,
    updatedAt
  });
});

app.post("/api/page/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { blocks, details } = req.body;
  const store = readStore();
  const userId = (req as any).authUser.id as string;
  const pages = Array.isArray(store["pages_list"]) ? store["pages_list"] : [];
  const page = pages.find((item: any) => item.id === id);
  if (!page || page.ownerUserId !== userId) {
    res.status(404).json({ error: "Page not found." });
    return;
  }
  await savePageDocument(
    id,
    Array.isArray(blocks) ? blocks : [],
    details && typeof details === "object" ? details : {}
  );
  res.json({ success: true });
});

app.delete("/api/page/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const store = readStore();
  const userId = (req as any).authUser.id as string;
  const pages = Array.isArray(store["pages_list"]) ? store["pages_list"] : [];
  const page = pages.find((item: any) => item.id === id);
  if (!page || (page.ownerUserId && page.ownerUserId !== userId && page.ownerUserId !== "local")) {
    res.status(404).json({ error: "Page not found" });
    return;
  }

  store["pages_list"] = pages.filter((item: any) => item.id !== id);
  if (id in store) {
    delete store[id];
  }
  writeStore(store);
  res.json({ success: true });
});

// User-Agent Parsing helper
function parseUserAgent(uaString: string | undefined) {
  if (!uaString) return { device: "Unknown", os: "Unknown", browser: "Unknown" };
  
  let device = "Desktop";
  if (/mobile|android|iphone|ipad|phone/i.test(uaString)) {
    if (/ipad|tablet/i.test(uaString)) {
      device = "Tablet";
    } else {
      device = "Mobile";
    }
  }

  let os = "Unknown";
  if (/windows/i.test(uaString)) os = "Windows";
  else if (/macintosh|mac os x/i.test(uaString)) os = "macOS";
  else if (/iphone|ipad|ipod/i.test(uaString)) os = "iOS";
  else if (/android/i.test(uaString)) os = "Android";
  else if (/linux/i.test(uaString)) os = "Linux";

  let browser = "Other";
  if (/chrome|crios/i.test(uaString) && !/edge|edg/i.test(uaString) && !/opr/i.test(uaString)) browser = "Chrome";
  else if (/safari/i.test(uaString) && !/chrome|crios/i.test(uaString)) browser = "Safari";
  else if (/firefox|fxios/i.test(uaString)) browser = "Firefox";
  else if (/edge|edg/i.test(uaString)) browser = "Edge";
  else if (/opera|opr/i.test(uaString)) browser = "Opera";

  return { device, os, browser };
}

// Track Event API
app.post("/api/track", (req, res) => {
  const ip = clientIp(req as any);
  if (!consumeRateLimit(`track:${ip}`, 120, 60_000)) {
    res.status(429).json({ error: "Too many tracking events.", code: "RATE_LIMITED" });
    return;
  }

  const { pageId, eventType, eventLabel, details } = req.body;
  const ua = req.headers["user-agent"];
  const parsedUA = parseUserAgent(ua);
  const domain = req.headers.host || "unknown-domain";
  // Log both the client connection port and the destination server port (e.g. 3000)
  const clientPort = req.socket.remotePort || "N/A";
  const portInfo = `Client: ${clientPort} → Host: ${PORT}`;

  const store = readStore();
  if (!store["tracking_events"]) {
    store["tracking_events"] = [];
  }

  const newEvent = {
    id: "evt_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    pageId: pageId || "unknown",
    eventType: eventType || "visit", // 'visit' | 'click' | 'register'
    eventLabel: eventLabel || "",
    device: parsedUA.device,
    os: parsedUA.os,
    browser: parsedUA.browser,
    domain,
    port: portInfo,
    details: details || {},
    timestamp: new Date().toISOString()
  };

  store["tracking_events"].unshift(newEvent);
  
  // Also increment counter metrics directly in our pages list if possible
  if (store["pages_list"] && Array.isArray(store["pages_list"])) {
    store["pages_list"] = store["pages_list"].map((p: any) => {
      if (p.id === pageId) {
        if (eventType === "visit") {
          return { ...p, views: (p.views || 0) + 1 };
        }
      }
      return p;
    });
  }

  writeStore(store);
  res.json({ success: true, event: newEvent });
});

/** Public lead capture from Bio Page Form / Smart Form blocks → Contacts */
app.post("/api/leads", async (req, res) => {
  try {
    const ip = clientIp(req as any);
    if (!consumeRateLimit(`lead:${ip}`, 60, 60_000)) {
      res.status(429).json({ error: "Too many submissions. Please wait a minute.", code: "RATE_LIMITED" });
      return;
    }

    const pageId = String(req.body?.pageId || "").trim();
    const fields =
      req.body?.fields && typeof req.body.fields === "object" && !Array.isArray(req.body.fields)
        ? (req.body.fields as Record<string, string>)
        : {};
    const source = String(req.body?.source || "BIO FORM").trim() || "BIO FORM";
    const pageTitle = typeof req.body?.pageTitle === "string" ? req.body.pageTitle.trim() : "";
    const blockId = typeof req.body?.blockId === "string" ? req.body.blockId.trim() : "";
    const blockLabel = typeof req.body?.blockLabel === "string" ? req.body.blockLabel.trim() : "";
    const sourceDomain =
      (typeof req.body?.sourceDomain === "string" && req.body.sourceDomain.trim()) ||
      (typeof req.body?.domain === "string" && req.body.domain.trim()) ||
      "";
    const templateIdBody =
      typeof req.body?.templateId === "string" ? req.body.templateId.trim() : "";
    const templateNameBody =
      typeof req.body?.templateName === "string" ? req.body.templateName.trim() : "";
    const pageSlugBody = typeof req.body?.pageSlug === "string" ? req.body.pageSlug.trim() : "";

    if (!pageId) {
      res.status(400).json({ error: "pageId is required" });
      return;
    }
    if (Object.keys(fields).length === 0) {
      res.status(400).json({ error: "fields are required" });
      return;
    }

    const store = readStore();
    const pages = Array.isArray(store["pages_list"]) ? store["pages_list"] : [];
    const page = pages.find((item: any) => item?.id === pageId);
    const pageDoc = store[pageId] as Record<string, unknown> | undefined;
    const pageDetails =
      pageDoc && pageDoc.details && typeof pageDoc.details === "object"
        ? (pageDoc.details as Record<string, unknown>)
        : {};
    const ownerUserId =
      (page && typeof page.ownerUserId === "string" && page.ownerUserId) ||
      (pageDoc && typeof pageDoc.ownerUserId === "string" && pageDoc.ownerUserId) ||
      (typeof req.body?.ownerUserId === "string" ? req.body.ownerUserId : "") ||
      "local";

    const templates = Array.isArray(store["bio_page_templates"]) ? store["bio_page_templates"] : [];
    const linkedTemplate =
      templates.find((tpl: any) => tpl?.id === templateIdBody) ||
      templates.find((tpl: any) => tpl?.id === pageDetails.templateId) ||
      templates.find((tpl: any) => tpl?.sourcePageId === pageId) ||
      null;

    const domains = Array.isArray(store["custom_domains"]) ? store["custom_domains"] : [];
    const linkedDomain = domains.find(
      (d: any) =>
        d?.pageId === pageId ||
        d?.linkedPageId === pageId ||
        (Array.isArray(d?.pageIds) && d.pageIds.includes(pageId))
    );
    const resolvedDomain =
      sourceDomain ||
      (linkedDomain && typeof linkedDomain.domainName === "string" && linkedDomain.domainName) ||
      (linkedDomain && typeof linkedDomain.hostname === "string" && linkedDomain.hostname) ||
      "";

    const resolvedTemplateId =
      templateIdBody ||
      (typeof pageDetails.templateId === "string" ? pageDetails.templateId : "") ||
      (linkedTemplate && typeof linkedTemplate.id === "string" ? linkedTemplate.id : "");
    const resolvedTemplateName =
      templateNameBody ||
      (typeof pageDetails.templateName === "string" ? pageDetails.templateName : "") ||
      (linkedTemplate && typeof linkedTemplate.name === "string" ? linkedTemplate.name : "");

    const existingContacts = Array.isArray(store["contacts"]) ? (store["contacts"] as any[]) : [];
    const emailHint = Object.values(fields).find((value) => String(value).includes("@"));
    const existing =
      emailHint
        ? existingContacts.find(
            (row) =>
              (!row.ownerUserId || row.ownerUserId === ownerUserId || row.ownerUserId === "local") &&
              String(row.email || "").toLowerCase() === String(emailHint).toLowerCase()
          )
        : null;

    const contact = buildLeadContact({
      fields,
      source,
      pageId,
      pageTitle: pageTitle || page?.title || "",
      blockId,
      blockLabel,
      ownerUserId,
      sourceDomain: resolvedDomain,
      templateId: resolvedTemplateId,
      templateName: resolvedTemplateName,
      pageSlug: pageSlugBody || page?.slug || "",
      existing: existing || null
    });

    store["contacts"] = upsertOwnerContact(existingContacts, contact);
    writeStore(store);

    if (!store["tracking_events"]) store["tracking_events"] = [];
    store["tracking_events"].unshift({
      id: "evt_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      pageId,
      eventType: "register",
      eventLabel: blockLabel ? `Form Lead: ${blockLabel}` : "Form Lead",
      details: { contactId: contact.id, email: contact.email, fields },
      timestamp: new Date().toISOString()
    });
    writeStore(store);

    res.json({ success: true, contact });
  } catch (error) {
    console.error("Lead capture failed:", error);
    res.status(500).json({ error: "Lead capture failed." });
  }
});

/** Authenticated contacts list for Contacts screen */
app.get("/api/contacts", requireAuth, (req, res) => {
  const userId = (req as any).authUser.id as string;
  const store = readStore();
  const contacts = (Array.isArray(store["contacts"]) ? store["contacts"] : []).filter(
    (row: any) => !row.ownerUserId || row.ownerUserId === userId || row.ownerUserId === "local"
  );
  res.json(contacts);
});

/** Authenticated create/update contact (dashboard) */
app.post("/api/contacts", requireAuth, (req, res) => {
  const userId = (req as any).authUser.id as string;
  const store = readStore();
  const existingContacts = Array.isArray(store["contacts"]) ? store["contacts"] : [];

  if (Array.isArray(req.body?.contacts)) {
    const incoming = (req.body.contacts as any[]).map((row) => ({
      ...row,
      ownerUserId: userId
    }));
    store["contacts"] = mergeContactLists(existingContacts, incoming, userId);
    writeStore(store);
    res.json({
      success: true,
      contacts: (store["contacts"] as any[]).filter(
        (row: any) => !row.ownerUserId || row.ownerUserId === userId || row.ownerUserId === "local"
      )
    });
    return;
  }

  const contactPayload = req.body?.contact || req.body;
  if (!contactPayload || typeof contactPayload !== "object") {
    res.status(400).json({ error: "contact is required" });
    return;
  }

  const fields =
    contactPayload.formFields && Array.isArray(contactPayload.formFields)
      ? Object.fromEntries(
          contactPayload.formFields.map((entry: any) => [entry.label, entry.value])
        )
      : {
          Name: contactPayload.name || "",
          Email: contactPayload.email || "",
          Phone: contactPayload.phone || "",
          Message: contactPayload.notes || ""
        };

  const contact = buildLeadContact({
    fields,
    source: contactPayload.source || "MANUAL ENTRY",
    pageId: contactPayload.pageId,
    pageTitle: contactPayload.pageTitle,
    blockId: contactPayload.blockId,
    blockLabel: contactPayload.blockLabel,
    ownerUserId: userId,
    existing: contactPayload.id
      ? existingContacts.find((row: any) => row.id === contactPayload.id) || {
          id: contactPayload.id
        }
      : null
  });

  if (contactPayload.tags) contact.tags = contactPayload.tags;
  if (contactPayload.name) contact.name = contactPayload.name;
  if (contactPayload.email) {
    contact.email = contactPayload.email;
    contact.maskedEmail = contact.email;
  }
  store["contacts"] = upsertOwnerContact(existingContacts, contact);
  writeStore(store);
  res.json({ success: true, contact });
});

app.delete("/api/contacts/:id", requireAuth, (req, res) => {
  const userId = (req as any).authUser.id as string;
  const store = readStore();
  const id = req.params.id;
  const contacts = Array.isArray(store["contacts"]) ? store["contacts"] : [];
  store["contacts"] = contacts.filter(
    (row: any) => !(row.id === id && (!row.ownerUserId || row.ownerUserId === userId || row.ownerUserId === "local"))
  );
  writeStore(store);
  res.json({ success: true });
});

// Bio page templates API (shared template library)
app.get("/api/templates", (req, res) => {
  const store = readStore();
  const templates = store["bio_page_templates"] || [];
  res.json(templates);
});

app.post("/api/templates", (req, res) => {
  const store = readStore();
  if (!store["bio_page_templates"]) {
    store["bio_page_templates"] = [];
  }

  if (req.body.template) {
    const template = req.body.template;
    const list = store["bio_page_templates"] as any[];
    const idx = list.findIndex((t: any) => t.id === template.id);
    if (idx >= 0) {
      list[idx] = { ...template, updatedAt: new Date().toISOString() };
    } else {
      list.unshift(template);
    }
  } else if (Array.isArray(req.body.templates)) {
    store["bio_page_templates"] = req.body.templates;
  }

  writeStore(store);
  res.json({ success: true, templates: store["bio_page_templates"] });
});

app.delete("/api/templates/:id", (req, res) => {
  const { id } = req.params;
  const store = readStore();
  if (store["bio_page_templates"] && Array.isArray(store["bio_page_templates"])) {
    store["bio_page_templates"] = store["bio_page_templates"].filter((t: any) => t.id !== id);
    writeStore(store);
  }
  res.json({ success: true });
});

// Bio page drafts — cross-device editor history
app.get("/api/drafts", requireAuth, (req, res) => {
  const userId = (req as any).authUser.id as string;
  const store = readStore();
  const drafts = mergeBioPageDrafts(store["bio_page_drafts"], [], userId).filter(
    (draft) => !draft.ownerUserId || draft.ownerUserId === userId
  );
  res.json(drafts);
});

app.post("/api/drafts", requireAuth, (req, res) => {
  const userId = (req as any).authUser.id as string;
  const store = readStore();

  if (req.body.draft) {
    const draft = { ...req.body.draft, ownerUserId: userId };
    store["bio_page_drafts"] = mergeBioPageDrafts(store["bio_page_drafts"], [draft], userId);
  } else if (Array.isArray(req.body.drafts)) {
    const stamped = req.body.drafts.map((draft: any) => ({ ...draft, ownerUserId: userId }));
    store["bio_page_drafts"] = mergeBioPageDrafts(store["bio_page_drafts"], stamped, userId);
  }

  writeStore(store);
  res.json({ success: true, drafts: store["bio_page_drafts"] });
});

// Analytics Retrieval API
app.get("/api/analytics", (req, res) => {
  const store = readStore();
  const events = store["tracking_events"] || [];
  
  // Calculate aggregate metrics
  const totalViews = events.filter((e: any) => e.eventType === "visit").length;
  const totalClicks = events.filter((e: any) => e.eventType === "click").length;
  const totalRegisters = events.filter((e: any) => e.eventType === "register").length;
  
  res.json({
    events,
    metrics: {
      totalViews,
      totalClicks,
      totalRegisters,
      totalPages: store["pages_list"]?.length || 0
    }
  });
});

function requestHostname(req: express.Request) {
  const pick = (value: unknown) =>
    String(value || "")
      .split(",")[0]
      .trim()
      .toLowerCase()
      .replace(/:\d+$/, "");

  return (
    pick(req.headers["key-customer-host"]) ||
    pick(req.headers["x-forwarded-host"]) ||
    pick(req.headers.host)
  );
}

function isPlatformHostname(hostname: string) {
  if (!hostname) return true;
  if (isPlatformSubdomainHostname(hostname)) return false;
  if (isPlatformApexHostname(hostname)) return true;

  const configured = [
    process.env.APP_URL,
    process.env.API_URL,
    process.env.RAILWAY_PUBLIC_DOMAIN
  ];
  return configured.some((value) => {
    if (!value) return false;
    try {
      const url = new URL(String(value).includes("://") ? String(value) : `https://${value}`);
      return url.hostname.toLowerCase() === hostname;
    } catch {
      return false;
    }
  });
}

function isStaticAssetPath(pathname: string) {
  return (
    pathname.startsWith("/assets/") ||
    pathname === "/favicon.ico" ||
    /\.(js|css|map|ico|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|txt|xml)$/i.test(pathname)
  );
}

/**
 * Customer hostnames reach Railway via Cloudflare for SaaS or a customer
 * Cloudflare Worker that sets X-Forwarded-Host. Redirect only the path so the
 * SPA renders the correct published page at the branded URL.
 */
app.use(async (req, res, next) => {
  if (
    req.path.startsWith("/api/") ||
    req.path.startsWith("/r/") ||
    req.path.startsWith("/l/") ||
    req.path.startsWith("/q/") ||
    req.method !== "GET"
  ) {
    next();
    return;
  }
  if (isStaticAssetPath(req.path)) {
    next();
    return;
  }
  const hostname = requestHostname(req);
  if (isPlatformHostname(hostname)) {
    next();
    return;
  }

  try {
    const platformSlug = parsePlatformSubdomainSlug(hostname);
    if (platformSlug) {
      const platformSub = await findPlatformSubdomainBySlug(platformSlug);
      if (!platformSub) {
        res
          .status(404)
          .type("html")
          .send(
            "<!doctype html><title>Address not found</title><h1>Address not found</h1><p>This free KEYLINK360 address is not active.</p>"
          );
        return;
      }
      res.cookie("keys_routed_page", platformSub.pageId, {
        maxAge: 60 * 60 * 1000,
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
      });
      next();
      return;
    }

    const domain = await findRoutableDomainByHostname(hostname);
    if (!domain) {
      res
        .status(404)
        .type("html")
        .send("<!doctype html><title>Domain not connected</title><h1>Domain not connected</h1><p>This hostname is not verified in KEYLINK360.</p>");
      return;
    }

    res.cookie("keys_routed_page", domain.pageId, {
      maxAge: 60 * 60 * 1000,
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    next();
  } catch (error) {
    console.error("Custom hostname routing failed:", error);
    res.status(503).send("Custom domain routing is temporarily unavailable.");
  }
});

// Ensure unhandled API routes return JSON 404 instead of HTML SPA fallback
app.all("/api/*", (_req, res) => {
  res.status(404).json({ error: "API endpoint not found.", code: "NOT_FOUND" });
});

// Vite middleware setup
function isProductionMode(): boolean {
  const lifecycle = process.env.npm_lifecycle_event;

  // npm run dev → always use Vite (live source)
  if (lifecycle === "dev") return false;
  // npm start / npm run preview → serve dist/
  if (lifecycle === "start" || lifecycle === "preview") return true;

  if (process.env.NODE_ENV === "development") return false;
  if (process.env.NODE_ENV === "production") return true;

  const entry = (process.argv[1] || "").replace(/\\/g, "/");
  if (entry.endsWith("/server.ts")) return false;
  return entry.endsWith("/server.cjs") || entry.endsWith("/dist/server.cjs");
}

async function startServer() {
  const isProd = isProductionMode();
  
  if (!isProd) {
    console.log("Starting server in DEVELOPMENT mode with Vite middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode, serving static files from dist/...");
    const distPath = path.join(process.cwd(), "dist");
    if (!fs.existsSync(path.join(distPath, "index.html"))) {
      console.error("ERROR: dist/index.html not found. Run `npm run build` first.");
      process.exit(1);
    }
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`[custom-domains] A record target: ${resolveCustomDomainATarget()}`);
    });
    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `\nPort ${PORT} is already in use. Stop the other server first:\n` +
            `  Windows: netstat -ano | findstr :${PORT}\n` +
            `  Then:    taskkill /PID <pid> /F\n`
        );
        process.exit(1);
      }
      throw err;
    });
  }

  // Init DB after bind so Railway healthchecks can pass during Supabase warmup.
  try {
    await initRootStore();
    console.log("Data store ready:", getDataStoreStatus());
    if (shouldRegisterCloudflareCustomHostnames()) {
      const origin = await ensurePlatformOriginHostRewrite();
      console.log(`[custom-domains] ${origin.message}`);
    }
    const wildcard = await ensurePlatformFreeUrlWildcardDns();
    console.log(`[platform-subdomains] ${wildcard.message}`);
    startSslPollingLoop();
  } catch (error) {
    console.error("Data store init failed (continuing with file fallback):", error);
  }
}

// Centralized Production Error Handler
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = typeof err?.status === "number" && err.status >= 400 && err.status < 600 ? err.status : 500;
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err?.message || err);
  
  if (res.headersSent) return;

  res.status(status).json({
    error: status === 500 && process.env.NODE_ENV === "production"
      ? "An unexpected error occurred. Please try again later."
      : (err?.message || "An unexpected error occurred."),
    code: err?.code || (status === 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR")
  });
});

function handleShutdown(signal: string) {
  console.log(`[server] Received ${signal}. Flushing data store and exiting gracefully...`);
  void flushRootStore().catch(() => {}).finally(() => {
    process.exit(0);
  });
}
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

startServer();

export default app;