import { Router, type Request, type Response } from "express";
import { requireMainOwner } from "../auth/routes";
import { readAuthStore, writeAuthStore, findUserById } from "../auth/store";
import { getRootStore, getDataStoreStatus } from "../db/rootStore";
import { isSupabaseConfigured } from "../db/supabase";
import { isCloudflareForSaasConfigured } from "../domains/cloudflare";
import { resolveCustomDomainATarget, resolveCnameTarget } from "../domains/hostname";
import { isRazorpayConfigured, getRazorpayKeyId } from "../payments/razorpayClient";
import { isSmtpConfigured } from "../auth/mail";
import type { UserStatus } from "../auth/crypto";
import {
  listAllSubscriptions,
  listAllBillingHistory,
  getUserSubscriptionSummary
} from "../billing/repository";

type AuthedAdminRequest = Request & {
  authUser?: { id: string; email: string; role: string; plan?: string };
};

export function createAdminRouter() {
  const router = Router();

  // Enforce Main Owner authorization across all admin routes
  router.use(requireMainOwner);

  /** Platform Overview & Aggregate KPIs */
  router.get("/overview", (_req: AuthedAdminRequest, res: Response) => {
    try {
      const store = getRootStore();
      const authStore = readAuthStore();

      const users = authStore.users || [];
      const totalUsers = users.length;
      const activeUsers = users.filter((u) => u.status === "active").length;
      const inactiveUsers = users.filter((u) => u.status === "inactive").length;
      const blockedUsers = users.filter((u) => u.status === "blocked").length;

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const newUsers7d = users.filter((u) => new Date(u.createdAt).getTime() >= sevenDaysAgo).length;

      const pages = (Array.isArray(store["pages_list"]) ? store["pages_list"] : []) as any[];
      const totalPages = pages.length;
      const livePages = pages.filter((p) => p.status === "Live").length;
      const draftPages = totalPages - livePages;
      const totalViews = pages.reduce((sum, p) => sum + (Number(p.views) || 0), 0);

      const domains = (Array.isArray(store["custom_domains"]) ? store["custom_domains"] : []) as any[];
      const totalDomains = domains.length;
      const connectedDomains = domains.filter((d) => d.status === "Verified" || d.status === "DNS Verified").length;

      const platformSubs = (Array.isArray(store["platform_subdomains"]) ? store["platform_subdomains"] : []) as any[];
      const totalPlatformSubdomains = platformSubs.length;

      const qrCodes = (Array.isArray(store["qr_codes"]) ? store["qr_codes"] : []) as any[];
      const totalQrCodes = qrCodes.length;
      const activeQrCodes = qrCodes.filter((q) => q.status === "Active").length;
      const totalQrScans = qrCodes.reduce((sum, q) => sum + (Number(String(q.scans || "0").replace(/,/g, "")) || 0), 0);

      const shortLinks = (Array.isArray(store["short_links"]) ? store["short_links"] : []) as any[];
      const totalShortLinks = shortLinks.length;
      const totalShortClicks = shortLinks.reduce((sum, l) => sum + (Number(l.totalClicks) || 0), 0);

      const rotators = (Array.isArray(store["link_rotators"]) ? store["link_rotators"] : []) as any[];
      const totalRotators = rotators.length;
      const activeRotators = rotators.filter((r) => r.status === "Active").length;

      const contacts = (Array.isArray(store["contacts"]) ? store["contacts"] : []) as any[];
      const totalContacts = contacts.length;

      const events = (Array.isArray(store["tracking_events"]) ? store["tracking_events"] : []) as any[];
      const totalEvents = events.length;
      const visitEvents = events.filter((e) => e.eventType === "visit").length;
      const clickEvents = events.filter((e) => e.eventType === "click").length;
      const registerEvents = events.filter((e) => e.eventType === "register").length;
      const purchaseEvents = events.filter((e) => e.eventType === "purchase").length;

      const payments = (Array.isArray(store["payments_log"]) ? store["payments_log"] : []) as any[];
      const totalPaymentOrders = payments.length;
      const paidOrders = payments.filter((p) => p.status === "paid").length;
      const totalRevenueInr = payments
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + (Number(p.amountInr) || 0), 0);

      const allSubs = listAllSubscriptions();
      const allBilling = listAllBillingHistory();
      const totalProUsers = users.filter((u) => u.plan && u.plan.toLowerCase().includes("pro")).length;
      const totalFreeUsers = totalUsers - totalProUsers;
      const activeSubsCount = allSubs.filter((s) => s.status === "ACTIVE").length;
      const subscriptionRevenueInr = allBilling
        .filter((b) => b.status === "paid")
        .reduce((sum, b) => sum + (Number(b.amountInr) || 0), 0);

      res.json({
        metrics: {
          users: { total: totalUsers, active: activeUsers, inactive: inactiveUsers, blocked: blockedUsers, new7d: newUsers7d },
          subscriptions: {
            totalFree: totalFreeUsers,
            totalPro: totalProUsers,
            activeSubscriptions: activeSubsCount,
            revenueInr: subscriptionRevenueInr
          },
          pages: { total: totalPages, live: livePages, draft: draftPages, totalViews },
          domains: { total: totalDomains, connected: connectedDomains, platformSubdomains: totalPlatformSubdomains },
          qrCodes: { total: totalQrCodes, active: activeQrCodes, totalScans: totalQrScans },
          shortLinks: { total: totalShortLinks, totalClicks: totalShortClicks },
          rotators: { total: totalRotators, active: activeRotators },
          leads: { totalContacts },
          events: { total: totalEvents, visits: visitEvents, clicks: clickEvents, registrations: registerEvents, purchases: purchaseEvents },
          payments: { totalOrders: totalPaymentOrders, paidOrders, totalRevenueInr }
        },
        healthStatus: getDataStoreStatus()
      });
    } catch (error) {
      console.error("Admin overview failed:", error);
      res.status(500).json({ error: "Failed to generate platform overview." });
    }
  });

  /** Sub Owners Directory with aggregate usage stats */
  router.get("/users", (req: AuthedAdminRequest, res: Response) => {
    try {
      const store = getRootStore();
      const authStore = readAuthStore();
      const search = String(req.query.search || "").trim().toLowerCase();
      const statusFilter = String(req.query.status || "all").trim().toLowerCase();
      const planFilter = String(req.query.plan || "all").trim();

      const pages = (Array.isArray(store["pages_list"]) ? store["pages_list"] : []) as any[];
      const qrCodes = (Array.isArray(store["qr_codes"]) ? store["qr_codes"] : []) as any[];
      const shortLinks = (Array.isArray(store["short_links"]) ? store["short_links"] : []) as any[];
      const rotators = (Array.isArray(store["link_rotators"]) ? store["link_rotators"] : []) as any[];
      const contacts = (Array.isArray(store["contacts"]) ? store["contacts"] : []) as any[];
      const domains = (Array.isArray(store["custom_domains"]) ? store["custom_domains"] : []) as any[];

      let list = (authStore.users || []).map((user) => {
        const uId = user.id;
        const userPages = pages.filter((p) => p.ownerUserId === uId);
        const userQr = qrCodes.filter((q) => q.ownerUserId === uId);
        const userLinks = shortLinks.filter((l) => l.ownerUserId === uId);
        const userRotators = rotators.filter((r) => r.ownerUserId === uId);
        const userContacts = contacts.filter((c) => c.ownerUserId === uId);
        const userDomains = domains.filter((d) => d.ownerUserId === uId);

        return {
          id: user.id,
          email: user.email,
          role: user.role || (user.id === "user_demo_keylink360" ? "MAIN_OWNER" : "SUB_OWNER"),
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.companyName || "Sub Owner",
          firstName: user.firstName,
          lastName: user.lastName,
          companyName: user.companyName,
          businessName: user.businessName,
          phone: user.phone,
          country: user.country,
          avatarUrl: user.avatarUrl,
          plan: user.plan,
          status: user.status,
          isVerified: user.isVerified,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          stats: {
            pagesCount: userPages.length,
            livePagesCount: userPages.filter((p) => p.status === "Live").length,
            qrCount: userQr.length,
            shortLinksCount: userLinks.length,
            rotatorsCount: userRotators.length,
            contactsCount: userContacts.length,
            domainsCount: userDomains.length
          }
        };
      });

      if (search) {
        list = list.filter(
          (u) =>
            u.email.toLowerCase().includes(search) ||
            u.name.toLowerCase().includes(search) ||
            u.companyName.toLowerCase().includes(search) ||
            u.businessName.toLowerCase().includes(search)
        );
      }

      if (statusFilter !== "all") {
        list = list.filter((u) => u.status === statusFilter);
      }

      if (planFilter !== "all") {
        list = list.filter((u) => u.plan.toLowerCase() === planFilter.toLowerCase());
      }

      res.json({
        total: list.length,
        users: list
      });
    } catch (error) {
      console.error("Admin list users failed:", error);
      res.status(500).json({ error: "Failed to list Sub Owners." });
    }
  });

  /** Deep inspection for a specific Sub Owner */
  router.get("/users/:id", (req: AuthedAdminRequest, res: Response) => {
    try {
      const { id } = req.params;
      const store = getRootStore();
      const authStore = readAuthStore();
      const user = findUserById(authStore, id);

      if (!user) {
        res.status(404).json({ error: "Sub Owner not found." });
        return;
      }

      const pages = ((Array.isArray(store["pages_list"]) ? store["pages_list"] : []) as any[]).filter(
        (p) => p.ownerUserId === id
      );
      const qrCodes = ((Array.isArray(store["qr_codes"]) ? store["qr_codes"] : []) as any[]).filter(
        (q) => q.ownerUserId === id
      );
      const shortLinks = ((Array.isArray(store["short_links"]) ? store["short_links"] : []) as any[]).filter(
        (l) => l.ownerUserId === id
      );
      const rotators = ((Array.isArray(store["link_rotators"]) ? store["link_rotators"] : []) as any[]).filter(
        (r) => r.ownerUserId === id
      );
      const domains = ((Array.isArray(store["custom_domains"]) ? store["custom_domains"] : []) as any[]).filter(
        (d) => d.ownerUserId === id
      );
      const contacts = ((Array.isArray(store["contacts"]) ? store["contacts"] : []) as any[]).filter(
        (c) => c.ownerUserId === id
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role || (user.id === "user_demo_keylink360" ? "MAIN_OWNER" : "SUB_OWNER"),
          name: `${user.firstName} ${user.lastName}`.trim(),
          firstName: user.firstName,
          lastName: user.lastName,
          companyName: user.companyName,
          businessName: user.businessName,
          phone: user.phone,
          country: user.country,
          avatarUrl: user.avatarUrl,
          plan: user.plan,
          status: user.status,
          isVerified: user.isVerified,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        },
        pages: pages.map((p) => ({ id: p.id, title: p.title, slug: p.slug, status: p.status, views: p.views, createdAt: p.createdAt })),
        qrCodes: qrCodes.map((q) => ({ id: q.id, name: q.name, publicCode: q.publicCode, targetUrl: q.targetUrl, scans: q.scans, status: q.status })),
        shortLinks: shortLinks.map((l) => ({ id: l.id, title: l.title, slug: l.slug, destinationUrl: l.destinationUrl, clicks: l.totalClicks, status: l.status })),
        rotators: rotators.map((r) => ({ id: r.id, name: r.name, slug: r.slug, destinationsCount: r.destinations?.length || 0, status: r.status })),
        domains: domains.map((d) => ({ id: d.id, domainName: d.domainName, pageId: d.pageId, status: d.status, type: d.type })),
        contactsCount: contacts.length,
        subscription: getUserSubscriptionSummary(id)
      });
    } catch (error) {
      console.error("Admin user detail failed:", error);
      res.status(500).json({ error: "Failed to inspect Sub Owner." });
    }
  });

  /** Update Sub Owner Account Status (Active, Inactive, Blocked) */
  router.patch("/users/:id/status", (req: AuthedAdminRequest, res: Response) => {
    try {
      const { id } = req.params;
      const targetStatus = String(req.body?.status || "").trim().toLowerCase() as UserStatus;

      if (!["active", "inactive", "blocked"].includes(targetStatus)) {
        res.status(400).json({ error: "Invalid status. Allowed: active, inactive, blocked." });
        return;
      }

      if (id === req.authUser?.id) {
        res.status(400).json({ error: "Main Owner cannot suspend or modify own account status." });
        return;
      }

      const authStore = readAuthStore();
      const user = findUserById(authStore, id);

      if (!user) {
        res.status(404).json({ error: "Sub Owner not found." });
        return;
      }

      user.status = targetStatus;
      user.updatedAt = new Date().toISOString();

      if (targetStatus === "blocked" || targetStatus === "inactive") {
        // Revoke active sessions immediately
        authStore.sessions = authStore.sessions.map((s) => (s.userId === id ? { ...s, revokedAt: new Date().toISOString() } : s));
      }

      writeAuthStore(authStore);

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          status: user.status,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      console.error("Admin user status update failed:", error);
      res.status(500).json({ error: "Failed to update Sub Owner status." });
    }
  });

  /** Platform-wide aggregate analytics */
  router.get("/analytics", (_req: AuthedAdminRequest, res: Response) => {
    try {
      const store = getRootStore();
      const events = (Array.isArray(store["tracking_events"]) ? store["tracking_events"] : []) as any[];

      const deviceMap: Record<string, number> = {};
      const browserMap: Record<string, number> = {};
      const osMap: Record<string, number> = {};
      const pageVisitsMap: Record<string, number> = {};

      for (const event of events) {
        if (event.device) {
          deviceMap[event.device] = (deviceMap[event.device] || 0) + 1;
        }
        if (event.browser) {
          browserMap[event.browser] = (browserMap[event.browser] || 0) + 1;
        }
        if (event.os) {
          osMap[event.os] = (osMap[event.os] || 0) + 1;
        }
        if (event.eventType === "visit" && event.pageId) {
          pageVisitsMap[event.pageId] = (pageVisitsMap[event.pageId] || 0) + 1;
        }
      }

      const pages = (Array.isArray(store["pages_list"]) ? store["pages_list"] : []) as any[];
      const topPages = Object.entries(pageVisitsMap)
        .map(([pId, count]) => {
          const page = pages.find((p) => p.id === pId);
          return {
            pageId: pId,
            title: page?.title || pId,
            slug: page?.slug || "",
            ownerUserId: page?.ownerUserId || "unknown",
            visits: count
          };
        })
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 10);

      res.json({
        totalEvents: events.length,
        devices: deviceMap,
        browsers: browserMap,
        os: osMap,
        topPages,
        recentEvents: events.slice(0, 50).map((e) => ({
          id: e.id,
          pageId: e.pageId,
          eventType: e.eventType,
          eventLabel: e.eventLabel,
          device: e.device,
          os: e.os,
          browser: e.browser,
          timestamp: e.timestamp
        }))
      });
    } catch (error) {
      console.error("Admin analytics failed:", error);
      res.status(500).json({ error: "Failed to generate platform analytics." });
    }
  });

  /** Platform System Health & Safe Config Status (Zero Secrets Leaked) */
  router.get("/health", (_req: AuthedAdminRequest, res: Response) => {
    try {
      const memoryUsage = process.memoryUsage();
      const dataStore = getDataStoreStatus();

      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        server: {
          nodeVersion: process.version,
          platform: process.platform,
          uptimeSec: Math.floor(process.uptime()),
          memory: {
            rssMb: Math.round(memoryUsage.rss / (1024 * 1024)),
            heapUsedMb: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
            heapTotalMb: Math.round(memoryUsage.heapTotal / (1024 * 1024))
          }
        },
        services: {
          database: {
            backend: dataStore.backend,
            supabaseConfigured: isSupabaseConfigured(),
            supabaseCooldownUntil: dataStore.supabaseCooldownUntil,
            status: dataStore.backend === "supabase" ? "CONNECTED (SUPABASE)" : "ACTIVE (LOCAL FILE FALLBACK)"
          },
          cloudflareSaas: {
            configured: isCloudflareForSaasConfigured(),
            aRecordTarget: resolveCustomDomainATarget(),
            cnameTarget: resolveCnameTarget(),
            status: isCloudflareForSaasConfigured() ? "CONFIGURED" : "MANUAL DNS MODE"
          },
          razorpay: {
            configured: isRazorpayConfigured(),
            keyId: getRazorpayKeyId() || null,
            status: isRazorpayConfigured() ? "CONFIGURED (TEST/LIVE)" : "NOT CONFIGURED"
          },
          smtp: {
            configured: isSmtpConfigured(),
            status: isSmtpConfigured() ? "SMTP CONNECTED" : "CONSOLE SIMULATION"
          }
        }
      });
    } catch (error) {
      console.error("Admin health failed:", error);
      res.status(500).json({ error: "Failed to fetch platform health." });
    }
  });

  return router;
}
