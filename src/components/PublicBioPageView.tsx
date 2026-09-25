import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Tv,
  Globe,
  ArrowLeft,
  Move,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RotateCcw
} from "lucide-react";
import InlineEditableText from "./bio/InlineEditableText";
import { normalizePageTheme, getBioPageThemeClass, getBioPageThemeStyle } from "../lib/bioPageThemes";
import type { DeviceViewportMode } from "../types";
import {
  BlockRecord,
  destinationEmailFromBlock,
  downloadVCard,
  getLinkSpinCouponCode,
  getLinkSpinPrizes,
  normalizeExternalUrl,
  filterVisibleBioBlocks,
  isWideBlock,
  getSemanticAnchorForBlock,
  resolveDestination
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
import BioAiChatWidget from "./bio/BioAiChatWidget";
import { normalizeCoverSettings } from "../lib/bioCoverPhoto";
import { formatDisplayHandle, readLocalPageUpdatedAt } from "../storage/bioBuilderStorage";
import { computeBlockInlineStyles, getBlockCustomMeta } from "../lib/blockStyleHelper";
import type { BioPage, BioPagePreviewDetails, BioPagePreviewTheme, BlockDeveloperStyles } from "../types";

interface Block {
  id: string;
  type: string;
  label: string;
  value: string;
  deviceVisibility?: string;
  colSpan?: string;
  styles?: BlockDeveloperStyles;
  isLocked?: boolean;
  isHidden?: boolean;
  [key: string]: any;
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
  initialBlocks?: Block[];
  initialDetails?: BioPagePreviewDetails;
  onExitPreview?: () => void;
  onUpdateBlocks?: (newBlocks: Block[]) => void;
  onUpdateDetails?: (newDetails: BioPagePreviewDetails) => void;
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

function writeCachedPage(pageId: string, blocks: Block[], details: BioPagePreviewDetails | null, pageSlug?: string) {
  try {
    sessionStorage.setItem(
      `keys_public_page_${pageId}`,
      JSON.stringify({ blocks, details, cachedAt: Date.now() })
    );
    if (pageSlug) {
      sessionStorage.setItem(
        `keys_public_page_${pageSlug}`,
        JSON.stringify({ blocks, details, cachedAt: Date.now() })
      );
    }
    localStorage.setItem(`biolink_blocks_${pageId}`, JSON.stringify(blocks));
    if (pageSlug) {
      localStorage.setItem(`biolink_blocks_${pageSlug}`, JSON.stringify(blocks));
    }
    if (details) {
      localStorage.setItem(`biolink_details_${pageId}`, JSON.stringify(details));
      if (pageSlug) {
        localStorage.setItem(`biolink_details_${pageSlug}`, JSON.stringify(details));
      }
    }
    window.dispatchEvent(
      new CustomEvent("key-page-preview-updated", {
        detail: { pageId, pageSlug, blocks, details }
      })
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
  mode = "preview",
  initialBlocks,
  initialDetails,
  onExitPreview,
  onUpdateBlocks,
  onUpdateDetails
}: PublicBioPageViewProps) {
  const initialPage =
    initialBlocks && initialBlocks.length > 0
      ? {
          blocks: initialBlocks,
          details: initialDetails || null,
          status: "ready" as const
        }
      : getInitialPageState(pageId, pageSlug, mode);
  const [displayPageId, setDisplayPageId] = useState(pageId);
  const displayPageMeta = allPages?.find((page) => page.id === displayPageId);
  const effectiveSlug = displayPageMeta?.slug || pageSlug;
  const effectiveTitle = initialDetails?.title || displayPageMeta?.title || pageTitle;
  const effectiveBio = initialDetails?.bio ?? (displayPageMeta?.bio || pageBio);
  const effectiveCover = initialDetails?.coverPhoto || displayPageMeta?.coverPhoto || pageCoverPhoto;
  const [blocks, setBlocks] = useState<Block[]>(initialPage.blocks);
  const [customDetails, setCustomDetails] = useState<BioPagePreviewDetails | null>(
    initialDetails || initialPage.details
  );
  const [pageTheme, setPageTheme] = useState<BioPagePreviewTheme>(
    normalizePageTheme(initialDetails?.pageTheme || initialPage.details?.pageTheme)
  );
  const [pageLoadStatus, setPageLoadStatus] = useState<"loading" | "ready" | "not_found">(initialPage.status);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!onExitPreview) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExitPreview();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExitPreview]);

  useEffect(() => {
    if (initialBlocks && initialBlocks.length > 0) {
      setBlocks(initialBlocks);
      setPageLoadStatus("ready");
    }
  }, [initialBlocks]);

  useEffect(() => {
    if (initialDetails) {
      setCustomDetails(initialDetails);
      if (initialDetails.pageTheme) {
        setPageTheme(normalizePageTheme(initialDetails.pageTheme));
      }
    }
  }, [initialDetails]);
  const [toast, setToast] = useState<string | null>(null);
  const [leadEmails, setLeadEmails] = useState<Record<string, string>>({});
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showThanksPage, setShowThanksPage] = useState(false);
  const publicScreenRef = useRef<HTMLDivElement | null>(null);
  const [activeSpinBlockId, setActiveSpinBlockId] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [activeDeviceMode, setActiveDeviceMode] = useState<DeviceViewportMode | "auto">(() => {
    if (typeof window === "undefined") return "auto";
    const params = new URLSearchParams(window.location.search);
    const d = params.get("device") || params.get("view");
    if (d === "mobile" || d === "tablet" || d === "laptop" || d === "desktop" || d === "tv") {
      return d;
    }
    return "auto";
  });
  const [showDeviceDock, setShowDeviceDock] = useState(true);

  // Super Smart Edit State for Global Preview
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);

  const [resizingBlock, setResizingBlock] = useState<{
    blockId: string;
    handle: "top" | "bottom" | "left" | "right" | "nw" | "ne" | "se" | "sw";
    startX: number;
    startY: number;
    initialScale: number;
    initialPaddingY: number;
    initialPaddingX: number;
    currentScale?: number;
    currentPaddingY?: number;
    currentPaddingX?: number;
  } | null>(null);

  const startResizing = (
    blockId: string,
    handle: "top" | "bottom" | "left" | "right" | "nw" | "ne" | "se" | "sw",
    e: React.MouseEvent | React.TouchEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const block = blocks.find((b) => b.id === blockId);
    const styles = (block?.styles || {}) as BlockDeveloperStyles;
    const initialScale = typeof styles.scale === "number" ? styles.scale : (typeof styles.customScale === "number" ? styles.customScale : 1);
    const initialPaddingY = typeof styles.paddingTop === "number" ? styles.paddingTop : 8;
    const initialPaddingX = typeof styles.paddingLeft === "number" ? styles.paddingLeft : 8;

    setResizingBlock({
      blockId,
      handle,
      startX: clientX,
      startY: clientY,
      initialScale,
      initialPaddingY,
      initialPaddingX,
      currentScale: initialScale,
      currentPaddingY: initialPaddingY,
      currentPaddingX: initialPaddingX
    });
  };

  useEffect(() => {
    if (!resizingBlock) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const deltaX = clientX - resizingBlock.startX;
      const deltaY = clientY - resizingBlock.startY;

      if (
        resizingBlock.handle === "se" ||
        resizingBlock.handle === "sw" ||
        resizingBlock.handle === "ne" ||
        resizingBlock.handle === "nw"
      ) {
        const dirX = resizingBlock.handle === "se" || resizingBlock.handle === "ne" ? 1 : -1;
        const dirY = resizingBlock.handle === "se" || resizingBlock.handle === "sw" ? 1 : -1;
        const effectiveDelta = (deltaX * dirX + deltaY * dirY) / 2;
        const newScale = Math.min(1.4, Math.max(0.7, Number((resizingBlock.initialScale + effectiveDelta * 0.003).toFixed(2))));

        setResizingBlock((prev) => (prev ? { ...prev, currentScale: newScale } : null));

        setBlocks((prevBlocks) =>
          prevBlocks.map((b) =>
            b.id === resizingBlock.blockId
              ? {
                  ...b,
                  styles: {
                    ...((b as any).styles || {}),
                    scale: newScale,
                    customScale: newScale
                  }
                }
              : b
          )
        );
      } else if (resizingBlock.handle === "top" || resizingBlock.handle === "bottom") {
        const dir = resizingBlock.handle === "bottom" ? 1 : -1;
        const newPad = Math.max(2, Math.min(50, Math.round(resizingBlock.initialPaddingY + deltaY * dir * 0.4)));
        setResizingBlock((prev) => (prev ? { ...prev, currentPaddingY: newPad } : null));

        setBlocks((prevBlocks) =>
          prevBlocks.map((b) =>
            b.id === resizingBlock.blockId
              ? {
                  ...b,
                  styles: {
                    ...((b as any).styles || {}),
                    paddingTop: newPad,
                    paddingBottom: newPad
                  }
                }
              : b
          )
        );
      } else if (resizingBlock.handle === "left" || resizingBlock.handle === "right") {
        const dir = resizingBlock.handle === "right" ? 1 : -1;
        const newPad = Math.max(2, Math.min(44, Math.round(resizingBlock.initialPaddingX + deltaX * dir * 0.4)));
        setResizingBlock((prev) => (prev ? { ...prev, currentPaddingX: newPad } : null));

        setBlocks((prevBlocks) =>
          prevBlocks.map((b) =>
            b.id === resizingBlock.blockId
              ? {
                  ...b,
                  styles: {
                    ...((b as any).styles || {}),
                    paddingLeft: newPad,
                    paddingRight: newPad
                  }
                }
              : b
          )
        );
      }
    };

    const handlePointerUp = () => {
      if (resizingBlock) {
        setBlocks((prevBlocks) => {
          writeCachedPage(displayPageId, prevBlocks, customDetails, effectiveSlug);
          onUpdateBlocks?.(prevBlocks);
          return prevBlocks;
        });
        setResizingBlock(null);
      }
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchmove", handlePointerMove);
    window.addEventListener("touchend", handlePointerUp);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [resizingBlock, displayPageId, customDetails, effectiveSlug, onUpdateBlocks]);

  const handleMoveBlock = (blockId: string, direction: "up" | "down") => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === blockId);
      if (idx === -1) return prev;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const [removed] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, removed);
      writeCachedPage(displayPageId, copy, customDetails, effectiveSlug);
      onUpdateBlocks?.(copy);
      return copy;
    });
  };

  const handleReorderBlocks = (sourceId: string, targetId: string, position: "before" | "after") => {
    if (sourceId === targetId) return;
    setBlocks((prev) => {
      const srcIdx = prev.findIndex((b) => b.id === sourceId);
      const tgtIdx = prev.findIndex((b) => b.id === targetId);
      if (srcIdx === -1 || tgtIdx === -1) return prev;
      const copy = [...prev];
      const [removed] = copy.splice(srcIdx, 1);
      let insertIdx = position === "before" ? tgtIdx : tgtIdx + 1;
      if (srcIdx < insertIdx) insertIdx -= 1;
      copy.splice(insertIdx, 0, removed);
      writeCachedPage(displayPageId, copy, customDetails, effectiveSlug);
      onUpdateBlocks?.(copy);
      return copy;
    });
  };

  const handleSetBlockScale = (blockId: string, scale: number) => {
    setBlocks((prev) => {
      const updated = prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              styles: {
                ...((b as any).styles || {}),
                scale,
                customScale: scale
              }
            }
          : b
      );
      writeCachedPage(displayPageId, updated, customDetails, effectiveSlug);
      onUpdateBlocks?.(updated);
      return updated;
    });
  };

  const handleToggleBlockColSpan = (blockId: string) => {
    setBlocks((prev) => {
      const updated = prev.map((b) => {
        if (b.id !== blockId) return b;
        const nextColSpan = b.colSpan === "half" ? "full" : "half";
        return { ...b, colSpan: nextColSpan };
      });
      writeCachedPage(displayPageId, updated, customDetails, effectiveSlug);
      onUpdateBlocks?.(updated);
      return updated;
    });
    triggerToast("✨ Updated column width!");
  };

  const handleDuplicateBlock = (blockId: string) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === blockId);
      if (idx === -1) return prev;
      const original = prev[idx];
      const copyBlock: Block = {
        ...original,
        id: "block_" + Date.now(),
        label: `${original.label || original.type} (Copy)`
      };
      const copy = [...prev];
      copy.splice(idx + 1, 0, copyBlock);
      writeCachedPage(displayPageId, copy, customDetails, effectiveSlug);
      onUpdateBlocks?.(copy);
      setSelectedBlockId(copyBlock.id);
      return copy;
    });
    triggerToast("✨ Duplicated component!");
  };

  const handleDeleteBlock = (blockId: string) => {
    setBlocks((prev) => {
      const updated = prev.filter((b) => b.id !== blockId);
      writeCachedPage(displayPageId, updated, customDetails, effectiveSlug);
      onUpdateBlocks?.(updated);
      return updated;
    });
    if (selectedBlockId === blockId) setSelectedBlockId(null);
    triggerToast("🗑️ Deleted component!");
  };

  const handleToggleBlockLock = (blockId: string) => {
    setBlocks((prev) => {
      const updated = prev.map((b) => {
        if (b.id !== blockId) return b;
        const nextLock = !Boolean(b.isLocked || (b as any).styles?.isLocked);
        return {
          ...b,
          isLocked: nextLock,
          styles: { ...((b as any).styles || {}), isLocked: nextLock }
        };
      });
      writeCachedPage(displayPageId, updated, customDetails, effectiveSlug);
      onUpdateBlocks?.(updated);
      return updated;
    });
  };

  const handleToggleBlockHidden = (blockId: string) => {
    setBlocks((prev) => {
      const updated = prev.map((b) => {
        if (b.id !== blockId) return b;
        const nextHidden = !Boolean(b.isHidden || (b as any).styles?.isHidden);
        return {
          ...b,
          isHidden: nextHidden,
          styles: { ...((b as any).styles || {}), isHidden: nextHidden }
        };
      });
      writeCachedPage(displayPageId, updated, customDetails, effectiveSlug);
      onUpdateBlocks?.(updated);
      return updated;
    });
  };
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

    if (target.startsWith("#")) {
      resolveDestination(target, target.slice(1), liveBlockHandlers, mode);
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
    onInlineTextChange: (blockId, field, val) => {
      setBlocks((prevBlocks) => {
        const updated = prevBlocks.map((b) => {
          if (b.id !== blockId) return b;
          if (field === "headline") {
            return { ...b, headline: val, label: val };
          }
          if (field === "subheadline") {
            return { ...b, subheadline: val, value: val };
          }
          return { ...b, [field]: val };
        });
        writeCachedPage(displayPageId, updated, customDetails, effectiveSlug);
        onUpdateBlocks?.(updated);
        return updated;
      });
      triggerToast("✨ SMART EDIT Saved!");
    },
    isInlineEditingAllowed: mode === "preview",
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

    const currentPageMeta = allPages?.find((p) => p.id === pageId || (pageSlug && p.slug === pageSlug));
    const isCustomDeviceScopeEnabled =
      Boolean(customDetails?.targetDevicesCustomEnabled ?? currentPageMeta?.targetDevicesCustomEnabled);
    // If custom device scope is not enabled, default to "all_devices" (Ultra-wide auto-fluid)
    const deviceScope = isCustomDeviceScopeEnabled
      ? (customDetails?.deviceScope || currentPageMeta?.deviceScope || "all_devices")
      : (customDetails?.deviceScope || currentPageMeta?.deviceScope || "all_devices");

    const targetScopeDevice: DeviceViewportMode =
      deviceScope === "mobile_only"
        ? "mobile"
        : deviceScope === "mobile_tablet"
          ? "tablet"
          : deviceScope === "mobile_tablet_laptop"
            ? "laptop"
            : "desktop";

    // In live published mode, strictly honor the author's published device target.
    // In preview mode, allow manual activeDeviceMode switcher if toggled.
    const effectiveDevice: DeviceViewportMode =
      mode === "live"
        ? targetScopeDevice
        : activeDeviceMode !== "auto"
          ? activeDeviceMode
          : targetScopeDevice;

    const isFramelessWidescreen =
      mode === "live" ||
      effectiveDevice === "desktop" ||
      effectiveDevice === "tv" ||
      activeDeviceMode === "auto" ||
      activeDeviceMode === "desktop" ||
      activeDeviceMode === "tv";

    const isDottedBackground = mode === "preview" && !isFramelessWidescreen;

    const containerMaxWidthClass =
      mode === "live" || isFramelessWidescreen
        ? effectiveDevice === "mobile"
          ? "w-full max-w-[430px] key-public-bio-page--mobile mx-auto min-h-screen"
          : effectiveDevice === "tablet"
            ? "w-full max-w-[820px] key-public-bio-page--tablet mx-auto min-h-screen"
            : effectiveDevice === "laptop"
              ? "w-full max-w-[1280px] key-public-bio-page--laptop mx-auto min-h-screen"
              : effectiveDevice === "desktop"
                ? "w-full max-w-[1536px] key-public-bio-page--desktop mx-auto min-h-screen rounded-none border-0 shadow-none"
                : effectiveDevice === "tv"
                  ? "w-full max-w-[1920px] key-public-bio-page--tv mx-auto min-h-screen rounded-none border-0 shadow-none"
                  : "w-full max-w-full key-public-bio-page--auto mx-auto min-h-screen rounded-none border-0 shadow-none"
        : effectiveDevice === "mobile"
          ? "w-full max-w-[430px] key-public-bio-page--mobile shadow-2xl rounded-2xl sm:rounded-[2.25rem] border border-white/10 my-4 sm:my-6 overflow-hidden"
          : effectiveDevice === "tablet"
            ? "w-full max-w-[820px] key-public-bio-page--tablet shadow-2xl rounded-2xl sm:rounded-[2rem] border border-white/10 my-4 sm:my-6 overflow-hidden"
            : "w-full max-w-[1280px] key-public-bio-page--laptop shadow-2xl rounded-2xl sm:rounded-[1.75rem] border border-white/10 my-4 sm:my-6 overflow-hidden";

    const gridLayoutClass =
      effectiveDevice === "mobile"
        ? "grid-cols-1 gap-3.5"
        : "grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5";

    return (
      <div
        className={`key-public-bio-page-shell key-public-bio-page--${effectiveDevice} flex flex-col items-center justify-start font-sans w-full min-h-screen mx-auto ${
          isDottedBackground
            ? "bg-[#090d16] text-slate-100 py-6 px-3 sm:px-4"
            : "p-0 m-0"
        }${showThanksPage ? " key-public-bio-page--thanks-open" : ""}`}
        style={
          isDottedBackground
            ? {
                backgroundColor: "#090d16",
                backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.09) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
                backgroundAttachment: "fixed",
                backgroundRepeat: "repeat",
                minHeight: "100vh"
              }
            : getBioPageThemeStyle(pageTheme)
        }
      >
        {/* Global Preview Floating Exit Button - Only Back Icon with Single Styled Tooltip */}
        {onExitPreview && (
          <div className="fixed top-4 left-4 z-50 animate-in fade-in slide-in-from-top-2 group/exitbtn">
            <button
              type="button"
              onClick={onExitPreview}
              className="flex items-center justify-center h-10 w-10 bg-slate-900/95 hover:bg-slate-800 text-white rounded-full shadow-2xl border border-slate-700/80 backdrop-blur-xl hover:scale-110 active:scale-95 transition-all cursor-pointer ring-1 ring-cyan-500/40"
              aria-label="Exit Preview (Esc)"
            >
              <ArrowLeft className="w-5 h-5 text-cyan-400 group-hover/exitbtn:-translate-x-0.5 transition-transform" />
            </button>
            <span className="pointer-events-none absolute -bottom-7 left-0 hidden group-hover/exitbtn:flex px-2 py-0.5 rounded-md bg-slate-950/90 text-[9px] font-normal text-slate-300 border border-slate-800/80 whitespace-nowrap shadow-lg z-50">
              Exit Preview (Esc)
            </span>
          </div>
        )}

        <div
          ref={publicScreenRef}
          className={`key-public-bio-page__card key-preview-isolate key-public-bio-page__screen ${getBioPageThemeClass(pageTheme)} w-full ${containerMaxWidthClass} mx-auto transition-all duration-300 overflow-hidden min-h-screen ${
            isDottedBackground ? "sm:min-h-[750px]" : ""
          } relative`}
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
              <h1 className="key-public-bio-page__title font-display">
                {mode === "preview" ? (
                  <InlineEditableText
                    value={displayTitle || "BioLink"}
                    onChange={(newT) => {
                      setCustomDetails((prev) => {
                        const next = { ...(prev || {}), title: newT };
                        writeCachedPage(displayPageId, blocks, next, effectiveSlug);
                        onUpdateDetails?.(next);
                        return next;
                      });
                      triggerToast("✨ Updated title!");
                    }}
                    isEditingAllowed={true}
                    tagName="span"
                  />
                ) : (
                  displayTitle
                )}
              </h1>
              {displayHandle && (
                <p className="key-public-bio-page__handle">{displayHandle}</p>
              )}
            </div>

            {mode === "preview" ? (
              <div className="key-phone-preview__bio-text">
                <InlineEditableText
                  value={displayBio || ""}
                  placeholder="Click to add bio..."
                  onChange={(newB) => {
                    setCustomDetails((prev) => {
                      const next = { ...(prev || {}), bio: newB };
                      writeCachedPage(displayPageId, blocks, next, effectiveSlug);
                      onUpdateDetails?.(next);
                      return next;
                    });
                    triggerToast("✨ Updated bio!");
                  }}
                  isEditingAllowed={true}
                  multiline
                  tagName="p"
                />
              </div>
            ) : (
              displayBio && <p className="key-phone-preview__bio-text">{displayBio}</p>
            )}

            <div className={`key-phone-preview__blocks grid ${gridLayoutClass}`}>
            {pageLoadStatus === "loading" && visibleBlocks.length === 0 && (
              <div className="col-span-full">
                <BlockSkeleton />
              </div>
            )}
            {loadError && visibleBlocks.length === 0 && (
              <p className="key-public-bio-page__loading rounded-2xl border p-4 text-center text-xs col-span-full">
                {loadError}
              </p>
            )}
            {pageLoadStatus === "not_found" && visibleBlocks.length === 0 && !loadError && (
              <p className="key-public-bio-page__loading rounded-2xl border p-4 text-center text-xs col-span-full">
                This page content is not published on the server yet. Open KEYLINK360 → Bio Pages → Edit
                this page → Publish, then refresh.
              </p>
            )}
            {visibleBlocks
              .filter((block) => mode === "preview" || !Boolean((block as any).isHidden || (block as any).styles?.isHidden))
              .map((block) => {
                const visibilityClass =
                  effectiveDevice === "mobile"
                    ? block.deviceVisibility === "desktop_only"
                      ? "hidden"
                      : "block"
                    : block.deviceVisibility === "mobile_only"
                      ? "block md:hidden"
                      : block.deviceVisibility === "desktop_only"
                        ? "hidden md:block"
                        : "block";
                const isWide = isWideBlock(block.type);
                const colSpanClass =
                  effectiveDevice === "mobile"
                    ? "col-span-1 w-full"
                    : block.colSpan === "half" && !isWide
                      ? "col-span-1 w-full"
                      : "col-span-1 md:col-span-2 col-span-full w-full";

                const isSelected = mode === "preview" && selectedBlockId === block.id;
                const isBeingDragged = mode === "preview" && draggingBlockId === block.id;
                const isDragOver = mode === "preview" && dragOverBlockId === block.id && draggingBlockId !== block.id;
                const isBlockLocked = Boolean(block.isLocked || (block as any).styles?.isLocked);
                const isBlockHidden = Boolean(block.isHidden || (block as any).styles?.isHidden);

                const devStyles = computeBlockInlineStyles((block as any).styles);
                const devMeta = getBlockCustomMeta((block as any).styles);
                const anchorId = getSemanticAnchorForBlock(block as any);

                return (
                  <div
                    key={`${block.id}-pay-${paymentRequired ? paymentAmountInr || 0 : 0}`}
                    id={anchorId || `block-${block.id}`}
                    data-block-id={block.id}
                    data-block-type={block.type}
                    data-block-label={block.label || ""}
                    data-block-anchor={anchorId || undefined}
                    style={devStyles}
                    aria-label={devMeta.ariaLabel}
                    draggable={mode === "preview" && !isBlockLocked && !showThanksPage}
                    onDragStart={(e) => {
                      if (mode !== "preview" || isBlockLocked || showThanksPage) return;
                      e.dataTransfer.setData("application/keylink-block-id", block.id);
                      e.dataTransfer.setData("text/plain", block.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDraggingBlockId(block.id);
                    }}
                    onDragEnd={() => {
                      setDraggingBlockId(null);
                      setDragOverBlockId(null);
                    }}
                    onDragOver={(e) => {
                      if (mode !== "preview") return;
                      e.preventDefault();
                      e.stopPropagation();
                      e.dataTransfer.dropEffect = "move";
                      if (dragOverBlockId !== block.id) {
                        setDragOverBlockId(block.id);
                      }
                    }}
                    onDragLeave={(e) => {
                      if (mode !== "preview") return;
                      e.stopPropagation();
                      if (dragOverBlockId === block.id) {
                        setDragOverBlockId(null);
                      }
                    }}
                    onDrop={(e) => {
                      if (mode !== "preview") return;
                      e.preventDefault();
                      e.stopPropagation();
                      const srcId = e.dataTransfer.getData("application/keylink-block-id") || draggingBlockId;
                      if (srcId && srcId !== block.id) {
                        handleReorderBlocks(srcId, block.id, "after");
                      }
                      setDraggingBlockId(null);
                      setDragOverBlockId(null);
                    }}
                    onClick={(e) => {
                      if (mode !== "preview") return;
                      const target = e.target as HTMLElement | null;
                      if (
                        target?.closest?.(".key-canva-inline-active") ||
                        target?.tagName === "INPUT" ||
                        target?.tagName === "TEXTAREA" ||
                        target?.closest?.("button")
                      ) {
                        return;
                      }
                      e.stopPropagation();
                      setSelectedBlockId(block.id);
                    }}
                    className={`${visibilityClass} ${colSpanClass} ${devMeta.className} transition-all duration-200 ${
                      mode === "preview"
                        ? `group relative p-2 rounded-2xl border cursor-grab active:cursor-grabbing select-none ${
                            isBeingDragged
                              ? "opacity-30 scale-95 border-dashed border-indigo-400 bg-indigo-500/10 ring-2 ring-indigo-400/40"
                              : isDragOver
                                ? "ring-2 ring-indigo-500 border-indigo-500 bg-indigo-500/10 shadow-lg scale-[1.01]"
                                : isSelected
                                  ? "key-canvas-block-active ring-2 ring-indigo-500 shadow-xl border-indigo-500 bg-indigo-500/5"
                                  : isBlockHidden
                                    ? "opacity-35 border-dashed border-slate-400/80 bg-slate-500/5"
                                    : "border-transparent hover:border-dashed hover:border-[#6366f1]/55 hover:bg-[#6366f1]/5"
                          }`
                        : ""
                    }`}
                  >
                    {/* Device Hidden Badge in Live Preview */}
                    {mode === "preview" && isBlockHidden && (
                      <div className="absolute -top-2 right-2 z-30 flex items-center gap-1 bg-slate-700 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">
                        <span>Hidden Node</span>
                      </div>
                    )}

                    {/* Smart Interactive Border Controls & Resize Handles */}
                    {mode === "preview" && !isBlockLocked && !showThanksPage && (
                      <>
                        {/* 1. Top Move Bar Anchor (4-Head Cursor & 5-Finger Grab) */}
                        <div
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer.setData("application/keylink-block-id", block.id);
                            e.dataTransfer.setData("text/plain", block.id);
                            e.dataTransfer.effectAllowed = "move";
                            setDraggingBlockId(block.id);
                          }}
                          onDragEnd={() => {
                            setDraggingBlockId(null);
                            setDragOverBlockId(null);
                          }}
                          className={`absolute -top-3.5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-950/95 text-white border border-indigo-500/60 shadow-lg backdrop-blur-md transition-all select-none cursor-move cursor-grab active:cursor-grabbing ${
                            isSelected
                              ? "opacity-100 scale-100 ring-2 ring-indigo-500/40"
                              : "opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100"
                          }`}
                          title="Drag to move up/down (5-finger hand cursor) or click arrows"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Move className="w-3 h-3 text-indigo-400 shrink-0 pointer-events-none" />
                          <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-indigo-200 pointer-events-none">
                            {block.type}
                          </span>
                          <div className="w-[1px] h-2.5 bg-white/15 mx-0.5" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveBlock(block.id, "up");
                            }}
                            className="p-0.5 hover:bg-white/20 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Move Up (↑)"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveBlock(block.id, "down");
                            }}
                            className="p-0.5 hover:bg-white/20 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Move Down (↓)"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>

                        {/* 2. Top & Bottom Border Handles (↕ Two-Head Vertical Resize) */}
                        <div
                          onMouseDown={(e) => startResizing(block.id, "top", e)}
                          onTouchStart={(e) => startResizing(block.id, "top", e)}
                          className="absolute top-0 left-4 right-4 h-2.5 -translate-y-1/2 cursor-ns-resize z-30 group/tline flex items-center justify-center select-none"
                          title="↕ Drag up/down to adjust vertical spacing / height"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="w-10 h-1 rounded-full bg-indigo-500/40 group-hover/tline:bg-indigo-400 group-hover/tline:h-1.5 transition-all opacity-0 group-hover:opacity-100" />
                        </div>

                        <div
                          onMouseDown={(e) => startResizing(block.id, "bottom", e)}
                          onTouchStart={(e) => startResizing(block.id, "bottom", e)}
                          className="absolute bottom-0 left-4 right-4 h-2.5 translate-y-1/2 cursor-ns-resize z-30 group/bline flex items-center justify-center select-none"
                          title="↕ Drag up/down to adjust vertical spacing / height"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="w-10 h-1 rounded-full bg-indigo-500/40 group-hover/bline:bg-indigo-400 group-hover/bline:h-1.5 transition-all opacity-0 group-hover:opacity-100" />
                        </div>

                        {/* 3. Left & Right Border Handles (↔ Side-Head Horizontal Resize) */}
                        <div
                          onMouseDown={(e) => startResizing(block.id, "left", e)}
                          onTouchStart={(e) => startResizing(block.id, "left", e)}
                          className="absolute left-0 top-4 bottom-4 w-2.5 -translate-x-1/2 cursor-ew-resize z-30 group/lline flex items-center justify-center select-none"
                          title="↔ Drag left/right to adjust horizontal spacing / width"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="h-10 w-1 rounded-full bg-indigo-500/40 group-hover/lline:bg-indigo-400 group-hover/lline:w-1.5 transition-all opacity-0 group-hover:opacity-100" />
                        </div>

                        <div
                          onMouseDown={(e) => startResizing(block.id, "right", e)}
                          onTouchStart={(e) => startResizing(block.id, "right", e)}
                          className="absolute right-0 top-4 bottom-4 w-2.5 translate-x-1/2 cursor-ew-resize z-30 group/rline flex items-center justify-center select-none"
                          title="↔ Drag left/right to adjust horizontal spacing / width"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="h-10 w-1 rounded-full bg-indigo-500/40 group-hover/rline:bg-indigo-400 group-hover/rline:w-1.5 transition-all opacity-0 group-hover:opacity-100" />
                        </div>

                        {/* 4. Four Corner Scale Handles (Small Size to Big Size) */}
                        <div
                          onMouseDown={(e) => startResizing(block.id, "nw", e)}
                          onTouchStart={(e) => startResizing(block.id, "nw", e)}
                          className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-500 shadow-md cursor-nwse-resize z-40 transition-transform hover:scale-125 opacity-0 group-hover:opacity-100 flex items-center justify-center select-none"
                          title="⤡ Drag corner to scale block (Small / Big size)"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div
                          onMouseDown={(e) => startResizing(block.id, "ne", e)}
                          onTouchStart={(e) => startResizing(block.id, "ne", e)}
                          className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-500 shadow-md cursor-nesw-resize z-40 transition-transform hover:scale-125 opacity-0 group-hover:opacity-100 flex items-center justify-center select-none"
                          title="⤢ Drag corner to scale block (Small / Big size)"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div
                          onMouseDown={(e) => startResizing(block.id, "sw", e)}
                          onTouchStart={(e) => startResizing(block.id, "sw", e)}
                          className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-500 shadow-md cursor-nesw-resize z-40 transition-transform hover:scale-125 opacity-0 group-hover:opacity-100 flex items-center justify-center select-none"
                          title="⤢ Drag corner to scale block (Small / Big size)"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div
                          onMouseDown={(e) => startResizing(block.id, "se", e)}
                          onTouchStart={(e) => startResizing(block.id, "se", e)}
                          className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-500 shadow-md cursor-nwse-resize z-40 transition-transform hover:scale-125 opacity-0 group-hover:opacity-100 flex items-center justify-center select-none"
                          title="⤡ Drag corner to scale block (Small / Big size)"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </>
                    )}

                    {/* Live Resizing HUD Indicator */}
                    {mode === "preview" && resizingBlock?.blockId === block.id && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none px-3 py-1.5 rounded-xl bg-slate-950/95 text-white text-xs font-mono font-bold shadow-2xl border border-indigo-400 backdrop-blur-xl flex items-center gap-1.5 animate-in fade-in zoom-in-95 select-none ring-2 ring-indigo-500/50">
                        {resizingBlock.handle === "se" || resizingBlock.handle === "sw" || resizingBlock.handle === "ne" || resizingBlock.handle === "nw" ? (
                          <>
                            <Move className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                            <span>Size: {Math.round((resizingBlock.currentScale || resizingBlock.initialScale) * 100)}%</span>
                          </>
                        ) : resizingBlock.handle === "top" || resizingBlock.handle === "bottom" ? (
                          <span>↕ Height: {resizingBlock.currentPaddingY ?? resizingBlock.initialPaddingY}px</span>
                        ) : (
                          <span>↔ Width: {resizingBlock.currentPaddingX ?? resizingBlock.initialPaddingX}px</span>
                        )}
                      </div>
                    )}

                    {/* Floating Action Pill over selected canvas block */}
                    {mode === "preview" && isSelected && (
                      <div
                        className="key-canvas-block-actions-pill"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-indigo-950 text-cyan-300 uppercase tracking-widest mr-1">
                          {block.type}
                        </span>
                        <button
                          type="button"
                          className="key-canvas-block-actions-pill__btn"
                          onClick={() => handleMoveBlock(block.id, "up")}
                          title="Move Block Up (↑)"
                        >
                          <ChevronUp className="w-3 h-3 text-cyan-300" />
                        </button>
                        <button
                          type="button"
                          className="key-canvas-block-actions-pill__btn"
                          onClick={() => handleMoveBlock(block.id, "down")}
                          title="Move Block Down (↓)"
                        >
                          <ChevronDown className="w-3 h-3 text-cyan-300" />
                        </button>

                        {/* Quick Size Presets: S, M, L, XL */}
                        <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-white/[0.06] border border-white/10 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSetBlockScale(block.id, 0.85)}
                            className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all ${
                              (block as any).styles?.scale === 0.85
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-white hover:bg-white/10"
                            }`}
                            title="Small Size (85%)"
                          >
                            S
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetBlockScale(block.id, 1)}
                            className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all ${
                              !(block as any).styles?.scale || (block as any).styles?.scale === 1
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-white hover:bg-white/10"
                            }`}
                            title="Normal Size (100%)"
                          >
                            M
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetBlockScale(block.id, 1.15)}
                            className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all ${
                              (block as any).styles?.scale === 1.15
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-white hover:bg-white/10"
                            }`}
                            title="Large Size (115%)"
                          >
                            L
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetBlockScale(block.id, 1.3)}
                            className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all ${
                              (block as any).styles?.scale === 1.3
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-white hover:bg-white/10"
                            }`}
                            title="Extra Large Size (130%)"
                          >
                            XL
                          </button>
                          {(block as any).styles?.scale && (block as any).styles?.scale !== 1 && (
                            <button
                              type="button"
                              onClick={() => handleSetBlockScale(block.id, 1)}
                              className="p-1 hover:bg-white/15 rounded text-amber-300 transition-colors ml-0.5"
                              title="Reset Size to 100%"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>

                        {/* Toggle ColSpan: Half / Full */}
                        <button
                          type="button"
                          className="key-canvas-block-actions-pill__btn"
                          onClick={() => handleToggleBlockColSpan(block.id)}
                          title={block.colSpan === "half" ? "Make Full Width" : "Make Half Width"}
                        >
                          <span className="text-[9px] font-bold text-indigo-300">
                            {block.colSpan === "half" ? "½" : "1/1"}
                          </span>
                        </button>

                        <button
                          type="button"
                          className="key-canvas-block-actions-pill__btn"
                          onClick={() => handleToggleBlockLock(block.id)}
                          title={isBlockLocked ? "Unlock Component" : "Lock Component"}
                        >
                          {isBlockLocked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                        </button>
                        <button
                          type="button"
                          className="key-canvas-block-actions-pill__btn"
                          onClick={() => handleToggleBlockHidden(block.id)}
                          title={isBlockHidden ? "Show Component" : "Hide Component"}
                        >
                          {isBlockHidden ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button
                          type="button"
                          className="key-canvas-block-actions-pill__btn"
                          onClick={() => handleDuplicateBlock(block.id)}
                          title="Duplicate block"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                        <button
                          type="button"
                          className="key-canvas-block-actions-pill__btn key-canvas-block-actions-pill__btn--danger"
                          onClick={() => handleDeleteBlock(block.id)}
                          title="Delete block"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="relative z-10">
                      <BlockRenderer
                        block={block as BlockRecord}
                        mode={mode === "preview" ? "preview" : "live"}
                        context={{
                          displayTitle,
                          displayHandle,
                          paymentEnabled: paymentRequired,
                          paymentAmountInr
                        }}
                        handlers={liveBlockHandlers}
                      />
                    </div>
                  </div>
                );
              })}
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

        {/* Live AI Sales & Support Chat Widget */}
        <BioAiChatWidget
          pageId={pageId}
          pageTitle={displayTitle}
          pageSlug={pageSlug}
          pageBio={displayBio}
          settings={customDetails?.aiAssistant}
          blocks={blocks as any}
        />

        {/* Floating Live Device Preview Switcher Dock (Preview Mode Only) */}
        {mode === "preview" && (
          showDeviceDock ? (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white shadow-2xl backdrop-blur-md border border-white/20 transition-all text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 pl-1 hidden sm:inline">
                Preview:
              </span>
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: "mobile" as const, label: "Mobile", icon: Smartphone, widthLabel: "430px" },
                    { id: "tablet" as const, label: "Tablet", icon: Tablet, widthLabel: "820px" },
                    { id: "laptop" as const, label: "Laptop", icon: Laptop, widthLabel: "1280px" },
                    { id: "desktop" as const, label: "Desktop", icon: Monitor, widthLabel: "1536px" },
                    { id: "tv" as const, label: "TV", icon: Tv, widthLabel: "1920px" },
                    { id: "auto" as const, label: "Auto Fluid", icon: Globe, widthLabel: "Responsive" }
                  ] as const
                ).map(({ id, label, icon: Icon, widthLabel }) => {
                  const isActive = activeDeviceMode === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveDeviceMode(id)}
                      title={`Real Live Device View: ${label} (${widthLabel})`}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-md font-bold ring-1 ring-indigo-400/50"
                          : "text-slate-300 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{label}</span>
                      <span className="text-[9px] font-mono opacity-60 hidden md:inline">({widthLabel})</span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setShowDeviceDock(false)}
                title="Hide Preview Dock"
                className="ml-1 p-1 rounded-full hover:bg-white/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeviceDock(true)}
              title="Show Device Preview Switcher"
              className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-900/85 hover:bg-slate-900 text-white shadow-xl backdrop-blur-md border border-white/20 text-xs font-semibold transition-all cursor-pointer"
            >
              <Monitor className="h-3.5 w-3.5 text-indigo-400" />
              <span>Devices</span>
            </button>
          )
        )}

      </div>
    </div>
  );
}
