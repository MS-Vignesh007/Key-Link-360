import React, { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { normalizePageTheme, getBioPageThemeClass, getBioPageThemeStyle } from "../lib/bioPageThemes";
import {
  BlockRecord,
  destinationEmailFromBlock,
  downloadVCard,
  getLinkSpinCouponCode,
  getLinkSpinPrizes,
  normalizeExternalUrl,
  filterVisibleBioBlocks
} from "../lib/bioBlocks";
import { apiUrl } from "../lib/apiBase";
import { openRazorpayCheckoutAndVerify, pageRequiresPayment } from "../lib/razorpayCheckout";
import BlockRenderer, { type BlockRendererHandlers } from "./bio/BlockRenderer";
import CoverPhotoView from "./bio/CoverPhotoView";
import ThankYouPageView, {
  createDefaultThankYouBlocks,
  DEFAULT_THANK_YOU_MESSAGE,
  DEFAULT_THANK_YOU_BRAND
} from "./bio/ThankYouPageView";
import { normalizeCoverSettings } from "../lib/bioCoverPhoto";
import { formatDisplayHandle, readLocalPageUpdatedAt } from "../storage/bioBuilderStorage";
import type { BioPage, BioPagePreviewDetails, BioPagePreviewTheme } from "../types";

interface Block {
  id: string;
  type: string;
  label: string;
  value: string;
}

interface PublicBioPageViewProps {
  pageId: string;
  pageTitle: string;
  pageSlug: string;
  pageBio?: string;
  pageCoverPhoto?: string;
  /** Optional page list (legacy; thank-you is now per-page details). */
  allPages?: BioPage[];
  /** Platform ?previewPageId= testing shows the sandbox banner; live custom domains do not. */
  mode?: "preview" | "live";
}

const marvelFallbackBlocks = [
  { id: "b1", type: "Header", label: "👤 Marvel Toys for Kids", value: "👤 Marvel Toys for Kids" },
  { id: "b2", type: "Header", label: "Official Marvel-Inspired Toys & Collectibles", value: "Official Marvel-Inspired Toys & Collectibles" },
  { id: "b3", type: "Text", label: "🎁 Safe, fun & exciting toys for young superheroes.", value: "🎁 Safe, fun & exciting toys for young superheroes." },
  { id: "b4", type: "Header", label: "⭐ Why Shop With Us?", value: "⭐ Why Shop With Us?" },
  { id: "b5", type: "Text", label: "🛡️ Quality Marvel-themed toys, 🚚 Fast Shipping, 💯 Trusted", value: "🛡️ Quality Marvel-themed toys, 🚚 Fast Shipping, 💯 Trusted" },
  { id: "b6", type: "Shop", label: "Products For Kids (Iron Man, Spiderman, Hulk)", value: "Products For Kids" },
  { id: "b7", type: "Button", label: "Explore the Toys Section", value: "Explore the Toys Section", bgColor: "#7c3aed", textColor: "#FFFFFF" },
  { id: "b8", type: "Coupon", label: "Special Offer (MARVELTOYCODE007007)", value: "MARVELTOYCODE007007" },
  { id: "b9", type: "Countdown", label: "Sale ends in (9 Days Timer)", value: "9" },
  { id: "b10", type: "Link Spin", label: "Buy Now (Prize Wheel)", value: "Buy Now" },
  { id: "b11", type: "WhatsApp", label: "Message Us on WhatsApp", value: "Message Us on WhatsApp" },
  { id: "b12", type: "Smart Form", label: "Get in Touch Leads Form", value: "Get in Touch" },
  { id: "b13", type: "vCard", label: "Save Contact Card Info", value: "Save Contact" }
];

const genericFallbackBlocks = [
  { id: "g1", type: "Header", label: "👤 My Responsive BioLink", value: "👤 My Responsive BioLink" },
  { id: "g2", type: "Text", label: "Welcome to my responsive bio page! Customize me using the blocks.", value: "Welcome" },
  { id: "g3", type: "Button", label: "Visit My Website", value: "https://example.com", bgColor: "#7c3aed", textColor: "#FFFFFF" },
  { id: "g4", type: "WhatsApp", label: "Chat with me on WhatsApp", value: "https://wa.me/1234567890" }
];

function readCachedPage(pageId: string): { blocks?: Block[]; details?: BioPagePreviewDetails } | null {
  try {
    const raw = sessionStorage.getItem(`keys_public_page_${pageId}`);
    if (!raw) return null;
    return JSON.parse(raw) as { blocks?: Block[]; details?: BioPagePreviewDetails };
  } catch {
    return null;
  }
}

function writeCachedPage(pageId: string, blocks: Block[], details: BioPagePreviewDetails | null) {
  try {
    sessionStorage.setItem(
      `keys_public_page_${pageId}`,
      JSON.stringify({ blocks, details, cachedAt: Date.now() })
    );
  } catch {
    /* ignore quota errors */
  }
}

function readLocalPageData(pageId: string, pageSlug: string) {
  let loadedBlocks: Block[] | null = null;
  let loadedDetails: BioPagePreviewDetails | null = null;

  // Prefer durable localStorage (written on Publish) over session cache.
  const savedBlocks =
    localStorage.getItem(`biolink_blocks_${pageId}`) ||
    localStorage.getItem(`biolink_blocks_${pageSlug}`);
  if (savedBlocks) {
    try {
      const parsed = JSON.parse(savedBlocks);
      if (Array.isArray(parsed) && parsed.length > 0) {
        loadedBlocks = parsed;
      }
    } catch {
      /* ignore */
    }
  }

  const savedDetails =
    localStorage.getItem(`biolink_details_${pageId}`) ||
    localStorage.getItem(`biolink_details_${pageSlug}`);
  if (savedDetails) {
    try {
      loadedDetails = JSON.parse(savedDetails) as BioPagePreviewDetails;
    } catch {
      /* ignore */
    }
  }

  if (!loadedBlocks?.length || !loadedDetails) {
    const cached = readCachedPage(pageId);
    if (!loadedBlocks?.length && cached?.blocks?.length) {
      loadedBlocks = cached.blocks;
    }
    if (!loadedDetails && cached?.details) {
      loadedDetails = cached.details;
    }
  }

  return { loadedBlocks, loadedDetails };
}

function mergePaymentDetails(
  primary: BioPagePreviewDetails | null | undefined,
  fallback: BioPagePreviewDetails | null | undefined
): BioPagePreviewDetails | null {
  if (!primary && !fallback) return null;
  if (!primary) return fallback ?? null;
  if (!fallback) return primary;
  const primaryPay = pageRequiresPayment(primary);
  const fallbackPay = pageRequiresPayment(fallback);
  if (primaryPay || !fallbackPay) return primary;
  return {
    ...primary,
    paymentEnabled: true,
    paymentAmountInr: fallback.paymentAmountInr,
    paymentDescription: fallback.paymentDescription
  };
}

function getInitialPageState(pageId: string, pageSlug: string, mode: "preview" | "live") {
  const { loadedBlocks, loadedDetails } = readLocalPageData(pageId, pageSlug);
  if (loadedBlocks?.length) {
    return {
      blocks: loadedBlocks,
      details: loadedDetails,
      status: "ready" as const
    };
  }
  if (mode === "live") {
    return {
      blocks: [] as Block[],
      details: loadedDetails,
      status: (loadedDetails ? "ready" : "loading") as "loading" | "ready" | "not_found"
    };
  }
  return {
    blocks: [] as Block[],
    details: loadedDetails,
    status: "loading" as const
  };
}

function BlockSkeleton() {
  return (
    <div className="key-public-bio-page__skeleton space-y-3" aria-hidden>
      {[0, 1, 2].map((key) => (
        <div key={key} className="h-12 rounded-2xl bg-slate-500/15 animate-pulse" />
      ))}
    </div>
  );
}

export default function PublicBioPageView({
  pageId,
  pageTitle,
  pageSlug,
  pageBio,
  pageCoverPhoto,
  allPages,
  mode = "preview"
}: PublicBioPageViewProps) {
  const initialPage = getInitialPageState(pageId, pageSlug, mode);
  const [displayPageId, setDisplayPageId] = useState(pageId);
  const displayPageMeta = allPages?.find((page) => page.id === displayPageId);
  const effectiveSlug = displayPageMeta?.slug || pageSlug;
  const effectiveTitle = displayPageMeta?.title || pageTitle;
  const effectiveBio = displayPageMeta?.bio || pageBio;
  const effectiveCover = displayPageMeta?.coverPhoto || pageCoverPhoto;
  const [blocks, setBlocks] = useState<Block[]>(initialPage.blocks);
  const [customDetails, setCustomDetails] = useState<BioPagePreviewDetails | null>(initialPage.details);
  const [pageTheme, setPageTheme] = useState<BioPagePreviewTheme>(
    normalizePageTheme(initialPage.details?.pageTheme)
  );
  const [pageLoadStatus, setPageLoadStatus] = useState<"loading" | "ready" | "not_found">(initialPage.status);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [leadEmails, setLeadEmails] = useState<Record<string, string>>({});
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showThanksPage, setShowThanksPage] = useState(false);
  const publicScreenRef = useRef<HTMLDivElement | null>(null);
  const [activeSpinBlockId, setActiveSpinBlockId] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const pageEtagRef = useRef<string | null>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const applyStoredDetails = (parsed: BioPagePreviewDetails | null) => {
    if (!parsed || typeof parsed !== "object") return;
    setCustomDetails(parsed);
    setPageTheme(normalizePageTheme(parsed.pageTheme));
  };

  const reloadStoredDetails = () => {
    try {
      const savedDetails =
        localStorage.getItem(`biolink_details_${displayPageId}`) ||
        localStorage.getItem(`biolink_details_${effectiveSlug}`);
      if (!savedDetails) return;
      applyStoredDetails(JSON.parse(savedDetails) as BioPagePreviewDetails);
    } catch (e) {
      console.error("Error loading custom details:", e);
    }
  };

  useEffect(() => {
    setDisplayPageId(pageId);
    try {
      sessionStorage.removeItem(`keys_public_page_${pageId}`);
    } catch {
      /* ignore */
    }
  }, [pageId]);

  useEffect(() => {
    const rawTitle = customDetails?.title || pageTitle || "BioLink";
    const cleanTitle = rawTitle.trim();
    if (!cleanTitle || cleanTitle.toLowerCase() === "keylink360") {
      document.title = "KeyLink360";
    } else {
      document.title = `${cleanTitle} · KeyLink360`;
    }
  }, [customDetails?.title, pageTitle]);

  useEffect(() => {
    if (mode === "live") return;

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === `biolink_details_${displayPageId}` ||
        event.key === `biolink_details_${effectiveSlug}`
      ) {
        reloadStoredDetails();
      }
    };

    const handlePreviewUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ pageId?: string; pageSlug?: string; details?: BioPagePreviewDetails }>).detail;
      if (!detail) return;
      if (detail.pageId !== displayPageId && detail.pageSlug !== effectiveSlug) return;
      if (detail.details) {
        applyStoredDetails(detail.details);
      } else {
        reloadStoredDetails();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("key-page-preview-updated", handlePreviewUpdated as EventListener);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("key-page-preview-updated", handlePreviewUpdated as EventListener);
    };
  }, [displayPageId, effectiveSlug, mode]);

  useEffect(() => {
    document.documentElement.classList.add("key-public-scroll");
    return () => {
      document.documentElement.classList.remove("key-public-scroll");
    };
  }, []);

  const trackAction = useCallback((eventType: "visit" | "click" | "register", eventLabel: string, details?: any) => {
    fetch(apiUrl("/api/track"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId,
        eventType,
        eventLabel,
        details
      })
    }).catch(err => {
      console.error("Failed to track event:", err);
    });
  }, [pageId]);

  const openWhatsAppLink = (value: string) => {
    if (!value) return;
    
    try {
      // If it's already a full link, use it
      if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("whatsapp://")) {
        window.open(value, "_blank", "noopener,noreferrer");
        return;
      }
      
      // Clean up any non-numeric characters for wa.me link
      const cleaned = value.replace(/[^0-9]/g, "");
      if (cleaned) {
        window.open(`https://wa.me/${cleaned}`, "_blank", "noopener,noreferrer");
      } else {
        window.open(`https://wa.me/${encodeURIComponent(value)}`, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.warn("WhatsApp redirect blocked by popup blocker or iframe policy:", err);
    }
  };

  const openExternalLink = (value: string) => {
    const target = value.trim();
    if (!target) {
      triggerToast("This link has not been configured yet.");
      return;
    }

    const url = normalizeExternalUrl(target);
    try {
      if (url.startsWith("mailto:") || url.startsWith("tel:")) {
        window.location.href = url;
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      triggerToast("Your browser blocked this link. Please try again.");
    }
  };

  const applyLoadedPage = (
    nextBlocks: Block[],
    details: BioPagePreviewDetails | null,
    status: "ready" | "not_found" = "ready"
  ) => {
    setBlocks(nextBlocks);
    setPageLoadStatus(status);
    if (details) {
      setCustomDetails(details);
      setPageTheme(normalizePageTheme(details.pageTheme));
    }
    writeCachedPage(displayPageId, nextBlocks, details);
  };

  const readLocalPageDataForPage = () => readLocalPageData(displayPageId, effectiveSlug);

  const applyServerDocument = (
    data: { blocks?: Block[]; details?: BioPagePreviewDetails; updatedAt?: string },
    localUpdatedAt: string | null,
    localDetails?: BioPagePreviewDetails | null
  ) => {
    const serverBlocks = Array.isArray(data.blocks) ? data.blocks : null;
    const serverDetails = mergePaymentDetails(data.details ?? null, localDetails ?? null);
    const serverUpdatedAt = typeof data.updatedAt === "string" ? data.updatedAt : null;
    const localIsNewer =
      localUpdatedAt &&
      serverUpdatedAt &&
      new Date(localUpdatedAt).getTime() > new Date(serverUpdatedAt).getTime();

    const serverHasPayment = pageRequiresPayment(data.details ?? null);
    const localHasPayment = pageRequiresPayment(localDetails ?? null);

    // Never keep a stale local doc that hides Pay UI when the server already has payment on.
    if (mode !== "live" && localIsNewer && !(serverHasPayment && !localHasPayment)) {
      return false;
    }
    if (serverBlocks) {
      applyLoadedPage(serverBlocks, serverDetails, "ready");
      return true;
    }
    if (serverDetails) {
      setCustomDetails(serverDetails);
      setPageTheme(normalizePageTheme(serverDetails.pageTheme));
      setPageLoadStatus("ready");
      return true;
    }
    return false;
  };

  // Track initial visit on mount
  useEffect(() => {
    trackAction("visit", "BioLink Page Visited");
  }, [trackAction]);

  const fetchServerPageDocument = useCallback(async (signal?: AbortSignal) => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (pageEtagRef.current) {
      headers["If-None-Match"] = pageEtagRef.current;
    }

    const res = await fetch(apiUrl(`/api/page/${displayPageId}`), {
      signal,
      headers,
      cache: "no-store"
    });
    if (res.status === 304) return { notModified: true as const };
    if (!res.ok) return null;

    const etag = res.headers.get("ETag");
    if (etag) pageEtagRef.current = etag;

    const data = (await res.json()) as {
      blocks?: Block[];
      details?: BioPagePreviewDetails;
      updatedAt?: string;
    };
    return { ...data, notModified: false as const };
  }, [displayPageId]);
  useEffect(() => {
    let isMounted = true;
    pageEtagRef.current = null;
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    async function loadPageData() {
      setLoadError(null);

      const { loadedBlocks, loadedDetails } = readLocalPageDataForPage();
      const localUpdatedAt = readLocalPageUpdatedAt(displayPageId, effectiveSlug);

      if (isMounted && loadedBlocks?.length) {
        applyLoadedPage(loadedBlocks, loadedDetails, "ready");
      } else if (isMounted && loadedDetails) {
        applyStoredDetails(loadedDetails);
      }

      try {
        const data = await fetchServerPageDocument(controller.signal);
        if (!isMounted) return;

        if (!data) {
          if (mode === "live" && !loadedBlocks?.length) {
            setPageLoadStatus("not_found");
          }
          return;
        }

        if (data.notModified) {
          // 304 has no body — if Pay flags are missing locally, force a fresh fetch once.
          if (!pageRequiresPayment(loadedDetails)) {
            pageEtagRef.current = null;
            const fresh = await fetch(apiUrl(`/api/page/${displayPageId}`), {
              cache: "no-store",
              headers: { Accept: "application/json" }
            });
            if (fresh.ok) {
              const body = (await fresh.json()) as {
                blocks?: Block[];
                details?: BioPagePreviewDetails;
                updatedAt?: string;
              };
              const appliedFresh = applyServerDocument(body, localUpdatedAt, loadedDetails);
              if (appliedFresh) return;
            }
          }
          if (loadedBlocks?.length) setPageLoadStatus("ready");
          return;
        }

        const applied = applyServerDocument(data, localUpdatedAt, loadedDetails);
        if (applied) return;

        if (mode !== "live" && loadedBlocks?.length) {
          applyLoadedPage(loadedBlocks, loadedDetails ?? data.details ?? null, "ready");
          return;
        }

        if (mode === "live" && !loadedBlocks?.length) {
          setPageLoadStatus("not_found");
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        console.error("Failed to fetch page data from server:", err);
        if (isMounted && (mode === "live" || !loadedBlocks?.length)) {
          setLoadError("Could not reach the server. Check your connection and try again.");
        }
      }

      if (isMounted) {
        if (loadedBlocks?.length) {
          applyLoadedPage(loadedBlocks, loadedDetails, "ready");
        } else if (mode !== "live") {
          setPageLoadStatus("not_found");
          if (!loadedDetails) {
            setCustomDetails(null);
            setPageTheme("dark");
          }
        } else if (!loadedBlocks?.length) {
          setPageLoadStatus("not_found");
        }
      }
    }

    void loadPageData();

    return () => {
      isMounted = false;
      fetchAbortRef.current?.abort();
    };
  }, [displayPageId, effectiveSlug, effectiveTitle, mode, fetchServerPageDocument]);

  // Live custom domains: background refresh when tab is visible (ETag avoids full payload)
  useEffect(() => {
    if (mode !== "live") return;

    const pollLatest = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const data = await fetchServerPageDocument();
        if (!data || data.notModified) return;
        const local = readLocalPageDataForPage();
        applyServerDocument(data, null, local.loadedDetails);
      } catch {
        /* ignore transient poll errors */
      }
    };

    const interval = window.setInterval(() => {
      void pollLatest();
    }, 45000);

    const onVisible = () => {
      if (document.visibilityState === "visible") void pollLatest();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [mode, displayPageId, fetchServerPageDocument]);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const displayTitle = customDetails?.title || effectiveTitle;
  const displayHandle = formatDisplayHandle(customDetails?.handle, displayTitle, {
    fallbackToTitle: false
  });
  const displayBio = customDetails?.bio || effectiveBio;
  const activeSpinBlock = activeSpinBlockId
    ? blocks.find((block) => block.id === activeSpinBlockId)
    : blocks.find((block) => block.type === "Link Spin");
  const spinCouponCode = activeSpinBlock
    ? getLinkSpinCouponCode(activeSpinBlock as BlockRecord)
    : blocks.find((block) => block.type === "Coupon" && block.value)?.value || "SAVE20";
  const spinPrizes = activeSpinBlock
    ? getLinkSpinPrizes(activeSpinBlock as BlockRecord)
    : getLinkSpinPrizes({ id: "", type: "Link Spin", label: "", value: "" });
  const coverPhoto =
    customDetails?.coverPhoto ||
    effectiveCover ||
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800";
  const coverSettings = normalizeCoverSettings(customDetails?.coverSettings);
  const visibleBlocks = filterVisibleBioBlocks(blocks);
  const paymentRequired = pageRequiresPayment(customDetails);
  const paymentAmountInr = paymentRequired
    ? Math.round(Number(customDetails?.paymentAmountInr) || 0)
    : undefined;

  const openThanksAfterSubmit = () => {
    // Non-payment forms only — never a dedicated URL route.
    setShowThanksPage(true);
    publicScreenRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const liveBlockHandlers: BlockRendererHandlers = {
    onToast: triggerToast,
    onExternalLink: (url, label) => {
      if (label) trackAction("click", label);
      openExternalLink(url);
    },
    onWhatsApp: openWhatsAppLink,
    onSpinOpen: (blockId) => {
      setActiveSpinBlockId(blockId);
                      setSpinResult(null);
                      setIsSpinning(false);
                      setShowSpinWheel(true);
    },
    deferThanksUntilPaid: paymentRequired,
    paymentAmountInr,
    paymentSuccessTitle: customDetails?.thankYouTitle || "Payment successful",
    paymentSuccessMessage:
      customDetails?.thankYouMessage ||
      "Your payment was verified securely. Thank you!",
    onSecureCheckout: async ({ blockId, fields, source }) => {
      const blockLabel = blocks.find((entry) => entry.id === blockId)?.label || blockId;
      trackAction("register", `${source} checkout: ${blockLabel}`);
      const result = await openRazorpayCheckoutAndVerify({
        pageId,
        pageTitle: displayTitle,
        pageSlug,
        blockId,
        blockLabel,
        source,
        fields,
        sourceDomain: typeof window !== "undefined" ? window.location.hostname : "",
        displayName: displayTitle || "KEYLINK360"
      });
      if (result.state === "success" && result.contactId) {
        window.dispatchEvent(new CustomEvent("key-contacts-updated"));
      }
      // Success stays inside the Form/Smart Form checkout UI — no Thank You route/overlay.
      return result;
    },
    onLeadSubmit: (blockId, email, destinationEmail) => {
      if (paymentRequired) return;
      const blockLabel = blocks.find((entry) => entry.id === blockId)?.label || blockId;
      const fields = { Email: email };
      trackAction("register", `Smart Form Lead: ${blockLabel}`, { email });

      void fetch(apiUrl("/api/leads"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          pageTitle: displayTitle,
          pageSlug,
          blockId,
          blockLabel,
          source: "SMART FORM",
          sourceDomain: typeof window !== "undefined" ? window.location.hostname : "",
          templateId: customDetails?.templateId || "",
          templateName: customDetails?.templateName || "",
          fields
        })
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("Lead save failed");
          const payload = await response.json().catch(() => null);
          if (payload?.contact) {
            const { broadcastLeadCaptured } = await import("../lib/contactCapture");
            broadcastLeadCaptured(payload.contact);
                          } else {
            window.dispatchEvent(new CustomEvent("key-contacts-updated"));
          }
          setLeadEmails((prev) => ({ ...prev, [blockId]: "" }));
        })
        .catch(() => {
          if (destinationEmail) {
            const mailUrl = `mailto:${destinationEmail}?subject=${encodeURIComponent(`Lead from ${displayTitle}`)}&body=${encodeURIComponent(email)}`;
            window.location.href = mailUrl;
          }
          setLeadEmails((prev) => ({ ...prev, [blockId]: "" }));
        });
    },
    onFormSubmit: (blockId, data, destinationEmail) => {
      if (paymentRequired) return;
      const blockLabel = blocks.find((entry) => entry.id === blockId)?.label || blockId;
      const emailValue = Object.entries(data).find(
        ([key, value]) => key.toLowerCase().includes("email") || String(value).includes("@")
      )?.[1];
      trackAction("register", `Form Lead: ${blockLabel}`, {
        email: emailValue || undefined,
        name: data.Name || data.name || undefined
      });

      void fetch(apiUrl("/api/leads"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          pageTitle: displayTitle,
          pageSlug,
          blockId,
          blockLabel,
          source: "BIO FORM",
          sourceDomain: typeof window !== "undefined" ? window.location.hostname : "",
          templateId: customDetails?.templateId || "",
          templateName: customDetails?.templateName || "",
          fields: data
        })
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("Lead save failed");
          const payload = await response.json().catch(() => null);
          if (payload?.contact) {
            const { broadcastLeadCaptured } = await import("../lib/contactCapture");
            broadcastLeadCaptured(payload.contact);
          } else {
            window.dispatchEvent(new CustomEvent("key-contacts-updated"));
          }
        })
        .catch(() => {
          if (destinationEmail) {
            const body = Object.entries(data)
              .map(([key, value]) => `${key}: ${value}`)
              .join("\n");
            const mailUrl = `mailto:${destinationEmail}?subject=${encodeURIComponent(`Form submission from ${displayTitle}`)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailUrl;
          }
        });
    },
    onVCardDownload: (block) => {
      const contactName =
        (typeof block.contactName === "string" && block.contactName.trim()) ||
        displayTitle ||
        block.label;
      const phone =
        (typeof block.phone === "string" && block.phone.trim()) ||
        (block.value?.includes("@") ? "" : block.value);
      const email =
        (typeof block.email === "string" && block.email.trim()) ||
        (block.value?.includes("@") ? block.value : destinationEmailFromBlock(block));
      downloadVCard({ name: contactName, phone, email, handle: displayHandle });
                      trackAction("click", `vCard Contact: ${block.label}`);
      triggerToast("Contact card downloaded to your device.");
    },
    onTrack: trackAction,
    leadEmails,
    onLeadEmailChange: (blockId, email) => setLeadEmails((prev) => ({ ...prev, [blockId]: email })),
    onShowThanks: () => {
      if (paymentRequired) return;
      openThanksAfterSubmit();
    }
  };

                return (
    <div
      className={`key-public-bio-page ${getBioPageThemeClass(pageTheme)} flex flex-col items-center justify-start font-sans${
        showThanksPage ? " key-public-bio-page--thanks-open" : ""
      }`}
      style={getBioPageThemeStyle(pageTheme)}
    >
      <div
        ref={publicScreenRef}
        className={`key-public-bio-page__card key-preview-isolate key-public-bio-page__screen ${getBioPageThemeClass(pageTheme)} w-full max-w-md`}
        style={getBioPageThemeStyle(pageTheme)}
      >
        <div
          className="key-phone-preview__bio-layer"
          hidden={showThanksPage}
          aria-hidden={showThanksPage}
        >
          <CoverPhotoView
            src={coverPhoto}
            alt="Hero Cover"
            settings={coverSettings}
            variant="preview"
            className="key-phone-preview__cover key-public-bio-page__cover"
          />

          <div className="key-phone-preview__body key-public-bio-page__body">
            <div className="key-public-bio-page__profile">
              <h1 className="key-public-bio-page__title font-display">{displayTitle}</h1>
              {displayHandle && (
                <p className="key-public-bio-page__handle">{displayHandle}</p>
              )}
                    </div>

            {displayBio && <p className="key-phone-preview__bio-text">{displayBio}</p>}

            <div className="key-phone-preview__blocks space-y-4">
            {pageLoadStatus === "loading" && visibleBlocks.length === 0 && <BlockSkeleton />}
            {loadError && visibleBlocks.length === 0 && (
              <p className="key-public-bio-page__loading rounded-2xl border p-4 text-center text-xs">
                {loadError}
              </p>
            )}
            {pageLoadStatus === "not_found" && visibleBlocks.length === 0 && !loadError && (
              <p className="key-public-bio-page__loading rounded-2xl border p-4 text-center text-xs">
                This page content is not published on the server yet. Open KEYLINK360 → Bio Pages → Edit
                this page → Publish, then refresh.
              </p>
            )}
            {visibleBlocks.map((block) => (
              <BlockRenderer
                key={`${block.id}-pay-${paymentRequired ? paymentAmountInr || 0 : 0}`}
                block={block as BlockRecord}
                mode="live"
                context={{
                  displayTitle,
                  displayHandle,
                  paymentEnabled: paymentRequired,
                  paymentAmountInr
                }}
                handlers={liveBlockHandlers}
              />
            ))}
                      </div>

            <div className="key-bio-page-footer key-phone-preview__footer">
              <span>Powered by KEYLINK360</span>
                      </div>
                      </div>
                    </div>

        <ThankYouPageView
          open={showThanksPage}
          title={customDetails?.thankYouTitle || "Thank You"}
          message={
            !customDetails?.thankYouMessage ||
            customDetails.thankYouMessage ===
              "Your details were received. We will connect with you soon."
              ? DEFAULT_THANK_YOU_MESSAGE
              : customDetails.thankYouMessage
          }
          emoji={customDetails?.thankYouEmoji || "✓"}
          blocks={(
            (customDetails?.thankYouBlocks?.length
              ? customDetails.thankYouBlocks
              : createDefaultThankYouBlocks()) as BlockRecord[]
          ).map((block) => {
            if (block.type === "Button" && block.label === "View order status") {
              return { ...block, label: "Back to page", value: "" };
            }
            if (
              block.type === "Text" &&
              block.label === "Your details were received. We will connect with you soon."
            ) {
              return { ...block, label: DEFAULT_THANK_YOU_BRAND, value: DEFAULT_THANK_YOU_BRAND };
            }
            return block;
          })}
          onBack={() => setShowThanksPage(false)}
          displayTitle={displayTitle}
          handlers={{
            ...liveBlockHandlers,
            deferThanksUntilPaid: false,
            paymentAmountInr: undefined,
            onSecureCheckout: undefined
          }}
        />

        {/* Interactive Simulator Toast Overlay */}
        {toast && (
          <div className="absolute bottom-5 left-4 right-4 bg-slate-900/95 border border-slate-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl text-center shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 flex items-center justify-center gap-1.5">
            <span>🔔</span>
            <span className="leading-tight">{toast}</span>
          </div>
        )}

        {/* Dynamic Interactive Link Spin (Lucky Wheel) Game Overlay */}
        {showSpinWheel && (
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-200">
            <button
              onClick={() => setShowSpinWheel(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center space-y-1 mb-6">
              <span className="text-xs font-black text-cyan-400 tracking-wider uppercase block">🎁 GROW YOUR SALES</span>
              <h4 className="font-display font-black text-xl">Lucky Wheel Game</h4>
              <p className="text-[11px] text-slate-300">Spin the interactive wheel to win real prizes!</p>
            </div>

            {/* Wheel Wrapper */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-6">
              {/* Needle/pointer */}
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 z-30 rotate-45 transform shadow-md" />

              {/* Spinner circle using conic gradient */}
              <div
                className={`w-full h-full rounded-full border-4 border-slate-700 relative overflow-hidden shadow-2xl ${
                  isSpinning ? "animate-[spin_0.8s_linear_infinite]" : ""
                }`}
                style={{
                  background: "conic-gradient(#7c3aed 0deg 90deg, #2563EB 90deg 180deg, #10B981 180deg 270deg, #a855f7 270deg 360deg)"
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                  <span className="absolute top-4 text-white font-extrabold text-[9px]">Gift</span>
                  <span className="absolute right-4 text-white font-extrabold text-[9px]">20% OFF</span>
                  <span className="absolute bottom-4 text-white font-extrabold text-[9px]">Try Again</span>
                  <span className="absolute left-4 text-white font-extrabold text-[9px]">Freebie</span>
                </div>
              </div>

              {/* Spin hub */}
              <div className="absolute w-14 h-14 rounded-full bg-white text-slate-900 shadow-lg flex items-center justify-center z-20">
                <span className="text-xs font-black text-slate-950 font-mono">1SMART</span>
              </div>
            </div>

            {spinResult ? (
              <div className="text-center space-y-3.5 animate-in zoom-in-95 duration-200 max-w-xs">
                <p className="text-sm font-black text-green-400">🎉 CONGRATULATIONS! 🎉</p>
                <p className="text-sm font-black text-white">{spinResult}</p>
                <p className="text-xs text-slate-400 bg-slate-950 px-3 py-2 rounded-xl font-mono border border-slate-800">
                  Use Code: <span className="font-bold text-cyan-400">{spinCouponCode}</span>
                </p>
                <div className="flex gap-2 justify-center pt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(spinCouponCode);
                      triggerToast("Spin coupon code copied!");
                      setShowSpinWheel(false);
                    }}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-950 rounded-xl text-xs font-bold"
                  >
                    Copy Code
                  </button>
                  <button
                    onClick={() => {
                      setSpinResult(null);
                      setIsSpinning(false);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                  >
                    Spin Again
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (isSpinning) return;
                  setIsSpinning(true);
                  setTimeout(() => {
                    setIsSpinning(false);
                    const won = spinPrizes[Math.floor(Math.random() * spinPrizes.length)];
                    setSpinResult(won);
                    trackAction("register", "Spin Wheel Prize Won", { prize: won, code: spinCouponCode });
                  }, 1800);
                }}
                disabled={isSpinning}
                className="px-8 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-slate-950 hover:text-white rounded-2xl text-xs font-black transition-all shadow-lg disabled:opacity-50"
              >
                {isSpinning ? "SPINNING..." : "SPIN THE WHEEL!"}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
