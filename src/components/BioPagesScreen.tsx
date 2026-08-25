import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { screenToPath } from "../navigation";
import { ScreenId } from "../types";
import type { BioPage, BioPageDraft, BioPageTemplate, BioEditorState, BioEditorBlock, BioPagePreviewTheme, BioPagePreviewDetails, BioCoverPhotoSettings, CustomDomain, PlatformSubdomain } from "../types";
import {
  buildEditorState,
  cloneBlocks,
  DEFAULT_COVER,
  formatDisplayHandle,
  suggestedHandlePlaceholder,
  getStoredHandle,
  normalizeHandleInput,
  deleteDraftByPageId,
  upsertDraft,
  persistDrafts,
  upsertTemplate,
  syncTemplateToServer,
  persistAndSyncPagePreview,
  persistPagePreviewLocalOnly,
  syncDraftToServer,
  syncAllDraftsToServer,
  syncPagesListToServer,
  readStoredPageTheme,
  readStoredPageDetails,
  createUniquePageId,
  fetchPageDocumentFromServer,
  readLocalPageDocument,
  readLocalPublishedUpdatedAt,
  resolveStoredPageBlocks
} from "../storage/bioBuilderStorage";
import { CreateNotificationInput } from "../storage/notificationStorage";
import { PRIMARY_DOMAIN } from "../storage/publishStorage";
import {
  getShareableOrigin,
  resolveBioPagePublicLink,
  sortPagesByPublicLinkKind
} from "../lib/bioPagePublicUrl";
import { apiUrl } from "../lib/apiBase";
import { normalizePageTheme, getBioPageThemeClass, getBioPageThemeStyle } from "../lib/bioPageThemes";
import {
  SOCIAL_PLATFORMS,
  createDefaultSocialFields,
  createDefaultLinkSpinFields,
  createDefaultVCardFields,
  createDefaultEventFields,
  createDefaultFormFields,
  createDefaultFaqItems,
  createDefaultTestimonials,
  createDefaultTipOptions,
  createDefaultMapFields,
  createDefaultImageFields,
  createDefaultDividerFields,
  createDefaultCallFields,
  createDefaultEmailFields,
  createDefaultBannerFields,
  createDefaultGalleryBlockFields,
  createDefaultPricingPlans,
  createDefaultStatItems,
  createFaqItem,
  createTestimonial,
  createTipOption,
  createGalleryItem,
  createPricingPlan,
  createStatItem,
  getFaqItems,
  getTestimonials,
  getTipOptions,
  getGalleryItems,
  getPricingPlans,
  getStatItems,
  getCallPhone,
  getEmailAddress,
  resolveGoogleMap,
  defaultCountdownEndAt,
  fromDatetimeLocalValue,
  getCurrencySymbol,
  getLinkSpinCouponCode,
  getLinkSpinPrizes,
  DEFAULT_SHOP_PRODUCTS,
  toDatetimeLocalValue,
  filterVisibleBioBlocks,
  type BlockRecord
} from "../lib/bioBlocks";
import BlockRenderer, { type BlockRendererHandlers } from "./bio/BlockRenderer";
import FormFieldsEditor from "./bio/FormFieldsEditor";
import ThankYouPageView, {
  createDefaultThankYouBlocks,
  DEFAULT_THANK_YOU_MESSAGE
} from "./bio/ThankYouPageView";
import BioPageThemePicker from "./bio/BioPageThemePicker";
import CoverPhotoView from "./bio/CoverPhotoView";
import CoverPhotoControls from "./bio/CoverPhotoControls";
import { DEFAULT_COVER_SETTINGS, normalizeCoverSettings } from "../lib/bioCoverPhoto";
import {
  RefreshCw,
  Plus,
  Smartphone,
  Copy,
  BarChart2,
  Edit3,
  QrCode,
  ExternalLink,
  Trash2,
  Check,
  X,
  Link,
  Loader,
  Settings,
  Layers,
  ShoppingBag,
  User,
  Download,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  MousePointerClick,
  Calendar,
  MessageSquare,
  Clock,
  Play,
  Gift,
  Star,
  Save,
  Share2,
  FileText,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Palette,
  Globe,
  Image as ImageIcon,
  LayoutGrid,
  ClipboardList,
  HelpCircle,
  Quote,
  HeartHandshake,
  MapPin,
  Minus,
  Phone,
  Mail,
  Megaphone,
  DollarSign,
  Eye,
  Search,
  MoreVertical,
  Lock,
  Unlock
} from "lucide-react";
import PageShell, { PageHeader, Workspace } from "./layout/PageShell";
import { BIO_LINK } from "../lib/bioLinkColors";
import type { AppTheme } from "../lib/themeStorage";

export { getShareableOrigin } from "../lib/bioPagePublicUrl";

function normalizePageMatchKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Pages to remove when cleaning duplicates — keeps highest views, then newest. */
function getDuplicatePlatformPageIds(pages: BioPage[]): Set<string> {
  const duplicateIds = new Set<string>();

  const markDuplicateCopies = (groups: Map<string, BioPage[]>) => {
    for (const group of groups.values()) {
      if (group.length <= 1) continue;
      const sorted = [...group].sort((a, b) => {
        if (b.views !== a.views) return b.views - a.views;
        return String(b.createdAt).localeCompare(String(a.createdAt));
      });
      for (let index = 1; index < sorted.length; index += 1) {
        duplicateIds.add(sorted[index].id);
      }
    }
  };

  const byTitle = new Map<string, BioPage[]>();
  const bySlug = new Map<string, BioPage[]>();
  for (const page of pages) {
    const titleKey = normalizePageMatchKey(page.title);
    if (titleKey) {
      const titleGroup = byTitle.get(titleKey) ?? [];
      titleGroup.push(page);
      byTitle.set(titleKey, titleGroup);
    }
    const slugKey = normalizePageMatchKey(page.slug || "");
    if (slugKey) {
      const slugGroup = bySlug.get(slugKey) ?? [];
      slugGroup.push(page);
      bySlug.set(slugKey, slugGroup);
    }
  }

  markDuplicateCopies(byTitle);
  markDuplicateCopies(bySlug);
  return duplicateIds;
}

interface BioPageListRowOptions {
  selection?: {
    checked: boolean;
    onToggle: (id: string) => void;
  };
  showDuplicateBadge?: boolean;
}

function matchesPlatformPageSearch(
  page: BioPage,
  query: string,
  domains: CustomDomain[],
  platformSubdomains: PlatformSubdomain[] = []
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const publicLink = resolveBioPagePublicLink(page, domains, platformSubdomains);
  const haystack = [
    page.title,
    page.id,
    page.slug,
    page.handle || "",
    page.status,
    publicLink.displayLabel,
    publicLink.shareUrl,
    publicLink.openUrl
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

const marvelInitialBlocks = [
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

const genericInitialBlocks = [
  { id: "g1", type: "Header", label: "👤 My Responsive BioLink", value: "👤 My Responsive BioLink" },
  { id: "g2", type: "Text", label: "Welcome to my responsive bio page! Customize me using the blocks.", value: "Welcome" },
  { id: "g3", type: "Button", label: "Visit My Website", value: "https://example.com", bgColor: "#7c3aed", textColor: "#FFFFFF" },
  { id: "g4", type: "WhatsApp", label: "Chat with me on WhatsApp", value: "https://wa.me/1234567890" }
];

const defaultProductsList = DEFAULT_SHOP_PRODUCTS;

const getBlockIcon = (type: string) => {
  const iconClass = "key-editor-block-icon";
  switch (type) {
    case "Button":
      return <div className={`${iconClass} key-editor-block-icon--purple`}><Link className="h-4 w-4" /></div>;
    case "Text":
      return <div className={`${iconClass} key-editor-block-icon--slate`}><FileText className="h-4 w-4" /></div>;
    case "Header":
      return <div className={`${iconClass} key-editor-block-icon--blue font-extrabold text-xs`}>H1</div>;
    case "Socials":
      return <div className={`${iconClass} key-editor-block-icon--pink`}><Share2 className="h-4 w-4" /></div>;
    case "Shop":
      return <div className={`${iconClass} key-editor-block-icon--green`}><ShoppingBag className="h-4 w-4" /></div>;
    case "Coupon":
      return <div className={`${iconClass} key-editor-block-icon--sky`}><Gift className="h-4 w-4" /></div>;
    case "Countdown":
      return <div className={`${iconClass} key-editor-block-icon--rose`}><Clock className="h-4 w-4" /></div>;
    case "Deep Link":
      return <div className={`${iconClass} key-editor-block-icon--indigo`}><Sparkles className="h-4 w-4" /></div>;
    case "Link Spin":
      return <div className={`${iconClass} key-editor-block-icon--amber`}><RefreshCw className="h-4 w-4" /></div>;
    case "WhatsApp":
      return <div className={`${iconClass} key-editor-block-icon--whatsapp`}><MessageSquare className="h-4 w-4" /></div>;
    case "Smart Form":
      return <div className={`${iconClass} key-editor-block-icon--violet`}><User className="h-4 w-4" /></div>;
    case "Form":
      return <div className={`${iconClass} key-editor-block-icon--violet`}><ClipboardList className="h-4 w-4" /></div>;
    case "FAQ":
      return <div className={`${iconClass} key-editor-block-icon--indigo`}><HelpCircle className="h-4 w-4" /></div>;
    case "Testimonials":
      return <div className={`${iconClass} key-editor-block-icon--amber`}><Quote className="h-4 w-4" /></div>;
    case "Tip Jar":
      return <div className={`${iconClass} key-editor-block-icon--rose`}><HeartHandshake className="h-4 w-4" /></div>;
    case "Map":
      return <div className={`${iconClass} key-editor-block-icon--rose`}><MapPin className="h-4 w-4" /></div>;
    case "Image":
      return <div className={`${iconClass} key-editor-block-icon--indigo`}><ImageIcon className="h-4 w-4" /></div>;
    case "Divider":
      return <div className={`${iconClass} key-editor-block-icon--slate`}><Minus className="h-4 w-4" /></div>;
    case "vCard":
      return <div className={`${iconClass} key-editor-block-icon--neutral`}><User className="h-4 w-4" /></div>;
    case "Video":
      return <div className={`${iconClass} key-editor-block-icon--red`}><Play className="h-4 w-4" /></div>;
    case "Music":
      return <div className={`${iconClass} key-editor-block-icon--teal text-sm`}>🎵</div>;
    case "Gallery":
      return <div className={`${iconClass} key-editor-block-icon--indigo text-sm`}>📸</div>;
    case "PDF":
      return <div className={`${iconClass} key-editor-block-icon--pdf text-sm`}>📄</div>;
    case "Events":
      return <div className={`${iconClass} key-editor-block-icon--indigo`}><Calendar className="h-4 w-4" /></div>;
    case "Call":
      return <div className={`${iconClass} key-editor-block-icon--neutral`}><Phone className="h-4 w-4" /></div>;
    case "Email":
      return <div className={`${iconClass} key-editor-block-icon--indigo`}><Mail className="h-4 w-4" /></div>;
    case "Banner":
      return <div className={`${iconClass} key-editor-block-icon--sky`}><Megaphone className="h-4 w-4" /></div>;
    case "Stats":
      return <div className={`${iconClass} key-editor-block-icon--green`}><BarChart2 className="h-4 w-4" /></div>;
    case "Pricing":
      return <div className={`${iconClass} key-editor-block-icon--amber`}><DollarSign className="h-4 w-4" /></div>;
    default:
      return <div className={`${iconClass} key-editor-block-icon--slate`}><Link className="h-4 w-4" /></div>;
  }
};

const getBlockDefaultBgColor = (type: string) => {
  switch (type) {
    case "WhatsApp":
      return "#25D366";
    case "Coupon":
      return "#EFF6FF";
    case "Call":
      return "#0f172a";
    case "Email":
      return "#4f46e5";
    case "Button":
    case "Deep Link":
      return BIO_LINK.bg;
    default:
      return "#FFFFFF";
  }
};

const getBlockDefaultTextColor = (type: string) => {
  switch (type) {
    case "WhatsApp":
    case "Deep Link":
    case "Button":
    case "Call":
    case "Email":
      return BIO_LINK.text;
    default:
      return "#0F172A";
  }
};

interface BioPagesScreenProps {
  pages: BioPage[];
  domains?: CustomDomain[];
  platformSubdomains?: PlatformSubdomain[];
  onAddPage: (title: string, slug: string, pageId?: string, pageKind?: "bio" | "thanks") => BioPage;
  onDeletePage: (id: string) => void;
  onDeletePages?: (ids: string[]) => void;
  onUpdatePage: (
    id: string,
    title: string,
    bio?: string,
    coverPhoto?: string,
    handle?: string,
    status?: BioPage["status"]
  ) => void;
  onDuplicatePage: (id: string) => void;
  onRefreshPages: () => Promise<void>;
  analyticsEvents: Array<{ pageId?: string; eventType?: string; eventLabel?: string; timestamp?: string }>;
  // New props for shared state
  savedTemplates: BioPageTemplate[];
  setSavedTemplates: React.Dispatch<React.SetStateAction<BioPageTemplate[]>>;
  savedDrafts: BioPageDraft[];
  setSavedDrafts: React.Dispatch<React.SetStateAction<BioPageDraft[]>>;
  pageBlocksMap: Record<string, BioEditorBlock[]>;
  setPageBlocksMap: React.Dispatch<React.SetStateAction<Record<string, BioEditorBlock[]>>>;
  initialActiveEditPageId: string | null;
  clearInitialActiveEditPageId: () => void;
  initialActiveTemplateId: string | null;
  clearInitialActiveTemplateId: () => void;
  onNotify: (input: CreateNotificationInput) => void;
  theme?: AppTheme;
}

export default function BioPagesScreen({
  pages,
  domains = [],
  platformSubdomains = [],
  onAddPage,
  onDeletePage,
  onDeletePages,
  onUpdatePage,
  onDuplicatePage,
  onRefreshPages,
  analyticsEvents,
  savedTemplates,
  setSavedTemplates,
  savedDrafts,
  setSavedDrafts,
  pageBlocksMap,
  setPageBlocksMap,
  initialActiveEditPageId,
  clearInitialActiveEditPageId,
  initialActiveTemplateId,
  clearInitialActiveTemplateId,
  onNotify,
  theme = "dark"
}: BioPagesScreenProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editIdFromUrl = searchParams.get("edit");
  const editFromDomain = searchParams.get("source") === "domain";
  // History list only — template sessions stay out until Save Draft / Publish
  const historyPages = React.useMemo(
    () =>
      pages.filter(
        (page) => !page.isUncommitted && (page.pageKind || "bio") !== "thanks"
      ),
    [pages]
  );
  const sortedPages = React.useMemo(
    () => sortPagesByPublicLinkKind(historyPages, domains, platformSubdomains),
    [historyPages, domains, platformSubdomains]
  );
  const customDomainPages = React.useMemo(
    () => sortedPages.filter((page) => resolveBioPagePublicLink(page, domains, platformSubdomains).kind === "custom"),
    [sortedPages, domains, platformSubdomains]
  );
  const platformPages = React.useMemo(
    () => sortedPages.filter((page) => resolveBioPagePublicLink(page, domains, platformSubdomains).kind !== "custom"),
    [sortedPages, domains, platformSubdomains]
  );
  const resolvePublicLink = React.useCallback(
    (page: BioPage) => resolveBioPagePublicLink(page, domains, platformSubdomains),
    [domains, platformSubdomains]
  );
  const [isAdding, setIsAdding] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newPageKind, setNewPageKind] = useState<"bio" | "thanks">("bio");
  const [newPageId, setNewPageId] = useState(() => createUniquePageId());
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");

  // Popup Modal States
  const [selectedAnalyticsPage, setSelectedAnalyticsPage] = useState<BioPage | null>(null);
  const [selectedEditPage, setSelectedEditPage] = useState<BioPage | null>(null);
  const [selectedQRPage, setSelectedQRPage] = useState<BioPage | null>(null);

  const selectedEditPageLink = React.useMemo(
    () => (selectedEditPage ? resolvePublicLink(selectedEditPage) : null),
    [selectedEditPage, domains]
  );
  const selectedQRPageLink = React.useMemo(
    () => (selectedQRPage ? resolvePublicLink(selectedQRPage) : null),
    [selectedQRPage, domains]
  );
  const [customDomainSectionExpanded, setCustomDomainSectionExpanded] = useState(true);
  const [platformSectionExpanded, setPlatformSectionExpanded] = useState(true);
  const [platformSearchQuery, setPlatformSearchQuery] = useState("");
  const [platformStatusFilter, setPlatformStatusFilter] = useState<"All" | BioPage["status"]>("All");
  const [platformDuplicatesOnly, setPlatformDuplicatesOnly] = useState(false);
  const [platformSelectionMode, setPlatformSelectionMode] = useState(false);
  const [platformBulkMenuOpen, setPlatformBulkMenuOpen] = useState(false);
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<Set<string>>(() => new Set());
  const platformBulkMenuRef = useRef<HTMLDivElement>(null);
  const editorExitingRef = useRef(false);
  const editorCloseConfirmOpenRef = useRef(false);

  const platformDuplicateIds = React.useMemo(
    () => getDuplicatePlatformPageIds(platformPages),
    [platformPages]
  );
  const platformZeroViewIds = React.useMemo(
    () => new Set(platformPages.filter((page) => page.views === 0).map((page) => page.id)),
    [platformPages]
  );
  const filteredPlatformPages = React.useMemo(() => {
    const query = platformSearchQuery.trim();
    return platformPages.filter((page) => {
      if (platformDuplicatesOnly && !platformDuplicateIds.has(page.id)) return false;
      if (platformStatusFilter !== "All" && page.status !== platformStatusFilter) return false;
      return matchesPlatformPageSearch(page, query, domains, platformSubdomains);
    });
  }, [
    platformPages,
    platformSearchQuery,
    platformStatusFilter,
    platformDuplicatesOnly,
    platformDuplicateIds,
    domains,
    platformSubdomains
  ]);

  const hasPlatformActiveFilters =
    platformSearchQuery.trim().length > 0 ||
    platformStatusFilter !== "All" ||
    platformDuplicatesOnly;

  const clearPlatformFilters = () => {
    setPlatformSearchQuery("");
    setPlatformStatusFilter("All");
    setPlatformDuplicatesOnly(false);
  };

  const selectedPlatformCount = selectedPlatformIds.size;

  React.useEffect(() => {
    setSelectedPlatformIds((current) => {
      const validIds = new Set(platformPages.map((page) => page.id));
      const next = new Set([...current].filter((id) => validIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [platformPages]);

  React.useEffect(() => {
    if (!platformBulkMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!platformBulkMenuRef.current?.contains(event.target as Node)) {
        setPlatformBulkMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [platformBulkMenuOpen]);

  const enterPlatformSelectionMode = () => {
    setPlatformSelectionMode(true);
  };

  const exitPlatformSelectionMode = () => {
    setPlatformSelectionMode(false);
    setSelectedPlatformIds(new Set());
    setPlatformBulkMenuOpen(false);
  };

  const togglePlatformSelection = (pageId: string) => {
    setSelectedPlatformIds((current) => {
      const next = new Set(current);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });
  };

  const selectVisiblePlatformPages = (predicate: (page: BioPage) => boolean) => {
    enterPlatformSelectionMode();
    setSelectedPlatformIds(new Set(filteredPlatformPages.filter(predicate).map((page) => page.id)));
  };

  const handlePlatformMenuSelectAll = () => {
    enterPlatformSelectionMode();
    setSelectedPlatformIds(new Set(filteredPlatformPages.map((page) => page.id)));
    setPlatformBulkMenuOpen(false);
  };

  const handlePlatformMenuClearSelection = () => {
    setSelectedPlatformIds(new Set());
    setPlatformBulkMenuOpen(false);
  };

  const handlePlatformMenuDeleteSelected = () => {
    if (!platformSelectionMode) {
      enterPlatformSelectionMode();
      setPlatformBulkMenuOpen(false);
      return;
    }

    if (selectedPlatformCount === 0) {
      setPlatformBulkMenuOpen(false);
      return;
    }

    deleteSelectedPlatformPages();
    setPlatformBulkMenuOpen(false);
  };

  const deleteSelectedPlatformPages = () => {
    const ids = [...selectedPlatformIds];
    if (ids.length === 0) return;

    const sampleTitles = ids
      .slice(0, 3)
      .map((id) => pages.find((page) => page.id === id)?.title)
      .filter(Boolean);
    const preview =
      sampleTitles.length > 0
        ? `\n\n${sampleTitles.join("\n")}${ids.length > 3 ? `\n…and ${ids.length - 3} more` : ""}`
        : "";

    if (
      !window.confirm(
        `Delete ${ids.length} selected platform link${ids.length === 1 ? "" : "s"}? This cannot be undone.${preview}`
      )
    ) {
      return;
    }

    if (onDeletePages) {
      onDeletePages(ids);
    } else {
      ids.forEach((id) => onDeletePage(id));
    }
    setSelectedPlatformIds(new Set());
    setPlatformSelectionMode(false);
    triggerToast(`Deleted ${ids.length} platform link${ids.length === 1 ? "" : "s"}.`);
  };

  React.useEffect(() => {
    if (selectedEditPage) {
      document.body.classList.add("key-editor-open");
      setCoverSectionLocked(false);
      setExpandedBlockId(null);
    } else {
      document.body.classList.remove("key-editor-open");
    }
    return () => document.body.classList.remove("key-editor-open");
  }, [selectedEditPage]);

  React.useEffect(() => {
    if (!isAdding) return;
    document.body.classList.add("key-create-page-modal-open");
    return () => document.body.classList.remove("key-create-page-modal-open");
  }, [isAdding]);

  // Analytics tab state
  const [analyticsTab, setAnalyticsTab] = useState<"7 Days" | "30 Days" | "All Time">("7 Days");

  const handleWhatsAppRedirect = (value: string) => {
    if (!value) return;
    try {
      if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("whatsapp://")) {
        window.open(value, "_blank", "noopener,noreferrer");
        return;
      }
      const cleaned = value.replace(/[^0-9]/g, "");
      if (cleaned) {
        window.open(`https://wa.me/${cleaned}`, "_blank", "noopener,noreferrer");
      } else {
        window.open(`https://wa.me/${encodeURIComponent(value)}`, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.warn("WhatsApp popup redirection blocked by browser or iframe sandbox policy:", err);
    }
  };

  // QR Customizer States
  const [qrColor, setQrColor] = useState<string>("Default");
  const [qrDesign, setQrDesign] = useState<"Squares" | "Rounded" | "Dots" | "Fluid">("Squares");
  const [qrForeground, setQrForeground] = useState<string>("#000000");
  const [qrBackground, setQrBackground] = useState<string>("#FFFFFF");
  const [hasLogo, setHasLogo] = useState(false);

  // Editor states
  const [editorTitle, setEditorTitle] = useState<string>("");
  const [editorHandle, setEditorHandle] = useState<string>("");
  const [editorBio, setEditorBio] = useState<string>("Write a short bio...");
  const [editorCoverPhoto, setEditorCoverPhoto] = useState<string>("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800");
  const [editorCoverSettings, setEditorCoverSettings] = useState<BioCoverPhotoSettings>({
    ...DEFAULT_COVER_SETTINGS
  });
  const [editorPageTheme, setEditorPageTheme] = useState<BioPagePreviewTheme>("dark");
  const [editorTab, setEditorTab] = useState<"Edit" | "Thank You" | "Settings">("Edit");
  const [editorViewPanel, setEditorViewPanel] = useState<"blocks" | "edit" | "preview">("edit");
  const [linkedTemplateId, setLinkedTemplateId] = useState<string | null>(null);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState("");
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Widget states inside editor to allow live mockup interactivity!
  const [couponCode, setCouponCode] = useState("MARVELTOYCODE007007");
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  // Interactive Simulator States
  const [simulatorToast, setSimulatorToast] = useState<string | null>(null);
  const [simulatorLeadEmail, setSimulatorLeadEmail] = useState("");
  const [showThanksPage, setShowThanksPage] = useState(false);
  const [thankYouTitle, setThankYouTitle] = useState("Thank You");
  const [thankYouMessage, setThankYouMessage] = useState(DEFAULT_THANK_YOU_MESSAGE);
  const [thankYouEmoji, setThankYouEmoji] = useState("✓");
  const [thankYouBlocks, setThankYouBlocks] = useState(() => createDefaultThankYouBlocks());
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [paymentAmountInr, setPaymentAmountInr] = useState(499);
  const [paymentDescription, setPaymentDescription] = useState("Bio page form payment");
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [activeSpinBlockId, setActiveSpinBlockId] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);

  // Utility to show temporary toast in the simulator
  const triggerSimulatorToast = (msg: string) => {
    setSimulatorToast(msg);
    setTimeout(() => {
      setSimulatorToast(null);
    }, 3000);
  };

  // Dynamic blocks state for the editor
  const [editorBlocks, setEditorBlocks] = useState<Array<{ id: string; type: string; label: string; value: string }>>([]);

  /** Thank You tab reuses the same Block Library / accordion editor as Edit. */
  const editingThankYouPage = editorTab === "Thank You";
  type EditorBlockRow = { id: string; type: string; label: string; value: string; [key: string]: unknown };
  const canvasBlocks = (editingThankYouPage ? thankYouBlocks : editorBlocks) as EditorBlockRow[];
  const setCanvasBlocks = (action: React.SetStateAction<EditorBlockRow[]>) => {
    if (editingThankYouPage) {
      setThankYouBlocks((prev) => {
        const base = prev as EditorBlockRow[];
        const next = typeof action === "function" ? action(base) : action;
        return next as BlockRecord[];
      });
      return;
    }
    setEditorBlocks(action as React.SetStateAction<typeof editorBlocks>);
  };

  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingBlockLabel, setEditingBlockLabel] = useState<string>("");
  const [editingBlockValue, setEditingBlockValue] = useState<string>("");

  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);
  const [coverSectionLocked, setCoverSectionLocked] = useState(false);
  const [showCoverUrlModal, setShowCoverUrlModal] = useState(false);
  const [coverUrlDraft, setCoverUrlDraft] = useState(DEFAULT_COVER);

  // Reordering blocks state (PAGE BLOCKS accordion only)
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const [isAccordionReorderDrag, setIsAccordionReorderDrag] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ index: number; position: "before" | "after" } | null>(null);
  const accordionListRef = useRef<HTMLDivElement>(null);
  const composeScrollRef = useRef<HTMLDivElement>(null);
  const editorTitleInputRef = useRef<HTMLInputElement>(null);
  const blockDragMovedRef = useRef(false);

  React.useEffect(() => {
    if (!coverSectionLocked) return;
    const container = composeScrollRef.current;
    if (!container) return;
    container.scrollTop = 0;
  }, [coverSectionLocked]);

  const getAccordionDropPosition = (e: React.DragEvent): "before" | "after" => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
  };

  const getInsertIndex = (targetIndex: number, position: "before" | "after", listLength: number) => {
    const raw = position === "before" ? targetIndex : targetIndex + 1;
    return Math.max(0, Math.min(raw, listLength));
  };

  const reorderEditorBlocks = (
    sourceIndex: number,
    targetIndex: number,
    position: "before" | "after"
  ) => {
    setCanvasBlocks((prev) => {
      if (sourceIndex < 0 || sourceIndex >= prev.length) return prev;
      const copy = [...prev];
      const [removed] = copy.splice(sourceIndex, 1);
      let insertIndex = getInsertIndex(targetIndex, position, copy.length);
      if (sourceIndex < insertIndex) insertIndex -= 1;
      copy.splice(insertIndex, 0, removed);
      return copy;
    });
  };

  const getDropDisplayPosition = (target: { index: number; position: "before" | "after" }, total: number) => {
    const raw = target.position === "before" ? target.index + 1 : target.index + 2;
    return Math.max(1, Math.min(raw, total));
  };

  const resetAccordionDragState = () => {
    setDraggedBlockIndex(null);
    setIsAccordionReorderDrag(false);
    setDropTarget(null);
  };

  const handleBlockDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation();
    blockDragMovedRef.current = true;
    e.dataTransfer.setData("text/block-index", String(index));
    e.dataTransfer.setData("text/block-reorder", "accordion");
    e.dataTransfer.effectAllowed = "move";
    setDraggedBlockIndex(index);
    setIsAccordionReorderDrag(true);
    setDropTarget(null);
  };

  const handleBlockDragOver = (e: React.DragEvent, index: number) => {
    // Form field reordering happens inside FormFieldsEditor — don't hijack it.
    if (
      e.dataTransfer.types.includes("text/form-field-reorder") ||
      e.dataTransfer.types.includes("application/x-form-field-index")
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const isReorder =
      isAccordionReorderDrag ||
      draggedBlockIndex !== null ||
      e.dataTransfer.types.includes("text/block-reorder") ||
      e.dataTransfer.types.includes("text/block-index");
    e.dataTransfer.dropEffect = isReorder ? "move" : "copy";
    setDropTarget({ index, position: getAccordionDropPosition(e) });
  };

  const handleAccordionListDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isAccordionReorderDrag && draggedBlockIndex === null) return;
    e.dataTransfer.dropEffect = "move";
    if (canvasBlocks.length === 0) return;

    const listEl = accordionListRef.current;
    if (!listEl) return;

    const blockEls = listEl.querySelectorAll<HTMLElement>("[data-accordion-block]");
    const lastBlock = blockEls[blockEls.length - 1];
    if (!lastBlock) return;

    const lastRect = lastBlock.getBoundingClientRect();
    if (e.clientY > lastRect.bottom - 8) {
      setDropTarget({ index: canvasBlocks.length - 1, position: "after" });
    }
  };

  const handleBlockDrop = (e: React.DragEvent, targetIndex: number) => {
    // Ignore drops that belong to Form Fields editor.
    if (
      e.dataTransfer.types.includes("text/form-field-reorder") ||
      e.dataTransfer.types.includes("application/x-form-field-index")
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const blockType = e.dataTransfer.getData("text/plain");
    const sourceIndexStr = e.dataTransfer.getData("text/block-index");
    const position = dropTarget?.index === targetIndex ? dropTarget.position : getAccordionDropPosition(e);

    if (blockType && !sourceIndexStr) {
      // Guard: form-field index / garbage must not create a block.
      const knownTypes = new Set([
        "Button",
        "Text",
        "Header",
        "Socials",
        "Shop",
        "Coupon",
        "Countdown",
        "Deep Link",
        "Link Spin",
        "WhatsApp",
        "Smart Form",
        "Form",
        "FAQ",
        "Testimonials",
        "Tip Jar",
        "Video",
        "Music",
        "Gallery",
        "PDF",
        "Image",
        "vCard",
        "Events",
        "Map",
        "Divider",
        "Call",
        "Email",
        "Banner",
        "Stats",
        "Pricing"
      ]);
      if (!knownTypes.has(blockType)) {
        resetAccordionDragState();
        return;
      }
      const insertIndex = getInsertIndex(targetIndex, position, canvasBlocks.length);
      handleAddBlock(blockType, insertIndex);
      triggerToast(`✨ Added ${blockType} at position ${insertIndex + 1}`);
      setActiveDraggedBlockType(null);
      resetAccordionDragState();
      return;
    }

    const sourceIndex = sourceIndexStr ? parseInt(sourceIndexStr, 10) : draggedBlockIndex;
    if (sourceIndex !== null && !isNaN(sourceIndex)) {
      const wouldStay =
        (position === "before" && sourceIndex === targetIndex) ||
        (position === "after" && sourceIndex === targetIndex + 1) ||
        (position === "after" && sourceIndex === targetIndex && targetIndex === canvasBlocks.length - 1);

      if (!wouldStay) {
        reorderEditorBlocks(sourceIndex, targetIndex, position);
        triggerToast(`🔄 Moved to position ${getDropDisplayPosition({ index: targetIndex, position }, canvasBlocks.length)}`);
      }
    }
    resetAccordionDragState();
  };

  const handleBlockDragEnd = () => {
    resetAccordionDragState();
    window.setTimeout(() => {
      blockDragMovedRef.current = false;
    }, 0);
  };

  const scrollAccordionIntoCenter = (blockId: string) => {
    const container = composeScrollRef.current;
    const element = document.getElementById(`editor-block-${blockId}`);
    if (!container || !element) return;
    window.requestAnimationFrame(() => {
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const nextTop =
        container.scrollTop +
        (elementRect.top - containerRect.top) -
        containerRect.height / 2 +
        elementRect.height / 2;
      container.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
    });
  };

  const toggleAccordionBlock = (blockId: string, isExpanded: boolean) => {
    const nextExpanded = isExpanded ? null : blockId;
    setExpandedBlockId(nextExpanded);
    if (nextExpanded) {
      scrollAccordionIntoCenter(blockId);
    }
  };

  const handleAccordionHeaderActivate = (blockId: string, isExpanded: boolean) => {
    if (blockDragMovedRef.current) return;
    toggleAccordionBlock(blockId, isExpanded);
  };

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleUpdateBlockField = (blockId: string, field: string, value: any) => {
    setCanvasBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, [field]: value } : b)));
  };

  const handleCoverPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      triggerToast("Choose a valid image file for the cover photo.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      triggerToast("Cover photo must be 5 MB or smaller.");
      return;
    }

      const reader = new FileReader();
      reader.onloadend = () => {
        setEditorCoverPhoto(reader.result as string);
        triggerToast("✨ Cover photo uploaded successfully!");
      };
      reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Custom states to store saved templates, saved drafts, and active blocks mappings (with localStorage persistence)
  const [toast, setToast] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  
  const [nextInitialBlocks, setNextInitialBlocks] = useState<Array<{ id: string; type: string; label: string; value: string }> | null>(genericInitialBlocks);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("generic");

  // Fallback drag block type for robust sandbox iframe drag-and-drop support
  const [activeDraggedBlockType, setActiveDraggedBlockType] = useState<string | null>(null);

  // Drag-and-drop state & counter variables
  const [isDraggingOverManager, setIsDraggingOverManager] = useState(false);
  const [isDraggingOverPreview, setIsDraggingOverPreview] = useState(false);

  const dragCounterManager = useRef(0);
  const dragCounterPreview = useRef(0);

  const handleDragStartBlockType = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData("text/plain", type);
    e.dataTransfer.effectAllowed = "copy";
    setActiveDraggedBlockType(type);
    setIsAccordionReorderDrag(false);
    setDropTarget(null);
  };

  const handleDragOverTarget = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer) return;
    const isReorder =
      isAccordionReorderDrag ||
      draggedBlockIndex !== null ||
      e.dataTransfer.types.includes("text/block-reorder") ||
      e.dataTransfer.types.includes("text/block-index");
    e.dataTransfer.dropEffect = isReorder ? "move" : "copy";
    handleAccordionListDragOver(e);
  };

  const handleDragEnterManager = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterManager.current += 1;
    setIsDraggingOverManager(true);
  };

  const handleDragLeaveManager = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterManager.current -= 1;
    if (dragCounterManager.current <= 0) {
      dragCounterManager.current = 0;
      setIsDraggingOverManager(false);
    }
  };

  const handleDropOnManager = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterManager.current = 0;
    setIsDraggingOverManager(false);

    const sourceIndexStr = e.dataTransfer.getData("text/block-index");
    if (sourceIndexStr) {
      const sourceIndex = parseInt(sourceIndexStr, 10);
      if (!isNaN(sourceIndex) && dropTarget) {
        reorderEditorBlocks(sourceIndex, dropTarget.index, dropTarget.position);
        triggerToast(`🔄 Moved to position ${getDropDisplayPosition(dropTarget, canvasBlocks.length)}`);
      } else if (!isNaN(sourceIndex) && sourceIndex !== canvasBlocks.length - 1) {
        setCanvasBlocks((prev) => {
          const copy = [...prev];
          const [removed] = copy.splice(sourceIndex, 1);
          copy.push(removed);
          return copy;
        });
        triggerToast("🔄 Moved to last position");
      }
      resetAccordionDragState();
      return;
    }

    const type = e.dataTransfer.getData("text/plain") || activeDraggedBlockType;
    if (type) {
      handleAddBlock(type);
      triggerToast(`✨ Block Drag & Drop: Added new ${type} Block to manager!`);
    }
    setActiveDraggedBlockType(null);
    resetAccordionDragState();
  };

  const handleDragEnterPreview = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterPreview.current += 1;
    setIsDraggingOverPreview(true);
  };

  const handleDragLeavePreview = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterPreview.current -= 1;
    if (dragCounterPreview.current <= 0) {
      dragCounterPreview.current = 0;
      setIsDraggingOverPreview(false);
    }
  };

  const handleDropOnPreview = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterPreview.current = 0;
    setIsDraggingOverPreview(false);
    const type = e.dataTransfer.getData("text/plain") || activeDraggedBlockType;
    if (type) {
      handleAddBlock(type);
      triggerSimulatorToast(`🚀 Live Drag & Drop: Added new ${type} block to layout!`);
    }
    setActiveDraggedBlockType(null);
  };

  const handleSaveAsTemplate = () => {
    if (!editorTitle.trim()) {
      triggerToast("⚠️ Add a page title before saving as template.");
      return;
    }
    setTemplateNameInput(
      linkedTemplateId
        ? savedTemplates.find((tpl) => tpl.id === linkedTemplateId)?.name || editorTitle
        : `${editorTitle} Template`
    );
    setShowSaveTemplateModal(true);
  };

  const confirmSaveAsTemplate = async () => {
    try {
      const name = templateNameInput.trim() || editorTitle || "Untitled Template";
      const state = buildCurrentEditorState();
      const now = new Date().toISOString();

      const savedTemplate: BioPageTemplate = linkedTemplateId
        ? {
            id: linkedTemplateId,
            name,
            sourcePageId: selectedEditPage?.id,
            previewImage: state.pageMeta.coverImage,
            data: state,
            createdAt:
              savedTemplates.find((t) => t.id === linkedTemplateId)?.createdAt || now,
            updatedAt: now
          }
        : {
            id: `tpl_${Date.now()}`,
            name,
            sourcePageId: selectedEditPage?.id,
            previewImage: state.pageMeta.coverImage,
            data: state,
            createdAt: now,
            updatedAt: now
          };

      setSavedTemplates((prev) => upsertTemplate(savedTemplate, prev));

      if (!linkedTemplateId) {
        setLinkedTemplateId(savedTemplate.id);
      }

      // Persist template linkage on the live page document so public leads record it
      if (selectedEditPage) {
        persistPagePreviewLocalOnly(
          selectedEditPage.id,
          selectedEditPage.slug,
          editorBlocks,
          {
            ...buildCurrentPreviewDetails(),
            templateId: savedTemplate.id,
            templateName: name
          }
        );
      }

      const serverOk = await syncTemplateToServer(savedTemplate);
      setShowSaveTemplateModal(false);

      triggerToast(
        serverOk
          ? linkedTemplateId
            ? `✨ Template "${name}" updated on the cloud.`
            : `✨ Template "${name}" saved to the cloud.`
          : `✨ Template "${name}" saved for this session.`
      );
      onNotify({
        type: "template_saved",
        title: linkedTemplateId ? "Template updated" : "Template saved",
        message: `"${name}" is available in Templates → My Templates.`,
        targetScreen: ScreenId.TEMPLATES
      });
    } catch (err) {
      console.error("Failed to save template:", err);
      triggerToast("⚠️ Could not save template. Please try again.");
    }
  };

  const buildCurrentEditorState = (): BioEditorState =>
    buildEditorState(
      editorTitle,
      editorBio,
      editorCoverPhoto,
      editorBlocks as BioEditorBlock[],
      selectedEditPage?.slug,
      editorHandle,
      editorPageTheme,
      editorCoverSettings,
      {
        title: thankYouTitle,
        message: thankYouMessage,
        emoji: thankYouEmoji,
        blocks: thankYouBlocks as BioEditorBlock[]
      },
      {
        enabled: paymentEnabled,
        amountInr: paymentAmountInr,
        description: paymentDescription
      }
    );

  const buildCurrentPreviewDetails = (theme: BioPagePreviewTheme = editorPageTheme) => {
    const linkedTpl = linkedTemplateId
      ? savedTemplates.find((tpl) => tpl.id === linkedTemplateId)
      : null;
    const amount =
      typeof paymentAmountInr === "number" && Number.isFinite(paymentAmountInr) && paymentAmountInr > 0
        ? Math.round(paymentAmountInr)
        : 0;
    return {
      title: editorTitle,
      bio: editorBio,
      coverPhoto: editorCoverPhoto,
      handle: getStoredHandle(editorHandle),
      pageTheme: theme,
      coverSettings: editorCoverSettings,
      templateId: linkedTpl?.id || linkedTemplateId || undefined,
      templateName: linkedTpl?.name || undefined,
      thankYouTitle,
      thankYouMessage,
      thankYouEmoji,
      thankYouBlocks: thankYouBlocks as BioEditorBlock[],
      // Always persist explicit flags so public pages don't keep stale payment OFF/ON.
      paymentEnabled: Boolean(paymentEnabled && amount > 0),
      ...(paymentEnabled && amount > 0
        ? {
            paymentAmountInr: amount,
            paymentDescription: (paymentDescription || "Bio page form payment").trim()
          }
        : {
            paymentAmountInr: 0,
            paymentDescription: ""
          })
    };
  };

  const leadCaptureMeta = () => {
    const details = buildCurrentPreviewDetails();
    return {
      sourceDomain: typeof window !== "undefined" ? window.location.hostname : "",
      pageSlug: selectedEditPage?.slug || "",
      templateId: details.templateId || "",
      templateName: details.templateName || ""
    };
  };

  const previewHandle = formatDisplayHandle(editorHandle, editorTitle, { fallbackToTitle: false });
  const handlePlaceholder = suggestedHandlePlaceholder(editorTitle);
  const phonePreviewScreenRef = useRef<HTMLDivElement | null>(null);
  const activeSpinBlock = activeSpinBlockId
    ? canvasBlocks.find((block) => block.id === activeSpinBlockId)
    : canvasBlocks.find((block) => block.type === "Link Spin");
  const spinCouponCode = activeSpinBlock
    ? getLinkSpinCouponCode(activeSpinBlock as BlockRecord)
    : "LUCKYSPIN20";
  const spinPrizes = activeSpinBlock
    ? getLinkSpinPrizes(activeSpinBlock as BlockRecord)
    : getLinkSpinPrizes({ id: "", type: "Link Spin", label: "", value: "" });

  const previewBlockHandlers: BlockRendererHandlers = {
    onToast: triggerSimulatorToast,
    onWhatsApp: handleWhatsAppRedirect,
    onSpinOpen: (blockId) => {
      setActiveSpinBlockId(blockId);
      setSpinResult(null);
      setIsSpinning(false);
      setShowSpinWheel(true);
    },
    leadEmails: Object.fromEntries(
      canvasBlocks.filter((block) => block.type === "Smart Form").map((block) => [block.id, simulatorLeadEmail])
    ),
    onLeadEmailChange: (_blockId, email) => setSimulatorLeadEmail(email),
    onLeadSubmit: (blockId, email) => {
      if (!selectedEditPage) return;
      const blockLabel = canvasBlocks.find((entry) => entry.id === blockId)?.label || blockId;
      const meta = leadCaptureMeta();
      void fetch(apiUrl("/api/leads"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: selectedEditPage.id,
          pageTitle: editorTitle || selectedEditPage.title,
          blockId,
          blockLabel,
          source: "SMART FORM",
          fields: { Email: email },
          ...meta
        })
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("save failed");
          const payload = await response.json().catch(() => null);
          if (payload?.contact) {
            const { broadcastLeadCaptured } = await import("../lib/contactCapture");
            broadcastLeadCaptured(payload.contact);
          } else {
            window.dispatchEvent(new CustomEvent("key-contacts-updated"));
          }
          onNotify({
            type: "contact_added",
            title: "Lead saved to Contacts",
            message: `${email} was added from ${blockLabel}.`,
            targetScreen: ScreenId.CONTACTS
          });
        })
        .catch(() => {
          triggerSimulatorToast("Could not save lead to Contacts yet.");
        });
    },
    onFormSubmit: (blockId, data) => {
      if (!selectedEditPage) return;
      const blockLabel = canvasBlocks.find((entry) => entry.id === blockId)?.label || blockId;
      const meta = leadCaptureMeta();
      void fetch(apiUrl("/api/leads"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: selectedEditPage.id,
          pageTitle: editorTitle || selectedEditPage.title,
          blockId,
          blockLabel,
          source: "BIO FORM",
          fields: data,
          ...meta
        })
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("save failed");
          const payload = await response.json().catch(() => null);
          if (payload?.contact) {
            const { broadcastLeadCaptured } = await import("../lib/contactCapture");
            broadcastLeadCaptured(payload.contact);
          } else {
            window.dispatchEvent(new CustomEvent("key-contacts-updated"));
          }
          onNotify({
            type: "contact_added",
            title: "Form lead saved to Contacts",
            message: `Submission from "${blockLabel}" is now in Contacts.`,
            targetScreen: ScreenId.CONTACTS
          });
        })
        .catch(() => {
          triggerSimulatorToast("Could not save form lead to Contacts yet.");
        });
    },
    deferThanksUntilPaid: paymentEnabled && paymentAmountInr > 0,
    paymentAmountInr: paymentEnabled ? paymentAmountInr : undefined,
    paymentSuccessTitle: thankYouTitle || "Payment successful",
    paymentSuccessMessage: thankYouMessage || "Your payment was verified. Thank you!",
    onSecureCheckout: async () => {
      // Editor preview never charges — success UI stays on the form block (no route).
      triggerSimulatorToast(
        `Payment skipped in preview${paymentAmountInr ? ` (₹${paymentAmountInr})` : ""}`
      );
      return { state: "success" as const, amountInr: paymentAmountInr };
    },
    onShowThanks: () => {
      if (paymentEnabled && paymentAmountInr > 0) return;
      triggerSimulatorToast("✨ Opening Thank You page");
      setShowThanksPage(true);
    }
  };

  const syncPreviewStorage = (theme: BioPagePreviewTheme = editorPageTheme) => {
    if (!selectedEditPage) return;
    persistPagePreviewLocalOnly(
      selectedEditPage.id,
      selectedEditPage.slug,
      editorBlocks,
      buildCurrentPreviewDetails(theme)
    );
  };

  const skipEditorAutoSyncRef = React.useRef(true);

  React.useEffect(() => {
    skipEditorAutoSyncRef.current = true;
    setShowThanksPage(false);
  }, [selectedEditPage?.id]);

  React.useEffect(() => {
    if (!selectedEditPage || showPublishSuccess) return;
    if (skipEditorAutoSyncRef.current) {
      skipEditorAutoSyncRef.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      syncPreviewStorage();
    }, 800);

    return () => window.clearTimeout(timer);
  }, [
    editorBlocks,
    editorTitle,
    editorBio,
    editorCoverPhoto,
    editorCoverSettings,
    editorHandle,
    editorPageTheme,
    thankYouTitle,
    thankYouMessage,
    thankYouEmoji,
    thankYouBlocks,
    paymentEnabled,
    paymentAmountInr,
    paymentDescription,
    selectedEditPage?.id,
    showPublishSuccess
  ]);

  React.useEffect(() => {
    if (editorTab === "Thank You") setShowThanksPage(true);
  }, [editorTab]);

  React.useEffect(() => {
    if (!showThanksPage) return;
    const screen = phonePreviewScreenRef.current;
    if (screen) screen.scrollTop = 0;
  }, [showThanksPage, thankYouBlocks, thankYouTitle, thankYouMessage, thankYouEmoji]);

  const handlePreviewThemeChange = (theme: BioPagePreviewTheme) => {
    setEditorPageTheme(theme);
    syncPreviewStorage(theme);
  };

  const hydrateThankYouFromDetails = (details?: BioPagePreviewDetails | null, state?: BioEditorState) => {
    const title =
      state?.pageMeta.thankYouTitle || details?.thankYouTitle || "Thank You";
    let message =
      state?.pageMeta.thankYouMessage ||
      details?.thankYouMessage ||
      DEFAULT_THANK_YOU_MESSAGE;
    // Migrate old ecommerce-style defaults to KEYLINK360 branding
    if (
      message === "Your details were received. We will connect with you soon." ||
      !message.trim()
    ) {
      message = DEFAULT_THANK_YOU_MESSAGE;
    }
    const emoji = state?.pageMeta.thankYouEmoji || details?.thankYouEmoji || "✓";
    let blocks =
      (state?.thankYouBlocks?.length
        ? state.thankYouBlocks
        : details?.thankYouBlocks?.length
          ? details.thankYouBlocks
          : createDefaultThankYouBlocks()) || createDefaultThankYouBlocks();
    blocks = (blocks as BioEditorBlock[]).map((block) => {
      if (block.type === "Button" && block.label === "View order status") {
        return { ...block, label: "Back to page", value: "" };
      }
      if (
        block.type === "Text" &&
        block.label === "Your details were received. We will connect with you soon."
      ) {
        return {
          ...block,
          label:
            "KEYLINK360 helps you share your bio, capture leads, and grow your brand from one page.",
          value:
            "KEYLINK360 helps you share your bio, capture leads, and grow your brand from one page."
        };
      }
      return block;
    });
    setThankYouTitle(title);
    setThankYouMessage(message);
    setThankYouEmoji(emoji);
    setThankYouBlocks(cloneBlocks(blocks as BioEditorBlock[]) as BlockRecord[]);

    const payEnabled =
      state?.pageMeta.paymentEnabled === true || details?.paymentEnabled === true;
    const amountRaw =
      state?.pageMeta.paymentAmountInr ?? details?.paymentAmountInr ?? 499;
    const amount =
      typeof amountRaw === "number" && Number.isFinite(amountRaw) && amountRaw > 0
        ? Math.round(amountRaw)
        : 499;
    const payDesc =
      state?.pageMeta.paymentDescription ||
      details?.paymentDescription ||
      "Bio page form payment";
    setPaymentEnabled(payEnabled);
    setPaymentAmountInr(amount);
    setPaymentDescription(payDesc);
  };

  const hydrateEditorFromState = (state: BioEditorState) => {
    setEditorTitle(state.pageMeta.title);
    setEditorHandle(state.pageMeta.handle || "");
    setEditorBio(state.pageMeta.shortBio);
    setEditorCoverPhoto(state.pageMeta.coverImage);
    setEditorCoverSettings(normalizeCoverSettings(state.pageMeta.coverSettings));
    setEditorPageTheme(normalizePageTheme(state.pageMeta.pageTheme));
    setEditorBlocks(cloneBlocks(state.blocks));
    hydrateThankYouFromDetails(null, state);
  };

  const getTemplateDisplayName = (tpl: BioPageTemplate) => tpl.name;
  const getTemplateBlockCount = (tpl: BioPageTemplate) => tpl.data?.blocks?.length ?? 0;
  const getDraftDisplayName = (draft: BioPageDraft) => draft.data.pageMeta.title;
  const getDraftBlockCount = (draft: BioPageDraft) => draft.data.blocks.length;

  const getTemplateFallbackBlocks = (page: BioPage): BioEditorBlock[] => {
    if (page.title.toLowerCase().includes("marvel")) {
      return cloneBlocks(marvelInitialBlocks as BioEditorBlock[]);
    }
    return cloneBlocks(genericInitialBlocks as BioEditorBlock[]);
  };

  const resolvePageBlocks = (page: BioPage): BioEditorBlock[] => {
    const stored = resolveStoredPageBlocks(page.id, page.slug, pageBlocksMap);
    if (stored) return stored;
    return getTemplateFallbackBlocks(page);
  };

  const shouldRestoreDraftForPage = (
    page: BioPage,
    draft: BioPageDraft,
    preferPublished?: boolean
  ): boolean => {
    if (preferPublished) return false;
    if (page.status === "Live") {
      const publishedAt = readLocalPublishedUpdatedAt(page.id, page.slug);
      if (publishedAt && new Date(draft.updatedAt).getTime() <= new Date(publishedAt).getTime()) {
        return false;
      }
      const localDoc = readLocalPageDocument(page.id, page.slug);
      if (localDoc?.updatedAt && new Date(draft.updatedAt).getTime() <= new Date(localDoc.updatedAt).getTime()) {
        return false;
      }
    }
    return true;
  };

  const hydrateEditorPageMeta = (page: BioPage, details?: BioPagePreviewDetails | null) => {
    setEditorTitle(details?.title || page.title);
    setEditorHandle(details?.handle ?? page.handle ?? "");
    setEditorBio(details?.bio || page.bio || "Write a short bio...");
    setEditorCoverPhoto(details?.coverPhoto || page.coverPhoto || DEFAULT_COVER);
    setEditorPageTheme(normalizePageTheme(details?.pageTheme ?? readStoredPageTheme(page.id, page.slug)));
    setEditorCoverSettings(normalizeCoverSettings(details?.coverSettings ?? readStoredPageDetails(page.id, page.slug)?.coverSettings));
    hydrateThankYouFromDetails(details);
  };

  const loadEditorContentForPage = async (
    page: BioPage,
    options?: { templateId?: string | null; preferPublished?: boolean }
  ) => {
    const pageDraft = savedDrafts.find((draft) => draft.pageId === page.id);
    if (pageDraft && shouldRestoreDraftForPage(page, pageDraft, options?.preferPublished)) {
      hydrateEditorFromState(pageDraft.data);
      triggerToast(`📂 Restored draft for "${pageDraft.data.pageMeta.title}"`);
      return;
    }

    const localDoc = readLocalPageDocument(page.id, page.slug);
    let resolvedBlocks = resolvePageBlocks(page);
    let resolvedDetails = localDoc?.details ?? readStoredPageDetails(page.id, page.slug);

    try {
      const serverDoc = await fetchPageDocumentFromServer(page.id);
      if (serverDoc) {
        const serverBlocks = Array.isArray(serverDoc.blocks) ? serverDoc.blocks : null;
        const serverUpdatedAt =
          typeof serverDoc.updatedAt === "string" ? new Date(serverDoc.updatedAt).getTime() : 0;
        const localUpdatedAt = localDoc?.updatedAt ? new Date(localDoc.updatedAt).getTime() : 0;
        const useServerBlocks =
          serverBlocks &&
          (serverUpdatedAt >= localUpdatedAt ||
            (page.status === "Live" && serverBlocks.length >= resolvedBlocks.length));

        if (useServerBlocks) {
          resolvedBlocks = cloneBlocks(serverBlocks);
          if (serverDoc.details) {
            resolvedDetails = serverDoc.details;
          }
        }
      }
    } catch {
      /* keep local/template blocks */
    }

    hydrateEditorPageMeta(page, resolvedDetails);
    setEditorBlocks(resolvedBlocks);
    setPageBlocksMap((prev) => ({
      ...prev,
      [page.id]: cloneBlocks(resolvedBlocks)
    }));
  };

  const applyEditingPageUpdate = (status?: BioPage["status"]) => {
    if (!selectedEditPage) return pages;
    const nextStatus = status ?? selectedEditPage.status;
    onUpdatePage(
      selectedEditPage.id,
      editorTitle,
      editorBio,
      editorCoverPhoto,
      editorHandle,
      nextStatus
    );
    setSelectedEditPage({
      ...selectedEditPage,
      title: editorTitle,
      bio: editorBio,
      coverPhoto: editorCoverPhoto,
      handle: editorHandle,
      status: nextStatus,
      isUncommitted: undefined
    });
    return pages.map((page) =>
      page.id === selectedEditPage.id
        ? {
            ...page,
            title: editorTitle,
            bio: editorBio,
            coverPhoto: editorCoverPhoto,
            handle: editorHandle,
            status: nextStatus,
            isUncommitted: undefined
          }
        : page
    );
  };

  const handleSaveDraft = async () => {
    if (!selectedEditPage || !editorTitle.trim()) {
      triggerToast("Add a page title before saving a draft.");
      return;
    }

    if (isSavingDraft) return;
    setIsSavingDraft(true);

    try {
      const state = buildCurrentEditorState();
      const now = new Date().toISOString();
      const existingDraft = savedDrafts.find((draft) => draft.pageId === selectedEditPage.id);

      const draftRecord: BioPageDraft = {
        id: existingDraft?.id || `draft_${selectedEditPage.id}`,
        pageId: selectedEditPage.id,
        pageSlug: selectedEditPage.slug,
        data: state,
        createdAt: existingDraft?.createdAt || now,
        updatedAt: now
      };

      const nextDrafts = upsertDraft(draftRecord, savedDrafts);
      setSavedDrafts(nextDrafts);

      const pagesForSync = applyEditingPageUpdate("Draft");
      const pageId = selectedEditPage.id;
      const pageSlug = selectedEditPage.slug;
      const blocksSnapshot = cloneBlocks(state.blocks);
      const details = buildCurrentPreviewDetails();

      setPageBlocksMap((prev) => ({
        ...prev,
        [pageId]: blocksSnapshot
      }));

      // Local save finishes immediately — never wait on the network for the button.
      persistPagePreviewLocalOnly(pageId, pageSlug, blocksSnapshot, details);
      persistDrafts(nextDrafts);

      triggerToast(`Draft saved for "${editorTitle}".`);
      onNotify({
        type: "draft_saved",
        title: "Draft saved",
        message: `Your edits to "${editorTitle}" were saved.`,
        targetScreen: ScreenId.BIO_PAGES
      });

      // Best-effort cloud sync in the background (no error toasts).
      void (async () => {
        try {
          await syncPagesListToServer(pagesForSync);
          await Promise.all([
            syncDraftToServer(draftRecord),
            persistAndSyncPagePreview(pageId, pageSlug, blocksSnapshot, details, {
              pages: pagesForSync
            })
          ]);
        } catch (error) {
          console.warn("[bio] background draft sync failed:", error);
        }
      })();
    } catch (err) {
      console.error("Failed to save draft:", err);
      triggerToast("Could not save draft. Please try again.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const startEditingBlock = (id: string, label: string, value: string) => {
    setEditingBlockId(id);
    setEditingBlockLabel(label);
    setEditingBlockValue(value);
  };

  const saveEditingBlock = (id: string) => {
    setCanvasBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, label: editingBlockLabel, value: editingBlockValue } : b))
    );
    setEditingBlockId(null);
  };

  const handleDeleteBlock = (id: string) => {
    setCanvasBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleAddBlock = (type: string, atIndex?: number) => {
    const id = "block_" + Date.now();
    let label = "";
    let value = "";
    let extraFields: any = {};
    switch (type) {
      case "Button":
        label = "Explore the Toys Section";
        value = "https://example.com/toys";
        extraFields = { bgColor: BIO_LINK.bg, textColor: BIO_LINK.text };
        break;
      case "Text":
        label = "🎁 Safe, fun & exciting toys for young superheroes.";
        value = "🎁 Safe, fun & exciting toys for young superheroes.";
        break;
      case "Header":
        label = "⭐ Why Shop With Us?";
        value = "⭐ Why Shop With Us?";
        break;
      case "Socials":
        label = "Follow our Social handles";
        value = "Socials";
        extraFields = createDefaultSocialFields();
        break;
      case "Shop":
        label = "My Shop";
        value = "Products List";
        extraFields = {
          alignment: "Centre",
          currency: "₹ INR",
          products: JSON.parse(JSON.stringify(defaultProductsList)),
          bgColor: "#10B981",
          textColor: "#FFFFFF"
        };
        break;
      case "Coupon":
        label = "Special Offer (MARVELTOYCODE007007)";
        value = "MARVELTOYCODE007007";
        break;
      case "Countdown":
        label = "Sale ends in";
        value = "9";
        extraFields = {
          endAt: defaultCountdownEndAt(9),
          headline: "Limited offer ends in"
        };
        break;
      case "Deep Link":
        label = "Open in App";
        value = "https://yourapp.example/open";
        extraFields = {
          bgColor: BIO_LINK.bg,
          textColor: BIO_LINK.text,
          iconEmoji: "📱",
          subtext: "Tap to open the app",
          showArrow: "Yes"
        };
        break;
      case "Link Spin":
        label = "Spin to Win";
        value = "Spin Now";
        extraFields = createDefaultLinkSpinFields();
        break;
      case "WhatsApp":
        label = "Message Us on WhatsApp";
        value = "https://wa.me/919876543210";
        break;
      case "Smart Form":
        label = "Get in Touch Leads Form";
        value = "leads@example.com";
        extraFields = {};
        break;
      case "Form":
        label = "Contact Form";
        value = "leads@example.com";
        extraFields = createDefaultFormFields();
        break;
      case "FAQ":
        label = "Frequently Asked Questions";
        value = "FAQ";
        extraFields = { faqItems: createDefaultFaqItems() };
        break;
      case "Testimonials":
        label = "What people say";
        value = "Testimonials";
        extraFields = { testimonials: createDefaultTestimonials() };
        break;
      case "Tip Jar":
        label = "Support my work";
        value = "https://www.buymeacoffee.com/";
        extraFields = {
          description: "Choose an amount to support",
          tipOptions: createDefaultTipOptions()
        };
        break;
      case "Map":
        label = "Find Us";
        value = "https://www.google.com/maps/search/?api=1&query=Marina+Beach,+Chennai";
        extraFields = createDefaultMapFields();
        break;
      case "Image":
        label = "Featured Image";
        value = "";
        extraFields = createDefaultImageFields();
        break;
      case "Divider":
        label = "Divider";
        value = "line";
        extraFields = createDefaultDividerFields();
        break;
      case "vCard":
        label = "Save Contact Card Info";
        value = "Save Contact";
        extraFields = createDefaultVCardFields();
        break;
      case "Video":
        label = "Watch Video stream";
        value = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
        extraFields = { thumbUrl: "" };
        break;
      case "Music":
        label = "Listen to Sound track";
        value = "https://example.com/soundtrack.mp3";
        extraFields = { subtext: "Tap to listen" };
        break;
      case "Gallery":
        label = "View Gallery Showcase";
        value = "Showcase Images";
        extraFields = createDefaultGalleryBlockFields();
        break;
      case "Call":
        label = "Call Us Now";
        value = "+919876543210";
        extraFields = createDefaultCallFields();
        break;
      case "Email":
        label = "Email Me";
        value = "hello@example.com";
        extraFields = createDefaultEmailFields();
        break;
      case "Banner":
        label = "Announcement";
        value = "Banner";
        extraFields = createDefaultBannerFields();
        break;
      case "Stats":
        label = "Why choose us";
        value = "Stats";
        extraFields = { statItems: createDefaultStatItems() };
        break;
      case "Pricing":
        label = "Our Pricing";
        value = "Pricing";
        extraFields = {
          description: "Pick the plan that fits you best",
          pricingPlans: createDefaultPricingPlans()
        };
        break;
      case "PDF":
        label = "Download PDF Catalog";
        value = "https://example.com/catalog.pdf";
        extraFields = { fileSize: "3.2 MB" };
        break;
      case "Events":
        label = "Join Upcoming Meetup & Event";
        value = "https://meetup.com/event-001";
        extraFields = createDefaultEventFields();
        break;
      default:
        label = `New ${type} Block`;
        value = `Value of ${type}`;
    }
    const newBlock = { id, type, label, value, ...extraFields };
    setCanvasBlocks((prev) => {
      if (atIndex === undefined || atIndex < 0 || atIndex > prev.length) {
        return [...prev, newBlock];
      }
      const copy = [...prev];
      copy.splice(atIndex, 0, newBlock);
      return copy;
    });
  };

  const COLOR_MAP: Record<string, string> = {
    Default: "#000000",
    Orange: "#6366f1",
    Dark: "#111827",
    Navy: "#1E3A8A",
    Purple: "#6D28D9",
    Green: "#047857",
    Gold: "#B45309"
  };

  const handleColorSelect = (colorName: string) => {
    setQrColor(colorName);
    const hex = COLOR_MAP[colorName] || "#000000";
    setQrForeground(hex);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshPages();
      triggerToast("✓ BioLink pages refreshed.");
    } catch {
      triggerToast("Unable to refresh pages. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyText = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      triggerToast(successMessage);
    } catch {
      triggerToast("Unable to copy the link. Please copy it from the address field.");
    }
  };

  const confirmDeletePage = (page: BioPage) => {
    if (window.confirm(`Delete "${page.title}"? This cannot be undone.`)) {
      onDeletePage(page.id);
      triggerToast(`"${page.title}" was deleted.`);
    }
  };

  const renderBioPagePublicLink = (page: BioPage) => {
    const link = resolvePublicLink(page);
    const unpublished = page.status !== "Live";
    const blockedTitle = unpublished
      ? "Publish this page before visitors can open the link"
      : link.kind === "custom" && !link.canOpen
        ? "Verify DNS on Custom Domains before opening this address"
        : link.shareUrl;

    return (
      <div className="mt-1 flex flex-wrap items-center gap-2 min-w-0">
        {!link.canOpen ? (
          <span
            title={blockedTitle}
            className={`text-xs font-medium flex items-center gap-1 font-mono min-w-0 max-w-full ${
              unpublished ? "text-slate-500" : "text-amber-700"
            }`}
          >
            {link.kind === "custom" ? (
              <Globe className="h-3 w-3 shrink-0" />
            ) : link.kind === "keys_subdomain" ? (
              <Sparkles className="h-3 w-3 shrink-0" />
            ) : (
              <Link className="h-3 w-3 shrink-0" />
            )}
            <span className="truncate">{link.displayLabel}</span>
          </span>
        ) : (
          <a
            href={link.openUrl}
            target="_blank"
            rel="noreferrer"
            title={link.shareUrl}
            className={`text-xs font-medium flex items-center gap-1 font-mono hover:underline min-w-0 max-w-full ${
              link.kind === "custom"
                ? "text-emerald-700 hover:text-emerald-800"
                : link.kind === "keys_subdomain"
                  ? "text-violet-700 hover:text-violet-800"
                  : "text-indigo-600 hover:text-indigo-700"
            }`}
          >
            {link.kind === "custom" ? (
              <Globe className="h-3 w-3 shrink-0" />
            ) : link.kind === "keys_subdomain" ? (
              <Sparkles className="h-3 w-3 shrink-0" />
            ) : (
              <Link className="h-3 w-3 shrink-0" />
            )}
            <span className="truncate">{link.displayLabel}</span>
          </a>
        )}
        {!unpublished && link.kind === "custom" && (
          <span className={`key-bio-page-link-badge shrink-0 ${link.publicReady ? "" : "key-bio-page-link-badge--pending"}`}>
            {link.publicReady ? "Custom domain" : link.canOpen ? "DNS OK" : "Pending DNS"}
          </span>
        )}
        {!unpublished && link.kind === "keys_subdomain" && (
          <span className="key-bio-page-link-badge shrink-0">Free KEY URL</span>
        )}
      </div>
    );
  };

  const renderBioPageListRow = (page: BioPage, rowOptions?: BioPageListRowOptions) => {
    const publicLink = resolvePublicLink(page);
    const isSelected = rowOptions?.selection?.checked ?? false;
    const showSelection = Boolean(rowOptions?.selection);
    return (
      <div
        key={page.id}
        className={`key-list-row min-w-0 ${publicLink.kind === "custom" ? "key-list-row--custom-domain" : publicLink.kind === "keys_subdomain" ? "key-list-row--custom-domain" : ""} ${
          isSelected ? "key-list-row--selected" : ""
        } ${showSelection ? "key-list-row--bulk-select" : ""}`}
      >
        {showSelection && (
          <label className="key-list-row__select shrink-0">
            <input
              type="checkbox"
              checked={rowOptions!.selection!.checked}
              onChange={() => rowOptions!.selection!.onToggle(page.id)}
              aria-label={`Select ${page.title}`}
              className="key-list-row__select-input"
            />
          </label>
        )}
        <div className="key-list-row__main min-w-0 flex-1">
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          <div
            className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0 ${
              publicLink.kind === "custom"
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-indigo-500/10 text-indigo-400"
            }`}
          >
            {publicLink.kind === "custom" ? (
              <Globe className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <Smartphone className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            {editingId === page.id ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editTitleValue}
                  onChange={(e) => setEditTitleValue(e.target.value)}
                  className="bg-white border border-gray-200 rounded px-2 py-0.5 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500/100"
                />
                <button onClick={() => saveEdit(page.id)} className="text-green-600 hover:bg-green-50 p-1 rounded">
                  <Check className="h-4.5 w-4.5" />
                </button>
                <button onClick={() => setEditingId(null)} className="text-gray-400 hover:bg-gray-50 p-1 rounded">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <h4 className="font-display font-semibold text-gray-950 text-base truncate">{page.title}</h4>
                {rowOptions?.showDuplicateBadge && (
                  <span className="key-bio-page-duplicate-badge shrink-0">Duplicate</span>
                )}
                <button onClick={() => startEditing(page)} className="text-gray-400 hover:text-gray-600">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {renderBioPagePublicLink(page)}
          </div>
        </div>

        <div className={`flex flex-wrap items-center gap-4 sm:gap-6 lg:gap-6 w-full lg:w-auto lg:justify-end ${showSelection ? "" : "pl-14 lg:pl-0"}`}>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              page.status === "Live"
                ? "bg-emerald-50 text-emerald-600"
                : page.status === "Paused"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-slate-100 text-slate-600"
            }`}
          >
            {page.status}
          </span>

          <div className="text-center">
            <span className="font-display font-bold text-2xl text-gray-950 block leading-none">{page.views}</span>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mt-1">Views</span>
          </div>

          <div className="text-center hidden sm:block">
            <span className="font-sans font-medium text-gray-500 text-xs font-mono block leading-none">{page.createdAt}</span>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mt-1">Created</span>
          </div>

          <div className="grid grid-cols-7 gap-0.5 bg-gray-50 p-1.5 rounded-xl border border-gray-100 shadow-sm w-full max-w-[320px] sm:max-w-none sm:w-auto sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-1 mx-auto sm:mx-0">
            <button
              type="button"
              onClick={() => setSelectedAnalyticsPage(page)}
              title={`Analytics — ${page.title}`}
              className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-[#6366f1] transition-all flex items-center justify-center"
            >
              <BarChart2 className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={() => openEditor(page)}
              title="Edit"
              className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-[#6366f1] transition-all flex items-center justify-center"
            >
              <Edit3 className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={() => onDuplicatePage(page.id)}
              title="Duplicate"
              className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-[#6366f1] transition-all flex items-center justify-center"
            >
              <Layers className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedQRPage(page);
                setQrColor("Default");
                setQrForeground("#000000");
                setQrBackground("#FFFFFF");
                setQrDesign("Squares");
                setHasLogo(false);
              }}
              title={`QR — ${page.title}`}
              className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-[#6366f1] transition-all flex items-center justify-center"
            >
              <QrCode className="h-4.5 w-4.5" />
            </button>
            {publicLink.canOpen && (
              <a
                href={publicLink.openUrl}
                target="_blank"
                rel="noreferrer"
                title="Open (visit page)"
                className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-[#6366f1] transition-all flex items-center justify-center"
              >
                <ExternalLink className="h-4.5 w-4.5" />
              </a>
            )}
            {!publicLink.canOpen && (
              <button
                type="button"
                disabled
                title={
                  page.status !== "Live"
                    ? "Publish this page before visitors can open it"
                    : "This link is not ready to open yet"
                }
                className="p-2 rounded-lg text-slate-300 cursor-not-allowed flex items-center justify-center"
              >
                <ExternalLink className="h-4.5 w-4.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (page.status !== "Live") {
                  triggerToast("Publish this page before sharing the public link.");
                  return;
                }
                void copyText(publicLink.shareUrl, "Public shareable link copied!");
              }}
              title={
                page.status !== "Live"
                  ? "Publish this page before sharing"
                  : "Copy Public Share Link (WhatsApp & Mobile)"
              }
              className={`p-2 hover:bg-white rounded-lg transition-all flex items-center justify-center ${
                page.status !== "Live"
                  ? "text-slate-300 hover:text-slate-400"
                  : "text-slate-500 hover:text-emerald-600"
              }`}
            >
              <Copy className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={() => confirmDeletePage(page)}
              title="Delete"
              className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-rose-600 transition-all flex items-center justify-center"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  };

  const exitEditor = () => {
    const discardingUncommitted =
      selectedEditPage?.isUncommitted === true ||
      pages.find((page) => page.id === selectedEditPage?.id)?.isUncommitted === true;
    const discardPageId = discardingUncommitted ? selectedEditPage?.id : null;

    editorExitingRef.current = true;
    editorCloseConfirmOpenRef.current = false;
    setSelectedEditPage(null);
    setShowPublishSuccess(false);
    setShowSaveTemplateModal(false);
    setIsPublishing(false);
    setEditorTab("Edit");
    setEditorViewPanel("edit");
    clearInitialActiveEditPageId();
    clearInitialActiveTemplateId();
    navigate(screenToPath(ScreenId.BIO_PAGES), { replace: true });

    // Back / close without Save Draft or Publish — do not keep a Bio Pages history row
    if (discardPageId) {
      onDeletePage(discardPageId);
    }
  };

  const closeEditor = () => {
    if (editorExitingRef.current || editorCloseConfirmOpenRef.current) return;

    editorCloseConfirmOpenRef.current = true;
    const shouldClose = window.confirm(
      "Close the editor? Changes that have not been saved as a draft or published will be lost."
    );
    editorCloseConfirmOpenRef.current = false;

    if (shouldClose) {
      exitEditor();
    }
  };

  const resolveCreateSlug = (cleanSuffix: string, pageId: string): string => {
    const isTaken = (slug: string) =>
      pages.some((page) => page.slug.toLowerCase() === slug.toLowerCase());

    const base = `key.link/page-${cleanSuffix}`;
    if (!isTaken(base)) return base;

    const shortId = pageId.split("_").pop() || pageId.slice(-6);
    const withShort = `key.link/page-${cleanSuffix}-${shortId}`;
    if (!isTaken(withShort)) return withShort;

    return `key.link/page-${cleanSuffix}-${pageId.replace(/^p_/, "")}`;
  };

  const openCreatePageModal = () => {
    setNewPageId(createUniquePageId());
    setNewPageKind("bio");
    setNewTitle("");
    setNewSlug("");
    setSelectedTemplateId("generic");
    setNextInitialBlocks(genericInitialBlocks);
    setIsAdding(true);
  };

  const closeCreatePageModal = () => {
    setIsAdding(false);
    setNewPageKind("bio");
    setNewTitle("");
    setNewSlug("");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPageId.trim()) return;

    const cleanSuffix = (newSlug.trim() || newTitle)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

    if (!cleanSuffix) {
      triggerToast("Enter a valid URL ending using letters, numbers, or hyphens.");
      return;
    }
    const fullSlug = resolveCreateSlug(cleanSuffix, newPageId);
    setIsCreating(true);
    const newlyCreatedPage = onAddPage(newTitle.trim(), fullSlug, newPageId, "bio");

    const selectedBlocks = nextInitialBlocks || genericInitialBlocks;
    setPageBlocksMap((prev) => ({
      ...prev,
      [newlyCreatedPage.id]: [...selectedBlocks]
    }));

    void persistAndSyncPagePreview(
      newlyCreatedPage.id,
      fullSlug,
      selectedBlocks as BioEditorBlock[],
      {
        title: newlyCreatedPage.title,
        bio: newlyCreatedPage.bio || "Write a short bio...",
        coverPhoto: newlyCreatedPage.coverPhoto || DEFAULT_COVER,
        handle: getStoredHandle(newlyCreatedPage.handle),
        pageTheme: "dark"
      },
      { pages: [...pages, newlyCreatedPage] }
    );

    setNextInitialBlocks(genericInitialBlocks);
    setSelectedTemplateId("generic");
    closeCreatePageModal();
    setIsCreating(false);
    triggerToast(`✨ "${newlyCreatedPage.title}" created · Page ID: ${newlyCreatedPage.id}`);

    setTimeout(() => {
      openEditor(newlyCreatedPage);
    }, 50);
  };

  const startEditing = (page: BioPage) => {
    setEditingId(page.id);
    setEditTitleValue(page.title);
  };

  const saveEdit = (id: string) => {
    if (!editTitleValue) return;
    onUpdatePage(id, editTitleValue);
    setEditingId(null);
  };

  const openEditor = (page: BioPage, options?: { templateId?: string | null; preferPublished?: boolean }) => {
    editorExitingRef.current = false;
    const isAlreadyEditing = selectedEditPage?.id === page.id;

    if (!isAlreadyEditing) {
    setSelectedEditPage(page);
    setEditorTab("Edit");
      setEditorViewPanel("edit");
      setShowPublishSuccess(false);
      setShowSaveTemplateModal(false);
      setLinkedTemplateId(options?.templateId ?? null);
      void loadEditorContentForPage(page, options);
    }

    const params = new URLSearchParams({ edit: page.id });
    if (options?.preferPublished) {
      params.set("source", "domain");
    }
    navigate(`${screenToPath(ScreenId.BIO_PAGES)}?${params.toString()}`, { replace: true });
  };

  // Auto-load editor when arriving from deep links (Custom Domains, Dashboard, Templates)
  React.useEffect(() => {
    if (editorExitingRef.current) {
      if (!editIdFromUrl && !initialActiveEditPageId) {
        editorExitingRef.current = false;
      }
      return;
    }

    const targetId = (initialActiveEditPageId || editIdFromUrl)?.trim();
    if (!targetId) return;

    const pageToEdit = pages.find((p) => p.id === targetId);
    if (!pageToEdit) {
      return;
    }

    if (selectedEditPage?.id !== pageToEdit.id) {
      setSelectedEditPage(pageToEdit);
      setEditorTab("Edit");
      setEditorViewPanel("edit");
      setShowPublishSuccess(false);
      setShowSaveTemplateModal(false);
      setLinkedTemplateId(initialActiveTemplateId ?? null);
      void loadEditorContentForPage(pageToEdit, { preferPublished: editFromDomain });
    }

    if (initialActiveEditPageId) {
      clearInitialActiveEditPageId();
      clearInitialActiveTemplateId();
    }
  }, [
    initialActiveEditPageId,
    initialActiveTemplateId,
    pages,
    savedDrafts,
    editIdFromUrl,
    editFromDomain,
    selectedEditPage?.id
  ]);

  const handlePublishEditor = async () => {
    if (!selectedEditPage || isPublishing) return;
    if (!editorTitle.trim()) {
      triggerToast("A page title is required before publishing.");
      return;
    }

    setIsPublishing(true);
    try {
      const pageId = selectedEditPage.id;
      const pageSlug = selectedEditPage.slug;
      const blocksSnapshot = cloneBlocks(editorBlocks);
      const details = buildCurrentPreviewDetails();
      const pagesForSync = applyEditingPageUpdate("Live");

      setPageBlocksMap((prev) => ({
        ...prev,
        [pageId]: blocksSnapshot
      }));

      persistPagePreviewLocalOnly(pageId, pageSlug, blocksSnapshot, details);
      try {
        sessionStorage.removeItem(`keys_public_page_${pageId}`);
      } catch {
        /* ignore */
      }

      const nextDrafts = deleteDraftByPageId(pageId, savedDrafts);
      setSavedDrafts(nextDrafts);
      persistDrafts(nextDrafts);

      // Public Pay button needs server details — wait for sync before success UI.
      await syncPagesListToServer(pagesForSync);
      const synced = await persistAndSyncPagePreview(pageId, pageSlug, blocksSnapshot, details, {
        pages: pagesForSync
      });
      void syncAllDraftsToServer(nextDrafts);

      if (!synced.serverOk) {
        triggerToast(
          "Published locally, but cloud sync failed — public Pay button may not update until you publish again while online."
        );
      } else if (
        import.meta.env.DEV &&
        selectedEditPageLink?.kind === "custom"
      ) {
        triggerToast(
          `Cloud content synced. If ${selectedEditPageLink.displayLabel} still looks old, hard-refresh — and deploy latest app build so Pay/theme UI code is live.`
        );
      }

      onNotify({
        type: "page_published",
        title: "Page published",
        message:
          details.paymentEnabled && details.paymentAmountInr
            ? `"${editorTitle}" is live · Form Pay ₹${details.paymentAmountInr} enabled.`
            : `"${editorTitle}" is now live.`,
        targetScreen: ScreenId.BIO_PAGES,
        meta: { pageId }
      });
      setShowPublishSuccess(true);
    } catch (err) {
      console.error("Failed to publish page:", err);
      triggerToast("Could not publish. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  const getAnalyticsData = () => {
    const days = analyticsTab === "7 Days" ? 7 : analyticsTab === "30 Days" ? 30 : null;
    const rangeStart = days ? Date.now() - days * 24 * 60 * 60 * 1000 : null;
    const pageEvents = analyticsEvents.filter((event) => {
      if (event.pageId !== selectedAnalyticsPage?.id) return false;
      if (!rangeStart) return true;
      const timestamp = new Date(event.timestamp || "").getTime();
      return Number.isFinite(timestamp) && timestamp >= rangeStart;
    });
    const pageBlocks = selectedAnalyticsPage ? resolvePageBlocks(selectedAnalyticsPage) : [];
    const clicks = pageEvents.filter((event) => event.eventType === "click");
    const widgets = pageBlocks
      .filter((block) => block.type !== "Header" && block.type !== "Text")
      .map((block) => {
        const count = clicks.filter((event) => event.eventLabel?.includes(block.label)).length;
      return {
          name: block.label,
          type: block.type.toUpperCase().replace(/\s+/g, "_"),
          count,
          percentage: clicks.length ? Math.round((count / clicks.length) * 100) : 0
        };
      });

      return {
      views: pageEvents.filter((event) => event.eventType === "visit").length,
      clicks: clicks.length,
      widgets
    };
  };

  const currentAnalytics = getAnalyticsData();

  return (
    <PageShell>
      <PageHeader
        title="BioLink Pages"
        subtitle={`Create link pages to share on Instagram, WhatsApp & business cards · ${historyPages.length} page${historyPages.length !== 1 ? "s" : ""}`}
        actions={
          <>
          <button
            onClick={handleRefresh}
              className="key-btn-secondary px-4 py-2.5"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
              onClick={() => openCreatePageModal()}
              className="key-btn-accent px-5 py-2.5"
          >
            <Plus className="h-4 w-4" />
            <span>New Page</span>
          </button>
          </>
        }
      />

      {/* Creation Modal/Dialog — portaled so backdrop covers navbar (PageShell z-index trap) */}
      {isAdding &&
        createPortal(
        <div className="key-modal-backdrop key-workflow-modal-backdrop">
          <div className="key-modal-panel key-workflow-modal animate-in fade-in zoom-in-95 duration-200">
            <div className="key-workflow-modal__accent" aria-hidden />
            <header className="key-workflow-modal__header">
              <div className="key-workflow-modal__brand">
                <div className="key-workflow-modal__icon">
                  <Smartphone />
        </div>
                <div className="key-workflow-modal__titles">
                  <h3 className="key-workflow-modal__title">Create Your Link Page</h3>
                  <p className="key-workflow-modal__subtitle">
                    One page for all your social links, contact info, and business details.
                  </p>
      </div>
              </div>
              <button
                type="button"
                onClick={closeCreatePageModal}
                className="key-workflow-modal__close"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <form onSubmit={handleCreate} className="key-workflow-modal__form">
              <div className="key-workflow-modal__field">
                <label className="key-workflow-modal__label" htmlFor="create-page-title">
                  What should we call this page?
                </label>
                <input
                  id="create-page-title"
                  type="text"
                  required
                  placeholder="e.g. My Business Links"
                  value={newTitle}
                  onChange={(e) => {
                    const title = e.target.value;
                    setNewTitle(title);
                    
                    const clean = title
                      .toLowerCase()
                      .replace(/[^a-z0-9\s-]/g, "")
                      .trim()
                      .replace(/\s+/g, "-");
                    setNewSlug(clean);
                  }}
                  className="key-workflow-modal__input"
                />
                <p className="key-workflow-modal__hint">
                  Visitors will see this name. Use your name, shop name, or brand.
                </p>
              </div>

              <div className="key-workflow-modal__field">
                <label className="key-workflow-modal__label" htmlFor="create-page-slug">
                  Your page link ending
                </label>
                <input
                  id="create-page-slug"
                  type="text"
                  required
                  placeholder={
                    newTitle
                      ? newTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")
                      : "e.g. my-business"
                  }
                  value={newSlug}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val.includes("key.link/page-")) {
                      val = val.replace("key.link/page-", "");
                    }
                    if (val.includes("1smart.link/page-")) {
                      val = val.replace("1smart.link/page-", "");
                    }
                    setNewSlug(val);
                  }}
                  className="key-workflow-modal__input"
                />
                <p className="key-workflow-modal__hint">
                  Your page opens at{" "}
                  <span className="key-workflow-modal__mono">
                    {PRIMARY_DOMAIN}/{newSlug.trim() || "my-business"}
                  </span>
                  . Use only letters, numbers, and hyphens.
                </p>
              </div>

              {savedTemplates.length > 0 && (
                <div className="key-workflow-modal__field">
                  <label className="key-workflow-modal__label" htmlFor="create-page-template">
                    Start from saved template
                </label>
                  <select
                    id="create-page-template"
                    value={selectedTemplateId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedTemplateId(id);
                      if (id === "generic") {
                      setNextInitialBlocks(genericInitialBlocks);
                        return;
                      }
                      const tpl = savedTemplates.find((item) => item.id === id);
                      if (!tpl) return;
                      setNextInitialBlocks(tpl.data.blocks);
                      setNewTitle(`${getTemplateDisplayName(tpl)} Copy`);
                      setNewSlug(
                        `${getTemplateDisplayName(tpl)} Copy`
                          .toLowerCase()
                          .replace(/[^a-z0-9\s-]/g, "")
                          .replace(/\s+/g, "-")
                      );
                      triggerToast(`✨ Applied "${getTemplateDisplayName(tpl)}"!`);
                    }}
                    className="key-workflow-modal__input"
                  >
                    <option value="generic">Blank page</option>
                    {savedTemplates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {getTemplateDisplayName(tpl)}
                      </option>
                    ))}
                  </select>
                  <p className="key-workflow-modal__hint">
                    Pick a design you saved from the bio page editor, or start blank.
                  </p>
                </div>
              )}

              <div className="key-workflow-modal__actions">
                        <button
                  type="submit"
                  disabled={isCreating}
                  className="key-workflow-modal__submit key-btn-accent disabled:cursor-not-allowed"
                >
                  {isCreating ? "Creating…" : "Create My Page"}
                        </button>
              </div>

              <footer className="key-workflow-modal__meta">
                <div className="key-workflow-modal__meta-row">
                  <span className="key-workflow-modal__meta-label">Page ID</span>
                <button
                  type="button"
                    onClick={() => copyText(newPageId, "Page ID copied.")}
                    className="key-workflow-modal__meta-copy"
                    title="Copy page ID"
                    aria-label="Copy page ID"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                </button>
              </div>
                <code className="key-workflow-modal__meta-id">{newPageId}</code>
                <p className="key-workflow-modal__hint">
                  Auto-generated — use in search if pages share the same name.
                </p>
              </footer>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Pages Container list */}
      <Workspace className="key-section-card">
        {historyPages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <div className="h-14 w-14 bg-indigo-500/10 text-[#6366f1] rounded-2xl flex items-center justify-center mb-6">
              <Smartphone className="h-6 w-6" />
            </div>
            <h4 className="font-display font-bold text-gray-900">No link pages yet</h4>
            <p className="text-gray-500 text-sm max-w-xs mt-1">
              Click <strong>New Page</strong> to create your first shareable link page for Instagram, WhatsApp, and your business.
            </p>
            <button
              onClick={openCreatePageModal}
              className="mt-4 key-btn-accent px-4 py-2"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {customDomainPages.length > 0 && (
              <div className="key-bio-pages-section-accordion key-bio-pages-section-accordion--custom">
                <div className="key-bio-pages-section-accordion__header">
                  <div className="key-bio-pages-section-head min-w-0">
                    <p className="key-bio-pages-section-label">Your own domain links</p>
                    <p className="key-bio-pages-section-subtitle">Your custom branded website URL</p>
                  </div>
                  <div className="key-bio-pages-section-accordion__meta key-bio-pages-section-accordion__meta--custom shrink-0">
                    <span className="key-bio-pages-section-count key-bio-pages-section-count--custom">
                      {customDomainPages.length}
                    </span>
                    <button
                      type="button"
                      className="key-bio-pages-section-accordion__chevron key-bio-pages-section-accordion__chevron--custom"
                      onClick={() => setCustomDomainSectionExpanded((open) => !open)}
                      aria-expanded={customDomainSectionExpanded}
                      aria-controls="key-custom-domain-pages-panel"
                      aria-label={customDomainSectionExpanded ? "Collapse custom domain links" : "Expand custom domain links"}
                    >
                      {customDomainSectionExpanded ? (
                        <ChevronUp className="h-4 w-4" aria-hidden />
                      ) : (
                        <ChevronDown className="h-4 w-4" aria-hidden />
                      )}
                        </button>
                      </div>
                </div>
                {customDomainSectionExpanded && (
                  <div
                    id="key-custom-domain-pages-panel"
                    className="key-bio-pages-section-accordion__body space-y-3"
                  >
                    {customDomainPages.map((page) => renderBioPageListRow(page))}
                  </div>
                )}
                </div>
            )}
            {platformPages.length > 0 && (
              <div className="key-bio-pages-section-accordion key-bio-pages-section-accordion--platform">
                <div className="key-bio-pages-section-accordion__header">
                  <div className="key-bio-pages-section-head min-w-0">
                    <p className="key-bio-pages-section-label">Free platform links</p>
                    <p className="key-bio-pages-section-subtitle">Hosted on KEYLINK360</p>
                  </div>
                  <div className="key-bio-pages-section-accordion__meta key-bio-pages-section-accordion__meta--platform shrink-0">
                    <span className="key-bio-pages-section-count key-bio-pages-section-count--platform">
                      {platformPages.length}
                  </span>
                    <button
                      type="button"
                      className="key-bio-pages-section-accordion__chevron key-bio-pages-section-accordion__chevron--platform"
                      onClick={() => setPlatformSectionExpanded((open) => !open)}
                      aria-expanded={platformSectionExpanded}
                      aria-controls="key-platform-pages-panel"
                      aria-label={platformSectionExpanded ? "Collapse free platform links" : "Expand free platform links"}
                    >
                      {platformSectionExpanded ? (
                        <ChevronUp className="h-4 w-4" aria-hidden />
                      ) : (
                        <ChevronDown className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                  </div>
                </div>
                {platformSectionExpanded && (
                  <div id="key-platform-pages-panel" className="key-bio-pages-section-accordion__body space-y-3">
                    <div className="key-platform-bulk-toolbar">
                      <div className="key-platform-bulk-toolbar__filters">
                        <div className="key-platform-bulk-toolbar__search key-icon-field">
                          <span className="key-icon-field__icon">
                            <Search className="h-4 w-4" />
                    </span>
                          <input
                            type="search"
                            value={platformSearchQuery}
                            onChange={(event) => setPlatformSearchQuery(event.target.value)}
                            placeholder="Search page name, slug, page ID, or Live/Draft…"
                            className="key-input key-icon-field__input w-full py-2.5"
                            aria-label="Search free platform links"
                          />
                  </div>
                        <select
                          value={platformStatusFilter}
                          onChange={(event) =>
                            setPlatformStatusFilter(event.target.value as "All" | BioPage["status"])
                          }
                          className="key-platform-bulk-status-filter"
                          aria-label="Filter by page status"
                        >
                          <option value="All">All statuses</option>
                          <option value="Live">Live</option>
                          <option value="Paused">Paused</option>
                          <option value="Draft">Draft</option>
                        </select>
                        {hasPlatformActiveFilters && (
                    <button
                            type="button"
                            onClick={clearPlatformFilters}
                            className="key-platform-bulk-clear"
                          >
                            Clear
                    </button>
                        )}
                        <div className="key-platform-bulk-menu-wrap" ref={platformBulkMenuRef}>
                    <button
                            type="button"
                            onClick={() => setPlatformBulkMenuOpen((open) => !open)}
                            className="key-platform-bulk-menu-trigger"
                            aria-label="Bulk link actions"
                            aria-expanded={platformBulkMenuOpen}
                            aria-haspopup="menu"
                          >
                            <MoreVertical className="h-4 w-4" />
                    </button>

                          {platformBulkMenuOpen && (
                            <div className="key-platform-bulk-menu" role="menu">
                    <button
                                type="button"
                                role="menuitem"
                                className="key-platform-bulk-menu__item"
                                onClick={handlePlatformMenuSelectAll}
                              >
                                Select all
                    </button>
                    <button
                                type="button"
                                role="menuitem"
                                className="key-platform-bulk-menu__item"
                                disabled={platformDuplicateIds.size === 0}
                      onClick={() => {
                                  selectVisiblePlatformPages((page) => platformDuplicateIds.has(page.id));
                                  setPlatformBulkMenuOpen(false);
                                }}
                              >
                                Select duplicates
                    </button>
                              <button
                                type="button"
                                role="menuitem"
                                className="key-platform-bulk-menu__item"
                                disabled={platformZeroViewIds.size === 0}
                                onClick={() => {
                                  selectVisiblePlatformPages((page) => platformZeroViewIds.has(page.id));
                                  setPlatformBulkMenuOpen(false);
                                }}
                              >
                                Select unused
                              </button>
                    <button
                                type="button"
                                role="menuitem"
                                className="key-platform-bulk-menu__item"
                      onClick={() => {
                                  setPlatformDuplicatesOnly((value) => !value);
                                  setPlatformBulkMenuOpen(false);
                      }}
                    >
                                {platformDuplicatesOnly ? "Show all links" : "Duplicates only"}
                    </button>
                    <button
                                type="button"
                                role="menuitem"
                                className="key-platform-bulk-menu__item"
                                disabled={!platformSelectionMode || selectedPlatformCount === 0}
                                onClick={handlePlatformMenuClearSelection}
                              >
                                Clear selection
                    </button>
                              <button
                                type="button"
                                role="menuitem"
                                className="key-platform-bulk-menu__item key-platform-bulk-menu__item--danger"
                                onClick={handlePlatformMenuDeleteSelected}
                              >
                                Delete selected
                                {selectedPlatformCount > 0 ? ` (${selectedPlatformCount})` : ""}
                              </button>
                              {platformSelectionMode && (
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="key-platform-bulk-menu__item"
                                  onClick={exitPlatformSelectionMode}
                                >
                                  Done selecting
                                </button>
                              )}
                  </div>
                          )}
                </div>
              </div>

                      <p className="key-platform-bulk-toolbar__meta">
                        Showing {filteredPlatformPages.length} of {platformPages.length} platform links
                        {platformDuplicateIds.size > 0 && (
                          <> · {platformDuplicateIds.size} duplicate cop{platformDuplicateIds.size === 1 ? "y" : "ies"} detected</>
                        )}
                        {platformSelectionMode && (
                          <> · Selection mode · {selectedPlatformCount} selected</>
                        )}
                      </p>
          </div>

                    {filteredPlatformPages.length === 0 ? (
                      <div className="key-platform-bulk-empty">
                        <p className="text-sm font-semibold text-slate-700">No links match your search</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Try another title, slug, or turn off &quot;Duplicates only&quot;.
                        </p>
                        {(platformSearchQuery || platformDuplicatesOnly || platformStatusFilter !== "All") && (
                          <button
                            type="button"
                            onClick={clearPlatformFilters}
                            className="mt-3 key-platform-bulk-action"
                          >
                            Reset filters
                          </button>
        )}
      </div>
                    ) : (
                      filteredPlatformPages.map((page) =>
                        renderBioPageListRow(
                          page,
                          platformSelectionMode
                            ? {
                                selection: {
                                  checked: selectedPlatformIds.has(page.id),
                                  onToggle: togglePlatformSelection
                                },
                                showDuplicateBadge: platformDuplicateIds.has(page.id)
                              }
                            : undefined
                        )
                      )
                    )}
          </div>
        )}
      </div>
            )}
          </div>
        )}
      </Workspace>

      {/* Analytics Modal */}
      {selectedAnalyticsPage && (
        <div className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-gray-900 text-lg">
                Analytics — {selectedAnalyticsPage.title}
              </h3>
              <button
                onClick={() => setSelectedAnalyticsPage(null)}
                className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Interval Selection Tabs */}
            <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl mb-6 border border-gray-100 max-w-xs">
              {(["7 Days", "30 Days", "All Time"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAnalyticsTab(tab)}
                  className={`flex-1 text-center py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    analyticsTab === tab
                      ? "bg-[#6366f1] text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-900 hover:bg-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center shadow-inner">
                <span className="font-display font-extrabold text-3xl text-gray-900 tracking-tight block">
                  {currentAnalytics.views}
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-1">
                  PAGE VIEWS
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center shadow-inner">
                <span className="font-display font-extrabold text-3xl text-gray-900 tracking-tight block">
                  {currentAnalytics.clicks}
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-1">
                  WIDGET CLICKS
                </span>
              </div>
            </div>

            {/* Widget Performance list */}
            <div>
              <h4 className="font-display font-bold text-gray-900 text-sm mb-3 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#6366f1]" />
                Widget Performance
              </h4>

              <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                {currentAnalytics.widgets.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                    Add an interactive block to track its engagement here.
                  </p>
                )}
                {currentAnalytics.widgets.map((widget, idx) => {
                  // Find a fitting icon
                  let IconComponent = Link;
                  if (widget.type === "WHATSAPP") IconComponent = MessageSquare;
                  else if (widget.type === "VCARD") IconComponent = User;
                  else if (widget.type === "SHOP") IconComponent = ShoppingBag;
                  else if (widget.type === "LINK_SPIN") IconComponent = RefreshCw;
                  else if (widget.type === "SMART_FORM_PDF") IconComponent = FileText;

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-start gap-2.5">
                          <div className="p-1 rounded-lg bg-slate-100 text-slate-500 shrink-0 mt-0.5">
                            <IconComponent className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="font-semibold text-gray-800 block leading-tight">
                              {widget.name}
                            </span>
                            <span className="text-[9px] text-gray-400 font-bold tracking-widest uppercase">
                              {widget.type}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-gray-900 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                          {widget.count}
                        </span>
                      </div>

                      {/* Performance Bar */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#6366f1] to-[#7c3aed] h-full rounded-full transition-all duration-500"
                          style={{ width: `${widget.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2nd - High-fidelity full-page Editor Modal exactly matching the builder screen with sidebar and live interactive preview in pristine Light Mode */}
      {selectedEditPage &&
        createPortal(
        <div className={`key-bio-editor-portal key-theme-${theme}`}>
          <div className="key-bg-clouds" aria-hidden>
            <span className="key-bg-cloud key-bg-cloud--1" />
            <span className="key-bg-cloud key-bg-cloud--2" />
            <span className="key-bg-cloud key-bg-cloud--3" />
            <span className="key-bg-cloud key-bg-cloud--4" />
            <span className="key-bg-cloud key-bg-cloud--5" />
          </div>
        <div className="key-bio-editor-shell flex flex-col h-full min-h-0 animate-in fade-in duration-200">
          {/* Editor Header — same fixed height as main app navbar */}
          <header className="key-app-navbar key-glass-header key-editor-header shrink-0">
            <div className="key-editor-header__left">
              <button
                type="button"
                onClick={closeEditor}
                className="key-editor-back-btn shrink-0"
                aria-label="Go back"
                title="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <span className="key-editor-header__divider" aria-hidden />
              <div className="key-editor-header__brand min-w-0">
                <span className="key-editor-header__domain shrink-0">keylink360</span>
                <span className="key-editor-header__slash shrink-0">/</span>
                  <input
                  ref={editorTitleInputRef}
                    type="text"
                    value={editorTitle}
                    onChange={(e) => setEditorTitle(e.target.value)}
                  className="key-editor-header__title-input min-w-0"
                  aria-label="Page title"
                />
                <button
                  type="button"
                  onClick={() => {
                    editorTitleInputRef.current?.focus();
                    editorTitleInputRef.current?.select();
                  }}
                  className="key-editor-header__edit-btn shrink-0"
                  aria-label="Edit page title"
                  title="Edit page title"
                >
                  <Edit3 className="h-3.5 w-3.5 key-editor-header__edit-icon" aria-hidden />
                </button>
              </div>
            </div>

            <div className="key-editor-header__center">
              <div className="key-editor-tab-switch" role="tablist" aria-label="Editor mode">
              <button
                  type="button"
                  role="tab"
                  aria-selected={editorTab === "Edit"}
                onClick={() => {
                  setEditorTab("Edit");
                  setShowThanksPage(false);
                  setExpandedBlockId(null);
                }}
                  className={editorTab === "Edit" ? "is-active" : ""}
              >
                Edit
              </button>
              <button
                  type="button"
                  role="tab"
                  aria-selected={editorTab === "Thank You"}
                onClick={() => {
                  setEditorTab("Thank You");
                  setExpandedBlockId(null);
                }}
                  className={editorTab === "Thank You" ? "is-active" : ""}
              >
                Thank You
              </button>
              <button
                  type="button"
                  role="tab"
                  aria-selected={editorTab === "Settings"}
                onClick={() => {
                  setEditorTab("Settings");
                  setShowThanksPage(false);
                }}
                  className={editorTab === "Settings" ? "is-active" : ""}
              >
                Settings
              </button>
              </div>
            </div>

            <div className="key-editor-header__right">
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                className="key-editor-nav-btn key-editor-nav-btn--template"
              >
                Save as Template
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                className="key-editor-nav-btn key-editor-nav-btn--draft"
              >
                {isSavingDraft ? (
                  <Loader className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span>{isSavingDraft ? "Saving…" : "Save Draft"}</span>
              </button>
              <button
                type="button"
                onClick={handlePublishEditor}
                disabled={isPublishing}
                aria-busy={isPublishing}
                className="key-editor-nav-btn key-editor-nav-btn--primary"
              >
                {isPublishing ? (
                  <Loader className="h-3.5 w-3.5 animate-spin" />
                ) : (
                <Save className="h-3.5 w-3.5" />
                )}
                <span>{isPublishing ? "Publishing…" : "Publish"}</span>
              </button>
            </div>
          </header>

          {(editorTab === "Edit" || editorTab === "Thank You") && !showPublishSuccess && (
            <div className="lg:hidden key-editor-subnav px-2 sm:px-3 py-2 shrink-0">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
                {(
                  [
                    { id: "blocks" as const, label: "Blocks", icon: LayoutGrid },
                    { id: "edit" as const, label: "Edit", icon: Edit3 },
                    { id: "preview" as const, label: "Preview", icon: Eye }
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setEditorViewPanel(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                      editorViewPanel === id
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Editor Body */}
          <div className="key-editor-body flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">
            {/* Main: Block library + Page editor */}
            <div
              className={`key-editor-body__main flex-1 overflow-hidden min-h-0 min-w-0 flex flex-col ${
                editorViewPanel === "preview" ? "hidden lg:block" : "block"
              }`}
            >
              {showPublishSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center text-emerald-800 animate-in fade-in zoom-in-95 duration-300">
                  <Check className="h-10 w-10 mx-auto mb-2 bg-emerald-500 text-white p-2 rounded-full shadow-lg" />
                  <h4 className="font-bold text-base">BioLink Page Published Successfully!</h4>
                  <p className="text-xs text-emerald-600 mt-1">
                    Changes are live at:{" "}
                    {selectedEditPageLink && (
                    <a
                        href={selectedEditPageLink.openUrl}
                      target="_blank"
                      rel="noreferrer"
                        className={`underline font-bold ml-1 ${
                          selectedEditPageLink.kind === "custom"
                            ? "text-emerald-700 hover:text-emerald-800"
                            : "text-[#6366f1] hover:text-[#7c3aed]"
                        }`}
                      >
                        {selectedEditPageLink.displayLabel}
                      </a>
                    )}
                  </p>
                  {import.meta.env.DEV && selectedEditPageLink?.kind === "custom" ? (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3 text-left">
                      Localhost publish synced to cloud. If the custom domain still shows an old
                      theme/blocks, the live server needs the latest deploy — then hard-refresh the
                      public page (Ctrl+Shift+R).
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-col items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        if (!selectedEditPageLink) return;
                        void copyText(selectedEditPageLink.shareUrl, "🔗 Public shareable link copied!");
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition-colors shadow-sm"
                    >
                      Copy Public Share Link (for WhatsApp)
                    </button>
                    <button
                      type="button"
                      onClick={exitEditor}
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : editorTab === "Settings" ? (
                <div className="max-w-xl mx-auto key-workspace key-workspace--stack w-full">
                  <h3 className="font-display font-bold text-xl text-slate-900">Page Settings</h3>
                  <div className="key-editor-panel key-workspace-panel key-workspace-panel--stack shadow-sm">
                    <div>
                      <label className="block text-xs text-slate-500 font-semibold mb-2">Meta Title</label>
                      <input
                        type="text"
                        value={editorTitle}
                        onChange={(e) => setEditorTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-sm text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 font-semibold mb-2">Meta Description</label>
                      <textarea
                        defaultValue="Official Marvel-Inspired Toys & Collectibles. Safe, fun & exciting toys for young superheroes."
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-sm text-slate-900 h-24"
                      />
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-slate-100">
                      <div>
                        <span className="text-xs font-bold block text-slate-800">Search Engine Indexing</span>
                        <span className="text-[10px] text-slate-500 block">Allow search engines to find this page</span>
                      </div>
                      <input type="checkbox" defaultChecked className="rounded border-slate-200 bg-slate-50 accent-[#6366f1] h-4.5 w-4.5" />
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-3.5">
                      <span className="text-[10px] font-bold text-[#ec4899] uppercase tracking-widest block">
                        Form payment (Razorpay)
                      </span>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        When enabled, public Form / Smart Form submit opens Razorpay Checkout for this fixed page amount. Success / failed / cancelled states stay on the same form (no separate thank-you URL). Contact is saved only after the server verifies payment.
                      </p>
                      <div className="flex items-center justify-between py-1">
                        <div>
                          <span className="text-xs font-bold block text-slate-800">Require payment on submit</span>
                          <span className="text-[10px] text-slate-500 block">Fixed amount for this whole page</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={paymentEnabled}
                          onChange={(e) => setPaymentEnabled(e.target.checked)}
                          className="rounded border-slate-200 bg-slate-50 accent-[#ec4899] h-4.5 w-4.5"
                        />
                      </div>
                      {paymentEnabled ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-slate-500 font-semibold mb-2">
                              Amount (INR)
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                min={1}
                                step={1}
                                value={paymentAmountInr}
                                onChange={(e) => {
                                  const n = Number(e.target.value);
                                  setPaymentAmountInr(
                                    Number.isFinite(n) && n > 0 ? Math.round(n) : 1
                                  );
                                }}
                                className="w-full bg-slate-50 border border-slate-200 focus:border-[#ec4899] focus:outline-none rounded-xl py-2 px-3 text-sm text-slate-900"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 font-semibold mb-2">
                              Checkout description
                            </label>
                            <input
                              type="text"
                              value={paymentDescription}
                              onChange={(e) => setPaymentDescription(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-[#ec4899] focus:outline-none rounded-xl py-2 px-3 text-sm text-slate-900"
                              placeholder="Bio page form payment"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditorTab("Edit");
                              setEditorViewPanel("preview");
                              triggerToast(
                                `Payment ON — Form / Smart Form now show Pay ₹${paymentAmountInr} in Live Preview`
                              );
                            }}
                            className="w-full rounded-xl bg-[#ec4899] hover:bg-[#db2777] text-white text-xs font-bold py-2.5"
                          >
                            View Form with Pay ₹{paymentAmountInr} in Live Preview
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {/* Drafts & Recovery List */}
                    <div className="pt-4 border-t border-slate-100 space-y-3.5">
                      <span className="text-[10px] font-bold text-[#6366f1] uppercase tracking-widest block">
                        Drafts & Recovery
                      </span>
                      {savedDrafts.filter((draft) => draft.pageId === selectedEditPage.id).length === 0 ? (
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">No saved drafts for this session yet. Click "Save Draft" in the top bar to create one.</p>
                      ) : (
                        <div className="space-y-2">
                          {savedDrafts.filter((draft) => draft.pageId === selectedEditPage.id).map((draft) => (
                            <div key={draft.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-all">
                              <div className="min-w-0">
                                <span className="text-xs font-bold block text-slate-800 truncate">{getDraftDisplayName(draft)}</span>
                                <span className="text-[9px] text-slate-400 block font-mono">{getDraftBlockCount(draft)} block{getDraftBlockCount(draft) !== 1 ? "s" : ""} saved</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  hydrateEditorFromState(draft.data);
                                  triggerToast(`✨ Restored editor blocks to draft "${getDraftDisplayName(draft)}"!`);
                                }}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm"
                              >
                                Restore
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="key-editor-body__grid">
                  {/* Block Library */}
                  <div
                    className={`key-editor-zone key-editor-zone--blocks ${
                      editorViewPanel === "blocks" ? "block" : "hidden"
                    } lg:block`}
                    >
                    <div className="key-editor-zone__head">
                      <LayoutGrid className="h-3.5 w-3.5" />
                      {editingThankYouPage ? "Thank You Block Library" : "Block Library"}
                    </div>
                    <div className="key-editor-zone__body key-workspace--stack no-scrollbar">
                    <div className="key-editor-blocks-palette">
                      <span className="key-editor-section-label mb-3">
                        Core Blocks
                      </span>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Button")}
                          onClick={() => handleAddBlock("Button")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            🔗
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Button</span>
                            <span className="text-[9px] text-slate-400 block">Interactive links</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Text")}
                          onClick={() => handleAddBlock("Text")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            📝
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Text</span>
                            <span className="text-[9px] text-slate-400 block">Formatted content</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Header")}
                          onClick={() => handleAddBlock("Header")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            H1
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Header</span>
                            <span className="text-[9px] text-slate-400 block">Bold title headers</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Socials")}
                          onClick={() => handleAddBlock("Socials")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            🌐
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Socials</span>
                            <span className="text-[9px] text-slate-400 block">Social media links</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="key-editor-blocks-palette">
                      <span className="key-editor-section-label mb-3">
                        Growth & Sales
                      </span>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Shop")}
                          onClick={() => handleAddBlock("Shop")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            🛒
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Shop</span>
                            <span className="text-[9px] text-slate-400 block">Sell physical items</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Coupon")}
                          onClick={() => handleAddBlock("Coupon")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            🎟️
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Coupon</span>
                            <span className="text-[9px] text-slate-400 block">Offer promo codes</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Countdown")}
                          onClick={() => handleAddBlock("Countdown")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            ⏱️
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Countdown</span>
                            <span className="text-[9px] text-slate-400 block">Urgency timers</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Deep Link")}
                          onClick={() => handleAddBlock("Deep Link")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            ⚡
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Deep Link</span>
                            <span className="text-[9px] text-slate-400 block">App redirections</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Link Spin")}
                          onClick={() => handleAddBlock("Link Spin")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            🎡
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Link Spin</span>
                            <span className="text-[9px] text-slate-400 block">Lucky spinner wheel</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "WhatsApp")}
                          onClick={() => handleAddBlock("WhatsApp")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            💬
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">WhatsApp</span>
                            <span className="text-[9px] text-slate-400 block">Direct chat campaign</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Smart Form")}
                          onClick={() => handleAddBlock("Smart Form")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-[#EEF2FF] text-blue-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            📋
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Smart Form</span>
                            <span className="text-[9px] text-slate-400 block">Gather lead info</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Form")}
                          onClick={() => handleAddBlock("Form")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            📝
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Form</span>
                            <span className="text-[9px] text-slate-400 block">Custom dynamic fields</span>
                      </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "FAQ")}
                          onClick={() => handleAddBlock("FAQ")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            ❓
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">FAQ</span>
                            <span className="text-[9px] text-slate-400 block">Q&A accordion</span>
                    </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Testimonials")}
                          onClick={() => handleAddBlock("Testimonials")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            💬
                          </span>
                    <div>
                            <span className="text-xs font-bold block text-slate-800">Testimonials</span>
                            <span className="text-[9px] text-slate-400 block">Customer quotes</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Tip Jar")}
                          onClick={() => handleAddBlock("Tip Jar")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            ☕
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Tip Jar</span>
                            <span className="text-[9px] text-slate-400 block">Support / donate links</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="key-editor-blocks-palette">
                      <span className="key-editor-section-label mb-3">
                        Engage & Convert
                      </span>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Call")}
                          onClick={() => handleAddBlock("Call")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            📞
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Call</span>
                            <span className="text-[9px] text-slate-400 block">Tap-to-call button</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Email")}
                          onClick={() => handleAddBlock("Email")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            ✉️
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Email</span>
                            <span className="text-[9px] text-slate-400 block">Mailto contact button</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Banner")}
                          onClick={() => handleAddBlock("Banner")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            📢
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Banner</span>
                            <span className="text-[9px] text-slate-400 block">Announcements & offers</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Stats")}
                          onClick={() => handleAddBlock("Stats")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            📊
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Stats</span>
                            <span className="text-[9px] text-slate-400 block">Social proof numbers</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Pricing")}
                          onClick={() => handleAddBlock("Pricing")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            💰
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Pricing</span>
                            <span className="text-[9px] text-slate-400 block">Dynamic plan cards</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="key-editor-blocks-palette">
                      <span className="key-editor-section-label mb-3">
                        Media
                      </span>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Video")}
                          onClick={() => handleAddBlock("Video")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            🎥
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Video</span>
                            <span className="text-[9px] text-slate-400 block">Play video streams</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Music")}
                          onClick={() => handleAddBlock("Music")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            🎵
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Music</span>
                            <span className="text-[9px] text-slate-400 block">Audio tracks/music</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Gallery")}
                          onClick={() => handleAddBlock("Gallery")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            🖼️
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Gallery</span>
                            <span className="text-[9px] text-slate-400 block">Image gallery</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "PDF")}
                          onClick={() => handleAddBlock("PDF")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            📄
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">PDF</span>
                            <span className="text-[9px] text-slate-400 block">Download documents</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Image")}
                          onClick={() => handleAddBlock("Image")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            🖼️
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Image</span>
                            <span className="text-[9px] text-slate-400 block">Single image + link</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="key-editor-blocks-palette">
                      <span className="key-editor-section-label mb-3">
                        Other
                      </span>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "vCard")}
                          onClick={() => handleAddBlock("vCard")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            🪪
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">vCard</span>
                            <span className="text-[9px] text-slate-400 block">Save contact details</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Events")}
                          onClick={() => handleAddBlock("Events")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            📅
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Events</span>
                            <span className="text-[9px] text-slate-400 block">Meetups & RSVP events</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Map")}
                          onClick={() => handleAddBlock("Map")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            📍
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Map</span>
                            <span className="text-[9px] text-slate-400 block">Location & directions</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Divider")}
                          onClick={() => handleAddBlock("Divider")}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-2xl text-left transition-all group relative shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                          title="Drag this block to the Manager or Live Preview, or click to add"
                        >
                          <span className="h-8 w-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                            —
                          </span>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">Divider</span>
                            <span className="text-[9px] text-slate-400 block">Spacing & separators</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Saved Templates & Session Drafts in Editor Sidebar */}
                    {(savedTemplates.length > 0 || savedDrafts.length > 0) && (
                      <div className="pt-4 border-t border-slate-200/80 space-y-6">
                        <span className="text-[10px] font-extrabold text-[#6366f1] uppercase tracking-widest block">
                          SAVED TEMPLATES & DRAFTS
                        </span>
                        
                        {savedTemplates.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Templates</span>
                            <div className="grid grid-cols-1 gap-2">
                              {savedTemplates.map((tpl) => (
                                <div key={tpl.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-all">
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-slate-800 block truncate">💎 {getTemplateDisplayName(tpl)}</span>
                                    <span className="text-[9px] text-slate-400 font-medium block">{getTemplateBlockCount(tpl)} blocks</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      hydrateEditorFromState(tpl.data);
                                      setLinkedTemplateId(tpl.id);
                                      triggerToast(`✨ Applied Template "${getTemplateDisplayName(tpl)}" to editor!`);
                                    }}
                                    className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-[#6366f1] text-[9px] font-bold rounded-lg transition-colors border border-indigo-500/20"
                                  >
                                    Apply
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {savedDrafts.some((draft) => draft.pageId === selectedEditPage.id) && (
                          <div className="space-y-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Session Drafts</span>
                            <div className="grid grid-cols-1 gap-2">
                              {savedDrafts.filter((draft) => draft.pageId === selectedEditPage.id).map((draft) => (
                                <div key={draft.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-all">
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-slate-800 block truncate">📝 {getDraftDisplayName(draft)}</span>
                                    <span className="text-[9px] text-slate-400 font-medium block">{getDraftBlockCount(draft)} blocks</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      hydrateEditorFromState(draft.data);
                                      triggerToast(`✨ Restored Draft for "${getDraftDisplayName(draft)}"!`);
                                    }}
                                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-bold rounded-lg transition-colors"
                                  >
                                    Restore
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                  </div>

                  {/* Page Editor: Cover + Accordions */}
                  <div
                    className={`key-editor-zone key-editor-zone--compose ${
                      editorViewPanel === "edit" ? "block" : "hidden"
                    } lg:block`}
                    >
                    <div className="key-editor-zone__head key-editor-zone__head--with-actions">
                      <div className="key-editor-zone__head-main">
                        <Edit3 className="h-3.5 w-3.5" />
                        {editingThankYouPage ? "Thank You Editor" : "Page Editor"}
                      </div>
                      {!editingThankYouPage ? (
                      <button
                        type="button"
                        className="key-editor-blocks-lock-btn"
                        aria-pressed={coverSectionLocked}
                        aria-label={
                          coverSectionLocked
                            ? "Unlock Cover Image & Header"
                            : "Lock Cover Image & Header"
                        }
                        title={
                          coverSectionLocked
                            ? "Unlock to show Cover Image & Header"
                            : "Lock to hide Cover Image & Header and focus on Page Blocks"
                        }
                        onClick={() => {
                          setCoverSectionLocked((locked) => !locked);
                        }}
                      >
                        {coverSectionLocked ? (
                          <Unlock className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <Lock className="h-3.5 w-3.5" aria-hidden />
                        )}
                        <span>{coverSectionLocked ? "Show header" : "Hide header"}</span>
                      </button>
                      ) : (
                        <span className="text-[10px] font-bold text-[#ec4899] uppercase tracking-wider">
                          After form submit
                        </span>
                      )}
                    </div>
                    <div
                      ref={composeScrollRef}
                      className={`key-editor-zone__body key-editor-compose-scroll no-scrollbar ${
                        coverSectionLocked ? "key-editor-compose-scroll--blocks-focus" : ""
                      }`}
                    >
                    <div
                      className={`key-editor-compose-stack ${
                        coverSectionLocked ? "key-editor-compose-stack--blocks-focus" : ""
                      }`}
                    >
                    {/* COVER IMAGE & BIO CARD — hidden when locked; Thank You uses hero meta instead */}
                    {editingThankYouPage ? (
                    <div className="key-editor-panel key-editor-cover-panel p-5 shadow-sm space-y-4 border border-pink-100">
                      <div>
                        <span className="key-editor-section-label text-[#ec4899]">Thank You page</span>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Shown as a 2nd full page after Form / Smart Form submit. Use the Block Library — same blocks as Edit.
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="key-editor-form-label">Nav title</label>
                          <input
                            type="text"
                            value={thankYouTitle}
                            onChange={(e) => setThankYouTitle(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-[#ec4899] focus:outline-none rounded-xl py-2.5 px-3.5 text-sm font-bold text-slate-800"
                            placeholder="Thank You"
                          />
                        </div>
                        <div>
                          <label className="key-editor-form-label">Hero emoji / mark</label>
                          <input
                            type="text"
                            value={thankYouEmoji}
                            onChange={(e) => setThankYouEmoji(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-[#ec4899] focus:outline-none rounded-xl py-2.5 px-3.5 text-sm font-bold text-slate-800"
                            placeholder="✓"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="key-editor-form-label">Supporting message</label>
                        <textarea
                          value={thankYouMessage}
                          onChange={(e) => setThankYouMessage(e.target.value)}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#ec4899] focus:outline-none rounded-xl py-2.5 px-3.5 text-xs text-slate-600 resize-none"
                          placeholder="Thanks for connecting with us on KEYLINK360..."
                        />
                      </div>
                    </div>
                    ) : !coverSectionLocked && (
                    <div className="key-editor-panel key-editor-cover-panel p-5 shadow-sm space-y-6">
                      <div className="flex items-center justify-between gap-3">
                        <span className="key-editor-section-label">
                          Cover Image & Header
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <CoverPhotoControls
                            settings={editorCoverSettings}
                            onChange={setEditorCoverSettings}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setCoverUrlDraft(
                                editorCoverPhoto.startsWith("data:") ? DEFAULT_COVER : editorCoverPhoto
                              );
                              setShowCoverUrlModal(true);
                            }}
                            className="key-cover-url-edit-btn"
                            aria-label="Edit custom cover photo URL"
                          >
                            <Edit3 className="h-3.5 w-3.5" aria-hidden />
                            <span className="key-cover-url-edit-btn__tooltip">Custom cover photo URL</span>
                          </button>
                          <span className="key-editor-section-badge">
                          Live Editing
                        </span>
                        </div>
                      </div>

                      {/* Dropzone/Preview Frame */}
                      <div className="relative key-editor-cover-panel__frame-wrap group">
                        <CoverPhotoView
                          src={
                            editorCoverPhoto ||
                            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800"
                          }
                          alt="Cover Banner"
                          settings={editorCoverSettings}
                          variant="editor"
                          className="key-editor-cover-panel__frame"
                        />
                        
                        {/* Hidden File Input */}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverPhotoUpload}
                          id="cover-photo-file-upload-center"
                          className="hidden"
                        />
                        
                        {/* Overlay trigger for Drag & Drop / Browse */}
                        <label
                          htmlFor="cover-photo-file-upload-center"
                          className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-xs font-bold gap-1.5 p-4 text-center"
                        >
                          <span className="text-xl">📷</span>
                          <span>Drop cover photo or browse</span>
                          <span className="text-[9px] font-normal opacity-75">Supports PNG, JPG, GIF up to 5MB</span>
                        </label>
                      </div>

                      {/* Title, handle & bio */}
                      <div className="grid grid-cols-1 gap-3.5 key-editor-cover-panel__fields">
                        <div>
                            <label className="key-editor-form-label">Biolink Title</label>
                            <input
                              type="text"
                              value={editorTitle}
                              onChange={(e) => setEditorTitle(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2.5 px-3.5 text-sm font-bold text-slate-800"
                              placeholder="My BioLink"
                            />
                        </div>

                          <div>
                            <label className="key-editor-form-label">
                              Page Handle (@watermark)
                            </label>
                            <div className="key-editor-handle-field flex items-center gap-2 bg-slate-50 border border-slate-200 focus-within:border-[#6366f1] rounded-xl px-3.5">
                              <span className="text-sm font-bold text-slate-400 shrink-0 select-none" aria-hidden>
                                @
                              </span>
                            <input
                              type="text"
                                value={editorHandle}
                                onChange={(e) => setEditorHandle(normalizeHandleInput(e.target.value))}
                                className="key-editor-handle-field__input flex-1 min-w-0 bg-transparent border-0 focus:outline-none focus:ring-0 py-2.5 text-sm font-semibold text-slate-800 font-mono placeholder:text-slate-400"
                                placeholder={handlePlaceholder}
                                aria-label="Page handle"
                              />
                            </div>
                            <p className="key-editor-form-hint">
                              {previewHandle
                                ? `Live preview shows ${previewHandle}`
                                : `Optional — e.g. @${handlePlaceholder} (leave empty to hide on your page)`}
                            </p>
                          </div>

                          <div>
                            <label className="key-editor-form-label">Short Bio</label>
                            <textarea
                              value={editorBio}
                              onChange={(e) => setEditorBio(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2.5 px-3.5 text-xs text-slate-600 resize-none"
                              placeholder="Write a short bio..."
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ACCORDION BLOCKS LIST — always visible; centered when cover is locked */}
                    <div className="space-y-3.5 key-editor-blocks-section">
                      <div className="key-editor-blocks-section__head flex items-center justify-between gap-3">
                        <span className="key-editor-section-label">
                          {editingThankYouPage ? "Thank You Blocks" : "Page Blocks"}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {isAccordionReorderDrag && draggedBlockIndex !== null && (
                            <span className="key-editor-section-badge animate-pulse">
                              {dropTarget
                                ? `Drop at #${getDropDisplayPosition(dropTarget, canvasBlocks.length)}`
                                : "Drag to reorder"}
                            </span>
                          )}
                          {expandedBlockId && !isAccordionReorderDrag && (
                            <span className="key-editor-section-badge key-editor-section-badge--editing">
                              Editing
                            </span>
                          )}
                          <span className="key-editor-blocks-section__meta">
                          {canvasBlocks.length} widget{canvasBlocks.length !== 1 ? "s" : ""}
                        </span>
                        </div>
                      </div>

                      <div
                        ref={accordionListRef}
                        onDragOver={handleDragOverTarget}
                        onDragEnter={handleDragEnterManager}
                        onDragLeave={handleDragLeaveManager}
                        onDrop={handleDropOnManager}
                        className={`key-editor-accordions no-scrollbar space-y-3.5 p-3.5 sm:p-4 rounded-[1.25rem] border transition-all overflow-x-hidden ${
                          isDraggingOverManager
                            ? "ring-2 ring-indigo-400/60 border-indigo-400"
                            : isAccordionReorderDrag
                              ? "border-indigo-300/80"
                              : ""
                        } ${expandedBlockId ? "key-editor-accordions--has-active" : ""}`}
                      >
                        {canvasBlocks.length === 0 ? (
                          <div className="key-editor-empty text-center py-14 space-y-2.5">
                            <div className="key-editor-empty__icon" aria-hidden>📥</div>
                            <p className="key-editor-empty__title">No blocks yet</p>
                            <p className="key-editor-empty__hint">Drag from Block Library or click a tile to start building.</p>
                          </div>
                        ) : (
                          canvasBlocks.map((block, idx) => {
                            const isExpanded = expandedBlockId === block.id;
                            const isCurrentlyDragged = draggedBlockIndex === idx;
                            const showDropBefore =
                              dropTarget?.index === idx && dropTarget.position === "before" && !isCurrentlyDragged;
                            const showDropAfter =
                              dropTarget?.index === idx && dropTarget.position === "after" && !isCurrentlyDragged;
                            return (
                              <div
                                key={block.id}
                                id={`editor-block-${block.id}`}
                                data-accordion-block
                                data-editing={isExpanded ? "true" : "false"}
                                onDragOver={(e) => handleBlockDragOver(e, idx)}
                                onDrop={(e) => handleBlockDrop(e, idx)}
                                className={`relative flex flex-col key-editor-accordion-item rounded-2xl overflow-hidden transition-all duration-200 ${
                                  isExpanded
                                    ? "key-editor-accordion-item--editing border-[#6366f1] shadow-md ring-1 ring-[#6366f1]/25"
                                    : "key-editor-accordion-item--idle shadow-sm hover:shadow"
                                } ${isCurrentlyDragged ? "opacity-40 scale-[0.98] border-dashed border-[#6366f1]" : ""}`}
                              >
                                {showDropBefore && (
                                  <div className="absolute -top-[7px] left-2 right-2 z-30 flex items-center gap-2 pointer-events-none">
                                    <div className="h-1 flex-1 rounded-full bg-[#6366f1] shadow-[0_0_10px_rgba(99,102,241,0.55)]" />
                                    <span className="text-[8px] font-bold uppercase tracking-wider text-[#6366f1] bg-white px-1.5 py-0.5 rounded border border-indigo-200 shadow-sm">
                                      Drop here
                                    </span>
                                  </div>
                                )}
                                {showDropAfter && (
                                  <div className="absolute -bottom-[7px] left-2 right-2 z-30 flex items-center gap-2 pointer-events-none">
                                    <div className="h-1 flex-1 rounded-full bg-[#6366f1] shadow-[0_0_10px_rgba(99,102,241,0.55)]" />
                                    <span className="text-[8px] font-bold uppercase tracking-wider text-[#6366f1] bg-white px-1.5 py-0.5 rounded border border-indigo-200 shadow-sm">
                                      Drop here
                                    </span>
                                  </div>
                                )}
                                {/* Accordion Header — drag to reorder; chevron expands/collapses */}
                                <div
                                  className={`flex items-center justify-between p-3.5 select-none key-editor-accordion-header transition-colors ${
                                    isExpanded ? "key-editor-accordion-header--editing" : ""
                                  }`}
                                >
                                  <div
                                    draggable
                                    onDragStart={(e) => handleBlockDragStart(e, idx)}
                                    onDragEnd={handleBlockDragEnd}
                                    onClick={() => handleAccordionHeaderActivate(block.id, isExpanded)}
                                    className="flex items-center gap-3 min-w-0 flex-1 cursor-grab active:cursor-grabbing key-editor-accordion-drag-handle rounded-xl -m-1 p-1"
                                    title="Drag to reorder · click to expand"
                                  >
                                    <span
                                      className="text-slate-300 group-hover:text-[#6366f1] shrink-0 px-0.5 pointer-events-none"
                                      aria-hidden
                                    >
                                      <GripVertical className="h-4 w-4" />
                                    </span>
                                    
                                    {getBlockIcon(block.type)}

                                    <div className="min-w-0 pointer-events-none flex-1">
                                      <span className="block text-xs font-bold text-slate-800 truncate" title={block.label}>
                                        {block.label}
                                      </span>
                                      <span className="block text-[8.5px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                                        {block.type}
                                      </span>
                                    </div>

                                    {isExpanded && (
                                      <span className="key-editor-accordion-editing-pill shrink-0 pointer-events-none">
                                        Editing
                                      </span>
                                    )}
                                  </div>

                                      <button
                                        type="button"
                                    data-accordion-chevron
                                    aria-expanded={isExpanded}
                                    aria-label={isExpanded ? "Collapse block" : "Expand block"}
                                    onPointerDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                      toggleAccordionBlock(block.id, isExpanded);
                                    }}
                                    className={`flex items-center justify-center shrink-0 p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      isExpanded
                                        ? "text-[#6366f1] bg-indigo-100/80 hover:bg-indigo-100"
                                        : "text-slate-400 hover:text-[#6366f1] hover:bg-indigo-50/80"
                                    }`}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4 text-[#6366f1]" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>

                                {/* Accordion Content */}
                                {isExpanded && (
                                  <div className="border-t p-4 key-editor-accordion-body key-editor-accordion-body--editing space-y-6 text-left animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="key-editor-accordion-editing-banner">
                                      You are editing <strong>{block.type}</strong>
                                      {block.label ? <> · {block.label}</> : null}
                                    </div>
                                    {/* Widget Title */}
                                    {block.type !== "Shop" && (
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Widget Title</label>
                                        <input
                                          type="text"
                                          value={block.label}
                                          onChange={(e) => handleUpdateBlockField(block.id, "label", e.target.value)}
                                          className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800"
                                          placeholder="Enter widget label..."
                                        />
                                      </div>
                                    )}

                                    {/* Subtext and Customizations for Button/WhatsApp/Events/Deep Link */}
                                    {(block.type === "Button" || block.type === "WhatsApp" || block.type === "Events" || block.type === "Deep Link") && (
                                      <>
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subtext (Optional)</label>
                                            <input
                                              type="text"
                                              value={(block as any).subtext || ""}
                                              onChange={(e) => handleUpdateBlockField(block.id, "subtext", e.target.value)}
                                              className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800"
                                              placeholder="e.g. Free shipping!"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Icon (Emoji)</label>
                                            <input
                                              type="text"
                                              value={(block as any).iconEmoji || ""}
                                              onChange={(e) => handleUpdateBlockField(block.id, "iconEmoji", e.target.value)}
                                              className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800"
                                              placeholder="e.g. 🎒"
                                            />
                                          </div>
                                        </div>

                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Show Arrow Icon</label>
                                          <select
                                            value={(block as any).showArrow || "Yes"}
                                            onChange={(e) => handleUpdateBlockField(block.id, "showArrow", e.target.value)}
                                            className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800"
                                          >
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                          </select>
                                        </div>
                                      </>
                                    )}

                                    {/* Destination URL or Action values */}
                                    {block.type !== "Header" &&
                                      block.type !== "Text" &&
                                      block.type !== "Shop" &&
                                      block.type !== "Gallery" &&
                                      block.type !== "Coupon" &&
                                      block.type !== "Socials" &&
                                      block.type !== "Countdown" &&
                                      block.type !== "FAQ" &&
                                      block.type !== "Testimonials" &&
                                      block.type !== "Call" &&
                                      block.type !== "Email" &&
                                      block.type !== "Banner" &&
                                      block.type !== "Stats" &&
                                      block.type !== "Pricing" &&
                                      block.type !== "Divider" &&
                                      block.type !== "Image" && (
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                          {block.type === "WhatsApp"
                                            ? "WhatsApp Number"
                                            : block.type === "Smart Form" || block.type === "Form"
                                              ? "Email for Leads"
                                              : block.type === "Deep Link"
                                                ? "Deep link URL"
                                                : block.type === "Link Spin"
                                                  ? "Button label"
                                                  : block.type === "Map"
                                                    ? "Google Maps URL"
                                                    : block.type === "Tip Jar"
                                                      ? "Fallback payment URL"
                                                      : "Destination Link / Action"}
                                        </label>
                                        <input
                                          type="text"
                                          value={block.value}
                                          onChange={(e) => handleUpdateBlockField(block.id, "value", e.target.value)}
                                          className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800 font-mono"
                                          placeholder={
                                            block.type === "WhatsApp"
                                              ? "e.g. +919876543210"
                                              : block.type === "Map"
                                                ? "Paste Google Maps share link here"
                                                : "e.g. https://yoursite.com"
                                          }
                                        />
                                      </div>
                                    )}

                                    {/* Shop Specific Fields */}
                                    {block.type === "Shop" && (
                                      <div className="space-y-6">
                                        {/* TITLE */}
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Title</label>
                                          <input
                                            type="text"
                                            value={block.label}
                                            onChange={(e) => handleUpdateBlockField(block.id, "label", e.target.value)}
                                            className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800"
                                            placeholder="My Shop"
                                          />
                                        </div>

                                        {/* ALIGNMENT & CURRENCY */}
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Alignment</label>
                                            <select
                                              value={(block as any).alignment || "Centre"}
                                              onChange={(e) => handleUpdateBlockField(block.id, "alignment", e.target.value)}
                                              className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2.5 px-3 text-xs text-slate-800"
                                            >
                                              <option value="Left">Left</option>
                                              <option value="Centre">Centre</option>
                                              <option value="Right">Right</option>
                                            </select>
                                          </div>
                                          <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Currency</label>
                                            <select
                                              value={(block as any).currency || "₹ INR"}
                                              onChange={(e) => handleUpdateBlockField(block.id, "currency", e.target.value)}
                                              className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2.5 px-3 text-xs text-slate-800"
                                            >
                                              <option value="₹ INR">₹ INR</option>
                                              <option value="$ USD">$ USD</option>
                                              <option value="€ EUR">€ EUR</option>
                                              <option value="£ GBP">£ GBP</option>
                                              <option value="¥ JPY">¥ JPY</option>
                                            </select>
                                          </div>
                                        </div>

                                        {/* PRODUCTS */}
                                        <div className="space-y-3.5">
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Products</label>
                                          {((block as any).products || defaultProductsList).map((product: any, pIdx: number) => (
                                            <div key={product.id || pIdx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 relative">
                                              <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Product {pIdx + 1}</span>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const currentList = (block as any).products || defaultProductsList;
                                                    const updatedProducts = currentList.filter((_: any, idx: number) => idx !== pIdx);
                                                    handleUpdateBlockField(block.id, "products", updatedProducts);
                                                  }}
                                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded transition-colors"
                                                  title="Delete Product"
                                                >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                              </div>
                                              
                                              {/* Product Name */}
                                              <div>
                                                <input
                                                  type="text"
                                                  value={product.name || ""}
                                                  onChange={(e) => {
                                                    const currentList = [...((block as any).products || defaultProductsList)];
                                                    currentList[pIdx] = { ...currentList[pIdx], name: e.target.value };
                                                    handleUpdateBlockField(block.id, "products", currentList);
                                                  }}
                                                  className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs font-semibold text-slate-800"
                                                  placeholder="Product Name"
                                                />
                                              </div>

                                              {/* Product URL */}
                                              <div>
                                                <input
                                                  type="text"
                                                  value={product.url || ""}
                                                  onChange={(e) => {
                                                    const currentList = [...((block as any).products || defaultProductsList)];
                                                    currentList[pIdx] = { ...currentList[pIdx], url: e.target.value };
                                                    handleUpdateBlockField(block.id, "products", currentList);
                                                  }}
                                                  className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-[10px] font-mono text-slate-600"
                                                  placeholder="Product Destination URL"
                                                />
                                              </div>

                                              {/* Product Image Selector */}
                                              <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-2.5">
                                                <div className="relative h-12 w-12 rounded-lg border border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
                                                  {product.image ? (
                                                    <>
                                                      <img src={product.image} className="h-full w-full object-contain" alt="Thumbnail" referrerPolicy="no-referrer" />
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          const currentList = [...((block as any).products || defaultProductsList)];
                                                          currentList[pIdx] = { ...currentList[pIdx], image: "" };
                                                          handleUpdateBlockField(block.id, "products", currentList);
                                                        }}
                                                        className="absolute top-0.5 right-0.5 bg-rose-500 hover:bg-rose-600 text-white p-0.5 rounded-full shadow-md transition-all scale-75"
                                                      >
                                                        <X className="h-2.5 w-2.5" />
                                                      </button>
                                                    </>
                                                  ) : (
                                                    <div className="text-[8px] text-slate-400 font-bold">No Image</div>
                                                  )}
                                                </div>
                                                
                                                <div className="flex-1 space-y-1">
                                                  <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Product image</span>
                                                  <div className="flex gap-2">
                                                    <input
                                                      type="text"
                                                      value={product.image || ""}
                                                      onChange={(e) => {
                                                        const currentList = [...((block as any).products || defaultProductsList)];
                                                        currentList[pIdx] = { ...currentList[pIdx], image: e.target.value };
                                                        handleUpdateBlockField(block.id, "products", currentList);
                                                      }}
                                                      className="flex-1 bg-slate-50 border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-lg py-1 px-2 text-[10px] text-slate-700"
                                                      placeholder="Image URL"
                                                    />
                                                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2 py-1 rounded-lg cursor-pointer text-[9px] font-bold select-none flex items-center justify-center shrink-0">
                                                      Upload
                                                      <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                          const file = e.target.files?.[0];
                                                          if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                              const currentList = [...((block as any).products || defaultProductsList)];
                                                              currentList[pIdx] = { ...currentList[pIdx], image: reader.result as string };
                                                              handleUpdateBlockField(block.id, "products", currentList);
                                                              triggerToast("✨ Product image uploaded!");
                                                            };
                                                            reader.readAsDataURL(file);
                                                          }
                                                        }}
                                                      />
                                                    </label>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Price */}
                                              <div>
                                                <input
                                                  type="text"
                                                  value={product.price || ""}
                                                  onChange={(e) => {
                                                    const currentList = [...((block as any).products || defaultProductsList)];
                                                    currentList[pIdx] = { ...currentList[pIdx], price: e.target.value };
                                                    handleUpdateBlockField(block.id, "products", currentList);
                                                  }}
                                                  className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs font-semibold text-slate-800"
                                                  placeholder="Price (e.g. 3999)"
                                                />
                                              </div>
                                            </div>
                                          ))}
                                          
                                          {/* "+ Add Product" button */}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const currentList = (block as any).products || defaultProductsList;
                                              const newProduct = {
                                                id: "prod_" + Date.now(),
                                                name: "New Toy Hero",
                                                url: "https://www.amazon.in",
                                                image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300",
                                                price: "1999"
                                              };
                                              handleUpdateBlockField(block.id, "products", [...currentList, newProduct]);
                                            }}
                                            className="w-full py-2 border border-dashed border-[#6366f1] hover:bg-[#6366f1]/5 text-[#6366f1] rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all"
                                          >
                                            <Plus className="h-3.5 w-3.5" />
                                            Add Product
                                          </button>
                                        </div>

                                        {/* APPEARANCE */}
                                        <div className="space-y-2 pt-2 border-t border-slate-200/60">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Appearance</span>
                                          <div className="grid grid-cols-2 gap-3">
                                            <div>
                                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Card BG</label>
                                              <div className="flex items-center gap-2">
                                                <div
                                                  className="relative w-8 h-8 rounded-full border border-slate-200 overflow-hidden shrink-0 cursor-pointer shadow-sm"
                                                  style={{ backgroundColor: (block as any).bgColor || "#10B981" }}
                                                >
                                                  <input
                                                    type="color"
                                                    value={(block as any).bgColor || "#10B981"}
                                                    onChange={(e) => handleUpdateBlockField(block.id, "bgColor", e.target.value)}
                                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                                  />
                                                </div>
                                                <input
                                                  type="text"
                                                  value={(block as any).bgColor || "#10B981"}
                                                  onChange={(e) => handleUpdateBlockField(block.id, "bgColor", e.target.value)}
                                                  className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-1 px-2 text-[10px] font-mono uppercase text-slate-800"
                                                />
                                              </div>
                                            </div>

                                            <div>
                                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Text</label>
                                              <div className="flex items-center gap-2">
                                                <div
                                                  className="relative w-8 h-8 rounded-full border border-slate-200 overflow-hidden shrink-0 cursor-pointer shadow-sm"
                                                  style={{ backgroundColor: (block as any).textColor || "#FFFFFF" }}
                                                >
                                                  <input
                                                    type="color"
                                                    value={(block as any).textColor || "#FFFFFF"}
                                                    onChange={(e) => handleUpdateBlockField(block.id, "textColor", e.target.value)}
                                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                                  />
                                                </div>
                                                <input
                                                  type="text"
                                                  value={(block as any).textColor || "#FFFFFF"}
                                                  onChange={(e) => handleUpdateBlockField(block.id, "textColor", e.target.value)}
                                                  className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-1 px-2 text-[10px] font-mono uppercase text-slate-800"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Coupon Specific Fields */}
                                    {block.type === "Coupon" && (
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Coupon Code</label>
                                          <input
                                            type="text"
                                            value={block.value}
                                            onChange={(e) => handleUpdateBlockField(block.id, "value", e.target.value)}
                                            className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800 font-mono"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Discount Label</label>
                                          <input
                                            type="text"
                                            value={(block as any).discount || "10% OFF"}
                                            onChange={(e) => handleUpdateBlockField(block.id, "discount", e.target.value)}
                                            className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800"
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Countdown Specific Fields */}
                                    {block.type === "Countdown" && (
                                      <div className="space-y-3">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Headline (Optional)</label>
                                          <input
                                            type="text"
                                            value={(block as any).headline || ""}
                                            onChange={(e) => handleUpdateBlockField(block.id, "headline", e.target.value)}
                                            className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800"
                                            placeholder="e.g. Limited offer ends in"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">End date &amp; time</label>
                                          <input
                                            type="datetime-local"
                                            value={toDatetimeLocalValue((block as any).endAt as string)}
                                            onChange={(e) => handleUpdateBlockField(block.id, "endAt", fromDatetimeLocalValue(e.target.value))}
                                            className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800"
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Socials Specific Fields */}
                                    {block.type === "Socials" && (
                                      <div className="space-y-3">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Social profile URLs</label>
                                        {SOCIAL_PLATFORMS.map((platform) => (
                                          <div key={platform.id}>
                                            <label className="block text-[10px] font-semibold text-slate-500 mb-1">{platform.label}</label>
                                            <input
                                              type="url"
                                              value={(block as any)[platform.field] || ""}
                                              onChange={(e) => handleUpdateBlockField(block.id, platform.field, e.target.value)}
                                              placeholder={platform.placeholder}
                                              className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800 font-mono"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Gallery — dynamic images */}
                                    {block.type === "Gallery" && (
                                      <div className="space-y-3 pt-1 border-t border-slate-100">
                                        <div className="flex items-center justify-between">
                                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gallery images</label>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const items = [...getGalleryItems(block as BlockRecord), createGalleryItem()];
                                              handleUpdateBlockField(block.id, "galleryItems", items);
                                            }}
                                            className="text-[10px] font-bold text-[#6366f1] bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg"
                                          >
                                            + Add Image
                                          </button>
                                        </div>
                                        {getGalleryItems(block as BlockRecord).map((item, index) => (
                                          <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                              <span className="text-[10px] font-bold text-slate-500">Image {index + 1}</span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const items = getGalleryItems(block as BlockRecord).filter((_, i) => i !== index);
                                                  handleUpdateBlockField(block.id, "galleryItems", items);
                                                }}
                                                className="text-rose-500 hover:bg-rose-50 p-1 rounded"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </button>
                                            </div>
                                            <input
                                              type="url"
                                              value={item.url}
                                              onChange={(e) => {
                                                const items = getGalleryItems(block as BlockRecord).map((entry, i) =>
                                                  i === index ? { ...entry, url: e.target.value } : entry
                                                );
                                                handleUpdateBlockField(block.id, "galleryItems", items);
                                              }}
                                              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-mono"
                                              placeholder="Image URL"
                                            />
                                            <input
                                              type="text"
                                              value={item.caption}
                                              onChange={(e) => {
                                                const items = getGalleryItems(block as BlockRecord).map((entry, i) =>
                                                  i === index ? { ...entry, caption: e.target.value } : entry
                                                );
                                                handleUpdateBlockField(block.id, "galleryItems", items);
                                              }}
                                              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs"
                                              placeholder="Caption (optional)"
                                            />
                                            <input
                                              type="url"
                                              value={item.linkUrl}
                                              onChange={(e) => {
                                                const items = getGalleryItems(block as BlockRecord).map((entry, i) =>
                                                  i === index ? { ...entry, linkUrl: e.target.value } : entry
                                                );
                                                handleUpdateBlockField(block.id, "galleryItems", items);
                                              }}
                                              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-mono"
                                              placeholder="Click link URL (optional)"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {block.type === "Link Spin" && (
                                      <div className="space-y-3">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Win coupon code</label>
                                          <input
                                            type="text"
                                            value={(block as any).couponCode || "LUCKYSPIN20"}
                                            onChange={(e) => handleUpdateBlockField(block.id, "couponCode", e.target.value)}
                                            className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800 font-mono"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prize messages (one per line)</label>
                                          <textarea
                                            rows={4}
                                            value={(block as any).prizesText || ""}
                                            onChange={(e) => handleUpdateBlockField(block.id, "prizesText", e.target.value)}
                                            placeholder={"20% discount unlocked!\nFree gift with your next order!"}
                                            className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800"
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {block.type === "vCard" && (
                                      <div className="space-y-2">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact name</label>
                                        <input
                                          type="text"
                                            value={(block as any).contactName || ""}
                                            onChange={(e) => handleUpdateBlockField(block.id, "contactName", e.target.value)}
                                            className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</label>
                                        <input
                                          type="text"
                                            value={(block as any).phone || ""}
                                            onChange={(e) => handleUpdateBlockField(block.id, "phone", e.target.value)}
                                            placeholder="+919876543210"
                                            className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                                          <input
                                            type="email"
                                            value={(block as any).email || ""}
                                            onChange={(e) => handleUpdateBlockField(block.id, "email", e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800"
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {block.type === "Video" && (
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Custom thumbnail URL (optional)</label>
                                        <input
                                          type="url"
                                          value={(block as any).thumbUrl || ""}
                                          onChange={(e) => handleUpdateBlockField(block.id, "thumbUrl", e.target.value)}
                                          placeholder="Leave empty for YouTube auto-thumb"
                                          className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800 font-mono"
                                        />
                                      </div>
                                    )}

                                    {block.type === "Music" && (
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Track subtitle</label>
                                        <input
                                          type="text"
                                          value={(block as any).subtext || ""}
                                          onChange={(e) => handleUpdateBlockField(block.id, "subtext", e.target.value)}
                                          placeholder="e.g. Theme Track • 3:24"
                                          className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800"
                                        />
                                      </div>
                                    )}

                                    {block.type === "Events" && (
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Month label</label>
                                          <input
                                            type="text"
                                            value={(block as any).eventMonth || ""}
                                            onChange={(e) => handleUpdateBlockField(block.id, "eventMonth", e.target.value.toUpperCase())}
                                            placeholder="JUL"
                                            className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800 uppercase"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Day</label>
                                          <input
                                            type="text"
                                            value={(block as any).eventDay || ""}
                                            onChange={(e) => handleUpdateBlockField(block.id, "eventDay", e.target.value)}
                                            placeholder="20"
                                            className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800"
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* PDF Specific Fields */}
                                    {block.type === "PDF" && (
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">File Size Display</label>
                                        <input
                                          type="text"
                                          value={(block as any).fileSize || "3.2 MB"}
                                          onChange={(e) => handleUpdateBlockField(block.id, "fileSize", e.target.value)}
                                          className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800"
                                        />
                                      </div>
                                    )}

                                    {/* Form Specific Fields — fully dynamic */}
                                    {block.type === "Form" && (
                                      <div className="space-y-3 pt-1 border-t border-slate-100">
                                        {paymentEnabled && paymentAmountInr > 0 ? (
                                          <div className="rounded-xl border border-pink-200 bg-pink-50 px-3 py-2 space-y-1">
                                            <p className="text-[10px] font-bold text-pink-800 uppercase tracking-wider">
                                              Page payment ON · ₹{paymentAmountInr}
                                            </p>
                                            <p className="text-[10px] text-pink-700 leading-relaxed">
                                              Live Preview Form button shows <strong>Pay ₹{paymentAmountInr}</strong>.
                                              Public submit opens Razorpay; success stays on this form (no thank-you URL).
                                              Change amount in <strong>Settings</strong>.
                                            </p>
                                          </div>
                                        ) : (
                                          <p className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 leading-relaxed">
                                            Tip: turn on <strong>Settings → Form payment (Razorpay)</strong> to show{" "}
                                            <strong>Pay ₹…</strong> on this Form in Live Preview.
                                          </p>
                                        )}
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                                              <input
                                            type="text"
                                            value={(block as any).description || ""}
                                            onChange={(e) => handleUpdateBlockField(block.id, "description", e.target.value)}
                                            className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800"
                                            placeholder="Optional short helper text"
                                              />
                                            </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                            Submit Button Text
                                            {paymentEnabled && paymentAmountInr > 0 ? " (overridden by Pay ₹)" : ""}
                                          </label>
                                            <input
                                              type="text"
                                            value={(block as any).submitLabel || "Submit"}
                                            onChange={(e) => handleUpdateBlockField(block.id, "submitLabel", e.target.value)}
                                            className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800"
                                            placeholder="Submit"
                                            disabled={paymentEnabled && paymentAmountInr > 0}
                                            />
                                          </div>
                                        {!paymentEnabled || paymentAmountInr <= 0 ? (
                                          <p className="text-[10px] text-slate-500 bg-pink-50 border border-pink-100 rounded-xl px-3 py-2 leading-relaxed">
                                            After submit → opens this page&apos;s <strong>Thank You</strong> tab (2nd
                                            page with Back). Customize it from the Thank You editor tab.
                                          </p>
                                        ) : null}
                                        <FormFieldsEditor
                                          block={block as BlockRecord}
                                          onChange={(fields) => handleUpdateBlockField(block.id, "formFields", fields)}
                                        />
                                        </div>
                                    )}

                                    {block.type === "Smart Form" && (
                                      <div className="space-y-3 pt-1 border-t border-slate-100">
                                        {paymentEnabled && paymentAmountInr > 0 ? (
                                          <div className="rounded-xl border border-pink-200 bg-pink-50 px-3 py-2 space-y-1">
                                            <p className="text-[10px] font-bold text-pink-800 uppercase tracking-wider">
                                              Page payment ON · ₹{paymentAmountInr}
                                            </p>
                                            <p className="text-[10px] text-pink-700 leading-relaxed">
                                              Live Preview shows <strong>Pay ₹{paymentAmountInr}</strong>. Public flow uses Razorpay.
                                            </p>
                                          </div>
                                        ) : (
                                          <p className="text-[10px] text-slate-500 bg-pink-50 border border-pink-100 rounded-xl px-3 py-2 leading-relaxed">
                                            After submit → opens the <strong>Thank You</strong> 2nd page (edit in Thank
                                            You tab). Enable <strong>Settings → Form payment</strong> for Razorpay.
                                          </p>
                                        )}
                                      </div>
                                    )}

                                    {(block.type === "Button" || block.type === "Deep Link") && (
                                      <label className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-700 font-semibold cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={
                                            (block as any).openThanksPage === true ||
                                            (block as any).openThanksPage === "Yes" ||
                                            (block as any).openThanksPage === "true"
                                          }
                                          onChange={(e) =>
                                            handleUpdateBlockField(
                                              block.id,
                                              "openThanksPage",
                                              e.target.checked ? "Yes" : "No"
                                            )
                                          }
                                          className="rounded border-slate-300 accent-[#ec4899]"
                                        />
                                        On click → open Thank You page (instead of URL)
                                      </label>
                                    )}

                                    {/* FAQ dynamic items */}
                                    {block.type === "FAQ" && (
                                      <div className="space-y-3 pt-1 border-t border-slate-100">
                                        <div className="flex items-center justify-between">
                                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Questions</label>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const items = [...getFaqItems(block as BlockRecord), createFaqItem()];
                                              handleUpdateBlockField(block.id, "faqItems", items);
                                            }}
                                            className="text-[10px] font-bold text-[#6366f1] bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg"
                                          >
                                            + Add Question
                                          </button>
                                        </div>
                                        {getFaqItems(block as BlockRecord).map((item, index) => (
                                          <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                              <span className="text-[10px] font-bold text-slate-500">Q{index + 1}</span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const items = getFaqItems(block as BlockRecord).filter((_, i) => i !== index);
                                                  handleUpdateBlockField(block.id, "faqItems", items);
                                                }}
                                                className="text-rose-500 hover:bg-rose-50 p-1 rounded"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </button>
                                            </div>
                                              <input
                                              type="text"
                                              value={item.question}
                                              onChange={(e) => {
                                                const items = getFaqItems(block as BlockRecord).map((entry, i) =>
                                                  i === index ? { ...entry, question: e.target.value } : entry
                                                );
                                                handleUpdateBlockField(block.id, "faqItems", items);
                                              }}
                                              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs"
                                              placeholder="Question"
                                            />
                                            <textarea
                                              value={item.answer}
                                              onChange={(e) => {
                                                const items = getFaqItems(block as BlockRecord).map((entry, i) =>
                                                  i === index ? { ...entry, answer: e.target.value } : entry
                                                );
                                                handleUpdateBlockField(block.id, "faqItems", items);
                                              }}
                                              rows={2}
                                              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs resize-none"
                                              placeholder="Answer"
                                              />
                                            </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Testimonials dynamic items */}
                                    {block.type === "Testimonials" && (
                                      <div className="space-y-3 pt-1 border-t border-slate-100">
                                        <div className="flex items-center justify-between">
                                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quotes</label>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const items = [...getTestimonials(block as BlockRecord), createTestimonial()];
                                              handleUpdateBlockField(block.id, "testimonials", items);
                                            }}
                                            className="text-[10px] font-bold text-[#6366f1] bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg"
                                          >
                                            + Add Quote
                                          </button>
                                        </div>
                                        {getTestimonials(block as BlockRecord).map((item, index) => (
                                          <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-2">
                                            <div className="flex justify-end">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const items = getTestimonials(block as BlockRecord).filter((_, i) => i !== index);
                                                  handleUpdateBlockField(block.id, "testimonials", items);
                                                }}
                                                className="text-rose-500 hover:bg-rose-50 p-1 rounded"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </button>
                                            </div>
                                            <textarea
                                              value={item.quote}
                                              onChange={(e) => {
                                                const items = getTestimonials(block as BlockRecord).map((entry, i) =>
                                                  i === index ? { ...entry, quote: e.target.value } : entry
                                                );
                                                handleUpdateBlockField(block.id, "testimonials", items);
                                              }}
                                              rows={2}
                                              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs resize-none"
                                              placeholder="Quote"
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                            <input
                                              type="text"
                                                value={item.author}
                                                onChange={(e) => {
                                                  const items = getTestimonials(block as BlockRecord).map((entry, i) =>
                                                    i === index ? { ...entry, author: e.target.value } : entry
                                                  );
                                                  handleUpdateBlockField(block.id, "testimonials", items);
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs"
                                                placeholder="Author"
                                              />
                                              <input
                                                type="text"
                                                value={item.role}
                                                onChange={(e) => {
                                                  const items = getTestimonials(block as BlockRecord).map((entry, i) =>
                                                    i === index ? { ...entry, role: e.target.value } : entry
                                                  );
                                                  handleUpdateBlockField(block.id, "testimonials", items);
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs"
                                                placeholder="Role / company"
                                            />
                                          </div>
                                        </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Tip Jar dynamic options */}
                                    {block.type === "Tip Jar" && (
                                      <div className="space-y-3 pt-1 border-t border-slate-100">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                                          <input
                                            type="text"
                                            value={(block as any).description || ""}
                                            onChange={(e) => handleUpdateBlockField(block.id, "description", e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                          />
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tip options</label>
                                      <button
                                            type="button"
                                            onClick={() => {
                                              const items = [...getTipOptions(block as BlockRecord), createTipOption()];
                                              handleUpdateBlockField(block.id, "tipOptions", items);
                                            }}
                                            className="text-[10px] font-bold text-[#6366f1] bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg"
                                          >
                                            + Add Option
                                      </button>
                                        </div>
                                        {getTipOptions(block as BlockRecord).map((item, index) => (
                                          <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-2">
                                            <div className="flex justify-end">
                                      <button
                                                type="button"
                                                onClick={() => {
                                                  const items = getTipOptions(block as BlockRecord).filter((_, i) => i !== index);
                                                  handleUpdateBlockField(block.id, "tipOptions", items);
                                                }}
                                                className="text-rose-500 hover:bg-rose-50 p-1 rounded"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                            <input
                                              type="text"
                                              value={item.label}
                                              onChange={(e) => {
                                                const items = getTipOptions(block as BlockRecord).map((entry, i) =>
                                                  i === index ? { ...entry, label: e.target.value } : entry
                                                );
                                                handleUpdateBlockField(block.id, "tipOptions", items);
                                              }}
                                              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs"
                                              placeholder="Option label"
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                              <input
                                                type="text"
                                                value={item.amount}
                                                onChange={(e) => {
                                                  const items = getTipOptions(block as BlockRecord).map((entry, i) =>
                                                    i === index ? { ...entry, amount: e.target.value } : entry
                                                  );
                                                  handleUpdateBlockField(block.id, "tipOptions", items);
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs"
                                                placeholder="Amount"
                                              />
                                              <input
                                                type="text"
                                                value={item.url}
                                                onChange={(e) => {
                                                  const items = getTipOptions(block as BlockRecord).map((entry, i) =>
                                                    i === index ? { ...entry, url: e.target.value } : entry
                                                  );
                                                  handleUpdateBlockField(block.id, "tipOptions", items);
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-mono"
                                                placeholder="Payment URL"
                                              />
                                            </div>
                                          </div>
                                        ))}
                                  </div>
                                )}

                                    {/* Map fields */}
                                    {block.type === "Map" && (
                                      <div className="space-y-3 pt-1 border-t border-slate-100">
                                        <p className="text-[11px] text-slate-500 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 leading-relaxed">
                                          Paste a <strong>Google Maps link</strong> (Share → Copy link) or type an address.
                                          The live map preview updates automatically.
                                        </p>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Address / Place name</label>
                                          <input
                                            type="text"
                                            value={(block as any).address || ""}
                                            onChange={(e) => handleUpdateBlockField(block.id, "address", e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                            placeholder="e.g. Marina Beach, Chennai"
                                          />
                              </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subtext</label>
                                          <input
                                            type="text"
                                            value={(block as any).subtext || ""}
                                            onChange={(e) => handleUpdateBlockField(block.id, "subtext", e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                            placeholder="Visit us"
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Zoom</label>
                                            <select
                                              value={(block as any).zoom || "15"}
                                              onChange={(e) => handleUpdateBlockField(block.id, "zoom", e.target.value)}
                                              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                            >
                                              <option value="12">City</option>
                                              <option value="14">Area</option>
                                              <option value="15">Street</option>
                                              <option value="17">Building</option>
                                              <option value="19">Close-up</option>
                                            </select>
                                          </div>
                                          <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Map height</label>
                                            <select
                                              value={(block as any).mapHeight || "md"}
                                              onChange={(e) => handleUpdateBlockField(block.id, "mapHeight", e.target.value)}
                                              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                            >
                                              <option value="sm">Small</option>
                                              <option value="md">Medium</option>
                                              <option value="lg">Large</option>
                                            </select>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Show address</label>
                                            <select
                                              value={(block as any).showAddress || "Yes"}
                                              onChange={(e) => handleUpdateBlockField(block.id, "showAddress", e.target.value)}
                                              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                            >
                                              <option value="Yes">Yes</option>
                                              <option value="No">No</option>
                                            </select>
                                          </div>
                                          <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Button label</label>
                                            <input
                                              type="text"
                                              value={(block as any).buttonLabel || "Open in Google Maps"}
                                              onChange={(e) => handleUpdateBlockField(block.id, "buttonLabel", e.target.value)}
                                              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                            />
                                          </div>
                                        </div>
                                        {(() => {
                                          const preview = resolveGoogleMap(block as BlockRecord);
                                          return preview.hasLocation ? (
                                            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-36 relative">
                                              <iframe
                                                title="Map editor preview"
                                                src={preview.embedUrl}
                                                className="absolute inset-0 h-full w-full border-0"
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                              />
                                            </div>
                                          ) : (
                                            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                                              Add a Maps URL above or an address to preview the real location.
                                            </p>
                                          );
                                        })()}
                                      </div>
                                    )}

                                    {/* Image fields */}
                                    {block.type === "Image" && (
                                      <div className="space-y-3 pt-1 border-t border-slate-100">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Image URL</label>
                                          <input
                                            type="text"
                                            value={(block as any).imageUrl || ""}
                                            onChange={(e) => handleUpdateBlockField(block.id, "imageUrl", e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                          />
                      </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Click Link (optional)</label>
                                          <input
                                            type="text"
                                            value={(block as any).linkUrl || ""}
                                            onChange={(e) => handleUpdateBlockField(block.id, "linkUrl", e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                          />
                    </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Caption</label>
                                          <input
                                            type="text"
                                            value={(block as any).caption || ""}
                                            onChange={(e) => handleUpdateBlockField(block.id, "caption", e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                          />
                  </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Alt Text</label>
                                          <input
                                            type="text"
                                            value={(block as any).altText || ""}
                                            onChange={(e) => handleUpdateBlockField(block.id, "altText", e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                          />
                </div>
            </div>
                                    )}

                                    {/* Call block */}
                                    {block.type === "Call" && (
                                      <div className="space-y-3 pt-1 border-t border-slate-100">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone number</label>
                                          <input
                                            type="tel"
                                            value={(block as any).phone || getCallPhone(block as BlockRecord) || ""}
                                            onChange={(e) => {
                                              handleUpdateBlockField(block.id, "phone", e.target.value);
                                              handleUpdateBlockField(block.id, "value", e.target.value);
                                            }}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                            placeholder="+919876543210"
                                          />
                </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subtext (optional)</label>
                                          <input
                                            type="text"
                                            value={(block as any).subtext || ""}
                                            onChange={(e) => handleUpdateBlockField(block.id, "subtext", e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                            placeholder="Mon–Sat 10am–6pm"
                                          />
                  </div>
                    </div>
                                    )}

                                    {/* Email block */}
                                    {block.type === "Email" && (
                                      <div className="space-y-3 pt-1 border-t border-slate-100">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email address</label>
                                          <input
                                            type="email"
                                            value={(block as any).email || getEmailAddress(block as BlockRecord) || ""}
                                            onChange={(e) => {
                                              handleUpdateBlockField(block.id, "email", e.target.value);
                                              handleUpdateBlockField(block.id, "value", e.target.value);
                                            }}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                            placeholder="hello@example.com"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Default subject</label>
                                          <input
                                            type="text"
                                            value={(block as any).subject || ""}
                                            onChange={(e) => handleUpdateBlockField(block.id, "subject", e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                            placeholder="Hello from your bio page"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subtext (optional)</label>
                                          <input
                                            type="text"
                                            value={(block as any).subtext || ""}
                                            onChange={(e) => handleUpdateBlockField(block.id, "subtext", e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                            placeholder="We reply within 24 hours"
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Banner block */}
                                    {block.type === "Banner" && (
                                      <div className="space-y-3 pt-1 border-t border-slate-100">
                                        <div className="grid grid-cols-[72px_1fr] gap-2">
                                          <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Emoji</label>
                                            <input
                                              type="text"
                                              value={(block as any).bannerEmoji || "📢"}
                                              onChange={(e) => handleUpdateBlockField(block.id, "bannerEmoji", e.target.value)}
                                              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-2 text-center text-lg"
                                              maxLength={4}
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Style</label>
                                            <select
                                              value={(block as any).bannerStyle || "info"}
                                              onChange={(e) => handleUpdateBlockField(block.id, "bannerStyle", e.target.value)}
                                              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                            >
                                              <option value="info">Info</option>
                                              <option value="success">Success</option>
                                              <option value="warning">Warning</option>
                                              <option value="promo">Promo</option>
                                            </select>
                                  </div>
                                </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Title</label>
                                          <input
                                            type="text"
                                            value={(block as any).bannerTitle || block.label || ""}
                                            onChange={(e) => handleUpdateBlockField(block.id, "bannerTitle", e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                            placeholder="New offer live!"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Message</label>
                                          <textarea
                                            value={(block as any).bannerMessage || ""}
                                            onChange={(e) => handleUpdateBlockField(block.id, "bannerMessage", e.target.value)}
                                            rows={2}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs resize-none"
                                            placeholder="Check out our latest collection today."
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Link URL</label>
                                            <input
                                              type="url"
                                              value={(block as any).bannerLink || ""}
                                              onChange={(e) => handleUpdateBlockField(block.id, "bannerLink", e.target.value)}
                                              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                              placeholder="https://..."
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Link label</label>
                                            <input
                                              type="text"
                                              value={(block as any).bannerLinkLabel || "Learn more"}
                                              onChange={(e) => handleUpdateBlockField(block.id, "bannerLinkLabel", e.target.value)}
                                              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                              placeholder="Learn more"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Stats block */}
                                    {block.type === "Stats" && (
                                      <div className="space-y-3 pt-1 border-t border-slate-100">
                                        <div className="flex items-center justify-between">
                                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stat items</label>
                                          <button
                                            type="button"
                                  onClick={() => {
                                              const items = [...getStatItems(block as BlockRecord), createStatItem()];
                                              handleUpdateBlockField(block.id, "statItems", items);
                                            }}
                                            className="text-[10px] font-bold text-[#6366f1] bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg"
                                          >
                                            + Add Stat
                                          </button>
                                        </div>
                                        {getStatItems(block as BlockRecord).map((item, index) => (
                                          <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                              <span className="text-[10px] font-bold text-slate-500">Stat {index + 1}</span>
                                              <button
                                                type="button"
                                  onClick={() => {
                                                  const items = getStatItems(block as BlockRecord).filter((_, i) => i !== index);
                                                  handleUpdateBlockField(block.id, "statItems", items);
                                                }}
                                                className="text-rose-500 hover:bg-rose-50 p-1 rounded"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </button>
                              </div>
                                            <div className="grid grid-cols-2 gap-2">
                                              <input
                                                type="text"
                                                value={item.value}
                                                onChange={(e) => {
                                                  const items = getStatItems(block as BlockRecord).map((entry, i) =>
                                                    i === index ? { ...entry, value: e.target.value } : entry
                                                  );
                                                  handleUpdateBlockField(block.id, "statItems", items);
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-bold"
                                                placeholder="10K+"
                                              />
                                              <input
                                                type="text"
                                                value={item.label}
                                                onChange={(e) => {
                                                  const items = getStatItems(block as BlockRecord).map((entry, i) =>
                                                    i === index ? { ...entry, label: e.target.value } : entry
                                                  );
                                                  handleUpdateBlockField(block.id, "statItems", items);
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs"
                                                placeholder="Happy customers"
                                              />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                    )}

                                    {/* Pricing block */}
                                    {block.type === "Pricing" && (
                                      <div className="space-y-3 pt-1 border-t border-slate-100">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Section description</label>
                                          <input
                                            type="text"
                                            value={(block as any).description || ""}
                                            onChange={(e) => handleUpdateBlockField(block.id, "description", e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                            placeholder="Pick the plan that fits you best"
                                          />
                              </div>
                                <div className="flex items-center justify-between">
                                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plans</label>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const items = [...getPricingPlans(block as BlockRecord), createPricingPlan()];
                                              handleUpdateBlockField(block.id, "pricingPlans", items);
                                            }}
                                            className="text-[10px] font-bold text-[#6366f1] bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg"
                                          >
                                            + Add Plan
                                          </button>
                                </div>
                                        {getPricingPlans(block as BlockRecord).map((plan, index) => (
                                          <div key={plan.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="text-[10px] font-bold text-slate-500">Plan {index + 1}</span>
                                              <div className="flex items-center gap-2">
                                                <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                                                  <input
                                                    type="checkbox"
                                                    checked={plan.highlighted}
                                                    onChange={(e) => {
                                                      const items = getPricingPlans(block as BlockRecord).map((entry, i) =>
                                                        i === index ? { ...entry, highlighted: e.target.checked } : entry
                                                      );
                                                      handleUpdateBlockField(block.id, "pricingPlans", items);
                                                    }}
                                                    className="rounded border-slate-300"
                                                  />
                                                  Highlight
                                                </label>
                                  <button
                                                  type="button"
                                    onClick={() => {
                                                    const items = getPricingPlans(block as BlockRecord).filter((_, i) => i !== index);
                                                    handleUpdateBlockField(block.id, "pricingPlans", items);
                                    }}
                                                  className="text-rose-500 hover:bg-rose-50 p-1 rounded"
                                  >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                                            <input
                                              type="text"
                                              value={plan.name}
                                              onChange={(e) => {
                                                const items = getPricingPlans(block as BlockRecord).map((entry, i) =>
                                                  i === index ? { ...entry, name: e.target.value } : entry
                                                );
                                                handleUpdateBlockField(block.id, "pricingPlans", items);
                                              }}
                                              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-bold"
                                              placeholder="Plan name"
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                              <input
                                                type="text"
                                                value={plan.price}
                                                onChange={(e) => {
                                                  const items = getPricingPlans(block as BlockRecord).map((entry, i) =>
                                                    i === index ? { ...entry, price: e.target.value } : entry
                                                  );
                                                  handleUpdateBlockField(block.id, "pricingPlans", items);
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs"
                                                placeholder="₹999"
                                              />
                                              <input
                                                type="text"
                                                value={plan.period}
                                                onChange={(e) => {
                                                  const items = getPricingPlans(block as BlockRecord).map((entry, i) =>
                                                    i === index ? { ...entry, period: e.target.value } : entry
                                                  );
                                                  handleUpdateBlockField(block.id, "pricingPlans", items);
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs"
                                                placeholder="/month"
                                              />
                                  </div>
                                            <input
                                              type="text"
                                              value={plan.description}
                                              onChange={(e) => {
                                                const items = getPricingPlans(block as BlockRecord).map((entry, i) =>
                                                  i === index ? { ...entry, description: e.target.value } : entry
                                                );
                                                handleUpdateBlockField(block.id, "pricingPlans", items);
                                              }}
                                              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs"
                                              placeholder="Short plan description"
                                            />
                                            <textarea
                                              value={plan.features}
                                              onChange={(e) => {
                                                const items = getPricingPlans(block as BlockRecord).map((entry, i) =>
                                                  i === index ? { ...entry, features: e.target.value } : entry
                                                );
                                                handleUpdateBlockField(block.id, "pricingPlans", items);
                                              }}
                                              rows={3}
                                              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs resize-none font-mono"
                                              placeholder={"Feature one\nFeature two\nFeature three"}
                                            />
                                            <input
                                              type="url"
                                              value={plan.url}
                                              onChange={(e) => {
                                                const items = getPricingPlans(block as BlockRecord).map((entry, i) =>
                                                  i === index ? { ...entry, url: e.target.value } : entry
                                                );
                                                handleUpdateBlockField(block.id, "pricingPlans", items);
                                              }}
                                              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-mono"
                                              placeholder="Checkout / signup URL"
                                            />
                                  </div>
                                        ))}
                                  </div>
                                    )}

                                    {/* Divider fields */}
                                    {block.type === "Divider" && (
                                      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Style</label>
                                          <select
                                            value={(block as any).style || "line"}
                                            onChange={(e) => handleUpdateBlockField(block.id, "style", e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                          >
                                            <option value="line">Line</option>
                                            <option value="dots">Dots</option>
                                            <option value="space">Space only</option>
                                          </select>
                                  </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Spacing</label>
                                          <select
                                            value={(block as any).spacing || "md"}
                                            onChange={(e) => handleUpdateBlockField(block.id, "spacing", e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                          >
                                            <option value="sm">Small</option>
                                            <option value="md">Medium</option>
                                            <option value="lg">Large</option>
                                          </select>
                                </div>
                              </div>
                                    )}

                                    {/* Appearance Options (Background & Text Colors) */}
                                    {(block.type === "Button" || block.type === "Text" || block.type === "Coupon" || block.type === "WhatsApp" || block.type === "vCard" || block.type === "Deep Link" || block.type === "Call" || block.type === "Email") && (
                                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Background Color</label>
                                          <div className="flex items-center gap-2">
                                            <div
                                              className="relative w-8 h-8 rounded-full border border-slate-200 overflow-hidden shrink-0 cursor-pointer shadow-sm animate-in zoom-in-75 duration-150"
                                              style={{ backgroundColor: (block as any).bgColor || getBlockDefaultBgColor(block.type) }}
                                            >
                                              <input
                                                type="color"
                                                value={(block as any).bgColor || getBlockDefaultBgColor(block.type)}
                                                onChange={(e) => handleUpdateBlockField(block.id, "bgColor", e.target.value)}
                                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                              />
                                            </div>
                                            <input
                                              type="text"
                                              value={(block as any).bgColor || getBlockDefaultBgColor(block.type)}
                                              onChange={(e) => handleUpdateBlockField(block.id, "bgColor", e.target.value)}
                                              className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-1 px-2.5 text-[11px] font-mono uppercase text-slate-800"
                                            />
                                          </div>
                                        </div>

                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Text Color</label>
                                          <div className="flex items-center gap-2">
                                            <div
                                              className="relative w-8 h-8 rounded-full border border-slate-200 overflow-hidden shrink-0 cursor-pointer shadow-sm animate-in zoom-in-75 duration-150"
                                              style={{ backgroundColor: (block as any).textColor || getBlockDefaultTextColor(block.type) }}
                                            >
                                  <input
                                                type="color"
                                                value={(block as any).textColor || getBlockDefaultTextColor(block.type)}
                                                onChange={(e) => handleUpdateBlockField(block.id, "textColor", e.target.value)}
                                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                              />
                                            </div>
                                            <input
                                              type="text"
                                              value={(block as any).textColor || getBlockDefaultTextColor(block.type)}
                                              onChange={(e) => handleUpdateBlockField(block.id, "textColor", e.target.value)}
                                              className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-1 px-2.5 text-[11px] font-mono uppercase text-slate-800"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Action Footers */}
                                    <div className="flex items-center justify-between pt-3.5 border-t border-slate-100">
                                  <button
                                        onClick={() => handleDeleteBlock(block.id)}
                                        className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        <span>Delete Widget</span>
                                  </button>
                              <button
                                        onClick={() => setExpandedBlockId(null)}
                                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase"
                              >
                                        Collapse
                              </button>
                                  </div>
                                </div>
                                )}
                              </div>
                            );
                          })
                        )}
                                  </div>
                                </div>
                                </div>
                              </div>
                                </div>
                              </div>
              )}
                                  </div>

            {/* Live phone preview */}
            <div
              className={`key-editor-zone key-editor-zone--preview key-editor-preview-rail flex flex-col h-full min-h-0 shrink-0 ${
                editorViewPanel === "preview" ? "flex" : "hidden"
              } lg:flex`}
            >
              <div className="key-editor-zone__head key-editor-zone__head--with-actions">
                <div className="key-editor-zone__head-main">
                  <Smartphone className="h-3.5 w-3.5" />
                  Live Preview
                                </div>
                <BioPageThemePicker value={editorPageTheme} onChange={handlePreviewThemeChange} compact />
                              </div>

              <div className="key-editor-preview-rail__stage">
                <div className="key-phone-preview key-phone-preview--samsung key-phone-preview--slim key-phone-preview--device-4k key-phone-preview--black-case" aria-label="Mobile live preview">
                  <div className="key-phone-preview__side-key key-phone-preview__side-key--volume-up" aria-hidden />
                  <div className="key-phone-preview__side-key key-phone-preview__side-key--volume-down" aria-hidden />
                  <div className="key-phone-preview__bezel">
                    <div className="key-phone-preview__hole-punch" aria-hidden />

                    <div className="key-phone-preview__display">
                        <div
                          className="key-phone-preview__chrome"
                          style={showThanksPage ? { display: "none" } : undefined}
                        >
                        <div className="key-phone-preview__status-bar">
                          <span>12:33</span>
                          <span className="key-phone-preview__status-icons">▮▮▮ 100%</span>
                                  </div>
                        <div className="key-phone-preview__browser-bar">
                          <span className="key-phone-preview__browser-home" aria-hidden>⌂</span>
                          <span className="key-phone-preview__browser-url">
                            {selectedEditPageLink?.displayLabel || `${PRIMARY_DOMAIN}/page`}
                          </span>
                          <span className="key-phone-preview__browser-tabs" aria-hidden>1</span>
                                  </div>
                                </div>

                <div
                  ref={phonePreviewScreenRef}
                  onDragOver={showThanksPage ? undefined : handleDragOverTarget}
                  onDragEnter={showThanksPage ? undefined : handleDragEnterPreview}
                  onDragLeave={showThanksPage ? undefined : handleDragLeavePreview}
                  onDrop={showThanksPage ? undefined : handleDropOnPreview}
                        className={`key-preview-isolate key-phone-preview__screen ${getBioPageThemeClass(editorPageTheme)} no-scrollbar transition-all duration-200 ${
                          isDraggingOverPreview && !showThanksPage
                            ? "key-phone-preview__screen--drop-target"
                            : ""
                        } ${showThanksPage ? "key-phone-preview__screen--thanks-open" : ""}`}
                        style={getBioPageThemeStyle(editorPageTheme)}
                      >
                        {/* Bio page stays mounted but hidden while Thank You is open —
                            otherwise scrolling the phone reveals Pay/Form blocks under the overlay. */}
                        <div
                          className="key-phone-preview__bio-layer"
                          hidden={showThanksPage}
                          aria-hidden={showThanksPage}
                        >
                        <CoverPhotoView
                          src={
                            editorCoverPhoto ||
                            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800"
                          }
                      alt="Hero Cover"
                          settings={editorCoverSettings}
                          variant="preview"
                          className="key-phone-preview__cover key-public-bio-page__cover"
                        />

                        <div className="key-phone-preview__body key-public-bio-page__body">
                          <div className="key-public-bio-page__profile">
                            <h3 className="key-public-bio-page__title font-display">
                      {editorTitle || "Marvel Products"}
                    </h3>
                            {previewHandle && (
                              <p className="key-public-bio-page__handle">{previewHandle}</p>
                    )}
                  </div>

                          {editorBio && (
                            <p className="key-phone-preview__bio-text">{editorBio}</p>
                          )}

                          <div className="key-phone-preview__blocks">
                    {filterVisibleBioBlocks(editorBlocks).map((block) => {
                      return (
                        <div
                          key={block.id}
                          className="group relative p-1.5 rounded-2xl border border-transparent hover:border-dashed hover:border-[#6366f1]/55 hover:bg-[#6366f1]/5 transition-all duration-200 cursor-pointer"
                          onClick={() => {
                            setExpandedBlockId(block.id);
                            const el = document.getElementById(`editor-block-${block.id}`);
                            if (el) {
                              el.scrollIntoView({ behavior: "smooth", block: "center" });
                            }
                          }}
                        >
                          <div className="absolute -top-3.5 right-1.5 hidden max-lg:flex lg:group-hover:flex items-center gap-1 bg-white border border-[#6366f1]/30 shadow-md py-0.5 px-1.5 rounded-lg z-30 animate-in zoom-in-95 duration-150">
                            <span className="text-[7px] font-mono font-bold text-[#6366f1] uppercase tracking-widest mr-1">
                              {block.type}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedBlockId(block.id);
                                const el = document.getElementById(`editor-block-${block.id}`);
                                if (el) {
                                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                                }
                              }}
                              title="Edit Widget"
                              className="p-1 hover:bg-indigo-500/10 rounded text-slate-500 hover:text-[#6366f1] transition-colors"
                            >
                              <Edit3 className="h-2.5 w-2.5" />
                            </button>
                          </div>

                          <div className="relative z-10">
                            <BlockRenderer
                              block={block as BlockRecord}
                              mode="preview"
                              context={{
                                compact: true,
                                displayTitle: editorTitle,
                                displayHandle: previewHandle,
                                paymentEnabled: paymentEnabled && paymentAmountInr > 0,
                                paymentAmountInr: paymentEnabled ? paymentAmountInr : undefined
                              }}
                              handlers={previewBlockHandlers}
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
                    title={thankYouTitle}
                    message={thankYouMessage}
                    emoji={thankYouEmoji}
                    blocks={thankYouBlocks as BlockRecord[]}
                    onBack={() => {
                      setShowThanksPage(false);
                      if (editorTab === "Thank You") setEditorTab("Edit");
                    }}
                    compact
                    displayTitle={editorTitle}
                    handlers={{
                      ...previewBlockHandlers,
                      // Thank You is a post-submit screen — never show/run page Pay checkout here.
                      deferThanksUntilPaid: false,
                      paymentAmountInr: undefined,
                      onSecureCheckout: undefined
                    }}
                  />

                  {/* Interactive Simulator Toast Overlay */}
                  {simulatorToast && (
                    <div className="absolute bottom-5 left-4 right-4 bg-slate-900/95 border border-slate-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl text-center shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 flex items-center justify-center gap-1.5">
                      <span>🔔</span>
                      <span className="leading-tight">{simulatorToast}</span>
                    </div>
                  )}

                  {/* Dynamic Interactive Link Spin (Lucky Wheel) Game Overlay inside phone */}
                  {showSpinWheel && (
                    <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 text-white animate-in fade-in duration-200">
                      <button
                        onClick={() => setShowSpinWheel(false)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      <div className="text-center space-y-1 mb-6">
                        <span className="text-[10px] font-extrabold text-cyan-400 tracking-wider uppercase block">🎁 GROW YOUR SALES</span>
                        <h4 className="font-display font-black text-base">Lucky Wheel Simulator</h4>
                        <p className="text-[9px] text-slate-300">Spin the wheel to win official prizes & coupons!</p>
                      </div>

                      {/* Wheel Wrapper */}
                      <div className="relative w-40 h-40 flex items-center justify-center mb-5">
                        {/* Needle/pointer */}
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 z-30 rotate-45 transform shadow-md" />

                        {/* Spinner circle using simple CSS */}
                        <div
                          className={`w-full h-full rounded-full border-4 border-slate-700 relative overflow-hidden shadow-xl ${
                            isSpinning ? "animate-[spin_0.8s_linear_infinite]" : ""
                          }`}
                          style={{
                            background: "conic-gradient(#6366f1 0deg 90deg, #2563EB 90deg 180deg, #10B981 180deg 270deg, #F59E0B 270deg 360deg)"
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                            <span className="absolute top-3 text-white text-[8px]">Gift</span>
                            <span className="absolute right-3 text-white text-[8px]">20%</span>
                            <span className="absolute bottom-3 text-white text-[8px]">Try Again</span>
                            <span className="absolute left-3 text-white text-[8px]">Freebie</span>
                          </div>
                        </div>

                        {/* Spin hub */}
                        <div className="absolute w-12 h-12 rounded-full bg-white text-slate-900 shadow-lg flex items-center justify-center z-20">
                          <span className="text-xs font-extrabold text-slate-950">1SL</span>
                        </div>
                      </div>

                      {spinResult ? (
                        <div className="text-center space-y-2.5 animate-in zoom-in-95 duration-200">
                          <p className="text-xs font-bold text-green-400">🎉 CONGRATULATIONS! 🎉</p>
                          <p className="text-xs font-black text-white">{spinResult}</p>
                          <p className="text-[9px] text-slate-400 bg-slate-950 px-2 py-1.5 rounded font-mono border border-slate-800">Use Code: <span className="font-bold text-cyan-400">{spinCouponCode}</span></p>
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(spinCouponCode);
                                triggerSimulatorToast("🎟️ Spin coupon code copied!");
                                setShowSpinWheel(false);
                              }}
                              className="px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-slate-950 rounded-lg text-[10px] font-bold"
                            >
                              Copy Code
                            </button>
                            <button
                              onClick={() => {
                                setSpinResult(null);
                                setIsSpinning(false);
                              }}
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold"
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
                            }, 1800);
                          }}
                          disabled={isSpinning}
                          className="px-6 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-slate-950 hover:text-white rounded-xl text-xs font-black transition-all shadow-md disabled:opacity-50"
                        >
                          {isSpinning ? "SPINNING..." : "SPIN THE WHEEL!"}
                        </button>
                      )}
                    </div>
                  )}

                        <div className="key-phone-preview__home-bar" aria-hidden />
                </div>
              </div>
            </div>
                  <div className="key-phone-preview__side-key key-phone-preview__side-key--power" aria-hidden />
          </div>
        </div>
            </div>
          </div>

          {showCoverUrlModal && (
            <div
              className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
              onClick={() => setShowCoverUrlModal(false)}
              role="presentation"
            >
              <div
                className="bg-white rounded-3xl max-w-md w-full p-4 shadow-2xl border border-gray-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-lg text-gray-950">Cover Photo URL</h3>
                  <button
                    type="button"
                    onClick={() => setShowCoverUrlModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Paste an image URL to use as your page cover. Changes apply to the live preview instantly.
                </p>
                {editorCoverPhoto.startsWith("data:") && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">
                    You uploaded a file. Applying a URL will replace the uploaded cover.
                  </p>
                )}
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Cover Photo URL (Alternative)
                </label>
                <input
                  type="url"
                  value={coverUrlDraft}
                  onChange={(e) => setCoverUrlDraft(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-xl py-2.5 px-3 text-xs text-slate-800 font-mono mb-4"
                  placeholder="https://images.unsplash.com/..."
                  autoFocus
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCoverUrlDraft(DEFAULT_COVER);
                      setEditorCoverPhoto(DEFAULT_COVER);
                      setShowCoverUrlModal(false);
                      triggerToast("Cover photo reset to default.");
                    }}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Reset Default
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = coverUrlDraft.trim();
                      if (!trimmed) {
                        triggerToast("Enter a valid image URL.");
                        return;
                      }
                      setEditorCoverPhoto(trimmed);
                      setShowCoverUrlModal(false);
                      triggerToast("Cover photo URL updated!");
                    }}
                    className="flex-1 rounded-xl bg-[#591bd9] hover:bg-[#4a16b8] px-3 py-2.5 text-xs font-bold text-white transition-colors"
                  >
                    Apply URL
                  </button>
                </div>
              </div>
            </div>
          )}

          {showSaveTemplateModal && (
            <div
              className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
              onClick={() => setShowSaveTemplateModal(false)}
              role="presentation"
            >
              <div
                className="bg-white rounded-3xl max-w-md w-full p-4 shadow-2xl border border-gray-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-display font-bold text-lg text-gray-950">
                    {linkedTemplateId ? "Update Template" : "Save as Template"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowSaveTemplateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    confirmSaveAsTemplate();
                  }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                      TEMPLATE NAME
                    </label>
                    <input
                      type="text"
                      value={templateNameInput}
                      onChange={(e) => setTemplateNameInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#6366f1] rounded-xl py-2.5 px-3.5 text-sm text-gray-900 focus:outline-none"
                      placeholder="e.g. Summer Sale Landing"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Saves title, bio, cover, blocks, and settings to Templates → My Templates.
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSaveTemplateModal(false)}
                      className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-sm font-semibold"
                    >
                      {linkedTemplateId ? "Update Template" : "Save Template"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

          {toast && (
            <div className="key-editor-toast fixed bottom-6 right-6 z-[120] bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-indigo-500/40 animate-in fade-in slide-in-from-bottom-5 duration-300">
              <span className="text-sm font-bold">{toast}</span>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* 4th - QR Code Customizer Popup Modal matching screenshot 3 perfectly */}
      {selectedQRPage && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 shadow-2xl border border-gray-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-gray-900 text-lg">
                QR — {selectedQRPage.title}
              </h3>
              <button
                onClick={() => setSelectedQRPage(null)}
                className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* QR display box */}
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center border border-slate-100 relative shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=${qrForeground.replace(
                    "#",
                    ""
                  )}&bgcolor=${qrBackground.replace("#", "")}&data=${encodeURIComponent(selectedQRPageLink?.shareUrl || "")}`}
                  alt="QR Code"
                  referrerPolicy="no-referrer"
                  className="w-44 h-44 rounded-lg shadow bg-white"
                />

                {/* Logo watermark option if selected */}
                {hasLogo && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-9 h-9 bg-white p-1 rounded-lg border border-gray-200 shadow-md flex items-center justify-center">
                      <span className="text-[10px] font-extrabold text-[#6366f1]">1SL</span>
                    </div>
                  </div>
                )}
              </div>

              {/* URL label under QR */}
              <div className="mt-3 flex flex-col items-center gap-1.5 max-w-sm w-full">
                <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg truncate w-full text-center">
                  {selectedQRPageLink?.displayLabel || ""}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    void copyText(
                      selectedQRPageLink?.shareUrl || "",
                      "🔗 Public shareable link copied!"
                    );
                  }}
                  className="bg-indigo-500/100 hover:bg-indigo-400 text-white font-bold py-1 px-3 rounded-lg text-[10px] transition-colors"
                >
                  Copy Share Link
                </button>
              </div>
            </div>

            {/* Color palette selector matching mockup */}
            <div className="mb-4">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                COLOR PRESETS
              </span>
              <div className="flex flex-wrap gap-2">
                {["Default", "Orange", "Dark", "Navy", "Purple", "Green", "Gold"].map((colorName) => (
                  <button
                    key={colorName}
                    onClick={() => handleColorSelect(colorName)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      qrColor === colorName
                        ? "border-[#6366f1] bg-indigo-500/10 text-[#6366f1]"
                        : "border-gray-200 hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <span
                      className="h-3 w-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: COLOR_MAP[colorName] }}
                    />
                    <span>{colorName}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* QR Pattern Design selector */}
            <div className="mb-4">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                DESIGN STYLES
              </span>
              <div className="grid grid-cols-4 gap-2">
                {["Squares", "Rounded", "Dots", "Fluid"].map((style) => (
                  <button
                    key={style}
                    onClick={() => setQrDesign(style as any)}
                    className={`p-2.5 rounded-2xl text-center border transition-all ${
                      qrDesign === style
                        ? "border-[#6366f1] bg-indigo-500/10 text-[#6366f1] font-extrabold"
                        : "border-gray-200 hover:bg-gray-50 text-gray-500 text-xs"
                    }`}
                  >
                    <div className="font-bold text-xs">{style}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Hex Colors customization swatches */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Foreground
                </label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl p-2.5 bg-slate-50">
                  <input
                    type="color"
                    value={qrForeground}
                    onChange={(e) => {
                      setQrForeground(e.target.value);
                      setQrColor("Custom");
                    }}
                    className="w-6 h-6 rounded-md border-0 p-0 cursor-pointer overflow-hidden"
                  />
                  <span className="text-xs font-mono font-bold text-gray-700 uppercase">
                    {qrForeground}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Background
                </label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl p-2.5 bg-slate-50">
                  <input
                    type="color"
                    value={qrBackground}
                    onChange={(e) => setQrBackground(e.target.value)}
                    className="w-6 h-6 rounded-md border-0 p-0 cursor-pointer overflow-hidden"
                  />
                  <span className="text-xs font-mono font-bold text-gray-700 uppercase">
                    {qrBackground}
                  </span>
                </div>
              </div>
            </div>

            {/* Watermark Logo upload option button */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setHasLogo(!hasLogo)}
                className={`w-full flex items-center justify-center gap-2 border py-2.5 rounded-xl text-xs font-bold transition-all ${
                  hasLogo
                    ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                    : "border-gray-200 hover:bg-gray-50 text-gray-600"
                }`}
              >
                <span>↑</span>
                <span>{hasLogo ? "Remove KEYLINK360 Watermark" : "Add KEYLINK360 Logo Watermark"}</span>
              </button>
            </div>

            {/* Download actions matching third screenshot */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&color=${qrForeground.replace(
                  "#",
                  ""
                )}&bgcolor=${qrBackground.replace("#", "")}&data=${encodeURIComponent(selectedQRPageLink?.shareUrl || "")}`}
                download="qrcode.png"
                target="_blank"
                rel="noreferrer"
                className="bg-gradient-to-r from-[#6366f1] to-[#7c3aed] hover:from-[#4f46e5] hover:to-[#6d28d9] text-white py-3 rounded-xl text-xs font-bold text-center shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span>Download PNG</span>
              </a>

              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&color=${qrForeground.replace(
                  "#",
                  ""
                )}&bgcolor=${qrBackground.replace("#", "")}&format=svg&data=${encodeURIComponent(selectedQRPageLink?.shareUrl || "")}`}
                download="qrcode.svg"
                target="_blank"
                rel="noreferrer"
                className="border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4 text-gray-400" />
                <span>Download SVG</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {toast && !selectedEditPage && (
        <div className="fixed bottom-6 right-6 z-[200] bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <span className="text-sm font-bold">{toast}</span>
        </div>
      )}
    </PageShell>
  );
}
