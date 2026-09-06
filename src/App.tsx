import React, { useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ScreenId, UserProfile, BioPage, Contact, WhatsAppCampaign, WhatsAppTemplate, SmartLink, LinkRotator, QRCodeItem, TemplateItem, IntegrationItem, IntegrationVote, TrackingPixel, MediaFile, CustomDomain, PlatformSubdomain, HelpArticle, BioPageDraft, BioPageTemplate, BioEditorBlock, AppNotification, PublishSettings } from "./types";
import {
  initialUser,
  initialBioPages,
  initialContacts,
  initialWhatsAppCampaigns,
  initialWhatsAppTemplates,
  initialQRCodes,
  initialTemplates,
  initialIntegrations,
  initialVotes,
  initialTrackingPixels,
  initialMediaFiles,
  initialHelpArticles
} from "./data";

// Import modular screens
import Sidebar from "./components/Sidebar";
import MobileNavDrawer from "./components/MobileNavDrawer";
import Header from "./components/Header";
import LoginScreen from "./components/LoginScreen";
import LoggedInLoginPrompt from "./components/LoggedInLoginPrompt";
import NotFoundScreen from "./components/NotFoundScreen";
import LandingPage from "./components/LandingPage";
import {
  AuthUser,
  clearAuthSession,
  fetchAuthConfig,
  fetchMe,
  getAccessToken,
  getLastActivity,
  getStoredAuthUser,
  isPreviewToken,
  logoutRequest,
  touchActivity
} from "./lib/authApi";
import { apiUrl } from "./lib/apiBase";
import {
  isPlatformHostname,
  resolveBrandedDomain,
  stripPreviewQueryFromUrl
} from "./lib/customDomain";
import {
  connectDomain,
  deleteDomain,
  fetchDomains,
  patchDomainPage,
  verifyDomain
} from "./lib/domainApi";
import { syncPublishPrimaryUrlForVerifiedDomain } from "./lib/publishDomainSync";
import { fetchPlatformSubdomains } from "./lib/platformSubdomainApi";
import { fetchLinkRotators } from "./lib/linkRotatorApi";
import { fetchShortLinks } from "./lib/shortLinkApi";
import DashboardScreen from "./components/DashboardScreen";
import BioPagesScreen from "./components/BioPagesScreen";
import ContactsScreen from "./components/ContactsScreen";
import WhatsAppScreen from "./components/WhatsAppScreen";
import LinksScreen from "./components/LinksScreen";
import LinkRotatorScreen from "./components/LinkRotatorScreen";
import QRCodesScreen from "./components/QRCodesScreen";
import PublicQrScanRedirect from "./components/PublicQrScanRedirect";
import TemplatesScreen from "./components/TemplatesScreen";
import IntegrationsScreen from "./components/IntegrationsScreen";
import PixelsScreen from "./components/PixelsScreen";
import MediaLibraryScreen from "./components/MediaLibraryScreen";
import CustomDomainsScreen from "./components/CustomDomainsScreen";
import HelpCenterScreen from "./components/HelpCenterScreen";
import ContactSupportScreen from "./components/ContactSupportScreen";
import AccountScreen from "./components/AccountScreen";
import SuperAdminScreen from "./components/SuperAdminScreen";
import PublicBioPageView from "./components/PublicBioPageView";
import PublishModal from "./components/PublishModal";
import {
  cloneBlocks,
  DEFAULT_COVER,
  deleteDraftByPageId,
  getAllDrafts,
  getAllUserTemplates,
  getTemplateEditorPayload,
  normalizeDraft,
  normalizeTemplate,
  persistDrafts,
  persistTemplates,
  persistPagePreviewStorage,
  fetchServerTemplates,
  fetchWorkspaceExport,
  mergeDrafts,
  mergeTemplates,
  persistAndSyncDrafts,
  persistAndSyncTemplates,
  persistDraftsLocalCache,
  persistTemplatesLocalCache,
  syncAllLocalPageDocumentsToServer,
  syncLocalPageDocumentToServer,
  deleteTemplateOnServer,
  pruneLocalBioCache,
  createUniquePageId,
} from "./storage/bioBuilderStorage";
import {
  getAllNotifications,
  getUnreadCount,
  prependNotification,
  markNotificationRead,
  markAllNotificationsRead,
  CreateNotificationInput
} from "./storage/notificationStorage";
import { getPublishSettings, persistPublishSettings, PRIMARY_DOMAIN } from "./storage/publishStorage";
import { AppTheme, getStoredTheme, saveTheme } from "./lib/themeStorage";
import { getBlankTemplate, resolveSystemTemplate } from "./lib/systemTemplates";
import { APP_ROUTE_ENTRIES, formatDocumentTitle, getScreenTitle, pathToScreen, screenToPath } from "./navigation";
import {
  buildFixedQrScanUrl,
  buildQrImageUrl,
  ensureStableQrPayload,
  generateQrPublicCode
} from "./lib/qrCodes";

const USER_PROFILE_STORAGE_KEY = "keylink360_user_profile";

function writeLocalStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      pruneLocalBioCache();
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return;
      } catch {
        console.warn(`Browser storage is full; skipped caching "${key}". Server remains the source of truth.`);
        return;
      }
    }
    console.warn(`Unable to persist "${key}" in browser storage.`, error);
  }
}

function readLocalStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function authenticatedHeaders(json = false): Record<string, string> {
  const token = getAccessToken();
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

function normalizeExternalUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isBrandedHost = !isPlatformHostname();

  React.useEffect(() => {
    pruneLocalBioCache();
  }, []);

  const [brandedPageId, setBrandedPageId] = useState<string | null>(null);
  const [brandedPageMeta, setBrandedPageMeta] = useState<{
    title?: string | null;
    slug?: string | null;
    bio?: string | null;
    coverPhoto?: string | null;
  } | null>(null);
  const [brandedResolveState, setBrandedResolveState] = useState<"pending" | "ready" | "missing">(
    isBrandedHost ? "pending" : "missing"
  );

  // Parse URL search parameters for standalone public preview on the platform host
  const urlParams = new URLSearchParams(window.location.search);
  const previewPageId = urlParams.get("previewPageId");
  /** Visit-page / custom-domain tabs must stay light — no workspace sync storms. */
  const isPublicSurface = Boolean(previewPageId) || isBrandedHost;

  React.useEffect(() => {
    if (!isBrandedHost) return;
    let cancelled = false;

    void (async () => {
      const resolved = await resolveBrandedDomain();
      if (cancelled) return;
      if (resolved?.pageId) {
        setBrandedPageId(resolved.pageId);
        setBrandedPageMeta({
          title: resolved.title,
          slug: resolved.slug,
          bio: resolved.bio,
          coverPhoto: resolved.coverPhoto
        });
        setBrandedResolveState("ready");
        stripPreviewQueryFromUrl();
      } else {
        setBrandedPageMeta(null);
        setBrandedResolveState("missing");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isBrandedHost]);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(getAccessToken() && getStoredAuthUser()));
  const [authBootstrapping, setAuthBootstrapping] = useState(() => Boolean(getAccessToken()));
  const [idleTimeoutMs, setIdleTimeoutMs] = useState(1000 * 60 * 30);

  const currentScreen = React.useMemo(
    () => pathToScreen(location.pathname) ?? (isLoggedIn ? ScreenId.DASHBOARD : ScreenId.LOGIN),
    [location.pathname, isLoggedIn]
  );
  const editPageIdFromUrl = searchParams.get("edit");
  const mainScrollRef = React.useRef<HTMLElement>(null);

  const resetMainScroll = React.useCallback(() => {
    const el = mainScrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
    el.scrollLeft = 0;
  }, []);

  React.useEffect(() => {
    resetMainScroll();
  }, [location.pathname, resetMainScroll]);
  const authVerifyToken = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("verifyToken") || "";
  }, []);
  const authResetToken = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("resetToken") || params.get("reset_token") || params.get("token") || "";
  }, []);
  const authEmailParam = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("email") || "";
  }, []);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [uiTheme, setUiTheme] = useState<AppTheme>(() => getStoredTheme());
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getAllNotifications());
  const lastAnalyticsEventIdRef = React.useRef<string | null>(null);
  
  // App state loaded from static files
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      return saved ? { ...initialUser, ...JSON.parse(saved) } : initialUser;
    } catch {
      return initialUser;
    }
  });
  const [publishSettings, setPublishSettings] = useState<PublishSettings>(() => getPublishSettings());
  const [pages, setPages] = useState<BioPage[]>(() => {
    return readLocalStorage("biolinks_pages_list", initialBioPages);
  });
  const [isPagesSyncReady, setIsPagesSyncReady] = useState(false);
  const [workspaceHydrated, setWorkspaceHydrated] = useState(false);

  // Dynamic Browser Tab Document Title sync across all pages & states
  React.useEffect(() => {
    if (isBrandedHost) {
      const title = brandedPageMeta?.title || "KeyLink360";
      document.title = formatDocumentTitle(title);
      return;
    }

    if (previewPageId) {
      const pageToPreview = pages.find((p) => p.id === previewPageId);
      const title = pageToPreview?.title || "BioLink";
      document.title = formatDocumentTitle(title);
      return;
    }

    if (!isLoggedIn) {
      if (location.pathname === "/login") {
        document.title = formatDocumentTitle("Sign In");
      } else {
        document.title = "KeyLink360";
      }
      return;
    }

    if (currentScreen === ScreenId.BIO_PAGES && editPageIdFromUrl) {
      const editingPage = pages.find((p) => p.id === editPageIdFromUrl);
      if (editingPage?.title) {
        document.title = formatDocumentTitle(`Editing ${editingPage.title}`);
        return;
      }
    }

    const screenTitle = getScreenTitle(currentScreen);
    document.title = formatDocumentTitle(screenTitle);
  }, [
    isBrandedHost,
    brandedPageMeta?.title,
    previewPageId,
    pages,
    isLoggedIn,
    currentScreen,
    editPageIdFromUrl
  ]);

  // Server state and sync for pages list & analytics metrics
  const [serverMetrics, setServerMetrics] = useState<{
    totalViews: number;
    totalClicks: number;
    totalRegisters: number;
    events: any[];
  } | null>(null);
  const [serverHealth, setServerHealth] = useState<"checking" | "online" | "offline">("checking");

  React.useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const accessToken = getAccessToken();
      if (!accessToken) {
        setIsLoggedIn(false);
        setAuthBootstrapping(false);
        return;
      }

      // Client preview sessions skip /api/auth/me so static hosts still restore UI.
      if (isPreviewToken(accessToken)) {
        const previewUser = getStoredAuthUser();
        if (previewUser) {
          setUser((prev) => ({
            ...prev,
            name: previewUser.name || prev.name,
            email: previewUser.email || prev.email,
            avatarUrl: previewUser.avatarUrl || prev.avatarUrl,
            plan: previewUser.plan || prev.plan,
            isVerified: previewUser.isVerified,
            mfaEnabled: previewUser.mfaEnabled
          }));
          setIsLoggedIn(true);
          touchActivity();
        } else {
          clearAuthSession("silent");
          setIsLoggedIn(false);
        }
        setAuthBootstrapping(false);
        return;
      }

      try {
        const { user: authUser } = await fetchMe();
        if (cancelled) return;
        setUser((prev) => ({
          ...prev,
          name: authUser.name || prev.name,
          email: authUser.email,
          avatarUrl: authUser.avatarUrl || prev.avatarUrl,
          plan: authUser.plan || prev.plan,
          isVerified: authUser.isVerified,
          mfaEnabled: authUser.mfaEnabled
        }));
        setIsLoggedIn(true);
        touchActivity();
      } catch {
        if (!cancelled) {
          clearAuthSession("silent");
          setIsLoggedIn(false);
        }
      } finally {
        if (!cancelled) setAuthBootstrapping(false);
      }
    }

    void restoreSession();
    void fetchAuthConfig()
      .then((cfg) => {
        if (!cancelled && cfg.idleTimeoutMs) setIdleTimeoutMs(cfg.idleTimeoutMs);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!isLoggedIn) return;

    const onActivity = () => touchActivity();
    const events: Array<keyof WindowEventMap> = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));

    const timer = window.setInterval(() => {
      const last = getLastActivity();
      if (last && Date.now() - last > idleTimeoutMs) {
        void handleLogout();
      }
    }, 30_000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, onActivity));
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, idleTimeoutMs]);

  React.useEffect(() => {
    if (isBrandedHost || previewPageId || authBootstrapping) return;

    const isPublicQrPath = /^\/q\/[^/]+\/?$/i.test(location.pathname);
    if (isPublicQrPath) return;

    const isPublicPath =
      location.pathname === "/" ||
      location.pathname === "/home" ||
      location.pathname === screenToPath(ScreenId.LOGIN) ||
      location.pathname.startsWith("/login");

    if (!isLoggedIn) {
      if (!isPublicPath) {
        navigate(screenToPath(ScreenId.LOGIN), { replace: true });
      }
    } else if (location.pathname === "/" || location.pathname === "/home") {
      navigate(screenToPath(ScreenId.DASHBOARD), { replace: true });
    }
  }, [authBootstrapping, isBrandedHost, isLoggedIn, location.pathname, navigate, previewPageId]);

  // CRM Hard Refresh Limit Rule (>5 full refreshes in CRM resets session & sends user to Home page)
  React.useEffect(() => {
    const isPublicPath =
      location.pathname === "/" ||
      location.pathname === "/home" ||
      location.pathname === screenToPath(ScreenId.LOGIN) ||
      location.pathname.startsWith("/login");

    if (!isPublicPath && (isLoggedIn || Boolean(getAccessToken()))) {
      const raw = sessionStorage.getItem("keylink_crm_hard_refresh_count");
      const count = raw ? parseInt(raw, 10) : 0;
      const next = count + 1;

      if (next > 5) {
        sessionStorage.removeItem("keylink_crm_hard_refresh_count");
        clearAuthSession("silent");
        setIsLoggedIn(false);
        setWorkspaceHydrated(false);
        navigate("/", { replace: true });
        return;
      }
      sessionStorage.setItem("keylink_crm_hard_refresh_count", String(next));
    } else if (isPublicPath) {
      sessionStorage.removeItem("keylink_crm_hard_refresh_count");
    }
  }, []);

  React.useEffect(() => {
    if (isLoggedIn) {
      sessionStorage.setItem("keylink360_session", JSON.stringify({ loggedIn: true }));
    } else {
      sessionStorage.removeItem("keylink360_session");
      sessionStorage.removeItem("keyslink_session");
    }
  }, [isLoggedIn]);

  React.useEffect(() => {
    try {
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error("Failed to save user profile:", error);
    }
  }, [user]);

  React.useEffect(() => {
    let isMounted = true;

    const checkServerHealth = async () => {
      try {
        const response = await fetch(apiUrl("/api/health"), { cache: "no-store" });
        if (!response.ok) throw new Error("Health check failed");

        const health = await response.json();
        if (isMounted) {
          setServerHealth(health.status === "ok" ? "online" : "offline");
        }
      } catch {
        if (isMounted) setServerHealth("offline");
      }
    };

    checkServerHealth();
    const interval = window.setInterval(checkServerHealth, 30_000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const pushNotification = React.useCallback((input: CreateNotificationInput) => {
    setNotifications((prev) => prependNotification(prev, input));
  }, []);

  const savePublishSettings = (settings: PublishSettings) => {
    setPublishSettings(settings);
    persistPublishSettings(settings);
  };

  const handleWebsitePublished = (settings: PublishSettings) => {
    savePublishSettings(settings);
    pushNotification({
      type: "general",
      title: "Website published",
      message: `Your website is available at ${settings.primaryUrl}.`,
      targetScreen: ScreenId.DASHBOARD
    });
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) => markNotificationRead(prev, id));
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => markAllNotificationsRead(prev));
  };

  const unreadNotificationCount = getUnreadCount(notifications);

  // Load shared templates from server on startup
  React.useEffect(() => {
    if (isPublicSurface || !isLoggedIn) return;
    fetchServerTemplates().then((remote) => {
      if (remote.length === 0) return;
      setSavedTemplates((local) => {
        const merged = mergeTemplates(local, remote);
        persistTemplates(merged);
        return merged;
      });
    });
  }, [isLoggedIn, isPublicSurface]);

  // Hydrate drafts, pages, and editor blocks from server (cross-device sync)
  React.useEffect(() => {
    if (isPublicSurface) return;
    if (!isLoggedIn || isPreviewToken(getAccessToken())) {
      setWorkspaceHydrated(false);
      return;
    }
    let cancelled = false;
    setWorkspaceHydrated(false);

    (async () => {
      const exported = await fetchWorkspaceExport();
      if (cancelled || !exported) {
        setWorkspaceHydrated(true);
        return;
      }

      if (Array.isArray(exported.bio_page_drafts) && exported.bio_page_drafts.length > 0) {
        setSavedDrafts((local) => {
          const normalized = exported.bio_page_drafts!.map((draft) =>
            normalizeDraft(draft as unknown as Record<string, unknown>)
          );
          const merged = mergeDrafts(local, normalized);
          persistDrafts(merged);
          return merged;
        });
      }

      if (Array.isArray(exported.pages) && exported.pages.length > 0) {
        setPages((localPages) => {
          const merged = new Map(localPages.map((page) => [page.id, page]));
          exported.pages!.forEach((page) => merged.set(page.id, page as unknown as BioPage));
          return Array.from(merged.values());
        });
      }

      if (exported.page_documents && typeof exported.page_documents === "object") {
        setPageBlocksMap((localMap) => {
          const next = { ...localMap };
          let changed = false;
          for (const [pageId, doc] of Object.entries(exported.page_documents!)) {
            if (!Array.isArray(doc.blocks) || doc.blocks.length === 0) continue;
            const localBlocks = localMap[pageId];
            if (Array.isArray(localBlocks) && localBlocks.length > 0) continue;
            next[pageId] = doc.blocks;
            changed = true;
            const page = exported.pages?.find((item) => item.id === pageId);
            if (doc.details && page?.slug) {
              persistPagePreviewStorage(pageId, page.slug, doc.blocks, doc.details);
            }
          }
          return changed ? next : localMap;
        });
      }

      setWorkspaceHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, isPublicSurface]);

  const didPushLocalPagesRef = React.useRef(false);
  React.useEffect(() => {
    if (isPublicSurface) return;
    if (!isLoggedIn || !workspaceHydrated || isPreviewToken(getAccessToken())) return;
    const toSync = pages.filter((page) => !page.isUncommitted);
    if (!toSync.length || didPushLocalPagesRef.current) return;
    didPushLocalPagesRef.current = true;
    void syncAllLocalPageDocumentsToServer(toSync);
  }, [isLoggedIn, workspaceHydrated, pages, isPublicSurface]);

  // Notify on new live analytics events (skip initial load)
  React.useEffect(() => {
    if (isPublicSurface) return;
    if (!serverMetrics?.events?.length) return;
    const latest = serverMetrics.events[0];
    if (!latest?.id) return;

    if (lastAnalyticsEventIdRef.current === null) {
      lastAnalyticsEventIdRef.current = latest.id;
      return;
    }

    if (latest.id === lastAnalyticsEventIdRef.current) return;
    lastAnalyticsEventIdRef.current = latest.id;

    const label = latest.eventLabel || "Page activity";
    pushNotification({
      type: "analytics_event",
      title: `New ${latest.eventType || "visit"}`,
      message: `${label} · ${latest.device || "Unknown device"} on ${latest.domain || "key.link"}`,
      targetScreen: ScreenId.DASHBOARD
    });
  }, [serverMetrics?.events, pushNotification]);

  // 1. Initial fetch of pages list and analytics from the server
  React.useEffect(() => {
    if (isPublicSurface) return;
    if (!isLoggedIn || isPreviewToken(getAccessToken())) return;

    async function loadInitialData() {
      try {
        // Fetch Pages List
        const pagesRes = await fetch(apiUrl("/api/pages"), {
          headers: authenticatedHeaders()
        });
        if (pagesRes.ok) {
          const remotePages = await pagesRes.json();
          if (remotePages && Array.isArray(remotePages) && remotePages.length > 0) {
            setPages((localPages) => {
              const merged = new Map(localPages.map((page) => [page.id, page]));
              remotePages.forEach((page: BioPage) => merged.set(page.id, page));
              return Array.from(merged.values());
            });
          } else {
            // Seed an empty server from the local workspace, not hardcoded demo data.
            await fetch(apiUrl("/api/pages"), {
              method: "POST",
              headers: authenticatedHeaders(true),
              body: JSON.stringify({ pages })
            });
          }
        }
      } catch (err) {
        console.error("Failed to load initial pages list from server:", err);
      } finally {
        setIsPagesSyncReady(true);
      }

      // Fetch Analytics metrics
      try {
        const analyticsRes = await fetch(apiUrl("/api/analytics"));
        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          const metrics = data?.metrics ?? {};
          setServerMetrics({
            totalViews: metrics.totalViews ?? 0,
            totalClicks: metrics.totalClicks ?? 0,
            totalRegisters: metrics.totalRegisters ?? 0,
            events: Array.isArray(data?.events) ? data.events : []
          });
        }
      } catch (err) {
        console.error("Failed to load analytics from server:", err);
      }
    }

    loadInitialData();

    // Poll for analytics updates every 30 seconds
    const interval = setInterval(() => {
      fetch(apiUrl("/api/analytics"))
        .then(res => res.json())
        .then(data => {
          const metrics = data?.metrics ?? {};
          setServerMetrics({
            totalViews: metrics.totalViews ?? 0,
            totalClicks: metrics.totalClicks ?? 0,
            totalRegisters: metrics.totalRegisters ?? 0,
            events: Array.isArray(data?.events) ? data.events : []
          });
        })
        .catch(err => console.error("Error polling analytics:", err));
    }, 30000);

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Persist only committed pages — template edits stay out of history until Save Draft / Publish
  const committedPages = React.useMemo(
    () => pages.filter((page) => !page.isUncommitted),
    [pages]
  );

  // Whenever pages list is updated, sync to Railway first, then optional local cache
  React.useEffect(() => {
    if (!isPagesSyncReady || !getAccessToken() || isPreviewToken(getAccessToken())) {
      writeLocalStorage("biolinks_pages_list", committedPages);
      return;
    }

    fetch(apiUrl("/api/pages"), {
      method: "POST",
      headers: authenticatedHeaders(true),
      body: JSON.stringify({ pages: committedPages })
    })
      .catch((err) => {
        console.error("Failed to save pages list to server:", err);
      })
      .finally(() => {
        writeLocalStorage("biolinks_pages_list", committedPages);
      });
  }, [committedPages, isPagesSyncReady]);

  const [contacts, setContacts] = useState<Contact[]>(() => readLocalStorage("keylink360_contacts", readLocalStorage("keyslink_contacts", initialContacts)));
  const [whatsAppCampaigns, setWhatsAppCampaigns] = useState<WhatsAppCampaign[]>(() =>
    readLocalStorage("keylink360_whatsapp_campaigns", readLocalStorage("keyslink_whatsapp_campaigns", initialWhatsAppCampaigns))
  );
  const [whatsAppTemplates, setWhatsAppTemplates] = useState<WhatsAppTemplate[]>(() =>
    readLocalStorage("keylink360_whatsapp_templates", readLocalStorage("keyslink_whatsapp_templates", initialWhatsAppTemplates))
  );
  const [links, setLinks] = useState<SmartLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [linksLoadError, setLinksLoadError] = useState<string | null>(null);
  const [qrCodes, setQrCodes] = useState<QRCodeItem[]>(() => {
    const raw = readLocalStorage("keylink360_qr_codes", readLocalStorage("keyslink_qr_codes", initialQRCodes));
    return (Array.isArray(raw) ? raw : initialQRCodes).map((item) => ensureStableQrPayload(item));
  });
  const [templates] = useState<TemplateItem[]>(initialTemplates);
  
  // Custom elevated states for draft and template persistence across pages/screens
  const [savedTemplates, setSavedTemplates] = useState<BioPageTemplate[]>(() => getAllUserTemplates());

  const [savedDrafts, setSavedDrafts] = useState<BioPageDraft[]>(() => getAllDrafts());

  const [pageBlocksMap, setPageBlocksMap] = useState<Record<string, any[]>>({});

  const [initialActiveEditPageId, setInitialActiveEditPageId] = useState<string | null>(null);
  const [initialActiveTemplateId, setInitialActiveTemplateId] = useState<string | null>(null);

  React.useEffect(() => {
    if (editPageIdFromUrl) {
      setInitialActiveEditPageId(editPageIdFromUrl);
    }
  }, [editPageIdFromUrl]);

  React.useEffect(() => {
    if (!isLoggedIn || isPreviewToken(getAccessToken())) {
      persistTemplatesLocalCache(savedTemplates);
      return;
    }
    void persistAndSyncTemplates(savedTemplates);
  }, [savedTemplates, isLoggedIn]);

  React.useEffect(() => {
    if (!isLoggedIn || isPreviewToken(getAccessToken()) || !workspaceHydrated) {
      persistDraftsLocalCache(savedDrafts);
      return;
    }
    void persistAndSyncDrafts(savedDrafts);
  }, [savedDrafts, isLoggedIn, workspaceHydrated]);

  React.useEffect(() => writeLocalStorage("keylink360_contacts", contacts), [contacts]);
  React.useEffect(() => writeLocalStorage("keylink360_whatsapp_campaigns", whatsAppCampaigns), [whatsAppCampaigns]);
  React.useEffect(() => writeLocalStorage("keylink360_whatsapp_templates", whatsAppTemplates), [whatsAppTemplates]);
  React.useEffect(() => writeLocalStorage("keylink360_qr_codes", qrCodes), [qrCodes]);

  const [integrations, setIntegrations] = useState<IntegrationItem[]>(() =>
    readLocalStorage("keylink360_integrations", readLocalStorage("keyslink_integrations", initialIntegrations))
  );
  const [votes, setVotes] = useState<IntegrationVote[]>(() =>
    readLocalStorage("keylink360_integration_votes", readLocalStorage("keyslink_integration_votes", initialVotes))
  );
  React.useEffect(() => writeLocalStorage("keylink360_integrations", integrations), [integrations]);
  React.useEffect(() => writeLocalStorage("keylink360_integration_votes", votes), [votes]);
  const [pixels, setPixels] = useState<TrackingPixel[]>(() =>
    readLocalStorage("keylink360_pixels", readLocalStorage("keyslink_pixels", initialTrackingPixels))
  );
  React.useEffect(() => writeLocalStorage("keylink360_pixels", pixels), [pixels]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(() =>
    readLocalStorage("keylink360_media_files", readLocalStorage("keyslink_media_files", initialMediaFiles))
  );
  React.useEffect(() => writeLocalStorage("keylink360_media_files", mediaFiles), [mediaFiles]);
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [domainsLoadError, setDomainsLoadError] = useState<string | null>(null);
  const [platformSubdomains, setPlatformSubdomains] = useState<PlatformSubdomain[]>([]);
  const [linkRotators, setLinkRotators] = useState<LinkRotator[]>([]);
  const [linkRotatorsLoading, setLinkRotatorsLoading] = useState(false);
  const [linkRotatorsLoadError, setLinkRotatorsLoadError] = useState<string | null>(null);

  const loadPlatformSubdomains = React.useCallback(async () => {
    if (!getAccessToken() || isPreviewToken(getAccessToken())) return;
    try {
      setPlatformSubdomains(await fetchPlatformSubdomains());
    } catch {
      setPlatformSubdomains([]);
    }
  }, []);

  const loadLinkRotators = React.useCallback(async () => {
    if (!getAccessToken() || isPreviewToken(getAccessToken())) return;
    setLinkRotatorsLoading(true);
    setLinkRotatorsLoadError(null);
    try {
      setLinkRotators(await fetchLinkRotators());
    } catch (error) {
      setLinkRotators([]);
      setLinkRotatorsLoadError(
        error instanceof Error ? error.message : "Unable to load link rotators."
      );
    } finally {
      setLinkRotatorsLoading(false);
    }
  }, []);

  const loadShortLinks = React.useCallback(async () => {
    if (!getAccessToken() || isPreviewToken(getAccessToken())) return;
    setLinksLoading(true);
    setLinksLoadError(null);
    try {
      setLinks(await fetchShortLinks());
    } catch (error) {
      setLinks([]);
      setLinksLoadError(error instanceof Error ? error.message : "Unable to load short links.");
    } finally {
      setLinksLoading(false);
    }
  }, []);

  const loadDomains = React.useCallback(async () => {
    if (!getAccessToken() || isPreviewToken(getAccessToken())) return;
    setDomainsLoading(true);
    setDomainsLoadError(null);
    try {
      const list = await fetchDomains();
      // Keep LIVE + incomplete: incomplete rows still occupy a bio page and must be
      // visible so users can remove ghost links (e.g. abandoned demo01printzyhub.com).
      const sorted = [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setDomains(sorted);
      const verified = sorted.filter((domain) => domain.status === "Verified");
      if (verified[0]) {
        const synced = syncPublishPrimaryUrlForVerifiedDomain(verified[0]);
        if (synced) savePublishSettings(synced);
      }
    } catch (error) {
      setDomainsLoadError(error instanceof Error ? error.message : "Unable to load domains.");
    } finally {
      setDomainsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isPublicSurface) return;
    if (isLoggedIn) {
      void loadDomains();
      void loadPlatformSubdomains();
      void loadLinkRotators();
      void loadShortLinks();
    } else {
      setDomains([]);
      setPlatformSubdomains([]);
      setLinkRotators([]);
      setLinks([]);
    }
  }, [isLoggedIn, isPublicSurface, loadDomains, loadPlatformSubdomains, loadLinkRotators, loadShortLinks]);
  const [articles] = useState<HelpArticle[]>(initialHelpArticles);

  // Push browser workspace fields → Railway → Supabase normalized tables
  React.useEffect(() => {
    if (isPublicSurface) return;
    if (!isLoggedIn || !workspaceHydrated) return;

    const timer = window.setTimeout(() => {
      let supportTickets: unknown[] = [];
      try {
        supportTickets = JSON.parse(localStorage.getItem("keylink360_support_tickets") || localStorage.getItem("keyslink_support_tickets") || "[]");
        if (!Array.isArray(supportTickets)) supportTickets = [];
      } catch {
        supportTickets = [];
      }

      fetch(apiUrl("/api/workspace/import"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {})
        },
        credentials: "include",
        body: JSON.stringify({
          workspace: {
            contacts,
            whatsapp_campaigns: whatsAppCampaigns,
            whatsapp_templates: whatsAppTemplates,
            smart_links: links,
            qr_codes: qrCodes,
            catalog_templates: templates,
            integrations,
            integration_votes: votes,
            tracking_pixels: pixels,
            media_files: mediaFiles,
            help_articles: articles,
            support_tickets: supportTickets,
            notifications: getAllNotifications(),
            bio_page_drafts: savedDrafts,
            publish_settings: getPublishSettings()
          }
        })
      }).catch((error) => {
        console.warn("Workspace Supabase sync failed:", error);
      });
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [
    workspaceHydrated,
    isLoggedIn,
    contacts,
    whatsAppCampaigns,
    whatsAppTemplates,
    links,
    qrCodes,
    templates,
    integrations,
    votes,
    pixels,
    mediaFiles,
    articles,
    savedDrafts
  ]);

  // Live custom domain — clean URL without ?previewPageId=
  if (isBrandedHost) {
    if (brandedResolveState === "pending") {
      return <div className="min-h-screen bg-slate-50" />;
    }
    if (brandedPageId) {
      const pageToPreview = pages.find((p) => p.id === brandedPageId);
      if (pageToPreview && pageToPreview.status !== "Live") {
        return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center text-sm text-slate-600">
            <div>
              <h1 className="text-lg font-bold text-slate-900">Page not published</h1>
              <p className="mt-2">This bio page is still a draft. Publish it in KeyLink360 to go live.</p>
            </div>
          </div>
        );
      }
      return (
        <PublicBioPageView
          pageId={brandedPageId}
          pageTitle={pageToPreview?.title || brandedPageMeta?.title || "BioLink"}
          pageSlug={pageToPreview?.slug || brandedPageMeta?.slug || "biolink"}
          pageBio={pageToPreview?.bio || brandedPageMeta?.bio || undefined}
          pageCoverPhoto={pageToPreview?.coverPhoto || brandedPageMeta?.coverPhoto || undefined}
          allPages={pages}
          mode="live"
        />
      );
    }
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center text-sm text-slate-600">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Domain not connected</h1>
          <p className="mt-2">This hostname is not verified in KeyLink360.</p>
        </div>
      </div>
    );
  }

  // Platform public open (?previewPageId=) — Live pages use live mode so Pay UI matches production.
  if (previewPageId) {
    const pageToPreview = pages.find((p) => p.id === previewPageId);
    const isLive = pageToPreview?.status === "Live";
    return (
      <PublicBioPageView
        pageId={previewPageId}
        pageTitle={pageToPreview?.title || "BioLink"}
        pageSlug={pageToPreview?.slug || "biolink"}
        pageBio={pageToPreview?.bio}
        pageCoverPhoto={pageToPreview?.coverPhoto}
        allPages={pages}
        mode={isLive ? "live" : "preview"}
      />
    );
  }

  // Handlers for persistent operations
  const handleLoginSuccess = (authUser: AuthUser) => {
    setUser((prev) => ({
      ...prev,
      name: authUser.name || `${authUser.firstName} ${authUser.lastName}`.trim() || prev.name,
      email: authUser.email,
      avatarUrl: authUser.avatarUrl || prev.avatarUrl,
      plan: authUser.plan || prev.plan,
      isVerified: authUser.isVerified,
      mfaEnabled: authUser.mfaEnabled
    }));
    setIsLoggedIn(true);
    sessionStorage.removeItem("keylink_crm_hard_refresh_count");
    navigate(screenToPath(ScreenId.DASHBOARD), { replace: true });
    if (window.location.search.includes("verifyToken") || window.location.search.includes("token=")) {
      window.history.replaceState({}, "", screenToPath(ScreenId.DASHBOARD));
    }
  };

  const handleLogout = async () => {
    try {
      if (isPreviewToken(getAccessToken())) {
        clearAuthSession("silent");
      } else {
        await logoutRequest();
      }
    } catch {
      clearAuthSession("silent");
    }
    setIsLoggedIn(false);
    setWorkspaceHydrated(false);
    didPushLocalPagesRef.current = false;
    setIsMobileNavOpen(false);
    navigate(screenToPath(ScreenId.LOGIN), { replace: true });
    window.history.replaceState({ keyAuthGate: "login" }, "", screenToPath(ScreenId.LOGIN));
  };

  React.useEffect(() => {
    const onAuthExpired = () => {
      setIsLoggedIn(false);
      setWorkspaceHydrated(false);
      didPushLocalPagesRef.current = false;
      setIsMobileNavOpen(false);
      navigate(screenToPath(ScreenId.LOGIN), { replace: true });
      window.history.replaceState({ keyAuthGate: "login" }, "", screenToPath(ScreenId.LOGIN));
    };
    window.addEventListener("keylink360:auth-expired", onAuthExpired);
    window.addEventListener("keyslink:auth-expired", onAuthExpired);
    return () => {
      window.removeEventListener("keylink360:auth-expired", onAuthExpired);
      window.removeEventListener("keyslink:auth-expired", onAuthExpired);
    };
  }, [navigate]);

  const handleAddPage = (title: string, slug: string, pageId?: string, pageKind: "bio" | "thanks" = "bio") => {
    const newPage: BioPage = {
      id: pageId?.trim() || createUniquePageId(),
      title,
      slug,
      status: "Draft",
      views: 0,
      createdAt: "7 Jul 2026",
      pageKind,
      ...(pageKind === "thanks"
        ? {
            bio: "Thanks for connecting with us.",
            coverPhoto:
              "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=800"
          }
        : {})
    };
    setPages((currentPages) => [newPage, ...currentPages]);
    return newPage;
  };

  const handleRefreshPages = async () => {
    const response = await fetch(apiUrl("/api/pages"), {
      cache: "no-store",
      headers: authenticatedHeaders()
    });
    if (!response.ok) throw new Error("Unable to load pages");

    const remotePages = await response.json();
    if (!Array.isArray(remotePages)) throw new Error("Invalid pages response");

    setPages((localPages) => {
      const merged = new Map(localPages.map((page) => [page.id, page]));
      remotePages.forEach((page: BioPage) => merged.set(page.id, page));
      return Array.from(merged.values());
    });
  };

  const handleDeletePage = (id: string) => {
    handleDeletePages([id]);
  };

  const handleDeletePages = (ids: string[]) => {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (uniqueIds.length === 0) return;

    const idSet = new Set(uniqueIds);
    const removedPages = pages.filter((item) => idSet.has(item.id));

    setPages((currentPages) => currentPages.filter((item) => !idSet.has(item.id)));
    setPageBlocksMap((currentBlocks) => {
      const nextBlocks = { ...currentBlocks };
      for (const page of removedPages) {
        delete nextBlocks[page.id];
        if (page.slug) delete nextBlocks[page.slug];
      }
      return nextBlocks;
    });
    setSavedDrafts((drafts) => {
      let nextDrafts = drafts;
      for (const id of uniqueIds) {
        nextDrafts = deleteDraftByPageId(id, nextDrafts);
      }
      return nextDrafts;
    });

    for (const page of removedPages) {
      try {
        localStorage.removeItem(`biolink_blocks_${page.id}`);
        localStorage.removeItem(`biolink_blocks_${page.slug}`);
        localStorage.removeItem(`biolink_details_${page.id}`);
        localStorage.removeItem(`biolink_details_${page.slug}`);
      } catch {
        // Browser storage may be unavailable; the page state was still removed.
      }
    }

    for (const id of uniqueIds) {
      fetch(apiUrl(`/api/page/${id}`), {
        method: "DELETE",
        headers: authenticatedHeaders()
      }).catch((error) => {
        console.error("Failed to remove the page from the server:", error);
      });
    }
  };

  const handleUpdatePage = (
    id: string,
    title: string,
    bio?: string,
    coverPhoto?: string,
    pageHandle?: string,
    status?: BioPage["status"]
  ) => {
    setPages((currentPages) =>
      currentPages.map((page) =>
        page.id === id
          ? {
              ...page,
              title,
              bio: bio !== undefined ? bio : page.bio,
              coverPhoto: coverPhoto !== undefined ? coverPhoto : page.coverPhoto,
              handle: pageHandle !== undefined ? pageHandle : page.handle,
              status: status !== undefined ? status : page.status,
              // Save Draft / Publish commits the page into Bio Pages history
              isUncommitted: undefined
            }
          : page
      )
    );
  };

  const handleDuplicatePage = (id: string) => {
    const pageToDuplicate = pages.find((p) => p.id === id);
    if (!pageToDuplicate) return;

    const newId = "p_" + Date.now();
    const cleanSuffix =
      pageToDuplicate.title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-") ||
      "page-copy";
    const newSlug = `key.link/page-${cleanSuffix}-copy-${Math.floor(1000 + Math.random() * 9000)}`;

    const sourceBlocks =
      pageBlocksMap[pageToDuplicate.id] ||
      pageBlocksMap[pageToDuplicate.slug] ||
      [];

    const blocksCopy = cloneBlocks(sourceBlocks as BioEditorBlock[]);

    const duplicated: BioPage = {
      ...pageToDuplicate,
      id: newId,
      title: `${pageToDuplicate.title} (Copy)`,
      slug: newSlug,
      views: 0,
      createdAt: "7 Jul 2026"
    };

    setPages([duplicated, ...pages]);

    setPageBlocksMap((prev) => ({
      ...prev,
      [newId]: blocksCopy,
      [newSlug]: blocksCopy
    }));

    persistPagePreviewStorage(newId, newSlug, blocksCopy, {
      title: duplicated.title,
      bio: duplicated.bio || "Write a short bio...",
      coverPhoto: duplicated.coverPhoto || DEFAULT_COVER
    });

    pushNotification({
      type: "page_duplicated",
      title: "Page duplicated",
      message: `"${duplicated.title}" was created with ${blocksCopy.length} block(s).`,
      targetScreen: ScreenId.BIO_PAGES,
      meta: { pageId: newId }
    });
  };

  const maskContactEmail = (email: string) => {
    const [local = "", domain = "•••.com"] = email.split("@");
    const visible = local.slice(0, 1) || "•";
    return `${visible}••••@${domain || "•••.com"}`;
  };

  const maskContactPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 4 ? `•••••• ${digits.slice(-4)}` : phone ? "••••••" : "—";
  };

  const mergeContactsById = (local: Contact[], remote: Contact[]) => {
    const merged = new Map<string, Contact>();
    local.forEach((contact) => merged.set(contact.id, contact));
    remote.forEach((contact) => {
      const prev = merged.get(contact.id);
      merged.set(contact.id, {
        ...(prev || {}),
        ...contact,
        formFields: contact.formFields?.length ? contact.formFields : prev?.formFields,
        notes: contact.notes || prev?.notes,
        pageTitle: contact.pageTitle || prev?.pageTitle,
        blockLabel: contact.blockLabel || prev?.blockLabel,
        sourceDomain: contact.sourceDomain || prev?.sourceDomain,
        templateId: contact.templateId || prev?.templateId,
        templateName: contact.templateName || prev?.templateName,
        pageSlug: contact.pageSlug || prev?.pageSlug,
        tags: Array.from(new Set([...(prev?.tags || []), ...(contact.tags || [])].filter(Boolean)))
      });
    });
    return Array.from(merged.values()).sort(
      (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
    );
  };

  const refreshContactsFromServer = React.useCallback(async () => {
    if (!isLoggedIn || isPreviewToken(getAccessToken())) return;
    try {
      const response = await fetch(apiUrl("/api/contacts"), {
        cache: "no-store",
        headers: authenticatedHeaders()
      });
      if (!response.ok) return;
      const remote = await response.json();
      if (!Array.isArray(remote)) return;
      setContacts((local) => mergeContactsById(local, remote as Contact[]));
    } catch (error) {
      console.warn("Failed to refresh contacts:", error);
    }
  }, [isLoggedIn]);

  React.useEffect(() => {
    void refreshContactsFromServer();
  }, [refreshContactsFromServer, workspaceHydrated]);

  const refreshQrCodesFromServer = React.useCallback(async () => {
    if (!isLoggedIn || isPreviewToken(getAccessToken())) return;
    try {
      const response = await fetch(apiUrl("/api/qr-codes"), {
        cache: "no-store",
        headers: authenticatedHeaders()
      });
      if (!response.ok) return;
      const payload = await response.json();
      const remote = Array.isArray(payload?.items) ? (payload.items as QRCodeItem[]) : [];
      if (!remote.length) return;

      setQrCodes((local) => {
        const byId = new Map(remote.map((item) => [item.id, item]));
        const parseCount = (value: string | undefined) =>
          Math.max(0, Math.floor(Number(String(value ?? "0").replace(/,/g, "")) || 0));

        const mergedLocal = local.map((item) => {
          const server = byId.get(item.id);
          if (!server) return item;
          const scans = Math.max(parseCount(item.scans), parseCount(server.scans));
          const unique = Math.max(parseCount(item.uniqueScanners), parseCount(server.uniqueScanners));
          const localTs = Date.parse(String(item.targetUpdatedAt || "")) || 0;
          const serverTs = Date.parse(String(server.targetUpdatedAt || "")) || 0;
          const useServerDestination =
            Boolean(server.targetUrl) && (serverTs > localTs || (!localTs && server.targetUrl !== item.targetUrl));
          return {
            ...item,
            scans: String(scans),
            uniqueScanners: String(unique),
            conversionRate: server.conversionRate || item.conversionRate,
            topLocation: server.topLocation && server.topLocation !== "N/A" ? server.topLocation : item.topLocation,
            status: server.status || item.status,
            // Destination follows the freshest Edit URL from the server.
            targetUrl: useServerDestination ? server.targetUrl : item.targetUrl,
            targetUpdatedAt: useServerDestination
              ? server.targetUpdatedAt || item.targetUpdatedAt
              : item.targetUpdatedAt || server.targetUpdatedAt,
            // Keep frozen payload from local if present — QR matrix never changes.
            publicCode: item.publicCode || server.publicCode,
            scanUrl: item.scanUrl || server.scanUrl,
            qrUrl: item.qrUrl || server.qrUrl
          };
        });

        // Never re-add deleted local QRs from the server list.
        return mergedLocal;
      });
    } catch (error) {
      console.warn("Failed to refresh QR codes:", error);
    }
  }, [isLoggedIn]);

  React.useEffect(() => {
    void refreshQrCodesFromServer();
    if (!isLoggedIn) return;
    const timer = window.setInterval(() => {
      void refreshQrCodesFromServer();
    }, 12_000);
    return () => window.clearInterval(timer);
  }, [refreshQrCodesFromServer, workspaceHydrated, isLoggedIn]);

  React.useEffect(() => {
    const onContactsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ contact?: Contact }>).detail;
      if (detail?.contact) {
        void import("./lib/contactCapture").then(({ upsertLocalContact }) => {
          setContacts((current) => upsertLocalContact(current, detail.contact as Contact));
        });
      }
      void refreshContactsFromServer();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === "keys_lead_capture_ping" && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as { contact?: Contact };
          if (parsed?.contact) {
            void import("./lib/contactCapture").then(({ upsertLocalContact }) => {
              setContacts((current) => upsertLocalContact(current, parsed.contact as Contact));
            });
          }
        } catch {
          /* ignore */
        }
        void refreshContactsFromServer();
      }
      if ((event.key === "keylink360_contacts" || event.key === "keyslink_contacts") && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (Array.isArray(parsed)) {
            setContacts((local) => mergeContactsById(local, parsed as Contact[]));
          }
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("key-contacts-updated", onContactsUpdated as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("key-contacts-updated", onContactsUpdated as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, [refreshContactsFromServer]);

  React.useEffect(() => {
    if (currentScreen !== ScreenId.CONTACTS) return;
    void refreshContactsFromServer();
    const timer = window.setInterval(() => {
      void refreshContactsFromServer();
    }, 8000);
    return () => window.clearInterval(timer);
  }, [currentScreen, refreshContactsFromServer]);

  const handleAddContact = (newContactData: Omit<Contact, "id" | "maskedEmail" | "maskedPhone">) => {
    const newContact: Contact = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...newContactData,
      maskedEmail: maskContactEmail(newContactData.email),
      maskedPhone: maskContactPhone(newContactData.phone || "")
    };
    setContacts((current) => [newContact, ...current]);
    pushNotification({
      type: "contact_added",
      title: "New contact captured",
      message: `${newContact.name} was added to your contacts.`,
      targetScreen: ScreenId.CONTACTS
    });
    if (getAccessToken() && !isPreviewToken(getAccessToken())) {
      void fetch(apiUrl("/api/contacts"), {
        method: "POST",
        headers: authenticatedHeaders(true),
        body: JSON.stringify({ contact: newContact })
      }).catch((error) => console.warn("Failed to sync contact:", error));
    }
  };

  const handleUpdateContact = (
    id: string,
    contactData: Omit<Contact, "id" | "maskedEmail" | "maskedPhone">
  ) => {
    const updated: Contact = {
      id,
      ...contactData,
      maskedEmail: maskContactEmail(contactData.email),
      maskedPhone: maskContactPhone(contactData.phone || "")
    };
    setContacts((current) => current.map((contact) => (contact.id === id ? { ...contact, ...updated } : contact)));
    if (getAccessToken() && !isPreviewToken(getAccessToken())) {
      void fetch(apiUrl("/api/contacts"), {
        method: "POST",
        headers: authenticatedHeaders(true),
        body: JSON.stringify({ contact: updated })
      }).catch((error) => console.warn("Failed to sync contact update:", error));
    }
  };

  const handleDeleteContact = (id: string) => {
    setContacts((current) => current.filter((contact) => contact.id !== id));
    if (getAccessToken() && !isPreviewToken(getAccessToken())) {
      void fetch(apiUrl(`/api/contacts/${id}`), {
        method: "DELETE",
        headers: authenticatedHeaders()
      }).catch((error) => console.warn("Failed to delete contact on server:", error));
    }
  };

  const handleDeleteContacts = (ids: string[]) => {
    const idSet = new Set(ids.filter(Boolean));
    if (idSet.size === 0) return;
    setContacts((current) => current.filter((contact) => !idSet.has(contact.id)));
    if (getAccessToken() && !isPreviewToken(getAccessToken())) {
      for (const id of idSet) {
        void fetch(apiUrl(`/api/contacts/${id}`), {
          method: "DELETE",
          headers: authenticatedHeaders()
        }).catch((error) => console.warn("Failed to delete contact on server:", error));
      }
    }
  };

  const handleAddWhatsAppTemplate = (template: Omit<WhatsAppTemplate, "id">) => {
    const newTpl: WhatsAppTemplate = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...template
    };
    setWhatsAppTemplates((current) => [newTpl, ...current]);
  };

  const handleUpdateWhatsAppTemplate = (id: string, template: Omit<WhatsAppTemplate, "id">) => {
    setWhatsAppTemplates((current) =>
      current.map((item) => (item.id === id ? { ...item, ...template } : item))
    );
  };

  const handleDeleteWhatsAppTemplate = (id: string) => {
    setWhatsAppTemplates((current) => current.filter((item) => item.id !== id));
  };

  const handleAddWhatsAppCampaign = (campaign: Omit<WhatsAppCampaign, "id">) => {
    const newCamp: WhatsAppCampaign = {
      id: `wc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...campaign
    };
    setWhatsAppCampaigns((current) => [newCamp, ...current]);
  };

  const handleUpdateWhatsAppCampaign = (id: string, campaign: Omit<WhatsAppCampaign, "id">) => {
    setWhatsAppCampaigns((current) =>
      current.map((item) => (item.id === id ? { ...item, ...campaign } : item))
    );
  };

  const handleDeleteWhatsAppCampaign = (id: string) => {
    setWhatsAppCampaigns((current) => current.filter((item) => item.id !== id));
  };

  const syncQrToServer = React.useCallback(async (item: QRCodeItem, method: "POST" | "DELETE" = "POST") => {
    if (!isLoggedIn || isPreviewToken(getAccessToken())) return false;
    try {
      // Keep logo data URLs client-side only — they blow up API payloads.
      const payload =
        method === "POST"
          ? {
              ...item,
              designLogoUrl:
                item.designLogo === "custom" && item.designLogoUrl && item.designLogoUrl.length < 200_000
                  ? item.designLogoUrl
                  : undefined
            }
          : undefined;
      const response = await fetch(
        apiUrl(method === "DELETE" ? `/api/qr-codes/${encodeURIComponent(item.id)}` : "/api/qr-codes"),
        {
          method,
          headers: authenticatedHeaders(method === "POST"),
          credentials: "include",
          body: method === "POST" ? JSON.stringify(payload) : undefined
        }
      );
      if (!response.ok) {
        console.warn("QR server sync failed:", response.status);
        return false;
      }
      if (method === "POST") {
        const body = (await response.json().catch(() => null)) as {
          destinationSynced?: boolean;
        } | null;
        // Edit URL / create must publish to the public route index for mobile scans.
        if (body && body.destinationSynced === false) return false;
      }
      return true;
    } catch (error) {
      console.warn("QR server sync failed:", error);
      return false;
    }
  }, [isLoggedIn]);

  // Keep every Smart QR registered on the server so mobile /q/:code scans resolve.
  React.useEffect(() => {
    if (!isLoggedIn || !workspaceHydrated || isPreviewToken(getAccessToken())) return;
    if (!qrCodes.length) return;
    const timer = window.setTimeout(() => {
      qrCodes.forEach((item) => {
        void syncQrToServer(item, "POST");
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [isLoggedIn, workspaceHydrated, syncQrToServer, qrCodes]);

  const handleGenerateQR = (name: string, targetUrl: string, customColor: string) => {
    const normalizedTargetUrl = normalizeExternalUrl(targetUrl);
    const publicCode = generateQrPublicCode();
    const scanUrl = buildFixedQrScanUrl(publicCode);
    const newQR = ensureStableQrPayload({
      id: `qr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      targetUrl: normalizedTargetUrl,
      targetUpdatedAt: new Date().toISOString(),
      qrUrl: buildQrImageUrl(scanUrl, customColor, 250),
      scans: "0",
      uniqueScanners: "0",
      status: "Active",
      customDesign: true,
      designColor: customColor,
      designLogo: "none",
      designPattern: "rounded",
      publicCode,
      scanUrl
    });
    setQrCodes((current) => [newQR, ...current]);
    void syncQrToServer(newQR, "POST").then((ok) => {
      if (!ok) {
        pushNotification({
          type: "general",
          title: "QR saved locally only",
          message: `"${name}" could not register for mobile scans. Refresh this page and try again.`,
          targetScreen: ScreenId.QR_CODES
        });
      }
    });
    pushNotification({
      type: "qr_generated",
      title: "QR code created",
      message: `"${name}" is ready to share.`,
      targetScreen: ScreenId.QR_CODES
    });
  };

  const handleUpdateTargetUrl = async (id: string, newUrl: string): Promise<boolean> => {
    const normalizedTargetUrl = normalizeExternalUrl(newUrl);
    const targetUpdatedAt = new Date().toISOString();
    const current = qrCodes.find((item) => item.id === id);
    if (!current) return false;
    // Destination redirect only — never rewrite printed scanUrl / publicCode / QR matrix.
    const updated: QRCodeItem = {
      ...current,
      targetUrl: normalizedTargetUrl,
      targetUpdatedAt,
      publicCode: current.publicCode,
      scanUrl: current.scanUrl,
      qrUrl: current.qrUrl
    };
    setQrCodes((list) => list.map((item) => (item.id === id ? updated : item)));
    const ok = await syncQrToServer(updated, "POST");
    if (!ok) {
      pushNotification({
        type: "general",
        title: "Destination not published for mobile scans",
        message: "Save Dynamic Destination again. The QR image stays fixed — only the redirect must sync.",
        targetScreen: ScreenId.QR_CODES
      });
      return false;
    }

    // Confirm the host encoded in the fixed QR (/q/:code) already serves the new destination.
    const code = String(updated.publicCode || "").trim();
    if (code) {
      try {
        let checkHref = apiUrl(`/api/public/qr/${encodeURIComponent(code)}`);
        try {
          if (updated.scanUrl) {
            const scanOrigin = new URL(updated.scanUrl).origin;
            if (scanOrigin && !/localhost|127\.0\.0\.1/i.test(scanOrigin)) {
              checkHref = `${scanOrigin}/api/public/qr/${encodeURIComponent(code)}`;
            }
          }
        } catch {
          /* keep local check */
        }
        const check = await fetch(checkHref, { cache: "no-store" });
        const payload = (await check.json().catch(() => null)) as { targetUrl?: string } | null;
        const live = String(payload?.targetUrl || "").replace(/\/$/, "");
        const expected = normalizedTargetUrl.replace(/\/$/, "");
        if (check.ok && live && live !== expected) {
          pushNotification({
            type: "general",
            title: "Live scan URL not updated yet",
            message:
              "Saved locally, but keylink360.mindflo.today still opens the old URL. Deploy this fix to live, then Save Dynamic Destination again.",
            targetScreen: ScreenId.QR_CODES
          });
          return false;
        }
      } catch {
        /* live verify is best-effort when offline */
      }
    }
    return true;
  };

  const handleDeleteQR = (id: string) => {
    setQrCodes((current) => {
      const removed = current.find((qr) => qr.id === id);
      if (removed) void syncQrToServer(removed, "DELETE");
      return current.filter((qr) => qr.id !== id);
    });
  };

  const handleUpdateQR = (updated: QRCodeItem) => {
    setQrCodes((current) => {
      const next = current.map((qr) => {
        if (qr.id !== updated.id) return qr;
        return ensureStableQrPayload({
          ...qr,
          ...updated,
          // Frozen forever after create.
          publicCode: qr.publicCode || updated.publicCode,
          scanUrl: qr.scanUrl || updated.scanUrl
        });
      });
      const saved = next.find((qr) => qr.id === updated.id);
      if (saved) void syncQrToServer(saved, "POST");
      return next;
    });
  };

  const handleVote = (id: string) => {
    setVotes((current) =>
      current.map((v) => (v.id === id && !v.voted ? { ...v, votes: v.votes + 1, voted: true } : v))
    );
  };

  const handleUpdateIntegration = (updated: IntegrationItem) => {
    setIntegrations((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleAddPixel = (name: string, type: string, pixelId: string) => {
    const newPixel: TrackingPixel = {
      id: `px_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      type,
      pixelId,
      status: type.includes("TikTok") ? "Validation Required" : "Active"
    };
    setPixels((current) => [newPixel, ...current]);
    pushNotification({
      type: "pixel_added",
      title: "Tracking pixel added",
      message: `"${name}" (${type}) is now ${newPixel.status === "Active" ? "active" : "awaiting validation"}.`,
      targetScreen: ScreenId.PIXELS
    });
  };

  const handleUpdatePixel = (updated: TrackingPixel) => {
    setPixels((current) => current.map((pixel) => (pixel.id === updated.id ? updated : pixel)));
  };

  const handleDeletePixel = (id: string) => {
    setPixels((current) => current.filter((p) => p.id !== id));
  };

  const handleUploadFile = (file: Omit<MediaFile, "id">) => {
    const newFile: MediaFile = {
      ...file,
      id: `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    };
    setMediaFiles((current) => [newFile, ...current]);
  };

  const handleUpdateFile = (updated: MediaFile) => {
    setMediaFiles((current) => current.map((file) => (file.id === updated.id ? updated : file)));
  };

  const handleDeleteFile = (id: string) => {
    setMediaFiles((current) => current.filter((f) => f.id !== id));
  };

  const applyVerifiedDomainPublishSync = (domain: CustomDomain) => {
    const synced = syncPublishPrimaryUrlForVerifiedDomain(domain);
    if (synced) savePublishSettings(synced);
  };

  const handleConnectDomain = async (
    domainName: string,
    pageId: string,
    options?: {
      cloudflareApiToken?: string;
      accessToken?: string;
      dnsProviderId?: string;
      rememberProvider?: boolean;
    }
  ) => {
    const page = pages.find((item) => item.id === pageId);
    await syncLocalPageDocumentToServer(pageId, page?.slug);
    const result = await connectDomain(domainName, pageId, options);
    // Do not add to Custom Domains history until status is Verified (LIVE).
    return result;
  };

  const handleVerifyDomain = async (id: string, options?: { skipPageSync?: boolean }) => {
    const domain = domains.find((item) => item.id === id);
    if (domain && !options?.skipPageSync) {
      const page = pages.find((item) => item.id === domain.pageId);
      await syncLocalPageDocumentToServer(domain.pageId, page?.slug);
    }
    const result = await verifyDomain(id);
    if (result.domain.status === "Verified") {
      setDomains((current) => [
        result.domain,
        ...current.filter((item) => item.id !== result.domain.id)
      ]);
      applyVerifiedDomainPublishSync(result.domain);
    } else {
      // Keep incomplete setups out of the history list.
      setDomains((current) => current.filter((item) => item.id !== result.domain.id));
    }
    return result;
  };

  const handleReassignDomain = async (id: string, pageId: string) => {
    const page = pages.find((item) => item.id === pageId);
    await syncLocalPageDocumentToServer(pageId, page?.slug);
    const updated = await patchDomainPage(id, pageId);
    setDomains((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    return updated;
  };

  const handleDeleteDomain = async (id: string) => {
    const removed = domains.find((item) => item.id === id);
    const result = await deleteDomain(id);
    setDomains((current) => current.filter((d) => d.id !== id));

    if (removed) {
      const settings = getPublishSettings();
      const removedUrl = `https://${removed.domainName}`;
      const touchesPublish =
        settings.primaryUrl === removedUrl ||
        settings.customDomains.some(
          (entry) => entry.hostname === removed.domainName || entry.id === removed.id
        );
      if (touchesPublish) {
        savePublishSettings({
          ...settings,
          primaryUrl:
            settings.primaryUrl === removedUrl ? `https://${PRIMARY_DOMAIN}` : settings.primaryUrl,
          customDomains: settings.customDomains.filter(
            (entry) => entry.hostname !== removed.domainName && entry.id !== removed.id
          ),
          updatedAt: new Date().toISOString()
        });
      }
    }
    return result;
  };

  const handleUpdateUser = (name: string, email: string, avatarUrl: string) => {
    setUser((prev) => ({ ...prev, name, email, avatarUrl }));
  };

  const handleUpdateMfa = (enabled: boolean) => {
    setUser((prev) => ({ ...prev, mfaEnabled: enabled }));
  };

  const handleScreenChange = (screen: ScreenId) => {
    // Leaving Bio Pages without Save Draft / Publish discards template sessions
    if (screen !== ScreenId.BIO_PAGES) {
      const orphanIds = pages.filter((page) => page.isUncommitted).map((page) => page.id);
      if (orphanIds.length > 0) {
        handleDeletePages(orphanIds);
      }
      setInitialActiveEditPageId(null);
      setInitialActiveTemplateId(null);
    }

    const path = screenToPath(screen);
    navigate(path);
    setIsMobileNavOpen(false);
    if (location.pathname === path) {
      resetMainScroll();
    }
  };

  const handleNotificationNavigate = (screen: ScreenId, pageId?: string) => {
    if (screen === ScreenId.BIO_PAGES && pageId) {
      setInitialActiveEditPageId(pageId);
      navigate(`${screenToPath(screen)}?edit=${encodeURIComponent(pageId)}`);
      return;
    }
    navigate(screenToPath(screen));
  };

  const handleOpenDashboardPage = (pageId: string, options?: { fromCustomDomain?: boolean }) => {
    setInitialActiveEditPageId(pageId);
    const params = new URLSearchParams({ edit: pageId });
    if (options?.fromCustomDomain) {
      params.set("source", "domain");
    }
    navigate(`${screenToPath(ScreenId.BIO_PAGES)}?${params.toString()}`);
  };

  // Helper object to serve metrics inside dashboard with server-side tracking support
  const metrics = {
    totalClicks: serverMetrics ? serverMetrics.totalClicks : links.reduce((acc, curr) => acc + curr.clicks, 0),
    pageViews: serverMetrics ? serverMetrics.totalViews : committedPages.reduce((acc, curr) => acc + curr.views, 0),
    activeLinks: links.filter((l) => l.status === "Live").length,
    activePages: committedPages.filter((p) => p.status === "Live").length,
    totalRegisters: serverMetrics ? serverMetrics.totalRegisters : 0,
    events: serverMetrics ? serverMetrics.events : []
  };

  const handleExportData = () => {
    const backupData = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      user,
      pages: committedPages,
      contacts,
      whatsAppCampaigns,
      whatsAppTemplates,
      links,
      qrCodes,
      savedTemplates,
      savedDrafts,
      pageBlocksMap,
      pixels,
      mediaFiles,
      domains,
      integrations,
      votes
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `keylink360_workspace_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (backupData: any): boolean => {
    if (!backupData || typeof backupData !== "object") return false;
    
    // Minimal structure validation
    if (!backupData.pages && !backupData.contacts && !backupData.links) {
      return false;
    }

    try {
      if (backupData.user) setUser(backupData.user);
      if (backupData.pages) {
        setPages(backupData.pages);
        writeLocalStorage("biolinks_pages_list", backupData.pages);
      }
      if (backupData.contacts) setContacts(backupData.contacts);
      if (backupData.whatsAppCampaigns) setWhatsAppCampaigns(backupData.whatsAppCampaigns);
      if (backupData.whatsAppTemplates) setWhatsAppTemplates(backupData.whatsAppTemplates);
      if (backupData.links) setLinks(backupData.links);
      if (backupData.qrCodes) {
        setQrCodes(
          (Array.isArray(backupData.qrCodes) ? backupData.qrCodes : []).map((item: QRCodeItem) =>
            ensureStableQrPayload(item)
          )
        );
      }
      if (backupData.savedTemplates) {
        const normalized = (backupData.savedTemplates as Record<string, unknown>[]).map((item) =>
          item.data ? (item as unknown as BioPageTemplate) : normalizeTemplate(item)
        );
        setSavedTemplates(normalized);
        persistTemplates(normalized);
      }
      if (backupData.savedDrafts) {
        const normalized = (backupData.savedDrafts as Record<string, unknown>[]).map((item) =>
          item.data ? (item as unknown as BioPageDraft) : normalizeDraft(item)
        );
        setSavedDrafts(normalized);
        persistDrafts(normalized);
      }
      if (backupData.pageBlocksMap) {
        setPageBlocksMap(backupData.pageBlocksMap);
        writeLocalStorage("pageBlocksMap", backupData.pageBlocksMap);
      }
      if (backupData.pixels) setPixels(backupData.pixels);
      if (backupData.mediaFiles) setMediaFiles(backupData.mediaFiles);
      if (backupData.domains) setDomains(backupData.domains);
      if (backupData.integrations) setIntegrations(backupData.integrations);
      if (backupData.votes) setVotes(backupData.votes);

      return true;
    } catch (e) {
      console.error("Error restoring backup:", e);
      return false;
    }
  };

  // Render relevant content component based on route
  const renderScreenElement = (screen: ScreenId) => {
    switch (screen) {
      case ScreenId.DASHBOARD:
        return (
          <DashboardScreen
            onNavigate={handleScreenChange}
            onOpenPage={handleOpenDashboardPage}
            user={user}
            metrics={metrics}
            pages={committedPages}
          />
        );
      case ScreenId.BIO_PAGES:
        return (
          <BioPagesScreen
            pages={pages}
            domains={domains}
            platformSubdomains={platformSubdomains}
            onAddPage={handleAddPage}
            onDeletePage={handleDeletePage}
            onDeletePages={handleDeletePages}
            onUpdatePage={handleUpdatePage}
            onDuplicatePage={handleDuplicatePage}
            onRefreshPages={handleRefreshPages}
            analyticsEvents={serverMetrics?.events || []}
            savedTemplates={savedTemplates}
            setSavedTemplates={setSavedTemplates}
            savedDrafts={savedDrafts}
            setSavedDrafts={setSavedDrafts}
            pageBlocksMap={pageBlocksMap}
            setPageBlocksMap={setPageBlocksMap}
            initialActiveEditPageId={initialActiveEditPageId}
            clearInitialActiveEditPageId={() => setInitialActiveEditPageId(null)}
            initialActiveTemplateId={initialActiveTemplateId}
            clearInitialActiveTemplateId={() => setInitialActiveTemplateId(null)}
            onNotify={pushNotification}
            theme={uiTheme}
          />
        );
      case ScreenId.CONTACTS:
        return (
          <ContactsScreen
            contacts={contacts}
            onAddContact={handleAddContact}
            onUpdateContact={handleUpdateContact}
            onDeleteContact={handleDeleteContact}
            onDeleteContacts={handleDeleteContacts}
          />
        );
      case ScreenId.WHATSAPP:
        return (
          <WhatsAppScreen
            campaigns={whatsAppCampaigns}
            templates={whatsAppTemplates}
            onAddTemplate={handleAddWhatsAppTemplate}
            onUpdateTemplate={handleUpdateWhatsAppTemplate}
            onDeleteTemplate={handleDeleteWhatsAppTemplate}
            onAddCampaign={handleAddWhatsAppCampaign}
            onUpdateCampaign={handleUpdateWhatsAppCampaign}
            onDeleteCampaign={handleDeleteWhatsAppCampaign}
          />
        );
      case ScreenId.LINKS:
        return (
          <LinksScreen
            links={links}
            domains={domains}
            onReload={loadShortLinks}
            onUpsertLink={(link) => {
              setLinks((prev) => {
                const index = prev.findIndex((item) => item.id === link.id);
                if (index < 0) return [link, ...prev];
                const next = [...prev];
                next[index] = link;
                return next;
              });
            }}
            loading={linksLoading}
            loadError={linksLoadError}
          />
        );
      case ScreenId.LINK_ROTATOR:
        return (
          <LinkRotatorScreen
            rotators={linkRotators}
            domains={domains}
            onReload={loadLinkRotators}
            onUpsertRotator={(rotator) => {
              setLinkRotators((prev) => {
                const index = prev.findIndex((item) => item.id === rotator.id);
                if (index < 0) return [rotator, ...prev];
                const next = [...prev];
                next[index] = rotator;
                return next;
              });
            }}
            loading={linkRotatorsLoading}
            loadError={linkRotatorsLoadError}
          />
        );
      case ScreenId.QR_CODES:
        return (
          <QRCodesScreen
            items={qrCodes}
            onGenerateQR={handleGenerateQR}
            onUpdateTargetUrl={handleUpdateTargetUrl}
            onDeleteQR={handleDeleteQR}
            onUpdateQR={handleUpdateQR}
          />
        );
      case ScreenId.TEMPLATES:
        return (
          <TemplatesScreen
            items={templates}
            savedTemplates={savedTemplates}
            onDeleteCustomTemplate={(id) => {
              setSavedTemplates((prev) => prev.filter((t) => t.id !== id));
              deleteTemplateOnServer(id);
            }}
            onUseTemplate={(tplName, isCustom, customTpl) => {
              let editorPayload = getBlankTemplate(tplName);
              let sourceTemplateId: string | null = null;

              if (isCustom && customTpl) {
                editorPayload = getTemplateEditorPayload(customTpl);
                sourceTemplateId = customTpl.id;
              } else {
                editorPayload = resolveSystemTemplate(tplName) ?? getBlankTemplate(tplName);
              }

              const tplTitle = editorPayload.pageMeta.title;
              const tplBio = editorPayload.pageMeta.shortBio;
              const tplCoverPhoto = editorPayload.pageMeta.coverImage;
              const tplHandle = editorPayload.pageMeta.handle;
              const blocksToLoad = cloneBlocks(editorPayload.blocks);

              const newId = "p_" + Date.now();
              const cleanSuffix =
                tplTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-") || "custom-tpl";
              const newSlug = `key.link/page-${cleanSuffix}-${Math.floor(1000 + Math.random() * 9000)}`;

              const newPage: BioPage = {
                id: newId,
                title: tplTitle,
                slug: newSlug,
                status: "Draft",
                views: 0,
                createdAt: "7 Jul 2026",
                bio: tplBio,
                coverPhoto: tplCoverPhoto,
                handle: tplHandle,
                // Hidden from Bio Pages history until Save Draft or Publish
                isUncommitted: true
              };

              setPageBlocksMap((prev) => ({
                ...prev,
                [newId]: blocksToLoad,
                [newSlug]: blocksToLoad
              }));

              setPages((prev) => [newPage, ...prev]);

              setInitialActiveEditPageId(newId);
              setInitialActiveTemplateId(sourceTemplateId);
              handleScreenChange(ScreenId.BIO_PAGES);
            }}
          />
        );
      case ScreenId.INTEGRATIONS:
        return (
          <IntegrationsScreen
            items={integrations}
            votes={votes}
            onVote={handleVote}
            onUpdateIntegration={handleUpdateIntegration}
            onNavigate={handleScreenChange}
          />
        );
      case ScreenId.PIXELS:
        return (
          <PixelsScreen
            pixels={pixels}
            onAddPixel={handleAddPixel}
            onUpdatePixel={handleUpdatePixel}
            onDeletePixel={handleDeletePixel}
          />
        );
      case ScreenId.MEDIA_LIBRARY:
        return (
          <MediaLibraryScreen
            files={mediaFiles}
            onUploadFile={handleUploadFile}
            onUpdateFile={handleUpdateFile}
            onDeleteFile={handleDeleteFile}
          />
        );
      case ScreenId.CUSTOM_DOMAINS:
        return (
          <CustomDomainsScreen
            domains={domains}
            pages={committedPages}
            isLoading={domainsLoading}
            loadError={domainsLoadError}
            onReload={loadDomains}
            onConnectDomain={handleConnectDomain}
            onVerifyDomain={handleVerifyDomain}
            onReassignDomain={handleReassignDomain}
            onDeleteDomain={handleDeleteDomain}
            onEditPage={(pageId, options) => handleOpenDashboardPage(pageId, options)}
          />
        );
      case ScreenId.HELP_CENTER:
        return <HelpCenterScreen articles={articles} onNavigate={handleScreenChange} />;
      case ScreenId.CONTACT_SUPPORT:
        return <ContactSupportScreen user={user} onNavigate={handleScreenChange} />;
      case ScreenId.ACCOUNT:
        return (
          <AccountScreen
            user={user}
            theme={uiTheme}
            onThemeChange={(theme) => {
              setUiTheme(theme);
              saveTheme(theme);
            }}
            onUpdateUser={handleUpdateUser}
            onUpdateMfa={handleUpdateMfa}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onLogout={handleLogout}
            onNavigate={handleScreenChange}
          />
        );
      case ScreenId.SUPER_ADMIN:
        return (
          <SuperAdminScreen
            user={user}
            onNavigate={handleScreenChange}
          />
        );
      default:
        return <NotFoundScreen onNavigate={handleScreenChange} />;
    }
  };

  if (authBootstrapping) {
    return (
      <div className="key-auth-canvas h-screen max-h-[100dvh] overflow-hidden flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3 text-slate-300 relative z-10">
          <span className="h-8 w-8 border-2 border-indigo-300/40 border-t-indigo-300 rounded-full animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-widest">Restoring session…</p>
        </div>
      </div>
    );
  }

  const isPublicLandingPage = location.pathname === "/" || location.pathname === "/home";

  if (isPublicLandingPage) {
    return (
      <div className="min-h-screen w-full flex flex-col font-sans antialiased bg-[#05070d]">
        <LandingPage
          onGetStarted={() => {
            const target = document.getElementById("pricing");
            if (target) {
              target.scrollIntoView({ behavior: "smooth" });
            } else {
              navigate(isLoggedIn ? "/dashboard" : "/login?mode=register");
            }
          }}
          onSignIn={() => navigate(isLoggedIn ? "/dashboard" : "/login")}
        />
      </div>
    );
  }

  return (
    <div
      className={
        isLoggedIn
          ? `h-screen max-h-[100dvh] w-full overflow-hidden flex font-sans antialiased key-app-shell key-theme-${uiTheme}`
          : "min-h-screen w-full flex flex-col font-sans antialiased bg-[#05070d]"
      }
    >
      {isLoggedIn && (
        <div className="key-bg-clouds" aria-hidden>
          <span className="key-bg-cloud key-bg-cloud--1" />
          <span className="key-bg-cloud key-bg-cloud--2" />
          <span className="key-bg-cloud key-bg-cloud--3" />
          <span className="key-bg-cloud key-bg-cloud--4" />
          <span className="key-bg-cloud key-bg-cloud--5" />
        </div>
      )}
      {isLoggedIn && (
        <Sidebar
          currentScreen={currentScreen}
          onScreenChange={handleScreenChange}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          user={user}
        />
      )}

      <div className={isLoggedIn ? "flex-1 flex flex-col min-w-0 w-full h-screen overflow-hidden" : "flex-1 w-full min-h-screen flex flex-col"}>
        {isLoggedIn && (
          <Header
            currentScreen={currentScreen}
            user={user}
            onScreenChange={handleScreenChange}
            onMenuToggle={() => setIsMobileNavOpen((open) => !open)}
            isMobileNavOpen={isMobileNavOpen}
            notifications={notifications}
            unreadCount={unreadNotificationCount}
            onMarkNotificationRead={handleMarkNotificationRead}
            onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
            onNotificationNavigate={handleNotificationNavigate}
            onPublish={() => setIsPublishOpen(true)}
            onLogout={handleLogout}
          />
        )}

        <main
          ref={mainScrollRef}
          id="key-main-scroll-container"
          className={
            isLoggedIn
              ? "flex-1 min-h-0 w-full overflow-y-scroll overflow-x-hidden key-main-scroll focus:outline-none"
              : "min-w-0 w-full flex-1"
          }
          style={isLoggedIn ? { overflowY: "scroll", WebkitOverflowScrolling: "touch" } : undefined}
        >
          <div className={isLoggedIn ? "key-main-scroll__content w-full min-h-full pb-28" : "w-full min-h-screen flex flex-col"}>
            {!isLoggedIn ? (
              <Routes>
                <Route path="/q/:code" element={<PublicQrScanRedirect />} />
                <Route
                  path="/"
                  element={
                    <LandingPage
                      onGetStarted={() => navigate("/login?mode=register")}
                      onSignIn={() => navigate(screenToPath(ScreenId.LOGIN))}
                    />
                  }
                />
                <Route
                  path="/home"
                  element={
                    <LandingPage
                      onGetStarted={() => navigate("/login?mode=register")}
                      onSignIn={() => navigate(screenToPath(ScreenId.LOGIN))}
                    />
                  }
                />
                <Route
                  path={screenToPath(ScreenId.LOGIN)}
                  element={
                    <LoginScreen
                      onLoginSuccess={handleLoginSuccess}
                      initialView={authResetToken ? "reset" : authVerifyToken ? "verify" : "login"}
                      initialVerifyToken={authVerifyToken}
                      initialResetToken={authResetToken}
                      initialEmail={authEmailParam}
                    />
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            ) : (
              <Routes>
                <Route path="/q/:code" element={<PublicQrScanRedirect />} />
                {APP_ROUTE_ENTRIES.map(([screen, path]) => (
                  <React.Fragment key={path}>
                    <Route path={path} element={renderScreenElement(screen)} />
                  </React.Fragment>
                ))}
                <Route
                  path="/"
                  element={
                    <LandingPage
                      onGetStarted={() => navigate("/dashboard")}
                      onSignIn={() => navigate("/dashboard")}
                    />
                  }
                />
                <Route
                  path={screenToPath(ScreenId.LOGIN)}
                  element={
                    <LoggedInLoginPrompt
                      user={user}
                      onContinue={() => navigate(screenToPath(ScreenId.DASHBOARD))}
                      onLogout={() => void handleLogout()}
                    />
                  }
                />
                <Route path="*" element={<NotFoundScreen onNavigate={handleScreenChange} />} />
              </Routes>
            )}
          </div>

          {isLoggedIn && (
            <footer className="key-footer-bar px-4 sm:px-6 py-3.5 flex items-center justify-between font-mono shrink-0 select-none relative z-[1] pt-2">
              <div className="flex min-w-0">
                <span className="flex items-center truncate" aria-live="polite">
                  <span
                    className={`w-2 h-2 rounded-full mr-2 shrink-0 ${
                      serverHealth === "online"
                        ? "bg-emerald-500 animate-pulse"
                        : serverHealth === "offline"
                          ? "bg-rose-500"
                          : "bg-amber-400 animate-pulse"
                    }`}
                  />
                  {serverHealth === "online"
                    ? "System Operational"
                    : serverHealth === "offline"
                      ? "Server Offline"
                      : "Checking Server"}
                </span>
              </div>
              <div>KeyLink360 © 2026</div>
            </footer>
          )}
        </main>
      </div>

      {isLoggedIn && (
        <MobileNavDrawer
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
          currentScreen={currentScreen}
          onScreenChange={handleScreenChange}
          user={user}
        />
      )}

      {isLoggedIn && (
        <PublishModal
          isOpen={isPublishOpen}
          settings={publishSettings}
          user={user}
          onClose={() => setIsPublishOpen(false)}
          onSave={savePublishSettings}
          onPublished={handleWebsitePublished}
          onNavigateToCustomDomains={() => {
            setIsPublishOpen(false);
            handleScreenChange(ScreenId.CUSTOM_DOMAINS);
          }}
        />
      )}
    </div>
  );
}
