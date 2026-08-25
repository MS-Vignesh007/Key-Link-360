import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { screenToPath } from "../navigation";
import { ScreenId } from "../types";
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  ChevronDown,
  Clock,
  Edit3,
  ExternalLink,
  Globe,
  HelpCircle,
  Loader2,
  PlugZap,
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff
} from "lucide-react";
import type { BioPage, CustomDomain, CustomDomainPlatformConfig } from "../types";
import { syncLocalPageDocumentToServer } from "../storage/bioBuilderStorage";
import {
  fetchCustomDomainPlatformConfig,
  testDomainConnection,
  type DomainConnectionTest
} from "../lib/domainApi";
import { getAccessToken, isPreviewToken } from "../lib/authApi";
import { buildDnsRecordSet, formatDnsVerifyError } from "../lib/customDomainDns";
import { getProviderBranding } from "../lib/dnsProviderBranding";
import {
  canOpenCustomDomainInBrowser,
  domainStatusTone,
  getDomainConnectionLabel,
  getDomainConnectionState,
  getDomainStatusLabel,
  isCustomDomainPublicReady,
  isDomainDnsLinked
} from "../lib/customDomainStatus";
import ConnectDomainWizard, {
  type CloudflareOAuthBootstrap
} from "./customDomains/ConnectDomainWizard";
import CustomDomainSetupGuide from "./customDomains/CustomDomainSetupGuide";
import DomainDnsPanel from "./customDomains/DomainDnsPanel";
import HowItWorksDialog from "./customDomains/HowItWorksDialog";
import RemoveDomainDialog from "./customDomains/RemoveDomainDialog";
import PageShell, { PageHeader, SectionCard, Workspace } from "./layout/PageShell";

interface CustomDomainsScreenProps {
  domains: CustomDomain[];
  pages: BioPage[];
  isLoading: boolean;
  loadError: string | null;
  onReload: () => Promise<void>;
  onConnectDomain: (
    domainName: string,
    pageId: string,
    options?: {
      cloudflareApiToken?: string;
      accessToken?: string;
      dnsProviderId?: string;
      rememberProvider?: boolean;
    }
  ) => Promise<import("../lib/domainApi").DomainConnectResult>;
  onVerifyDomain: (
    id: string,
    options?: { skipPageSync?: boolean }
  ) => Promise<import("../lib/domainApi").DomainVerifyResult>;
  onReassignDomain: (id: string, pageId: string) => Promise<CustomDomain>;
  onDeleteDomain: (id: string) => Promise<{
    domainName?: string;
    dnsCleanup?: {
      success: boolean;
      attempted: boolean;
      removed: number;
      message: string;
    };
  } | void>;
  onEditPage: (pageId: string, options?: { fromCustomDomain?: boolean }) => void;
}

function isLiveHistoryDomain(domain: CustomDomain) {
  return domain.status === "Verified";
}

/** Domains that still occupy a bio page — including incomplete setups not shown as LIVE. */
function domainOccupiesPage(domain: CustomDomain) {
  return Boolean(domain.pageId);
}

function ConnectionIndicator({ domain }: { domain: CustomDomain }) {
  const state = getDomainConnectionState(domain);
  const label = getDomainConnectionLabel(domain);
  const Icon = state === "live" ? Wifi : state === "connecting" ? Clock : WifiOff;

  return (
    <span className={`key-domains-lovable__connection key-domains-lovable__connection--${state}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function ConnectionTestResult({ test }: { test: DomainConnectionTest }) {
  const dnsOk = test.dnsVerified;
  const dnsLabel = dnsOk ? "CNAME points to KEYLINK360" : "not ready yet";
  return (
    <div className={`key-domains-lovable__test-result key-domains-lovable__test-result--${test.connectionState}`}>
      <p className="key-domains-lovable__test-result-summary">{test.summary}</p>
      <ul className="key-domains-lovable__test-result-checks">
        <li className={dnsOk ? "is-ok" : "is-bad"}>
          DNS {dnsOk ? "OK" : "not ready"} — {dnsOk ? dnsLabel : test.dnsMessage}
        </li>
        <li className={test.servesKey ? "is-ok" : test.dnsVerified ? "is-warn" : "is-bad"}>
          KEYLINK360 {test.servesKey ? "reachable" : "not reachable yet"}
        </li>
        {test.dnsVerified && !test.servesKey && (
          <li className="is-warn">
            {test.sslAutomatic
              ? "Waiting for Cloudflare SSL / routing — usually 2–15 minutes. Click Retry / Test Connection again."
              : "Hostname not reaching KEYLINK360 yet. Confirm DNS, wait a few minutes, then Retry."}
          </li>
        )}
      </ul>
      {test.nextStep && <p className="key-domains-lovable__test-result-next">{test.nextStep}</p>}
    </div>
  );
}

function statusBadge(domain: CustomDomain) {
  const tone = domainStatusTone(domain);
  const verified = domain.status === "Verified";
  const failed = domain.status === "Error" || domain.providerStatus === "error";
  const provisioning = domain.status === "Provisioning SSL";
  const pending = domain.status === "Pending DNS";
  const dnsVerified = domain.status === "DNS Verified";
  const Icon = verified ? CheckCircle : failed ? AlertCircle : provisioning || pending ? Loader2 : dnsVerified ? Clock : Clock;
  return (
    <span className={`key-domains-lovable__status key-domains-lovable__status--${tone}`}>
      <Icon className={`h-3.5 w-3.5 ${provisioning || pending ? "animate-spin" : ""}`} />
      {getDomainStatusLabel(domain)}
    </span>
  );
}

export default function CustomDomainsScreen({
  domains,
  pages,
  isLoading,
  loadError,
  onReload,
  onConnectDomain,
  onVerifyDomain,
  onReassignDomain,
  onDeleteDomain,
  onEditPage
}: CustomDomainsScreenProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isPreviewSession = isPreviewToken(getAccessToken());
  const [wizardOpen, setWizardOpen] = useState(false);
  const [resumeDomain, setResumeDomain] = useState<CustomDomain | null>(null);
  const [oauthBootstrap, setOauthBootstrap] = useState<CloudflareOAuthBootstrap | null>(null);
  const [removeTarget, setRemoveTarget] = useState<CustomDomain | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone?: "ok" | "error" } | null>(null);
  const [platformConfig, setPlatformConfig] = useState<CustomDomainPlatformConfig | null>(null);
  const [platformConfigLoading, setPlatformConfigLoading] = useState(true);
  const [expandedDomainIds, setExpandedDomainIds] = useState<Set<string>>(new Set());
  const [expandedDnsIds, setExpandedDnsIds] = useState<Set<string>>(new Set());
  const [testingId, setTestingId] = useState<string | null>(null);
  const [reassigningId, setReassigningId] = useState<string | null>(null);
  const [connectionTests, setConnectionTests] = useState<Record<string, DomainConnectionTest>>({});
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  const loadPlatformConfig = React.useCallback(async () => {
    const startedAt = Date.now();
    setPlatformConfigLoading(true);
    try {
      setPlatformConfig(await fetchCustomDomainPlatformConfig());
    } catch {
      setPlatformConfig(null);
    } finally {
      setPlatformConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlatformConfig();
  }, [loadPlatformConfig]);

  useEffect(() => {
    if (!wizardOpen) return;
    document.body.classList.add("key-connect-domain-modal-open");
    // Fresh config when opening Connect — avoid stale cloudflareOAuthEnabled=false.
    void fetchCustomDomainPlatformConfig(true)
      .then(setPlatformConfig)
      .catch(() => undefined);
    return () => document.body.classList.remove("key-connect-domain-modal-open");
  }, [wizardOpen]);

  const historyDomains = useMemo(
    () => domains.filter(isLiveHistoryDomain),
    [domains]
  );

  // Show LIVE + incomplete/pending so ghost links (blocking a page) can be removed.
  const listedDomains = useMemo(() => {
    const live = domains.filter(isLiveHistoryDomain);
    const incomplete = domains.filter((domain) => !isLiveHistoryDomain(domain));
    return [...live, ...incomplete];
  }, [domains]);

  const linkedDomainsByPageId = useMemo(() => {
    const map = new Map<string, CustomDomain>();
    for (const domain of domains) {
      if (domainOccupiesPage(domain)) map.set(domain.pageId, domain);
    }
    return map;
  }, [domains]);

  const triggerToast = (message: string, tone: "ok" | "error" = "ok") => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const cfOauth = searchParams.get("cf_oauth");
    if (cfOauth === null) return;
    const domainName = (searchParams.get("domain") || "").trim();
    const pageId = (searchParams.get("pageId") || "").trim();
    const error = (searchParams.get("cf_oauth_error") || "").trim();
    if (domainName && pageId) {
      setOauthBootstrap({
        domainName,
        pageId,
        connected: cfOauth === "1",
        error: error || undefined
      });
      setResumeDomain(null);
      setWizardOpen(true);
      if (cfOauth === "1") {
        triggerToast("Cloudflare connected — finishing DNS setup…", "ok");
      } else if (error) {
        triggerToast(error, "error");
      }
    }
    const next = new URLSearchParams(searchParams);
    next.delete("cf_oauth");
    next.delete("cf_oauth_error");
    next.delete("domain");
    next.delete("pageId");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const toggleDomainAccordion = (domainId: string) => {
    setExpandedDomainIds((current) => {
      const next = new Set(current);
      if (next.has(domainId)) next.delete(domainId);
      else next.add(domainId);
      return next;
    });
  };

  const toggleDnsPanel = (domainId: string) => {
    setExpandedDnsIds((current) => {
      const next = new Set(current);
      if (next.has(domainId)) next.delete(domainId);
      else next.add(domainId);
      return next;
    });
  };

  const openLiveWebsite = async (domain: CustomDomain) => {
    if (!canOpenCustomDomainInBrowser(domain)) {
      triggerToast("Site opens only after status is Verified (Live). Fix DNS routing first.", "error");
      return;
    }

    const page = pages.find((item) => item.id === domain.pageId);
    await syncLocalPageDocumentToServer(domain.pageId, page?.slug);
    window.open(`https://${domain.domainName}`, "_blank", "noopener,noreferrer");
  };

  const editLinkedPage = (domain: CustomDomain) => {
    const page = pages.find((item) => item.id === domain.pageId);
    if (!page) {
      triggerToast("Linked page not found. Refresh and try again.", "error");
      return;
    }
    const params = new URLSearchParams({ edit: domain.pageId, source: "domain" });
    navigate(`${screenToPath(ScreenId.BIO_PAGES)}?${params.toString()}`);
    onEditPage(domain.pageId, { fromCustomDomain: true });
  };

  const testConnection = async (domain: CustomDomain) => {
    setTestingId(domain.id);
    try {
      const page = pages.find((item) => item.id === domain.pageId);
      await syncLocalPageDocumentToServer(domain.pageId, page?.slug);
      const { test, domain: updated } = await testDomainConnection(domain.id);
      setConnectionTests((current) => ({ ...current, [domain.id]: test }));
      await onReload();
      if (updated.status === "Verified") {
        triggerToast(`${updated.domainName} is live — connection OK.`, "ok");
      } else if (test.connectionState === "connecting") {
        triggerToast(
          `${updated.domainName}: DNS OK — KEYLINK360 is registering SSL/routing. Wait 2–5 min, then Test Connection again.`,
          "ok"
        );
      } else {
        triggerToast(test.nextStep || test.summary, "error");
      }
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : "Connection test failed.", "error");
    } finally {
      setTestingId(null);
    }
  };

  const reassignLinkedPage = async (domain: CustomDomain, nextPageId: string) => {
    if (nextPageId === domain.pageId) return;
    const taken = domains.find((item) => item.pageId === nextPageId && item.id !== domain.id);
    if (taken) {
      triggerToast(`That page is already connected to ${taken.domainName}.`, "error");
      return;
    }
    setReassigningId(domain.id);
    try {
      const page = pages.find((item) => item.id === nextPageId);
      await syncLocalPageDocumentToServer(nextPageId, page?.slug);
      await onReassignDomain(domain.id, nextPageId);
      triggerToast(`"${domain.domainName}" now opens ${page?.title || "the selected page"}.`);
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : "Could not change linked page.", "error");
    } finally {
      setReassigningId(null);
    }
  };

  const verifyDomain = async (domain: CustomDomain) => {
    setVerifyingId(domain.id);
    try {
      const page = pages.find((item) => item.id === domain.pageId);
      await syncLocalPageDocumentToServer(domain.pageId, page?.slug);
      const result = await onVerifyDomain(domain.id);
      const updated = result.domain;
      if (updated.status === "Verified") {
        triggerToast(`${updated.domainName} is live with HTTPS.`);
      } else if (isDomainDnsLinked(updated) || result.dns?.verified) {
        triggerToast(`${updated.domainName} DNS verified. SSL may take a few minutes.`);
      } else {
        triggerToast(
          formatDnsVerifyError(
            updated.domainName,
            updated.errorMessage || result.dns?.message,
            platformConfig?.aRecordTarget || ""
          ) ||
            updated.setupHint ||
            "DNS not detected yet.",
          "error"
        );
      }
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : "Verification failed.", "error");
    } finally {
      setVerifyingId(null);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setDeletingId(removeTarget.id);
    try {
      const result = await onDeleteDomain(removeTarget.id);
      const cleanup = result && typeof result === "object" ? result.dnsCleanup : undefined;
      if (cleanup?.attempted && cleanup.success) {
        triggerToast(
          cleanup.removed > 0
            ? `"${removeTarget.domainName}" removed from KEYLINK360 and Cloudflare DNS.`
            : `"${removeTarget.domainName}" removed. ${cleanup.message}`
        );
      } else if (cleanup?.attempted && !cleanup.success) {
        triggerToast(
          `"${removeTarget.domainName}" removed from KEYLINK360. Cloudflare DNS may still exist — ${cleanup.message}`,
          "error"
        );
      } else {
        triggerToast(`"${removeTarget.domainName}" removed.`);
      }
      setRemoveTarget(null);
      await onReload();
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : "Unable to remove domain.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const openConnectWizard = () => {
    setResumeDomain(null);
    setWizardOpen(true);
  };

  return (
    <PageShell>
      <PageHeader
        title="Custom Domains"
        subtitle={
          <>
            <span className="block">
              Connect a root domain or subdomain so visitors open your bio page on your brand address.
            </span>
            <span className="mt-2 block text-sm text-slate-600">
              <span className="font-semibold text-slate-800">Add existing domain</span>
              {" — "}
              Connect a website address you already own.
            </span>
          </>
        }
        actions={
          <div className="key-domains-header-actions self-start sm:pt-1">
            <button
              type="button"
              onClick={() =>
                navigate(`${screenToPath(ScreenId.HELP_CENTER)}?article=faq-cd-start`)
              }
              className="key-domains-help-btn"
            >
              <HelpCircle className="h-4 w-4" />
              Help
            </button>
            <button
              type="button"
              onClick={openConnectWizard}
              disabled={pages.length === 0 || isPreviewSession}
              className="key-btn-primary !w-auto shrink-0 px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base shadow-lg shadow-indigo-500/30"
              title={
                pages.length === 0
                  ? "Publish a bio page first"
                  : isPreviewSession
                    ? "Sign in with a full account to connect domains"
                    : undefined
              }
            >
              <Globe className="h-4 w-4 shrink-0" />
              Connect Domain
            </button>
          </div>
        }
      />

      {loadError && (
        <div className="key-banner-error">
          <span>{loadError}</span>
          <button type="button" onClick={() => void onReload()} className="font-bold underline">
            Retry
          </button>
        </div>
      )}

      {isPreviewSession && (
        <div className="key-banner-info">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Preview mode is active — custom domains need a full sign-in. Go to{" "}
            <button
              type="button"
              className="font-bold underline"
              onClick={() => navigate(screenToPath(ScreenId.ACCOUNT))}
            >
              Account
            </button>{" "}
            to sign out, then log in with your email and password.
          </span>
        </div>
      )}

      {platformConfig && !platformConfig.cloudflareEnvConfigured && !platformConfigLoading && (
        <div className="key-banner-error mb-4">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            <strong>SSL auto-setup is temporarily unavailable.</strong> Please try again later, or contact KEYLINK360
            support. You do not need to change anything in a hosting panel — only your domain DNS (CNAME/A) and{" "}
            <strong>Test Connection</strong> in KEYLINK360.
          </span>
        </div>
      )}

      <div className="key-domains-lovable key-domains-lovable--single">
        <SectionCard>
          <Workspace>
            <div className="key-domains-lovable__section">
              <div>
                <h3 className="key-domains-lovable__heading">Connected domains</h3>
                <p className="key-domains-lovable__desc">
                  Open a domain for provider, DNS, SSL details, and DNS records. Incomplete setups also
                  appear here so you can remove them if they block a bio page.
                </p>
                {listedDomains.length > 0 && (
                  <p className="key-domains-lovable__stats">
                    {historyDomains.length} live
                    {listedDomains.length > historyDomains.length
                      ? ` · ${listedDomains.length - historyDomains.length} incomplete`
                      : ""}
                  </p>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading domains…
              </div>
            ) : listedDomains.length === 0 ? (
              <CustomDomainSetupGuide
                config={platformConfig}
                hasPages={pages.length > 0}
                onConnect={openConnectWizard}
              />
            ) : (
              <ul className="key-domains-lovable__accordion-list">
                {listedDomains.map((domain) => {
                  const dnsSet =
                    platformConfig &&
                    buildDnsRecordSet(domain.domainName, platformConfig.aRecordTarget, {
                      cnameTarget: platformConfig.cnameTarget
                    });
                  const isOpen = expandedDomainIds.has(domain.id);
                  const dnsExpanded = expandedDnsIds.has(domain.id);
                  const publicReady = isCustomDomainPublicReady(domain);
                  const canOpen = canOpenCustomDomainInBrowser(domain);
                  const dnsLinked = isDomainDnsLinked(domain);
                  const connectionTest = connectionTests[domain.id];
                  const providerBrand =
                    domain.dnsProviderId || domain.dnsProviderName
                      ? getProviderBranding(
                          domain.dnsProviderId || "other",
                          domain.dnsProviderName || undefined
                        )
                      : null;
                  return (
                    <li
                      key={domain.id}
                      className={`key-domains-lovable__accordion ${isOpen ? "is-open" : ""}`}
                    >
                      <div className="key-domains-lovable__accordion-head">
                        <button
                          type="button"
                          className="key-domains-lovable__accordion-trigger"
                          aria-expanded={isOpen}
                          onClick={() => toggleDomainAccordion(domain.id)}
                        >
                          <ChevronDown
                            className={`key-domains-lovable__accordion-chevron ${isOpen ? "is-open" : ""}`}
                            aria-hidden
                          />
                          <span className="key-domains-lovable__domain-name">{domain.domainName}</span>
                        </button>
                        <div className="key-domains-lovable__accordion-badges">
                          <ConnectionIndicator domain={domain} />
                          {statusBadge(domain)}
                        </div>
                        <div
                          className="key-domains-lovable__accordion-controls"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            title="Refresh / Test connection"
                            disabled={testingId === domain.id || verifyingId === domain.id}
                            onClick={() => void testConnection(domain)}
                            className="key-domains-lovable__icon-btn"
                          >
                            {testingId === domain.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <PlugZap className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            title="Reconnect / continue setup"
                            onClick={() => {
                              setResumeDomain(domain);
                              setWizardOpen(true);
                            }}
                            className="key-domains-lovable__icon-btn"
                          >
                            <Globe className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Verify again"
                            disabled={verifyingId === domain.id}
                            onClick={() => void verifyDomain(domain)}
                            className="key-domains-lovable__icon-btn"
                          >
                            <RefreshCw
                              className={`h-4 w-4 ${verifyingId === domain.id ? "animate-spin" : ""}`}
                            />
                          </button>
                          {dnsLinked && (
                            <button
                              type="button"
                              title="Edit linked bio page"
                              onClick={() => editLinkedPage(domain)}
                              className="key-domains-lovable__icon-btn"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          )}
                          {canOpen && (
                            <button
                              type="button"
                              title="Open website in new tab"
                              onClick={() => void openLiveWebsite(domain)}
                              className={`key-domains-lovable__icon-btn ${
                                publicReady
                                  ? "key-domains-lovable__icon-btn--live"
                                  : "key-domains-lovable__icon-btn--open"
                              }`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Remove domain"
                            disabled={deletingId === domain.id}
                            onClick={() => setRemoveTarget(domain)}
                            className="key-domains-lovable__icon-btn key-domains-lovable__icon-btn--danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="key-domains-lovable__accordion-body">
                          <p className="key-domains-lovable__opens-row">
                            <span>Opens:</span>
                            <select
                              value={domain.pageId}
                              disabled={reassigningId === domain.id || pages.length === 0}
                              onChange={(event) => void reassignLinkedPage(domain, event.target.value)}
                              className="key-domains-lovable__page-select"
                              aria-label={`Change linked page for ${domain.domainName}`}
                            >
                              {pages.map((page) => {
                                const linkedElsewhere = linkedDomainsByPageId.get(page.id);
                                const disabled = Boolean(
                                  linkedElsewhere && linkedElsewhere.id !== domain.id
                                );
                                return (
                                  <option key={page.id} value={page.id} disabled={disabled}>
                                    {page.title}
                                    {disabled ? " (in use)" : ""}
                                  </option>
                                );
                              })}
                            </select>
                            <span className="key-domains-lovable__opens-meta">
                              {dnsSet?.records.length || 1} DNS record
                              {(dnsSet?.records.length || 1) === 1 ? "" : "s"} required
                            </span>
                          </p>

                          <div className="key-domains-lovable__meta-grid">
                            <div>
                              <span className="key-domains-lovable__meta-label">Provider</span>
                              {providerBrand ? (
                                <span className="key-domains-lovable__meta-provider">
                                  <img
                                    src={providerBrand.logoUrl}
                                    alt={`${providerBrand.displayName} logo`}
                                    className="key-domains-lovable__meta-provider-logo"
                                    width={72}
                                    height={22}
                                  />
                                  <span className="key-domains-lovable__meta-value">
                                    {providerBrand.displayName}
                                    {domain.providerConnected ? " · Connected" : ""}
                                  </span>
                                </span>
                              ) : (
                                <span className="key-domains-lovable__meta-value">—</span>
                              )}
                            </div>
                            <div>
                              <span className="key-domains-lovable__meta-label">DNS</span>
                              <span className="key-domains-lovable__meta-value">
                                {domain.dnsVerifiedAt || domain.dnsLastVerified
                                  ? "Verified"
                                  : "Pending"}
                              </span>
                            </div>
                            <div>
                              <span className="key-domains-lovable__meta-label">SSL</span>
                              <span className="key-domains-lovable__meta-value">
                                {domain.sslStatus || "pending"}
                              </span>
                            </div>
                            <div>
                              <span className="key-domains-lovable__meta-label">Last checked</span>
                              <span className="key-domains-lovable__meta-value">
                                {domain.lastCheckedAt
                                  ? new Date(domain.lastCheckedAt).toLocaleString()
                                  : "—"}
                              </span>
                            </div>
                          </div>

                          {(domain.setupHint || domain.errorMessage) && (
                            <p
                              className={`key-domains-lovable__hint ${
                                domain.errorMessage && domain.status === "Pending DNS"
                                  ? "is-error"
                                  : ""
                              }`}
                            >
                              {domain.setupHint ||
                                formatDnsVerifyError(
                                  domain.domainName,
                                  domain.errorMessage,
                                  platformConfig?.aRecordTarget || ""
                                )}
                            </p>
                          )}

                          {dnsSet && (
                            <div className="key-domains-lovable__dns-block">
                              <button
                                type="button"
                                onClick={() => toggleDnsPanel(domain.id)}
                                className="key-domains-lovable__dns-toggle"
                                aria-expanded={dnsExpanded}
                              >
                                <ChevronDown
                                  className={`h-3.5 w-3.5 transition-transform ${
                                    dnsExpanded ? "rotate-180" : ""
                                  }`}
                                />
                                {dnsExpanded ? "Hide DNS" : "Show DNS"}
                              </button>
                              {dnsExpanded && (
                                <DomainDnsPanel
                                  domainName={domain.domainName}
                                  records={dnsSet.records}
                                  aRecordTarget={platformConfig!.aRecordTarget}
                                  cnameTarget={platformConfig!.cnameTarget}
                                  ownershipVerification={domain.ownershipVerification}
                                />
                              )}
                            </div>
                          )}

                          {connectionTest && <ConnectionTestResult test={connectionTest} />}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="key-domains-how-trigger-wrap">
              <button
                type="button"
                className="key-domains-how-trigger"
                onClick={() => setHowItWorksOpen(true)}
              >
                <BookOpen className="h-4 w-4" />
                How it works
              </button>
            </div>
          </Workspace>
        </SectionCard>
      </div>

      {wizardOpen &&
        createPortal(
          <ConnectDomainWizard
            open={wizardOpen}
            pages={pages}
            linkedDomainsByPageId={linkedDomainsByPageId}
            platformConfig={platformConfig}
            resumeDomain={resumeDomain}
            oauthBootstrap={oauthBootstrap}
            onClose={() => {
              setWizardOpen(false);
              setResumeDomain(null);
              setOauthBootstrap(null);
            }}
            onVerify={onVerifyDomain}
            onConnectDomain={onConnectDomain}
            onDiscardIncomplete={async (domainId) => {
              await onDeleteDomain(domainId);
            }}
            onFinished={({ domain, connected }) => {
              setWizardOpen(false);
              setResumeDomain(null);
              setOauthBootstrap(null);
              void onReload();

              window.setTimeout(() => {
                if (connected) {
                  triggerToast(
                    `${domain.domainName} connected successfully — now LIVE on Custom Domains.`,
                    "ok"
                  );
                }
              }, 100);
            }}
          />,
          document.body
        )}

      {removeTarget &&
        createPortal(
          <RemoveDomainDialog
            domainName={removeTarget.domainName}
            onCancel={() => setRemoveTarget(null)}
            onConfirm={() => void confirmRemove()}
            isRemoving={deletingId === removeTarget.id}
          />,
          document.body
        )}

      {howItWorksOpen &&
        createPortal(
          <HowItWorksDialog
            open={howItWorksOpen}
            onClose={() => setHowItWorksOpen(false)}
            cnameTarget={platformConfig?.cnameTarget || platformConfig?.platformUrl || "keylink360.mindflo.today"}
            aRecordTarget={platformConfig?.aRecordTarget || "69.46.46.98"}
          />,
          document.body
        )}

      {toast &&
        createPortal(
          <div
            className={`key-toast key-toast--portal ${
              toast.tone === "error" ? "key-toast--error" : toast.tone === "ok" ? "key-toast--success" : ""
            }`}
            role="status"
            aria-live="polite"
          >
            {toast.message}
          </div>,
          document.body
        )}
    </PageShell>
  );
}
