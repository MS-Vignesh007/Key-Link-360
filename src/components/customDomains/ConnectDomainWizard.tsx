import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type {
  BioPage,
  CustomDomain,
  CustomDomainPlatformConfig,
  DnsProviderCapability,
  DnsProviderId
} from "../../types";
import {
  analyzeDomain,
  beginCloudflareConnect,
  fetchDomainPreferences,
  saveDomainPreferences,
  type DomainAnalysis,
  type DomainConnectResult
} from "../../lib/domainApi";
import {
  buildDnsRecordSet,
  customDomainValidationError,
  getCustomDomainKind,
  getDnsZoneDomain
} from "../../lib/customDomainDns";
import { isValidHostname, normaliseHostname } from "../../storage/publishStorage";
import SearchablePagePicker from "./SearchablePagePicker";
import DnsRecordsTable from "./DnsRecordsTable";
import { useDomainInputPreview } from "./useDomainInputPreview";
import { getProviderBranding } from "../../lib/dnsProviderBranding";
import { getAccessToken, isPreviewToken } from "../../lib/authApi";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ExternalLink,
  Globe,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  X
} from "lucide-react";

type WizardPhase = "domain" | "provider" | "connect" | "verifying" | "manual" | "success";

export type CloudflareOAuthBootstrap = {
  domainName: string;
  pageId: string;
  connected: boolean;
  error?: string;
};

interface ConnectDomainWizardProps {
  open: boolean;
  pages: BioPage[];
  linkedDomainsByPageId: Map<string, CustomDomain>;
  platformConfig: CustomDomainPlatformConfig | null;
  resumeDomain?: CustomDomain | null;
  /** After Cloudflare OAuth redirect — continue without asking for a token. */
  oauthBootstrap?: CloudflareOAuthBootstrap | null;
  onClose: () => void;
  onConnectDomain: (
    domainName: string,
    pageId: string,
    options?: {
      cloudflareApiToken?: string;
      accessToken?: string;
      dnsProviderId?: string;
      rememberProvider?: boolean;
    }
  ) => Promise<DomainConnectResult>;
  onVerify: (
    id: string,
    options?: { skipPageSync?: boolean }
  ) => Promise<import("../../lib/domainApi").DomainVerifyResult>;
  /** Remove an incomplete setup so it never appears as Offline in history. */
  onDiscardIncomplete?: (domainId: string) => Promise<void>;
  onFinished: (result: { domain: CustomDomain; connected: boolean; pending?: boolean }) => void;
}

const DEFAULT_PROVIDERS: DnsProviderCapability[] = [
  {
    id: "cloudflare",
    name: "Cloudflare",
    supportsAutoDns: true,
    supportsOAuth: false,
    logoUrl: "/dns-providers/cloudflare.svg",
    helpUrl: "https://developers.cloudflare.com/fundamentals/oauth/",
    blurb: "One click — authorize YOUR Cloudflare account and we add DNS for you."
  },
  {
    id: "other",
    name: "Manual",
    supportsAutoDns: false,
    supportsOAuth: false,
    logoUrl: "/dns-providers/default.svg",
    helpUrl: "https://www.google.com/search?q=how+to+add+CNAME+DNS+record",
    blurb: "Copy the CNAME or A records and add them at your DNS host yourself."
  }
];

function isDomainLive(domain: CustomDomain) {
  return domain.status === "Verified";
}

function progressIndex(phase: WizardPhase): number {
  if (phase === "domain") return 0;
  if (phase === "provider" || phase === "connect") return 1;
  if (phase === "verifying") return 2;
  if (phase === "manual") return 3;
  return 4;
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function friendlyDnsPendingError(hostname: string) {
  return `DNS for ${hostname} is not visible yet. Confirm the record below, wait about a minute, then check again.`;
}

function friendlyHttpsPendingError(hostname: string) {
  return `DNS looks good for ${hostname}. Secure HTTPS is still activating (usually 1–3 minutes). Keep this open and check again — you do not need to re-add DNS.`;
}

function friendlyDomainMissingError() {
  return "This setup was closed or removed. Click Cancel, then Connect Domain again.";
}

export default function ConnectDomainWizard({
  open,
  pages,
  linkedDomainsByPageId,
  platformConfig,
  resumeDomain,
  oauthBootstrap,
  onClose,
  onConnectDomain,
  onVerify,
  onDiscardIncomplete,
  onFinished
}: ConnectDomainWizardProps) {
  const discardingRef = useRef(false);
  const [phase, setPhase] = useState<WizardPhase>("domain");
  const [domainName, setDomainName] = useState("");
  const [pageId, setPageId] = useState("");
  const [pageSelectionConfirmed, setPageSelectionConfirmed] = useState(false);
  const [pendingPage, setPendingPage] = useState<BioPage | null>(null);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectedDomain, setConnectedDomain] = useState<CustomDomain | null>(null);
  const [analysis, setAnalysis] = useState<DomainAnalysis | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<DnsProviderId | "">("");
  const [preferredProviderId, setPreferredProviderId] = useState<string | null>(null);
  const [rememberProvider] = useState(true);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [dnsAutoProvisioned, setDnsAutoProvisioned] = useState(false);
  const [verifyAttempt, setVerifyAttempt] = useState(0);
  const [verifyMaxAttempts, setVerifyMaxAttempts] = useState(8);
  const [verifyStage, setVerifyStage] = useState(0);
  const [autoDnsReady, setAutoDnsReady] = useState(false);
  const [dnsConfirmed, setDnsConfirmed] = useState(false);
  const connectStartedRef = useRef(false);
  const verifyLoopIdRef = useRef(0);

  const firstAvailablePageId =
    pages.find((page) => page.status === "Live" && !linkedDomainsByPageId.has(page.id))?.id || "";
  const isResume = Boolean(resumeDomain);
  const isPreviewSession = isPreviewToken(getAccessToken());
  const previewSessionMessage =
    "You are in preview mode. Sign in with your email and password to connect a domain.";

  const providers = useMemo(() => {
    const raw = platformConfig?.dnsProviders?.length
      ? platformConfig.dnsProviders
      : DEFAULT_PROVIDERS;
    const cloudflare =
      raw.find((item) => item.id === "cloudflare") ||
      DEFAULT_PROVIDERS.find((item) => item.id === "cloudflare")!;
    const manual =
      raw.find((item) => item.id === "other") ||
      DEFAULT_PROVIDERS.find((item) => item.id === "other")!;
    return [
      { ...cloudflare, supportsAutoDns: true },
      {
        ...manual,
        name: "Manual",
        supportsAutoDns: false,
        blurb: "Copy the CNAME or A records and add them at your DNS host yourself."
      }
    ];
  }, [platformConfig]);

  const selectedProvider =
    providers.find((item) => item.id === selectedProviderId) ||
    DEFAULT_PROVIDERS.find((item) => item.id === selectedProviderId) ||
    null;

  // Reset wizard state only when the modal opens (or OAuth/resume handoff changes) —
  // never when page list updates mid-flow (that was bouncing users back to step 1).
  useEffect(() => {
    if (!open) return;
    if (resumeDomain) {
      setConnectedDomain(resumeDomain);
      setDomainName(resumeDomain.domainName);
      setPageId(resumeDomain.pageId || firstAvailablePageId);
      setPageSelectionConfirmed(Boolean(resumeDomain.pageId || firstAvailablePageId));
      setPendingPage(null);
      setSelectedProviderId(
        resumeDomain.dnsProviderId === "cloudflare" ? "cloudflare" : "other"
      );
      setPhase("verifying");
      void analyzeDomain(resumeDomain.domainName)
        .then(setAnalysis)
        .catch(() =>
          setAnalysis({
            domainName: resumeDomain.domainName,
            providerId: "unknown",
            providerName: "DNS host",
            nameservers: []
          })
        );
    } else if (oauthBootstrap?.domainName && oauthBootstrap.pageId) {
      setDomainName(oauthBootstrap.domainName);
      setPageId(oauthBootstrap.pageId);
      setPageSelectionConfirmed(true);
      setPendingPage(null);
      setConnectedDomain(null);
      setSelectedProviderId("cloudflare");
      setAutoDnsReady(oauthBootstrap.connected);
      setFormError(oauthBootstrap.error || "");
      setPhase(oauthBootstrap.connected ? "verifying" : "connect");
    } else {
      setPhase("domain");
      setDomainName("");
      setPageId("");
      setPageSelectionConfirmed(false);
      setPendingPage(null);
      setConnectedDomain(null);
      setAnalysis(null);
      setSelectedProviderId("");
    }
    if (!oauthBootstrap?.error) setFormError("");
    setVerifyError(null);
    setDnsAutoProvisioned(false);
    setVerifyAttempt(0);
    setVerifyMaxAttempts(8);
    setVerifyStage(0);
    if (!oauthBootstrap) {
      setAutoDnsReady(false);
    }
    connectStartedRef.current = false;

    void fetchDomainPreferences()
      .then((prefs) => {
        const preferred =
          prefs.preferredDnsProvider === "cloudflare" ? "cloudflare" : prefs.preferredDnsProvider ? "other" : null;
        setPreferredProviderId(preferred);
        if (!resumeDomain && !oauthBootstrap && preferred) {
          setSelectedProviderId(preferred as DnsProviderId);
        }
        // Never treat a saved Cloudflare token as a global "Connected" shortcut —
        // each Connect Domain run must Approve in Cloudflare again.
      })
      .catch(() => {
        /* preferences optional */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- firstAvailablePageId only for initial resume seed
  }, [open, resumeDomain, oauthBootstrap]);

  useEffect(() => {
    if (!open || phase !== "verifying" || connectStartedRef.current) return;
    connectStartedRef.current = true;

    // Domain row already exists (Manual "check again", resume) — only verify, never re-open Connect.
    if (connectedDomain) {
      void runVerifyLoop(connectedDomain);
      return;
    }
    if (!pageId || !pageSelectionConfirmed || !selectedProviderId) {
      connectStartedRef.current = false;
      return;
    }
    void runConnectFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase, isResume, connectedDomain?.id, pageId, pageSelectionConfirmed, selectedProviderId]);

  const activeHostname = connectedDomain?.domainName || normaliseHostname(domainName);
  const dnsSet = useMemo(() => {
    if (!platformConfig || !activeHostname) return null;
    return buildDnsRecordSet(activeHostname, platformConfig.aRecordTarget, {
      cnameTarget: platformConfig.cnameTarget
    });
  }, [activeHostname, platformConfig]);

  const inputPreview = useDomainInputPreview(domainName, dnsSet, phase === "domain" && !isResume);
  const dnsRecords = useMemo(() => (dnsSet ? dnsSet.records : []), [dnsSet]);
  const providerBranding = getProviderBranding(
    selectedProviderId === "cloudflare"
      ? "cloudflare"
      : analysis?.providerId && analysis.providerId !== "unknown"
        ? analysis.providerId
        : selectedProviderId || "other",
    selectedProvider?.name || analysis?.providerName || "your DNS host"
  );

  const requestPageSelection = (page: BioPage) => setPendingPage(page);
  const confirmPageSelection = () => {
    if (!pendingPage) return;
    setPageId(pendingPage.id);
    setPageSelectionConfirmed(true);
    setPendingPage(null);
    setFormError("");
  };
  const cancelPageSelection = () => setPendingPage(null);

  const discardIncompleteAndClose = async () => {
    if (discardingRef.current) return;
    discardingRef.current = true;
    const draft = connectedDomain;
    try {
      if (draft && !isDomainLive(draft) && onDiscardIncomplete) {
        await onDiscardIncomplete(draft.id);
      }
    } catch {
      /* best-effort cleanup */
    } finally {
      setConnectedDomain(null);
      onClose();
      discardingRef.current = false;
    }
  };

  const runVerifyLoop = async (domain: CustomDomain) => {
    const loopId = ++verifyLoopIdRef.current;
    // DNS checks first; once DNS is OK we wait longer for HTTPS/LIVE.
    let maxAttempts = 18;
    setVerifyMaxAttempts(maxAttempts);
    setVerifyStage(1);
    setVerifyAttempt(1);
    setIsSubmitting(true);
    setVerifyError(null);

    let sawDnsOk = dnsConfirmed;
    let lastHostname = domain.domainName;

    try {
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        if (verifyLoopIdRef.current !== loopId) return;

        const stepNum = attempt + 1;
        setVerifyAttempt(stepNum);
        try {
          const verifyResult = await onVerify(domain.id, { skipPageSync: true });
          if (verifyLoopIdRef.current !== loopId) return;

          const updated = verifyResult.domain;
          lastHostname = updated.domainName;
          setConnectedDomain(updated);

          const dnsOk = Boolean(verifyResult.dns?.verified || updated.dnsVerifiedAt);
          if (dnsOk) {
            sawDnsOk = true;
            setDnsConfirmed(true);
            setVerifyStage(2);
            // Give HTTPS more time once DNS is confirmed.
            if (maxAttempts < 24) {
              maxAttempts = 24;
              setVerifyMaxAttempts(maxAttempts);
            }
          }
          if (
            updated.status === "Provisioning SSL" ||
            updated.status === "DNS Verified" ||
            updated.sslStatus === "active" ||
            updated.sslStatus === "pending" ||
            updated.sslStatus === "edge"
          ) {
            setVerifyStage(3);
          }
          if (updated.sslStatus === "active" || updated.sslStatus === "edge" || updated.status === "Verified") {
            setVerifyStage(4);
          }
          if (updated.status === "Verified") {
            setVerifyStage(5);
            setVerifyError(null);
            setPhase("success");
            return;
          }

          if (attempt < maxAttempts - 1) {
            await sleep(sawDnsOk ? 4000 : 5000);
          } else if (sawDnsOk) {
            // DNS is fine — do NOT send users back to "add DNS" with a red DNS error.
            setVerifyError(friendlyHttpsPendingError(lastHostname));
            setPhase("verifying");
            setVerifyStage(3);
          } else if (selectedProviderId === "other") {
            // Manual path only — show CNAME/A copy steps again.
            setVerifyError(friendlyDnsPendingError(lastHostname));
            setPhase("manual");
          } else {
            setVerifyError(friendlyDnsPendingError(lastHostname));
            setPhase("verifying");
          }
        } catch (error) {
          if (verifyLoopIdRef.current !== loopId) return;
          const message = error instanceof Error ? error.message : "";
          const errorCode =
            error && typeof error === "object" && "code" in error
              ? String((error as { code?: string }).code || "")
              : "";
          const missing =
            errorCode === "DOMAIN_NOT_FOUND" ||
            /not found|removed or expired/i.test(message);

          if (missing) {
            setVerifyError(friendlyDomainMissingError());
            setPhase("verifying");
            return;
          }

          if (attempt >= maxAttempts - 1) {
            setVerifyError(
              sawDnsOk
                ? friendlyHttpsPendingError(lastHostname)
                : message || friendlyDnsPendingError(lastHostname)
            );
            // Manual DNS copy screen only after the user chose Manual on the provider step.
            if (!sawDnsOk && selectedProviderId === "other") {
              setPhase("manual");
            } else {
              setPhase("verifying");
            }
          } else {
            await sleep(sawDnsOk ? 4000 : 5000);
          }
        }
      }
    } finally {
      if (verifyLoopIdRef.current === loopId) {
        setIsSubmitting(false);
      }
    }
  };

  const runConnectFlow = async () => {
    const hostname = normaliseHostname(domainName);
    setIsSubmitting(true);
    setVerifyError(null);
    setVerifyStage(0);
    setDnsConfirmed(false);

    try {
      // Multi-tenant: customer OAuth token only (set after Approve this session).
      let result: DomainConnectResult;
      try {
        result = await onConnectDomain(hostname, pageId, {
          dnsProviderId: selectedProviderId || "other",
          rememberProvider
        });
      } catch (connectError) {
        const message =
          connectError instanceof Error ? connectError.message : "Could not connect this domain.";
        // Stale incomplete row from a cancelled setup — remove and retry once.
        if (/already connected|already exists|DOMAIN_EXISTS/i.test(message) && onDiscardIncomplete) {
          try {
            const existing = await import("../../lib/domainApi").then((mod) => mod.fetchDomains());
            const stale = existing.find(
              (item) =>
                item.domainName === hostname &&
                item.status !== "Verified"
            );
            if (stale) {
              await onDiscardIncomplete(stale.id);
              result = await onConnectDomain(hostname, pageId, {
                dnsProviderId: selectedProviderId || "other",
                rememberProvider
              });
            } else {
              throw connectError;
            }
          } catch {
            throw connectError;
          }
        } else {
          throw connectError;
        }
      }
      setConnectedDomain(result.domain);
      setDnsAutoProvisioned(Boolean(result.dnsAutoProvisioned));
      setVerifyStage(1);

      if (result.dnsAutoProvisioned) {
        setVerifyStage(2);
        await runVerifyLoop(result.domain);
        return;
      }

      // Customer zone not on platform token → send them to Cloudflare approve (no token paste).
      if (
        selectedProviderId === "cloudflare" &&
        (result.needsOAuth || result.oauthAuthorizeUrl) &&
        result.oauthAuthorizeUrl
      ) {
        window.location.href = result.oauthAuthorizeUrl;
        return;
      }

      if (selectedProviderId === "cloudflare") {
        const provisionMsg = result.dnsProvisionMessage || "";
        const zoneMissing =
          result.needsOAuth ||
          Boolean(result.oauthAuthorizeUrl) ||
          /no matching cloudflare zone|not in the cloudflare account|owns this domain/i.test(
            provisionMsg
          );

        // Wrong Cloudflare account approved (domain not in that account) → force Sign in again.
        if (zoneMissing) {
          if (provisionMsg) window.alert(provisionMsg);
          if (result.oauthAuthorizeUrl) {
            window.location.href = result.oauthAuthorizeUrl;
            return;
          }
          try {
            const begin = await beginCloudflareConnect(hostname, pageId);
            if (begin.mode === "oauth" && begin.authorizeUrl) {
              if (begin.accountMismatch && begin.message) window.alert(begin.message);
              window.location.href = begin.authorizeUrl;
              return;
            }
          } catch {
            /* fall through */
          }
        }

        // Not yet approved this session → Cloudflare Authorize / Sign in.
        if (!autoDnsReady) {
          try {
            const begin = await beginCloudflareConnect(hostname, pageId);
            if (begin.mode === "oauth" && begin.authorizeUrl) {
              if (begin.accountMismatch && begin.message) window.alert(begin.message);
              window.location.href = begin.authorizeUrl;
              return;
            }
          } catch {
            /* stay on Connect Cloudflare */
          }
        }
        setFormError(
          provisionMsg ||
            "We couldn't update DNS automatically. Try Connect Cloudflare again, or go back and choose Manual."
        );
        setPhase("connect");
        return;
      }

      // Manual was chosen on the provider step — show CNAME/A copy steps.
      if (selectedProviderId === "other") {
        setPhase("manual");
        return;
      }
      setPhase("provider");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not connect this domain.");
      setPhase("provider");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDomain = (event: FormEvent) => {
    event.preventDefault();
    if (isPreviewSession) {
      setFormError(previewSessionMessage);
      return;
    }
    const hostname = normaliseHostname(domainName);
    const domainError = customDomainValidationError(hostname);
    if (domainError) {
      setFormError(domainError);
      return;
    }
    if (!isValidHostname(hostname)) {
      setFormError("Enter a website address like yourdomain.com or name.yourdomain.com.");
      return;
    }
    if (!pageId || !pageSelectionConfirmed) {
      setFormError("Choose which page should open, then confirm with Yes.");
      return;
    }
    const linkedDomain = linkedDomainsByPageId.get(pageId);
    // Same hostname incomplete/live on this page → continue (server resumes). Only block a different LIVE domain.
    if (linkedDomain && normaliseHostname(linkedDomain.domainName) !== hostname) {
      if (linkedDomain.status === "Verified") {
        setFormError(
          `Pick a different bio page — this one already opens ${linkedDomain.domainName}. ` +
            `Or remove ${linkedDomain.domainName} from Custom Domains first.`
        );
        return;
      }
      // Incomplete ghost on another hostname — server clears it; allow continue.
    }

    setFormError("");
    void analyzeDomain(hostname)
      .then((result) => {
        setAnalysis(result);
        if (!selectedProviderId && result.providerId === "cloudflare") {
          setSelectedProviderId("cloudflare");
        } else if (!selectedProviderId && preferredProviderId === "cloudflare") {
          setSelectedProviderId("cloudflare");
        } else if (!selectedProviderId) {
          setSelectedProviderId("other");
        }
      })
      .catch(() => undefined);
    setPhase("provider");
  };

  /** Manual path: create the domain row, then show CNAME/A records immediately. */
  const startManualDnsSetup = async () => {
    const hostname = normaliseHostname(domainName);
    const linkedDomain = linkedDomainsByPageId.get(pageId);
    if (
      linkedDomain &&
      normaliseHostname(linkedDomain.domainName) !== hostname &&
      linkedDomain.status === "Verified"
    ) {
      setFormError(
        `Pick a different bio page — this one already opens ${linkedDomain.domainName}. ` +
          `Or remove ${linkedDomain.domainName} from Custom Domains first.`
      );
      setPhase("domain");
      return;
    }

    setFormError("");
    setVerifyError(null);
    setIsSubmitting(true);
    connectStartedRef.current = true;
    try {
      let result: DomainConnectResult;
      try {
        result = await onConnectDomain(hostname, pageId, {
          dnsProviderId: "other",
          rememberProvider
        });
      } catch (connectError) {
        const message =
          connectError instanceof Error ? connectError.message : "Could not connect this domain.";
        const pageTaken =
          /PAGE_DOMAIN_TAKEN|already opens|page is already connected|bio page already/i.test(message);
        if (pageTaken) {
          setFormError(
            message.includes("already")
              ? message
              : "Pick a different bio page — this one already has a custom domain."
          );
          setPhase("domain");
          connectStartedRef.current = false;
          return;
        }
        if (/already exists|DOMAIN_EXISTS|hostname is already connected/i.test(message) && onDiscardIncomplete) {
          try {
            const existing = await import("../../lib/domainApi").then((mod) => mod.fetchDomains());
            const stale = existing.find(
              (item) => item.domainName === hostname && item.status !== "Verified"
            );
            if (stale) {
              await onDiscardIncomplete(stale.id);
              result = await onConnectDomain(hostname, pageId, {
                dnsProviderId: "other",
                rememberProvider
              });
            } else {
              throw connectError;
            }
          } catch {
            throw connectError;
          }
        } else {
          throw connectError;
        }
      }
      setConnectedDomain(result.domain);
      setDnsAutoProvisioned(false);
      setSelectedProviderId("other");
      setPhase("manual");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not start manual DNS setup.";
      if (/already connected|PAGE_DOMAIN_TAKEN|already opens/i.test(message)) {
        setFormError(message);
        setPhase("domain");
      } else {
        setFormError(message);
        setPhase("provider");
      }
      connectStartedRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const chooseProvider = async (provider: DnsProviderCapability) => {
    setSelectedProviderId(provider.id);
    setFormError("");
    try {
      await saveDomainPreferences(provider.id);
      setPreferredProviderId(provider.id);
    } catch {
      /* optional */
    }

    if (provider.id === "cloudflare") {
      // Show Connect Cloudflare → user taps button → Cloudflare login / permissions.
      setPhase("connect");
      return;
    }

    await startManualDnsSetup();
  };

  const submitCloudflareConnect = async () => {
    setFormError("");
    setIsSubmitting(true);
    try {
      const hostname = normaliseHostname(domainName);
      const linkedDomain = linkedDomainsByPageId.get(pageId);
      if (
        linkedDomain &&
        normaliseHostname(linkedDomain.domainName) !== hostname &&
        linkedDomain.status === "Verified"
      ) {
        setFormError(
          `Pick a different bio page — this one already opens ${linkedDomain.domainName}.`
        );
        setPhase("domain");
        return;
      }

      // Always Cloudflare OAuth after Connect Cloudflare (permission required).
      // Same account → Approve only; other account's domain → Sign in + alert.
      const begin = await beginCloudflareConnect(hostname, pageId);
      if (begin.mode === "oauth" && begin.authorizeUrl) {
        setAutoDnsReady(false);
        if (begin.accountMismatch && begin.message) {
          window.alert(begin.message);
        } else if (begin.message) {
          setFormError(begin.message);
        }
        window.location.href = begin.authorizeUrl;
        return;
      }

      setAutoDnsReady(false);
      const serverMsg =
        begin.mode === "manual" && "message" in begin ? String(begin.message || "") : "";
      setFormError(
        serverMsg ||
          "Could not start Cloudflare approve. Go back and choose Manual, or try Connect Cloudflare again."
      );
      setPhase("connect");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not start Cloudflare connect.";
      if (/already connected|PAGE_DOMAIN_TAKEN|already opens/i.test(message)) {
        setFormError(
          message.includes("already")
            ? message
            : "That bio page already has a custom domain. Pick a different page."
        );
        setPhase("domain");
        return;
      }
      setFormError(message);
      setPhase("connect");
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishWizard = () => {
    const domainRecord = connectedDomain;
    if (domainRecord) {
      const live = isDomainLive(domainRecord);
      onFinished({ domain: domainRecord, connected: live, pending: !live });
      return;
    }
    onClose();
  };

  if (!open) return null;

  const dnsZoneDomain = getDnsZoneDomain(activeHostname);
  const domainKind = getCustomDomainKind(activeHostname);
  const activeDot = progressIndex(phase);
  const cnameTarget = platformConfig?.cnameTarget || "keylink360.mindflo.today";

  return (
    <div className="key-modal-backdrop key-workflow-modal-backdrop">
      <div className="key-domain-wizard key-domain-wizard--onboarding animate-in fade-in zoom-in-95 duration-200">
        <header className="key-domain-wizard__header">
          {phase !== "domain" && phase !== "success" && phase !== "verifying" && (
            <button
              type="button"
              className="key-domain-wizard__back"
              onClick={() => {
                if (phase === "provider") setPhase("domain");
                else if (phase === "connect") {
                  setFormError("");
                  setPhase("provider");
                } else if (phase === "manual") {
                  // Keep the setup — back to waiting, do not delete the domain.
                  setFormError("");
                  setPhase(dnsConfirmed ? "verifying" : "provider");
                }
              }}
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="key-domain-wizard__progress" aria-hidden>
            {[0, 1, 2, 3, 4].map((index) => (
              <span
                key={index}
                className={`key-domain-wizard__dot ${index <= activeDot ? "is-active" : ""} ${
                  index === activeDot ? "is-current" : ""
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            className="key-domain-wizard__close"
            onClick={() => {
              if (phase === "success") {
                void finishWizard();
                return;
              }
              if (phase === "verifying" || phase === "manual" || connectedDomain) {
                void discardIncompleteAndClose();
                return;
              }
              onClose();
            }}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {phase === "domain" && (
          <form onSubmit={submitDomain} className="key-domain-wizard__body">
            <div className="key-domain-wizard__hero">
              <div className="key-domain-wizard__hero-icon">
                <Globe className="h-7 w-7" />
              </div>
              <h2 className="key-domain-wizard__title">Connect your domain</h2>
              <p className="key-domain-wizard__lead">
                Use your own website address for your bio page. No technical setup needed — we guide you.
              </p>
            </div>

            {isPreviewSession && (
              <div className="key-domain-wizard__alert" role="status">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{previewSessionMessage}</span>
              </div>
            )}

            <label className="key-domain-wizard__label" htmlFor="wizard-domain">
              Your website address
            </label>
            <input
              id="wizard-domain"
              autoFocus
              value={domainName}
              onChange={(event) => setDomainName(event.target.value)}
              placeholder="name.yourdomain.com"
              className="key-domain-wizard__input"
            />
            {inputPreview.isValid && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                  Looks good
                </span>
                {inputPreview.kindLabel && (
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                    {inputPreview.kindLabel}
                  </span>
                )}
              </div>
            )}
            {inputPreview.validationError && domainName.trim() && (
              <p className="mt-2 text-xs text-rose-600">{inputPreview.validationError}</p>
            )}

            <div className="mt-4">
              <label className="key-domain-wizard__label">
                Which page should open on{" "}
                <strong>{inputPreview.normalized || "this address"}</strong>?
              </label>
              <SearchablePagePicker
                pages={pages}
                value={pageId}
                onChange={setPageId}
                linkedDomainsByPageId={linkedDomainsByPageId}
                connectingHostname={inputPreview.normalized || normaliseHostname(domainName)}
                onSelectAttempt={requestPageSelection}
              />
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Tip: Each bio page can open on only <strong>one</strong> custom domain. To connect
                another subdomain on the same root, pick a page that is not already linked. You can
                connect as many custom domains as you need.
              </p>
            </div>

            {formError && <p className="key-domain-wizard__error">{formError}</p>}

            <button
              type="submit"
              className="key-domain-wizard__primary"
              disabled={
                isPreviewSession ||
                !pageSelectionConfirmed ||
                !pageId ||
                !inputPreview.isValid ||
                isSubmitting
              }
            >
              Continue
            </button>
          </form>
        )}

        {phase === "provider" && (
          <div className="key-domain-wizard__body">
            <h2 className="key-domain-wizard__title">Where is your domain managed?</h2>
            <p className="key-domain-wizard__lead">
              Pick the company where you buy or manage <strong>{normaliseHostname(domainName)}</strong>.
              Not sure? Choose <strong>Manual</strong>.
            </p>
            {analysis?.providerName && analysis.providerId !== "unknown" && (
              <p className="key-domain-wizard__hint-pill">
                <Sparkles className="h-3.5 w-3.5" />
                We think this is {analysis.providerName}
              </p>
            )}
            {preferredProviderId && (
              <p className="mt-2 text-xs text-slate-500">
                Last used: {getProviderBranding(preferredProviderId).displayName}
              </p>
            )}

            <div className="key-provider-grid" role="list">
              {providers.map((provider) => {
                const selected = selectedProviderId === provider.id;
                const suggested =
                  provider.id === "cloudflare"
                    ? analysis?.providerId === "cloudflare"
                    : analysis?.providerId !== "cloudflare" &&
                      analysis?.providerId !== "unknown" &&
                      Boolean(analysis?.providerId) &&
                      provider.id === "other";
                return (
                  <button
                    key={provider.id}
                    type="button"
                    role="listitem"
                    disabled={isSubmitting}
                    className={`key-provider-card ${selected ? "is-selected" : ""} ${
                      suggested ? "is-suggested" : ""
                    }`}
                    onClick={() => void chooseProvider(provider)}
                  >
                    <span className="key-provider-card__logo-wrap" aria-hidden>
                      <img
                        src={provider.logoUrl}
                        alt=""
                        className="key-provider-card__logo"
                        width={42}
                        height={42}
                      />
                    </span>
                    <span className="key-provider-card__text">
                      <span className="key-provider-card__name">{provider.name}</span>
                      <span className="key-provider-card__blurb">{provider.blurb}</span>
                    </span>
                    {provider.supportsAutoDns && (
                      <span className="key-provider-card__badge">Auto setup</span>
                    )}
                  </button>
                );
              })}
            </div>
            {isSubmitting && (
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Preparing DNS records…
              </p>
            )}
            {formError && <p className="key-domain-wizard__error">{formError}</p>}
          </div>
        )}

        {phase === "connect" && selectedProvider && (
          <div className="key-domain-wizard__body">
            <div className="key-domain-wizard__hero">
              <img
                src={selectedProvider.logoUrl}
                alt=""
                className="key-domain-wizard__provider-logo"
              />
              <h2 className="key-domain-wizard__title">Connect Cloudflare</h2>
              <p className="key-domain-wizard__lead">
                Next you&apos;ll sign in to the Cloudflare account that owns{" "}
                <strong>{activeHostname || "your domain"}</strong>, then approve KEYLINK360. We add
                DNS automatically — no API token, no copy-paste.
              </p>
            </div>

            <div className="key-domain-wizard__auto-steps">
              <div>
                <ShieldCheck className="h-4 w-4" /> Approve Cloudflare (one click)
              </div>
              <div>
                <ShieldCheck className="h-4 w-4" /> We add DNS automatically
              </div>
              <div>
                <ShieldCheck className="h-4 w-4" /> Secure with HTTPS → LIVE
              </div>
            </div>

            {formError && <p className="key-domain-wizard__error">{formError}</p>}

            <button
              type="button"
              className="key-domain-wizard__primary"
              disabled={isSubmitting}
              onClick={() => void submitCloudflareConnect()}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Connect Cloudflare
            </button>
            <button
              type="button"
              className="key-domain-wizard__link mt-2"
              onClick={() => {
                setAutoDnsReady(false);
                setFormError("");
                setPhase("provider");
              }}
            >
              Back — choose Manual instead
            </button>
          </div>
        )}

        {phase === "verifying" && (
          <div className="key-domain-wizard__body key-domain-wizard__body--center">
            <div className="key-domain-wizard__provider-logo-wrap mb-3">
              <img
                src={providerBranding.logoUrl}
                alt=""
                className="key-domain-wizard__provider-logo-img"
                width={140}
                height={40}
              />
            </div>
            <h2 className="key-domain-wizard__title">Setting up {activeHostname}</h2>
            <p className="key-domain-wizard__lead">
              {isSubmitting
                ? `Checking… (${verifyAttempt}/${verifyMaxAttempts})`
                : verifyError
                  ? "Almost there — HTTPS is still finishing"
                  : "Starting setup…"}
            </p>
            <ul className="key-domain-wizard__checklist key-domain-wizard__checklist--pretty">
              {[
                "Checking DNS…",
                "DNS found",
                "Waiting for secure HTTPS…",
                "HTTPS ready",
                "LIVE"
              ].map((label, index) => {
                const done = verifyStage > index;
                const current = isSubmitting && verifyStage === index;
                return (
                  <li key={label} className={done ? "is-done" : current ? "is-current" : ""}>
                    {done ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : current ? (
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                    ) : (
                      <span className="inline-block h-4 w-4 rounded-full bg-slate-200" />
                    )}
                    {label}
                  </li>
                );
              })}
            </ul>
            {dnsAutoProvisioned && (
              <p className="mt-3 text-xs font-medium text-emerald-700">DNS updated automatically</p>
            )}
            {verifyError && <p className="key-domain-wizard__error mt-3">{verifyError}</p>}
            {!isSubmitting && verifyError && connectedDomain && (
              <button
                type="button"
                className="key-domain-wizard__primary mt-3"
                onClick={() => {
                  connectStartedRef.current = true;
                  setVerifyError(null);
                  void runVerifyLoop(connectedDomain);
                }}
              >
                Check again
              </button>
            )}
            {!isSubmitting && verifyError && selectedProviderId === "cloudflare" && (
              <button
                type="button"
                className="key-domain-wizard__link mt-2"
                onClick={() => {
                  setVerifyError(null);
                  setFormError("");
                  setPhase("provider");
                }}
              >
                Back — choose Manual instead
              </button>
            )}
            <p className="mt-4 text-center text-xs text-slate-500">
              {dnsConfirmed
                ? "DNS is done. Waiting for HTTPS can take 1–3 minutes — keep this open."
                : "Please wait — your domain appears on Custom Domains only after LIVE is complete."}
            </p>
            <button
              type="button"
              className="key-domain-wizard__link mt-3"
              onClick={() => void discardIncompleteAndClose()}
            >
              Cancel setup
            </button>
          </div>
        )}

        {phase === "manual" && dnsSet && (
          <div className="key-domain-wizard__body">
            <div className="key-domain-wizard__info-banner">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>One easy step at {providerBranding.displayName}</span>
            </div>

            <h2 className="key-domain-wizard__title">Add this record</h2>
            <p className="key-domain-wizard__lead">
              Open your domain settings for <strong>{dnsZoneDomain}</strong>, then copy the values below.
              You don&apos;t need to understand DNS — just match Type, Name, and Value.
            </p>

            {domainKind === "subdomain" && (
              <p className="key-domain-wizard__lead mt-2 text-sm">
                Type <strong>CNAME</strong> · Name{" "}
                <strong>{dnsSet.records[0]?.hostDisplay}</strong> · Value <strong>{cnameTarget}</strong>
              </p>
            )}
            {domainKind === "root" && (
              <p className="key-domain-wizard__lead mt-2 text-sm">
                Type <strong>A</strong> · Name <strong>@</strong> · Value{" "}
                <strong>{platformConfig?.aRecordTarget}</strong>
              </p>
            )}

            <DnsRecordsTable records={dnsRecords} readOnly />

            <div className="key-domain-wizard__help-row">
              {selectedProvider?.helpUrl && (
                <a
                  href={selectedProvider.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="key-domain-wizard__help-chip"
                >
                  Open {providerBranding.displayName} guide <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <a
                href="https://www.youtube.com/results?search_query=how+to+add+cname+record"
                target="_blank"
                rel="noopener noreferrer"
                className="key-domain-wizard__help-chip"
              >
                Video guide <ExternalLink className="h-3 w-3" />
              </a>
              <button
                type="button"
                className="key-domain-wizard__help-chip"
                onClick={() => window.open("/#/contact-support", "_self")}
              >
                <MessageCircle className="h-3 w-3" /> Need help?
              </button>
            </div>

            {verifyError && <p className="key-domain-wizard__error">{verifyError}</p>}
            {dnsAutoProvisioned && !verifyError && (
              <p className="mt-2 text-xs text-slate-600">
                We already tried to add this automatically. If check again still fails, confirm the
                record in Cloudflare is <strong>DNS only</strong> (gray cloud), not Proxied.
              </p>
            )}

            <button
              type="button"
              disabled={isSubmitting || !connectedDomain}
              className="key-domain-wizard__primary"
              onClick={() => {
                if (!connectedDomain || isSubmitting) return;
                // Keep connectStartedRef true so the verifying effect does not restart Connect Domain.
                connectStartedRef.current = true;
                setVerifyError(null);
                setPhase("verifying");
                void runVerifyLoop(connectedDomain);
              }}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? "Checking…" : "I added it — check again"}
            </button>
            <button
              type="button"
              className="key-domain-wizard__link mt-2"
              onClick={() => void discardIncompleteAndClose()}
            >
              Cancel setup
            </button>
          </div>
        )}

        {phase === "success" && (
          <div className="key-domain-wizard__body key-domain-wizard__body--center">
            <div className="key-domain-wizard__success-icon">
              <Check className="h-8 w-8" />
            </div>
            <h2 className="key-domain-wizard__title">All connected successfully</h2>
            <p className="key-domain-wizard__lead">
              <strong>{activeHostname}</strong> is LIVE and ready. Tap OK to return to your Custom
              Domains list.
            </p>
            {pageId && (
              <p className="key-domain-wizard__lead mt-4">
                Opens: <strong>{pages.find((page) => page.id === pageId)?.title || "Your bio page"}</strong>
              </p>
            )}
            <button
              type="button"
              disabled={!connectedDomain}
              className="key-domain-wizard__primary"
              onClick={() => void finishWizard()}
            >
              OK
            </button>
          </div>
        )}
      </div>

      {pendingPage && (
        <div className="key-modal-backdrop key-page-confirm-backdrop">
          <div
            className="key-domain-remove-dialog animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-bold text-slate-950">Confirm page selection</h3>
            <p className="mt-2 text-sm text-slate-600">
              Should <strong>{pendingPage.title}</strong> open when visitors go to{" "}
              <strong>{inputPreview.normalized || normaliseHostname(domainName)}</strong>?
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={cancelPageSelection} className="key-domain-remove-dialog__cancel">
                No
              </button>
              <button type="button" onClick={confirmPageSelection} className="key-domain-wizard__primary flex-1">
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
