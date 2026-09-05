import { Router, type Request, type Response } from "express";
import { randomBytes } from "node:crypto";
import { requireAuth } from "../auth/routes";
import { findUserById, readAuthStore, writeAuthStore } from "../auth/store";
import { publicUser } from "../auth/crypto";
import { getRootStore } from "../db/rootStore";
import {
  deleteCustomHostnamesForDomain,
  getCustomHostname,
  isCloudflareForSaasConfigured,
  registerCustomHostname,
  registerRootDomainHostnames,
  shouldRegisterCloudflareCustomHostnames,
  type ProviderHostname
} from "./cloudflare";
import { resolveDomainLifecycleStatus } from "./domainLifecycle";
import { provisionCloudflareDnsRecords } from "./cloudflareDns";
import {
  detectDnsProvider,
  domainServesKeyBio,
  verifyDomainDns,
  verifyHostnameReachability,
  type DnsProviderDetection
} from "./dns";
import { buildDnsRecordSet } from "./dnsRecords";
import {
  assertSupportedCustomDomain,
  getCustomDomainKind,
  getDnsZoneDomain,
  getSubdomainHostLabel,
  normalizeHostname,
  resolveCnameTarget,
  resolveCustomDomainATarget,
  resolvePlatformHostname,
  sanitizeARecordTarget
} from "./hostname";
import { beginCloudflareAutoSetup } from "./providers/cloudflareAuto";
import {
  cloudflareProvider,
  deprovisionCustomerCloudflareDns
} from "./providers/cloudflareProvider";
import {
  disconnectDnsProviderConnection,
  getDnsProviderConnection,
  listDnsProviderConnections,
  upsertDnsProviderConnection
} from "./providers/connections";
import {
  createCloudflareOAuthAuthorizeUrl,
  exchangeCloudflareOAuthCode,
  isCloudflareOAuthConfigured,
  oauthReturnAppUrl,
  takeOAuthStateAsync
} from "./providers/cloudflareOAuth";
import { resolveCustomerDnsTokens } from "./cloudflare/CloudflareTokenService";
import { fetchCloudflareAccountId } from "./cloudflare/CloudflareZoneService";
import {
  getDnsProvider,
  listDnsProviderCapabilities,
  normalizeDnsProviderId
} from "./providers/registry";
import {
  createDomain,
  findDomainById,
  findDomainByHostname,
  findDomainByPageId,
  listDomains,
  removeDomain,
  updateDomain,
  appendDomainVerificationLog,
  type CustomDomainRecord,
  type DomainStatus
} from "./repository";
import { checkResourceQuota } from "../billing/quotaGuard";

type AuthedRequest = Request & {
  authUser?: { id: string; email: string; plan?: string };
};

function domainId() {
  return `domain_${Date.now()}_${randomBytes(5).toString("hex")}`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function pageBelongsToUser(pageId: string, userId: string) {
  const store = getRootStore();
  const pages = store.pages_list;
  if (Array.isArray(pages)) {
    const page = pages.find((p) => p && typeof p === "object" && p.id === pageId);
    if (page) {
      return page.ownerUserId === userId;
    }
  }
  const doc = store[pageId] as Record<string, unknown> | undefined;
  if (doc && typeof doc === "object") {
    return doc.ownerUserId === userId;
  }
  return false;
}

const DNS_PROVIDER_CACHE_MS = 5 * 60 * 1000;
const dnsProviderCache = new Map<string, { at: number; value: DnsProviderDetection }>();

async function getDnsProviderForDomain(domainName: string): Promise<DnsProviderDetection> {
  const zone = getDnsZoneDomain(normalizeHostname(domainName));
  const cached = dnsProviderCache.get(zone);
  if (cached && Date.now() - cached.at < DNS_PROVIDER_CACHE_MS) {
    return cached.value;
  }
  const value = await detectDnsProvider(domainName);
  dnsProviderCache.set(zone, { at: Date.now(), value });
  return value;
}

function providerDnsLabel(detection: DnsProviderDetection): string {
  if (detection.providerId !== "unknown" && detection.providerName !== "DNS Provider") {
    return detection.providerName;
  }
  return "your DNS provider";
}

function proxySuffix(providerId: string): string {
  return providerId === "cloudflare" ? " (Proxied orange cloud)" : "";
}

async function buildSetupHint(
  record: CustomDomainRecord,
  saasConfigured: boolean,
  options?: { detectProvider?: boolean }
): Promise<{ hint: string | null; dnsProviderName: string | null; dnsProviderId: string | null }> {
  const detectProvider = options?.detectProvider !== false;
  if (record.status === "Verified") {
    return {
      hint: "Your domain is live with HTTPS. Share this address with visitors.",
      dnsProviderName: null,
      dnsProviderId: null
    };
  }
  if (record.status === "Provisioning SSL") {
    return {
      hint: saasConfigured
        ? "DNS is correct. SSL certificate is being issued — this usually takes a few minutes."
        : "DNS is correct. Waiting for SSL to finish provisioning.",
      dnsProviderName: null,
      dnsProviderId: null
    };
  }
  if (record.status === "DNS Verified") {
    const kind = getCustomDomainKind(record.domainName);
    if (kind === "subdomain") {
      return {
        hint: saasConfigured
          ? `DNS CNAME is correct. SSL is still finishing — click Test Connection. When status is Verified, ${record.domainName} will open your bio page.`
          : `DNS CNAME looks correct. Click Test Connection — when ${record.domainName} reaches KEYLINK360, status becomes Verified.`,
        dnsProviderName: null,
        dnsProviderId: null
      };
    }
    return {
      hint: saasConfigured
        ? "DNS is verified. SSL is still provisioning — click Test Connection in a minute."
        : "DNS is verified. Click Test Connection — when your domain reaches KEYLINK360, status becomes Verified.",
      dnsProviderName: null,
      dnsProviderId: null
    };
  }
  if (record.status === "Pending DNS") {
    const kind = getCustomDomainKind(record.domainName);
    const aTarget = resolveCustomDomainATarget();
    const cnameTarget = resolveCnameTarget();

    let detected: DnsProviderDetection = {
      domainName: record.domainName,
      providerId: "unknown",
      providerName: "DNS Provider",
      nameservers: []
    };
    if (record.dnsProviderId) {
      const capability = getDnsProvider(record.dnsProviderId).capability;
      detected = {
        domainName: record.domainName,
        providerId: capability.id,
        providerName: capability.name,
        nameservers: []
      };
    } else if (detectProvider) {
      detected = await getDnsProviderForDomain(record.domainName);
    }

    const label = providerDnsLabel(detected);

    if (kind === "root") {
      return {
        hint:
          `At ${label}: add A record · Name @ → ${aTarget}${proxySuffix(detected.providerId)}. ` +
          "Root domains use A records only. Then click Test Connection.",
        dnsProviderName: detected.providerName !== "DNS Provider" ? detected.providerName : null,
        dnsProviderId: detected.providerId !== "unknown" ? detected.providerId : null
      };
    }

    const hostLabel = getSubdomainHostLabel(record.domainName);
    return {
      hint:
        `At ${label}: add CNAME · Name ${hostLabel} → ${cnameTarget}${proxySuffix(detected.providerId)}. ` +
        "Subdomains use CNAME only — do not add an A record. Then click Test Connection.",
      dnsProviderName: detected.providerName !== "DNS Provider" ? detected.providerName : null,
      dnsProviderId: detected.providerId !== "unknown" ? detected.providerId : null
    };
  }
  return { hint: record.errorMessage, dnsProviderName: null, dnsProviderId: null };
}

function isWrongSubdomainARecordMessage(message: string, hostLabel: string): boolean {
  if (/do not use an a record/i.test(message)) return false;
  if (/subdomains use cname only/i.test(message)) return false;
  if (/dns cname points/i.test(message)) return false;
  if (/dns cname configured/i.test(message)) return false;
  if (new RegExp(`Host ${hostLabel} → \\d+\\.\\d+\\.\\d+\\.\\d+`, "i").test(message)) return true;
  if (/Add an A record/i.test(message)) return true;
  if (/ to A →/i.test(message)) return true;
  return false;
}

function sanitizeStoredErrorMessage(domainName: string, message: string | null): string | null {
  if (!message) return null;
  const kind = getCustomDomainKind(domainName);
  if (kind === "subdomain") {
    const hostLabel = getSubdomainHostLabel(domainName);
    const cnameTarget = resolveCnameTarget();
    if (isWrongSubdomainARecordMessage(message, hostLabel)) {
      return (
        `Subdomains use CNAME only: Host ${hostLabel} → ${cnameTarget}. ` +
        "Remove any A record for this host."
      );
    }
  }
  if (kind === "root" && /cname.*www/i.test(message)) {
    const aTarget = resolveCustomDomainATarget();
    return `Root domains use A record only: Host @ → ${aTarget}. Connect www.yourdomain.com separately as a subdomain if needed.`;
  }
  return message;
}

async function publicDomain(
  record: CustomDomainRecord,
  options?: { detectProvider?: boolean }
) {
  const saasConfigured = isCloudflareForSaasConfigured();
  const kind = getCustomDomainKind(record.domainName);
  const isSubdomain = kind === "subdomain";
  const { hint, dnsProviderName, dnsProviderId } = await buildSetupHint(record, saasConfigured, {
    detectProvider: options?.detectProvider
  });

  return {
    id: record.id,
    pageId: record.pageId,
    domainName: record.domainName,
    type: isSubdomain ? "CNAME" : "A",
    dnsTarget: record.dnsTarget,
    dnsHostLabel: isSubdomain ? getSubdomainHostLabel(record.domainName) : "@",
    status: record.status,
    dnsVerifiedAt: record.dnsVerifiedAt,
    provider: record.provider,
    providerStatus: record.providerStatus,
    sslStatus: record.sslStatus,
    ownershipVerification: record.ownershipVerification,
    lastCheckedAt: record.lastCheckedAt,
    errorMessage:
      record.status === "Pending DNS"
        ? null
        : sanitizeStoredErrorMessage(record.domainName, record.errorMessage),
    setupHint: hint,
    dnsProviderName: record.dnsProviderId
      ? getDnsProvider(record.dnsProviderId).capability.name
      : dnsProviderName,
    dnsProviderId: record.dnsProviderId || dnsProviderId,
    providerConnected: record.providerConnected,
    providerAccountId: record.providerAccountId,
    dnsLastVerified: record.dnsLastVerified || record.dnsVerifiedAt,
    selfServeEnabled: saasConfigured,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function providerPatch(provider: ProviderHostname) {
  return {
    provider: "cloudflare" as const,
    provider_hostname_id: provider.id,
    provider_status: provider.status,
    ssl_status: provider.sslStatus,
    ownership_verification:
      provider.ownershipVerification || provider.ownershipVerificationHttp || null,
    error_message: null
  };
}

async function resolveCloudflareProviderState(record: CustomDomainRecord): Promise<{
  provider?: ProviderHostname;
  providerError?: string;
  /** SaaS hostname removed because registration mode is off (Worker / live-check path). */
  clearedSaasHostname?: boolean;
}> {
  if (!isCloudflareForSaasConfigured()) return {};

  // Worker + Railway path: never create SaaS hostnames; remove leftovers that break Host routing.
  if (!shouldRegisterCloudflareCustomHostnames()) {
    if (record.providerHostnameId || record.provider === "cloudflare") {
      try {
        await deleteCustomHostnamesForDomain(record.domainName, record.providerHostnameId);
      } catch (error) {
        console.warn(
          `[domains] Could not clear SaaS hostname for ${record.domainName}:`,
          errorMessage(error)
        );
      }
      return { clearedSaasHostname: true };
    }
    return {};
  }

  try {
    if (record.providerHostnameId) {
      return { provider: await getCustomHostname(record.providerHostnameId) };
    }
    return { provider: await registerCustomHostname(record.domainName) };
  } catch (error) {
    return { providerError: errorMessage(error) };
  }
}

function clearSaasProviderPatch() {
  return {
    provider: "manual" as const,
    provider_hostname_id: null,
    provider_status: "worker_edge",
    ssl_status: "edge",
    ownership_verification: null,
    error_message: null
  };
}

/** Live only when the hostname actually serves KEY (/api/health). SaaS "active" alone is not enough on Railway. */
function connectionReachable(_domainName: string, servesKey: boolean, _provider?: ProviderHostname): boolean {
  return servesKey;
}

async function resolveFinalStatus(
  dnsVerified: boolean,
  domainName: string,
  provider?: ProviderHostname
): Promise<DomainStatus> {
  return resolveDomainLifecycleStatus({ dnsVerified, domainName, provider });
}

export type DomainConnectionTest = {
  dnsVerified: boolean;
  dnsMessage: string;
  servesKey: boolean;
  sslAutomatic: boolean;
  connectionState: "live" | "connecting" | "offline";
  summary: string;
  nextStep: string | null;
};

async function runConnectionTest(
  domainName: string,
  provider?: ProviderHostname
): Promise<DomainConnectionTest & { checkedAt: string }> {
  const dns = await verifyDomainDns(domainName);
  const registerSaas = shouldRegisterCloudflareCustomHostnames();
  const sslAutomatic = true;
  const kind = getCustomDomainKind(domainName);
  const checkedAt = dns.checkedAt;

  let dnsVerified = dns.verified;
  if (!dnsVerified) {
    dnsVerified = await verifyHostnameReachability(domainName);
  }

  const servesKey = await domainServesKeyBio(domainName);
  const live = connectionReachable(domainName, servesKey, provider);

  const dnsMessage = dnsVerified
    ? kind === "subdomain"
      ? "DNS CNAME points to KEYLINK360."
      : "DNS A record points to KEYLINK360."
    : dns.message;

  if (dnsVerified && live) {
    return {
      checkedAt,
      dnsVerified: true,
      dnsMessage,
      servesKey: true,
      sslAutomatic,
      connectionState: "live",
      summary: `${domainName} is connected and serving KEYLINK360.`,
      nextStep: null
    };
  }

  if (dnsVerified) {
    return {
      checkedAt,
      dnsVerified: true,
      dnsMessage,
      servesKey: false,
      sslAutomatic,
      connectionState: "connecting",
      summary: registerSaas
        ? "DNS is correct. Cloudflare is provisioning SSL and routing — usually 2–15 minutes."
        : "DNS is correct, but this hostname is not reaching KEYLINK360 yet.",
      nextStep:
        kind === "subdomain"
          ? registerSaas
            ? "Wait a few minutes, then click Test Connection / Retry. Ensure CNAME is Proxied (or DNS-only is fine for SaaS)."
            : `Confirm CNAME ${getSubdomainHostLabel(domainName)} → ${resolveCnameTarget()} is set, then Test Connection again.`
          : "Root domain needs A record @ → platform IP. Open Show DNS, then Test Connection again."
    };
  }

  return {
    checkedAt,
    dnsVerified: false,
    dnsMessage: dns.message,
    servesKey: false,
    sslAutomatic,
    connectionState: "offline",
    summary: "DNS not detected yet.",
    nextStep:
      kind === "subdomain"
        ? `Confirm CNAME ${getSubdomainHostLabel(domainName)} → ${resolveCnameTarget()} at Cloudflare (Proxied is OK), then Test Connection again.`
        : "Add the DNS records shown under Show DNS, wait 5–15 minutes, then Test Connection."
  };
}

export function createDomainsRouter() {
  const router = Router();

  router.get("/config", (_req, res: Response) => {
    const saasConfigured = isCloudflareForSaasConfigured();
    const registerSaasHostnames = shouldRegisterCloudflareCustomHostnames();
    const aRecordTarget = sanitizeARecordTarget(resolveCustomDomainATarget());
    const platformUrl = resolvePlatformHostname();
    const cnameTarget = resolveCnameTarget();
    const sslAutomatic = registerSaasHostnames || saasConfigured;
    res.json({
      provider: registerSaasHostnames ? "cloudflare" : "manual",
      platformUrl,
      aRecordTarget,
      cnameTarget,
      selfServeEnabled: true,
      sslAutomatic,
      cloudflareEnvConfigured: saasConfigured,
      registerCloudflareCustomHostnames: registerSaasHostnames,
      customHostnameEnabled: registerSaasHostnames,
      autoDnsViaCloudflare: true,
      cloudflareOAuthEnabled: isCloudflareOAuthConfigured(),
      dnsProviders: listDnsProviderCapabilities().map((provider) =>
        provider.id === "cloudflare"
          ? { ...provider, supportsOAuth: isCloudflareOAuthConfigured() }
          : provider
      ),
      registrars: listDnsProviderCapabilities().map((provider) => ({
        id: provider.id,
        name: provider.name,
        dnsHelpUrl: provider.helpUrl
      })),
      steps: [
        "Enter your domain and choose which bio page should open.",
        "Tell us where your domain is managed (Cloudflare, GoDaddy, …).",
        "Connect for automatic DNS, or follow simple copy steps.",
        "We verify until your address is LIVE with HTTPS."
      ]
    });
  });

  router.get("/analyze", async (req, res: Response) => {
    const domainName = normalizeHostname(req.query.domainName);
    const validationError = assertSupportedCustomDomain(domainName);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }
    try {
      const analysis = await detectDnsProvider(domainName);
      res.json({ analysis: { ...analysis, domainName } });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "DOMAIN_ANALYZE_FAILED" });
    }
  });

  /** Cloudflare OAuth callback — public; validated via one-time state (DB + memory). */
  router.get("/providers/cloudflare/oauth/callback", async (req, res: Response) => {
    const code = String(req.query.code || "").trim();
    const state = String(req.query.state || "").trim();
    const oauthError = String(req.query.error_description || req.query.error || "").trim();
    const pending = state ? await takeOAuthStateAsync(state) : null;

    if (!pending) {
      res.redirect(
        oauthReturnAppUrl({
          domainName: "",
          pageId: "",
          ok: false,
          error: "Cloudflare connection expired. Please try Connect Cloudflare again."
        })
      );
      return;
    }

    if (oauthError || !code) {
      res.redirect(
        oauthReturnAppUrl({
          domainName: pending.domainName,
          pageId: pending.pageId,
          ok: false,
          error: oauthError || "Cloudflare authorization was cancelled."
        })
      );
      return;
    }

    try {
      const tokens = await exchangeCloudflareOAuthCode({
        code,
        codeVerifier: pending.codeVerifier
      });
      const accountId = await fetchCloudflareAccountId(tokens.accessToken);
      await upsertDnsProviderConnection({
        ownerUserId: pending.userId,
        providerId: "cloudflare",
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || null,
        tokenExpiresAt: tokens.expiresIn
          ? new Date(Date.now() + tokens.expiresIn * 1000).toISOString()
          : null,
        providerAccountId: accountId,
        connected: true,
        metadata: { provider_name: "cloudflare", source: "oauth" }
      });
      const store = readAuthStore();
      const user = findUserById(store, pending.userId);
      if (user) {
        user.preferredDnsProvider = "cloudflare";
        user.updatedAt = new Date().toISOString();
        writeAuthStore(store);
      }
      res.redirect(
        oauthReturnAppUrl({
          domainName: pending.domainName,
          pageId: pending.pageId,
          ok: true
        })
      );
    } catch (error) {
      res.redirect(
        oauthReturnAppUrl({
          domainName: pending.domainName,
          pageId: pending.pageId,
          ok: false,
          error: errorMessage(error)
        })
      );
    }
  });

  router.use(requireAuth);
  // Domain mutations require an explicit bearer token. This prevents a
  // third-party site from using cross-site cookies to add/delete hostnames.
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

  router.post("/check-dns", async (req: AuthedRequest, res: Response) => {
    const domainName = normalizeHostname(req.body?.domainName);
    const validationError = assertSupportedCustomDomain(domainName);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }
    try {
      const dns = await verifyDomainDns(domainName);
      res.json({ dns });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "DOMAIN_DNS_CHECK_FAILED" });
    }
  });

  router.get("/preferences", async (req: AuthedRequest, res: Response) => {
    try {
      const store = readAuthStore();
      const user = findUserById(store, req.authUser!.id);
      const connections = await listDnsProviderConnections(req.authUser!.id);
      // Never expose encrypted tokens or raw secrets to the browser.
      const publicConnections = connections.map((c) => ({
        id: c.id,
        providerId: c.providerId,
        providerAccountId: c.providerAccountId,
        connected: c.connected,
        hasToken: c.hasToken,
        hasRefreshToken: c.hasRefreshToken,
        tokenExpiresAt: c.tokenExpiresAt,
        connectedAt: c.connectedAt,
        updatedAt: c.updatedAt,
        providerName: "cloudflare"
      }));
      res.json({
        preferredDnsProvider: user?.preferredDnsProvider || null,
        connections: publicConnections,
        cloudflareOAuthEnabled: isCloudflareOAuthConfigured(),
        providers: listDnsProviderCapabilities()
      });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "DOMAIN_PREFS_FAILED" });
    }
  });

  /** Disconnect customer's Cloudflare OAuth — does not touch platform SaaS credentials. */
  router.delete("/providers/cloudflare/connection", async (req: AuthedRequest, res: Response) => {
    try {
      const ok = await disconnectDnsProviderConnection(req.authUser!.id, "cloudflare");
      res.json({
        success: ok,
        connected: false,
        message: ok
          ? "Cloudflare disconnected. You can reconnect anytime, or use manual DNS."
          : "No Cloudflare connection found."
      });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "CF_DISCONNECT_FAILED" });
    }
  });

  router.put("/preferences", async (req: AuthedRequest, res: Response) => {
    try {
      const preferred = normalizeDnsProviderId(String(req.body?.preferredDnsProvider || ""));
      const store = readAuthStore();
      const user = findUserById(store, req.authUser!.id);
      if (!user) {
        res.status(404).json({ error: "User not found." });
        return;
      }
      user.preferredDnsProvider = preferred;
      user.updatedAt = new Date().toISOString();
      writeAuthStore(store);
      res.json({ success: true, preferredDnsProvider: preferred, user: publicUser(user) });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "DOMAIN_PREFS_SAVE_FAILED" });
    }
  });

  /**
   * Customer-facing Cloudflare connect — never asks for an API token.
   * Returns ready | oauth redirect | manual fallback.
   */
  router.post("/providers/cloudflare/begin", async (req: AuthedRequest, res: Response) => {
    try {
      const domainName = normalizeHostname(req.body?.domainName);
      const pageId = String(req.body?.pageId || "").trim();
      const validationError = assertSupportedCustomDomain(domainName);
      if (validationError) {
        res.status(400).json({ error: validationError, mode: "manual" });
        return;
      }
      if (!pageId) {
        res.status(400).json({ error: "Select a page for this domain.", mode: "manual" });
        return;
      }

      const result = await beginCloudflareAutoSetup({
        ownerUserId: req.authUser!.id,
        domainName,
        pageId
      });
      // Always 200 — client must never block on this probe.
      res.json(result);
    } catch (error) {
      console.warn("[domains] cloudflare begin failed:", errorMessage(error));
      res.json({
        mode: "manual",
        message: "Continue setup — we'll add DNS automatically when possible."
      });
    }
  });

  router.get("/providers/cloudflare/oauth/start", async (req: AuthedRequest, res: Response) => {
    try {
      if (!isCloudflareOAuthConfigured()) {
        res.status(503).json({
          error: "Cloudflare one-click connect is not configured yet.",
          code: "OAUTH_NOT_CONFIGURED",
          mode: "manual"
        });
        return;
      }
      const domainName = normalizeHostname(req.query.domainName);
      const pageId = String(req.query.pageId || "").trim();
      const validationError = assertSupportedCustomDomain(domainName);
      if (validationError || !pageId) {
        res.status(400).json({ error: validationError || "Missing page." });
        return;
      }
      const { authorizeUrl } = await createCloudflareOAuthAuthorizeUrl({
        userId: req.authUser!.id,
        domainName,
        pageId
      });
      res.json({ authorizeUrl });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "OAUTH_START_FAILED" });
    }
  });

  router.get("/", async (req: AuthedRequest, res: Response) => {
    try {
      const rows = await Promise.race([
        listDomains(req.authUser!.id),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Domain database timed out. Retry in a moment.")), 8_000)
        )
      ]);
      // Skip live DNS provider detection on list — it was blocking Custom Domains for 12s+.
      res.json({
        domains: await Promise.all(rows.map((row) => publicDomain(row, { detectProvider: false })))
      });
    } catch (error) {
      res.status(504).json({ error: errorMessage(error), code: "DOMAIN_LIST_FAILED" });
    }
  });

  router.post("/:id/test-connection", async (req: AuthedRequest, res: Response) => {
    try {
      let record = await findDomainById(req.params.id, req.authUser!.id);
      if (!record) {
        res.status(404).json({ error: "Domain not found." });
        return;
      }

      const {
        provider: providerState,
        providerError,
        clearedSaasHostname
      } = await resolveCloudflareProviderState(record);
      const test = await runConnectionTest(record.domainName, providerState);
      const status =
        test.connectionState === "live"
          ? ("Verified" as DomainStatus)
          : await resolveFinalStatus(test.dnsVerified, record.domainName, providerState);

      record = await updateDomain(record.id, req.authUser!.id, {
        status,
        dns_verified_at: test.dnsVerified ? test.checkedAt : null,
        last_checked_at: test.checkedAt,
        ...(clearedSaasHostname
          ? clearSaasProviderPatch()
          : providerState
            ? providerPatch(providerState)
            : {}),
        error_message: test.connectionState === "offline" ? test.dnsMessage : null
      });

      res.status(200).json({
        test,
        domain: await publicDomain(record),
        warning: providerError && test.dnsVerified
          ? "DNS looks correct. Cloudflare SSL registration had an issue — retry Test Connection in a minute."
          : undefined
      });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "DOMAIN_TEST_CONNECTION_FAILED" });
    }
  });

  router.get("/:id/serves-key", async (req: AuthedRequest, res: Response) => {
    try {
      const record = await findDomainById(req.params.id, req.authUser!.id);
      if (!record) {
        res.status(404).json({ error: "Domain not found." });
        return;
      }

      const servesKey = await domainServesKeyBio(record.domainName);
      const aTarget = resolveCustomDomainATarget();
      const detected = await getDnsProviderForDomain(record.domainName);
      const label = providerDnsLabel(detected);
      const kind = getCustomDomainKind(record.domainName);
      const cnameTarget = resolveCnameTarget();
      res.json({
        servesKey,
        message: servesKey
          ? null
          : kind === "subdomain"
            ? `${record.domainName} does not reach KEYLINK360 yet. At ${label}, set CNAME ${getSubdomainHostLabel(record.domainName)} → ${cnameTarget} and remove any A record.`
            : `${record.domainName} still opens another website (not KEYLINK360). At ${label}, set A record @ → ${aTarget}, remove duplicate records and old redirects, then verify again.`
      });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "DOMAIN_SERVES_KEY_FAILED" });
    }
  });

  router.post("/", async (req: AuthedRequest, res: Response) => {
    const domainName = normalizeHostname(req.body?.domainName);
    const pageId = String(req.body?.pageId || "").trim();
    const cloudflareApiToken = String(req.body?.cloudflareApiToken || req.body?.accessToken || "").trim();
    const dnsProviderId = normalizeDnsProviderId(
      String(req.body?.dnsProviderId || req.body?.preferredDnsProvider || "")
    );
    const rememberProvider = req.body?.rememberProvider !== false;
    const validationError = assertSupportedCustomDomain(domainName);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }
    if (!pageId || !pageBelongsToUser(pageId, req.authUser!.id)) {
      res.status(400).json({ error: "Select a valid website page for this domain." });
      return;
    }

    const existingByHost = await findDomainByHostname(domainName);
    if (existingByHost && existingByHost.ownerUserId !== req.authUser!.id) {
      res.status(409).json({
        error: "This hostname is already connected.",
        code: "DOMAIN_EXISTS"
      });
      return;
    }

    if (!existingByHost) {
      const quota = checkResourceQuota(req.authUser!.id, "customDomains", 1);
      if (!quota.allowed) {
        res.status(403).json({
          error: quota.error,
          code: "QUOTA_EXCEEDED",
          quota
        });
        return;
      }
    }

    let resumeRecord: CustomDomainRecord | null = null;
    const existingForPage = await findDomainByPageId(pageId, req.authUser!.id);
    if (existingForPage) {
      if (existingForPage.domainName === domainName) {
        // Same domain + same page — resume incomplete setup instead of blocking.
        resumeRecord = existingForPage;
      } else if (existingForPage.status !== "Verified") {
        // Ghost incomplete row was blocking this page — clear it and continue.
        await removeDomain(existingForPage.id, req.authUser!.id);
      } else {
        res.status(409).json({
          error:
            `This bio page already opens ${existingForPage.domainName}. ` +
            `Pick a different bio page for ${domainName}, or remove that domain first. ` +
            `One bio page can only use one custom domain.`,
          code: "PAGE_DOMAIN_TAKEN"
        });
        return;
      }
    }

    if (
      !resumeRecord &&
      existingByHost &&
      existingByHost.ownerUserId === req.authUser!.id
    ) {
      if (existingByHost.status === "Verified") {
        res.status(409).json({
          error: "This hostname is already connected.",
          code: "DOMAIN_EXISTS"
        });
        return;
      }
      resumeRecord =
        existingByHost.pageId === pageId
          ? existingByHost
          : await updateDomain(existingByHost.id, req.authUser!.id, { page_id: pageId });
    }

    const appHosts = [process.env.APP_URL, process.env.API_URL]
      .filter(Boolean)
      .map((value) => {
        try {
          return new URL(String(value).includes("://") ? String(value) : `https://${value}`).hostname;
        } catch {
          return "";
        }
      });
    if (appHosts.includes(domainName)) {
      res.status(400).json({ error: "This hostname is reserved by KEYLINK360." });
      return;
    }

    const registerSaas = shouldRegisterCloudflareCustomHostnames();
    const provider = registerSaas ? "cloudflare" : "manual";
    const kind = getCustomDomainKind(domainName);
    const dnsTarget = resolveCustomDomainATarget();

    try {
      let record: CustomDomainRecord;
      if (resumeRecord) {
        record = resumeRecord;
        if (record.pageId !== pageId) {
          record = await updateDomain(record.id, req.authUser!.id, { page_id: pageId });
        }
      } else {
        record = await createDomain({
          id: domainId(),
          ownerUserId: req.authUser!.id,
          pageId,
          domainName,
          dnsTarget,
          provider
        });
      }

      if (registerSaas) {
        if (record.providerHostnameId) {
          await appendDomainVerificationLog({
            domainId: record.id,
            ownerUserId: req.authUser!.id,
            event: "cloudflare_register",
            status: "resumed",
            message: `Resumed existing Cloudflare for SaaS hostname for ${domainName}.`
          });
        } else {
          try {
            const registered =
              kind === "subdomain"
                ? { apex: await registerCustomHostname(domainName), www: null }
                : await registerRootDomainHostnames(domainName);
            record = await updateDomain(record.id, req.authUser!.id, providerPatch(registered.apex));
            await appendDomainVerificationLog({
              domainId: record.id,
              ownerUserId: req.authUser!.id,
              event: "cloudflare_register",
              status: registered.www ? "apex_and_www" : "apex_only",
              message: registered.www
                ? `Registered ${domainName} and www.${domainName} with Cloudflare for SaaS.`
                : `Registered ${domainName} with Cloudflare for SaaS.`
            });
          } catch (providerError) {
            record = await updateDomain(record.id, req.authUser!.id, {
              provider_status: "error",
              ssl_status: "error",
              error_message: errorMessage(providerError)
            });
            await appendDomainVerificationLog({
              domainId: record.id,
              ownerUserId: req.authUser!.id,
              event: "cloudflare_register",
              status: "error",
              message: errorMessage(providerError)
            });
          }
        }
      } else {
        record = await updateDomain(record.id, req.authUser!.id, {
          provider_status: "worker_edge",
          ssl_status: "edge",
          error_message: null
        });
        await appendDomainVerificationLog({
          domainId: record.id,
          ownerUserId: req.authUser!.id,
          event: "cloudflare_register",
          status: "skipped",
          message:
            "Skipped Cloudflare for SaaS hostname registration (CLOUDFLARE_CUSTOM_HOSTNAME_ENABLED=false)."
        });
      }

      let dnsAutoProvisioned = false;
      let dnsProvisionMessage: string | null = null;
      let providerConnected = false;
      let providerAccountId: string | null = null;
      let needsOAuth = false;
      let oauthAuthorizeUrl: string | null = null;

      const adapter = getDnsProvider(dnsProviderId);
      // Multi-tenant Cloudflare: NEVER pass platform/request token for customer DNS.
      // cloudflareProvider resolves THIS user's encrypted OAuth token (+ refresh).
      // Other providers may still accept an explicit request token (guided/manual path).
      const accessTokenForProvision =
        dnsProviderId === "cloudflare"
          ? undefined
          : cloudflareApiToken || undefined;

      try {
        record = await updateDomain(record.id, req.authUser!.id, {
          dns_provider_id: dnsProviderId
        });
      } catch (metaError) {
        console.warn("[domains] dns_provider_id column missing — run dns-provider-onboarding-migration.sql", metaError);
      }

      if (rememberProvider) {
        try {
          const store = readAuthStore();
          const user = findUserById(store, req.authUser!.id);
          if (user) {
            user.preferredDnsProvider = dnsProviderId;
            user.updatedAt = new Date().toISOString();
            writeAuthStore(store);
          }
        } catch {
          /* ignore preference save failures */
        }
      }

      const canAttemptAutoDns =
        adapter.capability.supportsAutoDns &&
        (dnsProviderId === "cloudflare" || Boolean(accessTokenForProvision));

      if (canAttemptAutoDns) {
        try {
          const dnsRecords = buildDnsRecordSet(domainName).records;
          const provision = await adapter.provisionDns({
            domainName,
            records: dnsRecords,
            ownerUserId: req.authUser!.id,
            accessToken: accessTokenForProvision
          });
          dnsAutoProvisioned = provision.success;
          dnsProvisionMessage = provision.message;
          providerConnected = provision.success;
          providerAccountId = provision.providerAccountId || null;
          needsOAuth = Boolean(provision.needsOAuth && !provision.success);

          if (!provision.success && needsOAuth) {
            try {
              const started = await createCloudflareOAuthAuthorizeUrl({
                userId: req.authUser!.id,
                domainName,
                pageId
              });
              oauthAuthorizeUrl = started.authorizeUrl;
            } catch (oauthError) {
              console.warn("[domains] oauth url after dns fail:", errorMessage(oauthError));
            }
          }

          // Do not persist raw pasted tokens as the user's OAuth connection unless rememberProvider.
          if (rememberProvider && accessTokenForProvision && dnsProviderId !== "cloudflare") {
            await upsertDnsProviderConnection({
              ownerUserId: req.authUser!.id,
              providerId: dnsProviderId,
              accessToken: accessTokenForProvision,
              providerAccountId,
              connected: provision.success
            });
          }

          try {
            record = await updateDomain(record.id, req.authUser!.id, {
              provider_connected: provision.success,
              provider_account_id: providerAccountId,
              dns_provider_id: dnsProviderId
            });
          } catch {
            /* columns optional until migration */
          }

          await appendDomainVerificationLog({
            domainId: record.id,
            ownerUserId: req.authUser!.id,
            event: "auto_dns",
            status: provision.success ? "success" : "fallback_manual",
            message: provision.message
          });
        } catch (provisionError) {
          dnsProvisionMessage = errorMessage(provisionError);
          await appendDomainVerificationLog({
            domainId: record.id,
            ownerUserId: req.authUser!.id,
            event: "auto_dns",
            status: "error",
            message: dnsProvisionMessage
          });
        }
      } else if (dnsProviderId !== "cloudflare") {
        dnsProvisionMessage = adapter.capability.supportsAutoDns
          ? null
          : `${adapter.capability.name} guided setup — add the DNS record below, then we verify automatically.`;
      }

      res.status(201).json({
        domain: await publicDomain(record),
        dnsAutoProvisioned,
        dnsProvisionMessage,
        dnsProviderId,
        providerConnected,
        needsOAuth,
        oauthAuthorizeUrl,
        fallbackManual: !dnsAutoProvisioned && !oauthAuthorizeUrl
      });
    } catch (error) {
      const message = errorMessage(error);
      const duplicate = /duplicate|unique/i.test(message);
      res.status(duplicate ? 409 : 500).json({
        error: duplicate ? "This hostname is already connected." : message,
        code: duplicate ? "DOMAIN_EXISTS" : "DOMAIN_CREATE_FAILED"
      });
    }
  });

  router.post("/:id/verify", async (req: AuthedRequest, res: Response) => {
    try {
      let record = await findDomainById(req.params.id, req.authUser!.id);
      if (!record) {
        res.status(404).json({
          error: "This setup was removed or expired. Close and use Connect Domain again.",
          code: "DOMAIN_NOT_FOUND"
        });
        return;
      }

      let dns = await verifyDomainDns(record.domainName);

      // Orange-cloud CNAMEs (proxied) often break HTTPS. Re-apply DNS-only when needed.
      const looksOrangeCloud = dns.cnames.length === 0 && dns.addresses.length > 0;
      const shouldRepairDns =
        record.dnsProviderId === "cloudflare" &&
        (!dns.verified || looksOrangeCloud) &&
        !(await domainServesKeyBio(record.domainName));

      if (shouldRepairDns) {
        // Multi-tenant: repair using THIS customer's OAuth token only.
        const { tokens } = await resolveCustomerDnsTokens({
          ownerUserId: req.authUser!.id
        });
        const instructions = buildDnsRecordSet(record.domainName).records;
        for (const token of tokens) {
          try {
            const repaired = await provisionCloudflareDnsRecords(token, record.domainName, instructions);
            if (repaired.success) {
              dns = await verifyDomainDns(record.domainName);
              break;
            }
          } catch (repairError) {
            console.warn("[domains] dns repair:", errorMessage(repairError));
          }
        }
      }

      const {
        provider: providerState,
        providerError,
        clearedSaasHostname
      } = await resolveCloudflareProviderState(record);

      if (providerError && !dns.verified) {
        record = await updateDomain(record.id, req.authUser!.id, {
          status: "Pending DNS",
          last_checked_at: dns.checkedAt,
          provider_status: "error",
          ssl_status: "error",
          error_message: dns.message
        });
        res.status(200).json({
          domain: await publicDomain(record),
          dns,
          warning: providerError
        });
        return;
      }

      if (providerError && dns.verified) {
        record = await updateDomain(record.id, req.authUser!.id, {
          status: "DNS Verified",
          dns_verified_at: dns.checkedAt,
          last_checked_at: dns.checkedAt,
          provider_status: "error",
          ssl_status: "error",
          error_message: null
        });
        res.status(200).json({
          domain: await publicDomain(record),
          dns,
          warning:
            "DNS is correct. SSL provider setup failed — click Test Connection again in a minute."
        });
        return;
      }

      let dnsVerified = dns.verified;
      if (!dnsVerified) {
        dnsVerified = await verifyHostnameReachability(record.domainName);
      }

      const status = await resolveFinalStatus(dnsVerified, record.domainName, providerState);
      record = await updateDomain(record.id, req.authUser!.id, {
        status,
        dns_verified_at: dnsVerified ? dns.checkedAt : null,
        last_checked_at: dns.checkedAt,
        ...(clearedSaasHostname
          ? clearSaasProviderPatch()
          : providerState
            ? providerPatch(providerState)
            : {}),
        error_message: dnsVerified ? null : dns.message
      });

      await appendDomainVerificationLog({
        domainId: record.id,
        ownerUserId: req.authUser!.id,
        event: "verify_dns",
        status: record.status,
        message: dns.message,
        metadata: { dnsVerified, servesKey: await domainServesKeyBio(record.domainName) }
      });

      res.status(200).json({
        domain: await publicDomain(record),
        dns
      });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "DOMAIN_VERIFY_FAILED" });
    }
  });

  router.get("/:id/dns-records", async (req: AuthedRequest, res: Response) => {
    try {
      const record = await findDomainById(req.params.id, req.authUser!.id);
      if (!record) {
        res.status(404).json({ error: "Domain not found." });
        return;
      }
      const dns = buildDnsRecordSet(record.domainName);
      res.json({
        domainName: dns.domainName,
        kind: dns.kind,
        records: dns.records,
        ownershipVerification: record.ownershipVerification
      });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "DOMAIN_DNS_RECORDS_FAILED" });
    }
  });

  router.post("/:id/repair-dns", async (req: AuthedRequest, res: Response) => {
    try {
      const record = await findDomainById(req.params.id, req.authUser!.id);
      if (!record) {
        res.status(404).json({ error: "Domain not found." });
        return;
      }

      const dnsRecords = buildDnsRecordSet(record.domainName).records;
      // Multi-tenant: repair with the owner's saved Cloudflare OAuth token only.
      const provision = await cloudflareProvider.provisionDns({
        domainName: record.domainName,
        records: dnsRecords,
        ownerUserId: req.authUser!.id
      });

      if (!provision.success) {
        res.status(provision.needsOAuth ? 401 : 400).json({
          error: provision.message,
          needsOAuth: provision.needsOAuth || false,
          code: provision.needsOAuth ? "CLOUDFLARE_RECONNECT" : "DOMAIN_REPAIR_DNS_FAILED"
        });
        return;
      }

      await appendDomainVerificationLog({
        domainId: record.id,
        ownerUserId: req.authUser!.id,
        event: "repair_dns",
        status: "success",
        message: provision.message
      });

      const dns = await verifyDomainDns(record.domainName);
      const dnsVerified = dns.verified;
      let providerState: ProviderHostname | null = null;
      if (record.providerHostnameId) {
        try {
          providerState = await getCustomHostname(record.providerHostnameId);
        } catch {
          providerState = null;
        }
      }
      const status = await resolveFinalStatus(dnsVerified, record.domainName, providerState || undefined);
      const updated = await updateDomain(record.id, req.authUser!.id, {
        status,
        dns_verified_at: dnsVerified ? dns.checkedAt : null,
        last_checked_at: dns.checkedAt,
        error_message: dnsVerified ? null : dns.message
      });

      res.json({
        domain: await publicDomain(updated),
        dns,
        dnsAutoProvisioned: provision.success,
        dnsProvisionMessage: provision.message
      });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "DOMAIN_REPAIR_DNS_FAILED" });
    }
  });

  router.patch("/:id", async (req: AuthedRequest, res: Response) => {
    const pageId = String(req.body?.pageId || "").trim();
    if (!pageId || !pageBelongsToUser(pageId, req.authUser!.id)) {
      res.status(400).json({ error: "Select a valid website page for this domain." });
      return;
    }

    try {
      const record = await findDomainById(req.params.id, req.authUser!.id);
      if (!record) {
        res.status(404).json({ error: "Domain not found." });
        return;
      }
      if (record.pageId === pageId) {
        res.json({ domain: await publicDomain(record) });
        return;
      }

      const existingForPage = await findDomainByPageId(pageId, req.authUser!.id);
      if (existingForPage && existingForPage.id !== record.id) {
        res.status(409).json({
          error: `That page is already connected to ${existingForPage.domainName}. Each page can only use one custom domain.`
        });
        return;
      }

      const updated = await updateDomain(record.id, req.authUser!.id, { page_id: pageId });
      await appendDomainVerificationLog({
        domainId: updated.id,
        ownerUserId: req.authUser!.id,
        event: "reassign_page",
        status: updated.status,
        message: `Linked ${updated.domainName} to page ${pageId}.`,
        metadata: { pageId, previousPageId: record.pageId }
      });

      res.json({ domain: await publicDomain(updated) });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "DOMAIN_PATCH_FAILED" });
    }
  });

  router.get("/:id/status", async (req: AuthedRequest, res: Response) => {
    try {
      const record = await findDomainById(req.params.id, req.authUser!.id);
      if (!record) {
        res.status(404).json({ error: "Domain not found." });
        return;
      }
      const test = await runConnectionTest(record.domainName);
      res.json({
        domain: await publicDomain(record),
        verification: test
      });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error), code: "DOMAIN_STATUS_FAILED" });
    }
  });

  router.delete("/:id", async (req: AuthedRequest, res: Response) => {
    try {
      const record = await findDomainById(req.params.id, req.authUser!.id);
      if (!record) {
        res.status(404).json({ error: "Domain not found." });
        return;
      }

      // 1) Customer Cloudflare zone: remove KEY-managed CNAME/A (best-effort).
      let dnsCleanup: {
        success: boolean;
        attempted: boolean;
        removed: number;
        message: string;
      } = {
        success: false,
        attempted: false,
        removed: 0,
        message: "DNS cleanup skipped."
      };
      const shouldCleanCustomerDns =
        !record.dnsProviderId ||
        record.dnsProviderId === "cloudflare" ||
        record.providerConnected;
      if (shouldCleanCustomerDns) {
        try {
          dnsCleanup = await deprovisionCustomerCloudflareDns({
            ownerUserId: req.authUser!.id,
            domainName: record.domainName
          });
        } catch (dnsError) {
          dnsCleanup = {
            success: false,
            attempted: true,
            removed: 0,
            message: errorMessage(dnsError)
          };
          console.warn(
            `[domains] customer DNS cleanup failed for ${record.domainName}:`,
            dnsCleanup.message
          );
        }
      }

      // 2) Platform Cloudflare for SaaS custom hostname (KEY zone), if any.
      try {
        await deleteCustomHostnamesForDomain(record.domainName, record.providerHostnameId);
      } catch (providerError) {
        console.warn(
          `[domains] Cloudflare SaaS cleanup failed for ${record.domainName}, removing from KEY anyway:`,
          providerError
        );
      }

      // 3) Always remove from KEYLINK360 even if Cloudflare DNS cleanup failed.
      await removeDomain(record.id, req.authUser!.id);

      await appendDomainVerificationLog({
        domainId: record.id,
        ownerUserId: req.authUser!.id,
        event: "delete",
        status: dnsCleanup.success ? "removed_with_dns" : "removed",
        message: dnsCleanup.attempted
          ? `Removed ${record.domainName} from KEYLINK360. ${dnsCleanup.message}`
          : `Removed ${record.domainName} from KEYLINK360.`
      });

      res.json({
        success: true,
        domainName: record.domainName,
        dnsCleanup: {
          success: dnsCleanup.success,
          attempted: dnsCleanup.attempted,
          removed: dnsCleanup.removed,
          message: dnsCleanup.message
        }
      });
    } catch (error) {
      res.status(502).json({ error: errorMessage(error), code: "DOMAIN_DELETE_FAILED" });
    }
  });

  return router;
}
