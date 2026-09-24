import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { screenToPath } from "../navigation";
import { ScreenId } from "../types";
import type { BioPage, BioPageDraft, BioPageTemplate, BioEditorState, BioEditorBlock, BlockDeveloperStyles, BioPagePreviewTheme, BioPagePreviewDetails, BioCoverPhotoSettings, CustomDomain, PlatformSubdomain, DeviceViewportMode, DeviceTargetScope } from "../types";
import BlockStyleInspector from "./bio/BlockStyleInspector";
import BuilderStructureTree from "./bio/BuilderStructureTree";
import InlineEditableText from "./bio/InlineEditableText";
import { computeBlockInlineStyles, getBlockCustomMeta } from "../lib/blockStyleHelper";
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
import { normalizePageTheme, getBioPageThemeClass, getBioPageThemeStyle, BIO_PAGE_THEME_PRESETS } from "../lib/bioPageThemes";
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
  createDefaultSplitHeroFields,
  createDefaultVideoHeroFields,
  createDefaultGlowBadgeFields,
  createDefaultFeatureHeroFields,
  createDefaultTogglePricingFields,
  createDefaultProductShowcaseFields,
  createDefaultComparisonTableFields,
  createDefaultPaymentButtonFields,
  createDefaultBrandLogosFields,
  createDefaultStarRatingsFields,
  createDefaultPressMentionsFields,
  createDefaultBeforeAfterFields,
  createDefaultPortfolioFields,
  createDefaultVideoShowcaseFields,
  createDefaultAudioPlayerFields,
  createDefaultMultiStepFormFields,
  createDefaultLeadMagnetFields,
  createDefaultMeetingBookerFields,
  createDefaultNewsletterFields,
  createDefaultNavbarFields,
  createDefaultFooterFields,
  createDefaultMainFeatureFields,
  createDefaultAutoSliderFields,
  createDefaultGoogleFormFields,
  createDefaultFlashOfferFields,
  createDefaultCommunityHubFields,
  createDefaultYouTubeChannelFields,
  createDefaultInstagramFeedFields,
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
import BioAiChatWidget from "./bio/BioAiChatWidget";
import InteractiveSetupGuideModal from "./guides/InteractiveSetupGuideModal";
import DeviceMockupFrame from "./bio/DeviceMockupFrame";
import PhoneSimulatorToolbar from "./bio/PhoneSimulatorToolbar";
import VisibleDevicesDrawer from "./bio/VisibleDevicesDrawer";
import PublicBioPageView from "./PublicBioPageView";
import { DEVICE_CATALOG, DEFAULT_DEVICE, type DeviceSpec } from "../data/deviceCatalog";
import { DEFAULT_COVER_SETTINGS, normalizeCoverSettings } from "../lib/bioCoverPhoto";
import {
  Zap,
  RefreshCw,
  Plus,
  Smartphone,
  Bot,
  BookOpen,
  Copy,
  BarChart2,
  Edit3,
  QrCode,
  ExternalLink,
  Trash2,
  Check,
  X,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Sliders,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
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
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Palette,
  Globe,
  Image as ImageIcon,
  LayoutGrid,
  LayoutTemplate,
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
  Unlock,
  Tablet,
  Laptop,
  Monitor,
  Maximize2,
  PanelLeft,
  CheckCircle,
  BookmarkCheck,
  Target,
  CreditCard
} from "lucide-react";
import PageShell, { PageHeader, StatCard, StatCardGrid, Workspace } from "./layout/PageShell";
import { AppTheme, ALL_THEMES, getStoredTheme, saveTheme } from "../lib/themeStorage";
import PersonalizationModal from "./PersonalizationModal";

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

  // Reactive UI Theme sync across all 7 visual modes
  const [currentUiTheme, setCurrentUiTheme] = React.useState<AppTheme>(() => theme || getStoredTheme());
  const [isStudioPersonalizationOpen, setIsStudioPersonalizationOpen] = React.useState(false);

  React.useEffect(() => {
    if (theme) {
      setCurrentUiTheme(theme);
    }
  }, [theme]);

  React.useEffect(() => {
    const onThemeSync = (e: any) => {
      const nextTheme = (e?.detail || getStoredTheme()) as AppTheme;
      if (nextTheme) {
        setCurrentUiTheme(nextTheme);
      }
    };
    window.addEventListener("keylink360_theme_change", onThemeSync);
    window.addEventListener("storage", onThemeSync);
    return () => {
      window.removeEventListener("keylink360_theme_change", onThemeSync);
      window.removeEventListener("storage", onThemeSync);
    };
  }, []);

  const handleApplyStudioTheme = React.useCallback((nextTheme: AppTheme) => {
    setCurrentUiTheme(nextTheme);
    saveTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    document.documentElement.classList.remove(
      "key-theme-light",
      "key-theme-dark",
      "key-theme-eyevision",
      "key-theme-cyberpunk",
      "key-theme-luxury",
      "key-theme-synthwave",
      "key-theme-matrix"
    );
    document.documentElement.classList.add(`key-theme-${nextTheme}`);
    window.dispatchEvent(new CustomEvent("keylink360_theme_change", { detail: nextTheme }));
  }, []);

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
  const [revealedActionRowId, setRevealedActionRowId] = useState<string | null>(null);
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<Set<string>>(() => new Set());
  const platformBulkMenuRef = useRef<HTMLDivElement>(null);
  const editorExitingRef = useRef(false);
  const editorCloseConfirmOpenRef = useRef(false);

  React.useEffect(() => {
    if (!revealedActionRowId) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".key-list-row")) {
        setRevealedActionRowId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [revealedActionRowId]);

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

  // Multi-Device Viewport & Scope states
  const [viewportMode, setViewportMode] = useState<DeviceViewportMode>("mobile");
  const [viewportZoom, setViewportZoom] = useState<"fit" | number>("fit");
  const [editorDeviceScope, setEditorDeviceScope] = useState<DeviceTargetScope>("all_devices");
  const [isTargetDevicesCustomEnabled, setIsTargetDevicesCustomEnabled] = useState<boolean>(false);
  const [settingsSubPanel, setSettingsSubPanel] = useState<"root" | "seo" | "payment" | "ai" | "devices" | "thanks">("root");
  const [seoIndexingEnabled, setSeoIndexingEnabled] = useState<boolean>(true);
  const [editorMetaDescription, setEditorMetaDescription] = useState<string>("Official Marvel-Inspired Toys & Collectibles. Safe, fun & exciting toys for young superheroes.");
  const [isThankYouEnabled, setIsThankYouEnabled] = useState<boolean>(true);

  // Modern Studio Nav Tab & Sliding Sidebar states
  const [studioNavTab, setStudioNavTab] = useState<
    "menu" | "library" | "layers" | "inspector" | "theme" | "thanks" | "settings" | "drafts"
  >("menu");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isDrawerOpen = isSidebarOpen;
  const setIsDrawerOpen = setIsSidebarOpen;
  const [selectedCanvasBlockId, setSelectedCanvasBlockId] = useState<string | null>(null);
  const [blockLibrarySearch, setBlockLibrarySearch] = useState("");
  const [blockLibraryCategory, setBlockLibraryCategory] = useState<string>("all");

  // Bricks Builder & Blocks Edit Developer States
  const [inspectorTab, setInspectorTab] = useState<"content" | "style">("content");
  const [isPreviewOnlyMode, setIsPreviewOnlyMode] = useState<boolean>(false);
  const [isThemePopoverOpen, setIsThemePopoverOpen] = useState<boolean>(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceSpec>(DEFAULT_DEVICE);
  const [isDeviceDrawerOpen, setIsDeviceDrawerOpen] = useState<boolean>(false);
  const [isLandscape, setIsLandscape] = useState<boolean>(false);
  const [mockupFrameFinish, setMockupFrameFinish] = useState<string>("auto");
  const [showSimulatorToolbar, setShowSimulatorToolbar] = useState<boolean>(false);
  const [isGlobalPreviewOpen, setIsGlobalPreviewOpen] = useState<boolean>(false);
  const [isTargetScopePopoverOpen, setIsTargetScopePopoverOpen] = useState<boolean>(false);

  // Canvas Block Drag-to-Reorder and Drag-Outside-to-Delete States
  const [draggingCanvasBlockId, setDraggingCanvasBlockId] = useState<string | null>(null);
  const [dragOverCanvasBlockId, setDragOverCanvasBlockId] = useState<string | null>(null);
  const [isDraggingOutsidePreview, setIsDraggingOutsidePreview] = useState<boolean>(false);

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

  // AI Sales & Support Assistant States
  const [aiAssistantEnabled, setAiAssistantEnabled] = useState(false);
  const [aiBotName, setAiBotName] = useState("AI Sales Assistant");
  const [aiWelcomeMessage, setAiWelcomeMessage] = useState(
    "👋 Hi! How can I help you explore our products, pricing, or services today?"
  );
  const [aiBusinessName, setAiBusinessName] = useState("");
  const [aiBusinessDescription, setAiBusinessDescription] = useState("");
  const [aiContactPhone, setAiContactPhone] = useState("");
  const [aiContactEmail, setAiContactEmail] = useState("");
  const [aiPrimaryColor, setAiPrimaryColor] = useState("#6366f1");
  const [aiAutoLeadCapture, setAiAutoLeadCapture] = useState(true);
  const [aiCustomFaqs, setAiCustomFaqs] = useState<Array<{ question: string; answer: string }>>([
    { question: "How to order / buy?", answer: "Click on any of the product buttons on our bio page or chat with us on WhatsApp!" }
  ]);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

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
    setCanvasBlocks((prev) => {
      const next = prev.map((b) => {
        if (b.id !== blockId) return b;
        if (field === "headline") {
          return { ...b, headline: value, label: value };
        }
        if (field === "subheadline") {
          return { ...b, subheadline: value, value: value };
        }
        return { ...b, [field]: value };
      });
      if (selectedEditPage) {
        try {
          localStorage.setItem(`biolink_blocks_${selectedEditPage.id}`, JSON.stringify(next));
          if (selectedEditPage.slug) {
            localStorage.setItem(`biolink_blocks_${selectedEditPage.slug}`, JSON.stringify(next));
          }
          window.dispatchEvent(
            new CustomEvent("key-page-preview-updated", {
              detail: { pageId: selectedEditPage.id, pageSlug: selectedEditPage.slug, blocks: next }
            })
          );
        } catch {
          /* ignore quota */
        }
      }
      return next;
    });
  };

  const handleUpdateBlockStyles = (blockId: string, styles: BlockDeveloperStyles) => {
    setCanvasBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, styles } : b))
    );
  };

  const handleToggleBlockLock = (blockId: string) => {
    setCanvasBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b;
        const nextLock = !Boolean(b.isLocked || (b as any).styles?.isLocked);
        return {
          ...b,
          isLocked: nextLock,
          styles: { ...((b as any).styles || {}), isLocked: nextLock }
        };
      })
    );
    triggerToast("Component lock updated.");
  };

  const handleToggleBlockHidden = (blockId: string) => {
    setCanvasBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b;
        const nextHidden = !Boolean(b.isHidden || (b as any).styles?.isHidden);
        return {
          ...b,
          isHidden: nextHidden,
          styles: { ...((b as any).styles || {}), isHidden: nextHidden }
        };
      })
    );
    triggerToast("Component visibility updated.");
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
        status: "completed",
        stage: "workspace_activity",
        title: linkedTemplateId ? "Template Updated" : "Template Saved",
        message: `"${name}" with ${editorBlocks.length} block(s) is saved to workspace templates.`,
        targetScreen: ScreenId.TEMPLATES,
        actionLabel: "View Templates"
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
      },
      {
        enabled: aiAssistantEnabled,
        botName: aiBotName,
        welcomeMessage: aiWelcomeMessage,
        businessName: aiBusinessName || editorTitle,
        businessDescription: aiBusinessDescription || editorBio,
        contactPhone: aiContactPhone,
        contactEmail: aiContactEmail,
        primaryColor: aiPrimaryColor,
        autoLeadCapture: aiAutoLeadCapture,
        customFaqs: aiCustomFaqs
      },
      editorDeviceScope,
      isTargetDevicesCustomEnabled
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
      deviceScope: editorDeviceScope,
      targetDevicesCustomEnabled: isTargetDevicesCustomEnabled,
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
          }),
      aiAssistant: {
        enabled: aiAssistantEnabled,
        botName: aiBotName,
        welcomeMessage: aiWelcomeMessage,
        businessName: aiBusinessName || editorTitle,
        businessDescription: aiBusinessDescription || editorBio,
        contactPhone: aiContactPhone,
        contactEmail: aiContactEmail,
        primaryColor: aiPrimaryColor,
        autoLeadCapture: aiAutoLeadCapture,
        customFaqs: aiCustomFaqs
      }
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
    isInlineEditingAllowed: !showThanksPage,
    onInlineTextChange: (blockId, field, value) => {
      handleUpdateBlockField(blockId, field, value);
      triggerToast("✨ Saved inline edit!");
    },
    onSelectElement: (blockId, fieldToFocus) => {
      setSelectedCanvasBlockId(blockId);
      setExpandedBlockId(blockId);
      setStudioNavTab("inspector");
      setInspectorTab("content");
      setIsDrawerOpen(true);
      const el = document.getElementById(`editor-block-${blockId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
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

    const ai = state?.pageMeta.aiAssistant || details?.aiAssistant;
    if (ai) {
      setAiAssistantEnabled(Boolean(ai.enabled));
      if (ai.botName) setAiBotName(ai.botName);
      if (ai.welcomeMessage) setAiWelcomeMessage(ai.welcomeMessage);
      if (ai.businessName) setAiBusinessName(ai.businessName);
      if (ai.businessDescription) setAiBusinessDescription(ai.businessDescription);
      if (ai.contactPhone) setAiContactPhone(ai.contactPhone);
      if (ai.contactEmail) setAiContactEmail(ai.contactEmail);
      if (ai.primaryColor) setAiPrimaryColor(ai.primaryColor);
      if (typeof ai.autoLeadCapture === "boolean") setAiAutoLeadCapture(ai.autoLeadCapture);
      if (Array.isArray(ai.customFaqs) && ai.customFaqs.length > 0) setAiCustomFaqs(ai.customFaqs);
    } else {
      setAiAssistantEnabled(false);
    }
  };

  const hydrateEditorFromState = (state: BioEditorState) => {
    setEditorTitle(state.pageMeta.title);
    setEditorHandle(state.pageMeta.handle || "");
    setEditorBio(state.pageMeta.shortBio);
    setEditorCoverPhoto(state.pageMeta.coverImage);
    setEditorCoverSettings(normalizeCoverSettings(state.pageMeta.coverSettings));
    setEditorPageTheme(normalizePageTheme(state.pageMeta.pageTheme));
    setEditorDeviceScope(state.pageMeta.deviceScope ?? "all_devices");
    setIsTargetDevicesCustomEnabled(Boolean(state.pageMeta.targetDevicesCustomEnabled));
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
    setEditorDeviceScope(details?.deviceScope ?? page.deviceScope ?? "all_devices");
    setIsTargetDevicesCustomEnabled(Boolean(details?.targetDevicesCustomEnabled ?? page.targetDevicesCustomEnabled));
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
      deviceScope: editorDeviceScope,
      targetDevicesCustomEnabled: isTargetDevicesCustomEnabled,
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
            deviceScope: editorDeviceScope,
            targetDevicesCustomEnabled: isTargetDevicesCustomEnabled,
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
        status: "pending",
        stage: "before_build",
        title: "Draft Saved · Pending Publish",
        message: `Edits to "${editorTitle}" saved to cloud cache. Pending publish to make live on the web.`,
        targetScreen: ScreenId.BIO_PAGES,
        actionLabel: "Publish Now",
        meta: { pageId }
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
    if (selectedCanvasBlockId === id) {
      setSelectedCanvasBlockId(null);
    }
    if (expandedBlockId === id) {
      setExpandedBlockId(null);
    }
  };

  const handleDuplicateBlock = (blockId: string) => {
    const blockIndex = canvasBlocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return;
    const original = canvasBlocks[blockIndex];
    const newBlock = {
      ...JSON.parse(JSON.stringify(original)),
      id: "block_" + Date.now(),
      label: `${original.label || original.type} (Copy)`
    };
    setCanvasBlocks((prev) => {
      const next = [...prev];
      next.splice(blockIndex + 1, 0, newBlock);
      return next;
    });
    setSelectedCanvasBlockId(newBlock.id);
    setExpandedBlockId(newBlock.id);
    setStudioNavTab("inspector");
    setIsDrawerOpen(true);
    triggerToast(`✨ Duplicated "${original.label || original.type}"!`);
  };

  const handleMoveBlock = (blockId: string, direction: "up" | "down") => {
    const index = canvasBlocks.findIndex((b) => b.id === blockId);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= canvasBlocks.length) return;
    reorderEditorBlocks(index, targetIndex, direction === "up" ? "before" : "after");
  };

  const handleReorderCanvasBlock = (sourceBlockId: string, targetBlockId: string, position: "before" | "after") => {
    if (sourceBlockId === targetBlockId) return;
    const sourceIndex = canvasBlocks.findIndex((b) => b.id === sourceBlockId);
    const targetIndex = canvasBlocks.findIndex((b) => b.id === targetBlockId);
    if (sourceIndex === -1 || targetIndex === -1) return;
    reorderEditorBlocks(sourceIndex, targetIndex, position);
    triggerToast("✨ Component reordered in preview!");
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
      case "Split Hero":
        label = "Split Hero Banner";
        value = "Split Hero";
        extraFields = createDefaultSplitHeroFields();
        break;
      case "Video Hero":
        label = "Video Hero Header";
        value = "Video Hero";
        extraFields = createDefaultVideoHeroFields();
        break;
      case "Glow Badge":
        label = "Announce Badge";
        value = "Glow Badge";
        extraFields = createDefaultGlowBadgeFields();
        break;
      case "Feature Hero":
        label = "Features Overview";
        value = "Feature Hero";
        extraFields = createDefaultFeatureHeroFields();
        break;
      case "Toggle Pricing":
        label = "Monthly / Annual Pricing";
        value = "Toggle Pricing";
        extraFields = createDefaultTogglePricingFields();
        break;
      case "Product Showcase":
        label = "Featured Product";
        value = "Product Showcase";
        extraFields = createDefaultProductShowcaseFields();
        break;
      case "Comparison Table":
        label = "Feature Comparison";
        value = "Comparison Table";
        extraFields = createDefaultComparisonTableFields();
        break;
      case "Payment Button":
        label = "Pay Now Instant";
        value = "Payment Button";
        extraFields = createDefaultPaymentButtonFields();
        break;
      case "Brand Logos":
        label = "Trusted Brands Marquee";
        value = "Brand Logos";
        extraFields = createDefaultBrandLogosFields();
        break;
      case "Star Ratings":
        label = "Customer Ratings & Reviews";
        value = "Star Ratings";
        extraFields = createDefaultStarRatingsFields();
        break;
      case "Press Mentions":
        label = "Featured In Media";
        value = "Press Mentions";
        extraFields = createDefaultPressMentionsFields();
        break;
      case "Before/After Slider":
        label = "Before & After Results";
        value = "Before/After Slider";
        extraFields = createDefaultBeforeAfterFields();
        break;
      case "Portfolio Gallery":
        label = "Portfolio Showcase";
        value = "Portfolio Gallery";
        extraFields = createDefaultPortfolioFields();
        break;
      case "Video Showcase":
        label = "Video Course / Playlist";
        value = "Video Showcase";
        extraFields = createDefaultVideoShowcaseFields();
        break;
      case "Audio Player":
        label = "Podcast / Track Player";
        value = "Audio Player";
        extraFields = createDefaultAudioPlayerFields();
        break;
      case "Multi-Step Form":
        label = "Multi-Step Lead Wizard";
        value = "Multi-Step Form";
        extraFields = createDefaultMultiStepFormFields();
        break;
      case "Lead Magnet":
        label = "Free Ebook Download";
        value = "Lead Magnet";
        extraFields = createDefaultLeadMagnetFields();
        break;
      case "Meeting Booker":
        label = "Book a 1-on-1 Call";
        value = "Meeting Booker";
        extraFields = createDefaultMeetingBookerFields();
        break;
      case "Newsletter Box":
        label = "Join Email Newsletter";
        value = "Newsletter Box";
        extraFields = createDefaultNewsletterFields();
        break;
      case "Navbar":
        label = "Floating Glass Navbar";
        value = "Navbar";
        extraFields = createDefaultNavbarFields();
        break;
      case "Footer":
        label = "Modern Page Footer";
        value = "Footer";
        extraFields = createDefaultFooterFields();
        break;
      case "Main Feature":
        label = "Core Features Grid";
        value = "Main Feature";
        extraFields = createDefaultMainFeatureFields();
        break;
      case "Auto Slider":
        label = "Auto Carousel Slider";
        value = "Auto Slider";
        extraFields = createDefaultAutoSliderFields();
        break;
      case "Google Form":
        label = "Inquiry & Google Form";
        value = "Google Form";
        extraFields = createDefaultGoogleFormFields();
        break;
      case "Flash Offer":
        label = "Flash Sale Offer";
        value = "Flash Offer";
        extraFields = createDefaultFlashOfferFields();
        break;
      case "Community Hub":
        label = "VIP Community Hub";
        value = "Community Hub";
        extraFields = createDefaultCommunityHubFields();
        break;
      case "YouTube Channel":
        label = "YouTube Showcase";
        value = "YouTube Channel";
        extraFields = createDefaultYouTubeChannelFields();
        break;
      case "Instagram Feed":
        label = "Instagram Photo Grid";
        value = "Instagram Feed";
        extraFields = createDefaultInstagramFeedFields();
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
    setSelectedCanvasBlockId(id);
    setExpandedBlockId(id);
    setStudioNavTab("inspector");
    setIsDrawerOpen(true);
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
      onNotify({
        type: "page_deleted",
        status: "canceled",
        stage: "workspace_activity",
        title: "Page Deleted",
        message: `"${page.title}" was permanently removed from your workspace.`,
        targetScreen: ScreenId.BIO_PAGES
      });
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
        <span
          title={link.shareUrl || blockedTitle}
          className={`text-xs font-medium flex items-center gap-1 font-mono min-w-0 max-w-full cursor-default select-text ${
            unpublished
              ? "text-slate-400 dark:text-slate-500"
              : link.kind === "custom"
                ? "text-emerald-600 dark:text-emerald-400"
                : link.kind === "keys_subdomain"
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-indigo-600 dark:text-indigo-400"
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
    const isActionsRevealed = revealedActionRowId === page.id;

    const effectiveScope =
      page.deviceScope ||
      readStoredPageDetails(page.id, page.slug)?.deviceScope ||
      "auto_adaptive";

    return (
      <div
        key={page.id}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (
            target.closest("button") ||
            target.closest("input") ||
            target.closest("label") ||
            target.closest("a")
          ) {
            return;
          }
          setRevealedActionRowId((prev) => (prev === page.id ? null : page.id));
        }}
        className={`key-list-row min-w-0 cursor-pointer transition-all ${
          publicLink.kind === "custom" ? "key-list-row--custom-domain" : publicLink.kind === "keys_subdomain" ? "key-list-row--custom-domain" : ""
        } ${isSelected ? "key-list-row--selected" : ""} ${showSelection ? "key-list-row--bulk-select" : ""}`}
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
                : effectiveScope === "all_devices"
                  ? "bg-amber-500/10 text-amber-600"
                  : effectiveScope === "mobile_tablet_laptop"
                    ? "bg-purple-500/10 text-purple-600"
                    : effectiveScope === "mobile_tablet"
                      ? "bg-cyan-500/10 text-cyan-600"
                      : effectiveScope === "mobile_only"
                        ? "bg-blue-500/10 text-blue-600"
                        : "bg-indigo-500/10 text-indigo-500"
            }`}
            title={`Optimized for: ${
              effectiveScope === "all_devices"
                ? "All Devices (Desktop & TV)"
                : effectiveScope === "mobile_tablet_laptop"
                  ? "Mobile + Tablets + Laptops"
                  : effectiveScope === "mobile_tablet"
                    ? "Mobile + Tablets"
                    : effectiveScope === "mobile_only"
                      ? "Mobile Phone Only"
                      : "Smart Fluid (Universal)"
            }`}
          >
            {publicLink.kind === "custom" ? (
              <Globe className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : effectiveScope === "all_devices" ? (
              <Monitor className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : effectiveScope === "mobile_tablet_laptop" ? (
              <Laptop className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : effectiveScope === "mobile_tablet" ? (
              <Tablet className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : effectiveScope === "mobile_only" ? (
              <Smartphone className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
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
                <h4 className="font-display font-semibold text-base truncate" style={{ color: "var(--key-text)" }}>{page.title}</h4>
                {rowOptions?.showDuplicateBadge && (
                  <span className="key-bio-page-duplicate-badge shrink-0">Duplicate</span>
                )}
                {effectiveScope === "all_devices" ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0">
                    🖥️ All Devices
                  </span>
                ) : effectiveScope === "mobile_tablet_laptop" ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20 shrink-0">
                    💻 Laptop Ready
                  </span>
                ) : effectiveScope === "mobile_tablet" ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
                    📟 Mobile + Tablet
                  </span>
                ) : effectiveScope === "mobile_only" ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 shrink-0">
                    📱 Phone Only
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                    🌐 Universal
                  </span>
                )}
                <button onClick={() => startEditing(page)} className="text-gray-400 hover:text-gray-600">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {renderBioPagePublicLink(page)}
          </div>
        </div>

        {/* Right side: In-place Slider Reveal */}
        <div className={`key-thunder-slider-wrap w-full lg:w-auto lg:flex-nowrap lg:shrink-0 ${showSelection ? "" : "pl-14 lg:pl-0"}`}>
          {!isActionsRevealed ? (
            /* Normal State: 3 Options (Views, Date, Live) - NO 3-dots button */
            <div
              className="key-thunder-slider-stats flex items-center gap-3 sm:gap-4 lg:gap-5"
              title="Click anywhere to reveal page action keys"
            >
              {/* 1st: Views */}
              <div className="text-center shrink-0 w-[56px]">
                <span className="font-display font-bold text-2xl block leading-none" style={{ color: "var(--key-text)" }}>{page.views}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider block mt-1" style={{ color: "var(--key-text-muted)" }}>Views</span>
              </div>

              {/* 2nd: Created Date - exactly 2 lines: date on line 1, CREATED on line 2 */}
              <div className="text-center hidden sm:block shrink-0 w-[86px]">
                <span className="font-sans font-medium text-xs font-mono block leading-none whitespace-nowrap" style={{ color: "var(--key-text-muted)" }}>{page.createdAt}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider block mt-1" style={{ color: "var(--key-text-muted)" }}>Created</span>
              </div>

              {/* 3rd: Status / Live Badge */}
              <div className="shrink-0 w-[74px] flex justify-center">
                {page.status === "Live" ? (
                  <span className="key-thunder-status-live">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Live
                  </span>
                ) : page.status === "Paused" ? (
                  <span className="key-thunder-status-paused">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Paused
                  </span>
                ) : (
                  <span className="key-thunder-status-draft">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    Draft
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* Active Slider State: 3 Options hide, 7 Action Keys slide in smoothly! */
            <div
              className="key-thunder-slider-actions"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="key-thunder-row-actions">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAnalyticsPage(page);
                  }}
                  title={`Analytics — ${page.title}`}
                  className="key-thunder-action-btn key-thunder-action-btn--analytics"
                >
                  <BarChart2 className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openEditor(page);
                  }}
                  title="Edit Studio"
                  className="key-thunder-action-btn key-thunder-action-btn--edit"
                >
                  <Edit3 className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDuplicatePage(page.id);
                  }}
                  title="Duplicate Page"
                  className="key-thunder-action-btn key-thunder-action-btn--duplicate"
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
                  title={`QR Code Studio — ${page.title}`}
                  className="key-thunder-action-btn key-thunder-action-btn--qr"
                >
                  <QrCode className="h-4.5 w-4.5" />
                </button>
                {publicLink.canOpen ? (
                  <a
                    href={publicLink.openUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Open Live Public Link"
                    className="key-thunder-action-btn key-thunder-action-btn--open"
                  >
                    <ExternalLink className="h-4.5 w-4.5" />
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="Publish this page before visitors can open it"
                    className="key-thunder-action-btn opacity-30 cursor-not-allowed"
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
                  title="Copy Public Share Link"
                  className={`key-thunder-action-btn ${
                    page.status !== "Live"
                      ? "opacity-40 hover:opacity-70"
                      : "key-thunder-action-btn--share"
                  }`}
                >
                  <Copy className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmDeletePage(page);
                  }}
                  title="Delete Bio Page"
                  className="key-thunder-action-btn key-thunder-action-btn--delete"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Slider close key button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setRevealedActionRowId(null);
                }}
                title="Close action keys (back to stats)"
                className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 text-slate-400 hover:text-[var(--key-text)] transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
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
      onNotify({
        type: "general",
        status: "canceled",
        stage: "before_build",
        title: "Editor Session Canceled",
        message: `Uncommitted session for "${selectedEditPage?.title || "Page"}" was canceled and discarded.`,
        targetScreen: ScreenId.BIO_PAGES
      });
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

    onNotify({
      type: "page_created",
      status: "proceed",
      stage: "before_build",
      title: "Site Initialized · Ready to Build",
      message: `"${newlyCreatedPage.title}" created. 50+ pro blocks and responsive canvas ready.`,
      targetScreen: ScreenId.BIO_PAGES,
      actionLabel: "Edit in Studio",
      meta: { pageId: newlyCreatedPage.id }
    });

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
    onNotify({
      type: "general",
      status: "processing",
      stage: "building",
      title: "Building Site Assets",
      message: `Compiling ${editorBlocks.length} block(s), responsive layout (${editorDeviceScope}), and deploying to cloud CDN...`,
      targetScreen: ScreenId.BIO_PAGES,
      meta: { pageId: selectedEditPage.id }
    });
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
        status: "completed",
        stage: "after_publish",
        title: "Site Published & Live",
        message:
          details.paymentEnabled && details.paymentAmountInr
            ? `"${editorTitle}" is live and delivered to public visitors · Form Pay ₹${details.paymentAmountInr} enabled.`
            : `"${editorTitle}" is live and delivered across ${editorDeviceScope.replace(/_/g, " ")}.`,
        targetScreen: ScreenId.BIO_PAGES,
        actionLabel: "Open Live Site",
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
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors bg-white dark:bg-[var(--key-surface)] dark:border-[var(--key-border)] dark:text-[var(--key-text)] shadow-sm cursor-pointer"
            >
              <RefreshCw className={`h-4.5 w-4.5 text-gray-400 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => openCreatePageModal()}
              className="flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl px-5 py-2.5 text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>New Bio Page</span>
            </button>
          </>
        }
      />

      <div data-aos="fade-up" className="mb-6">
        <StatCardGrid>
          <StatCard label="TOTAL" value={historyPages.length} sub="all-time" />
          <StatCard
            label="TOTAL VIEWS"
            value={pages.reduce((acc, p) => acc + (Number(p.views) || 0), 0).toLocaleString()}
            sub="across all pages"
          />
          <StatCard
            label="LIVE PAGES"
            value={pages.filter((p) => p.status === "Live").length}
            sub="published"
          />
          <StatCard label="CUSTOM DOMAINS" value={customDomainPages.length} sub="connected" />
        </StatCardGrid>
      </div>

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
                  autoFocus
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
        <div className={`key-bio-editor-portal key-theme-${currentUiTheme}`} data-theme={currentUiTheme}>
          <div className="key-bg-clouds" aria-hidden>
            <span className="key-bg-cloud key-bg-cloud--1" />
            <span className="key-bg-cloud key-bg-cloud--2" />
            <span className="key-bg-cloud key-bg-cloud--3" />
            <span className="key-bg-cloud key-bg-cloud--4" />
            <span className="key-bg-cloud key-bg-cloud--5" />
          </div>
        <div className="key-studio-shell animate-in fade-in duration-200">
          {/* UNIFIED SINGLE STUDIO LEFT SIDEBAR WITH SMOOTH SLIDING PANELS */}
          {isSidebarOpen && !isPreviewOnlyMode && (
            <aside
              className="key-studio-sidebar flex flex-col h-full shrink-0 border-r border-white/[0.08] bg-slate-950/90 backdrop-blur-2xl z-30 transition-all duration-300 relative overflow-hidden text-slate-100 w-full min-w-full max-w-full md:w-[380px] md:min-w-[380px] md:max-w-[380px] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
            {studioNavTab === "menu" ? (
              /* LEVEL 1: MAIN MENU SLIDING VIEW */
              <div className="flex flex-col h-full w-full animate-in fade-in slide-in-from-left-4 duration-200 overflow-hidden">
                {/* Header: Back & Live badge */}
                <div className="key-studio-sidebar__header p-3.5 border-b border-white/[0.08] bg-white/[0.01] shrink-0">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <button
                      type="button"
                      onClick={closeEditor}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-xs font-bold border border-white/[0.08] shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      title="Back to Bio Pages"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 text-slate-400" />
                      <span>Back</span>
                    </button>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Editor Live</span>
                    </span>
                  </div>

                  {/* Heading: keylink360 / [title] */}
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-inner backdrop-blur-md">
                    <span className="text-xs font-semibold text-slate-400 select-none font-mono">keylink360/</span>
                    <input
                      ref={editorTitleInputRef}
                      type="text"
                      value={editorTitle}
                      onChange={(e) => setEditorTitle(e.target.value)}
                      className="key-studio-title-input flex-1 min-w-0 !bg-transparent text-xs font-bold !text-white placeholder-slate-500 focus:outline-none !border-none !shadow-none !ring-0"
                      style={{ background: "transparent", backgroundColor: "transparent", border: "none", boxShadow: "none", color: "#ffffff", outline: "none" }}
                      placeholder="page-title"
                      aria-label="Page Title"
                    />
                    <button
                      type="button"
                      onClick={() => editorTitleInputRef.current?.focus()}
                      className="p-1 hover:bg-white/[0.08] rounded-lg text-slate-400 hover:text-white transition-colors"
                      title="Edit title"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Main Actions: Publish, Save Draft, Save as Template */}
                  <div className="mt-3.5 space-y-2">
                    <button
                      type="button"
                      onClick={handlePublishEditor}
                      disabled={isPublishing}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                    >
                      {isPublishing ? (
                        <Loader className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      <span>{isPublishing ? "Publishing Site..." : "Publish Website"}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isSavingDraft}
                        className="py-2 px-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-indigo-500/40 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm disabled:opacity-60 cursor-pointer"
                      >
                        {isSavingDraft ? <Loader className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 text-indigo-400" />}
                        <span>{isSavingDraft ? "Saving…" : "Save Draft"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAsTemplate}
                        className="py-2 px-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-amber-500/40 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
                      >
                        <LayoutTemplate className="h-3 w-3 text-amber-400" />
                        <span>Save Template</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sidebar Navigation Section Tiles */}
                <nav className="key-studio-sidebar__nav flex-1 overflow-y-auto p-2.5 space-y-1.5 no-scrollbar">
                  {[
                    { id: "library" as const, label: "Add Blocks", desc: "50+ Pro widgets", icon: LayoutGrid, count: "50+ Pro", badgeColor: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" },
                    { id: "layers" as const, label: "Structure Tree", desc: "Reorder & manage", icon: Layers, count: `${canvasBlocks.length}`, badgeColor: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" },
                    { id: "inspector" as const, label: "Block Inspector", desc: "Styles & content", icon: Edit3, count: selectedCanvasBlockId ? "Active" : null, badgeColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" },
                    { id: "theme" as const, label: "Design & Themes", desc: "Colors, fonts & glass", icon: Palette, count: null },
                    { id: "settings" as const, label: "Page Settings", desc: "SEO, screens & thank you", icon: Settings, count: null },
                    { id: "drafts" as const, label: "Saved Templates", desc: "Restore drafts", icon: BookmarkCheck, count: savedDrafts.length > 0 ? `${savedDrafts.length}` : null }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setStudioNavTab(tab.id);
                          if (tab.id === "settings") {
                            setEditorTab("Settings");
                            setShowThanksPage(false);
                          } else {
                            setEditorTab("Edit");
                            setShowThanksPage(false);
                          }
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] backdrop-blur-xl border border-white/[0.07] hover:border-indigo-500/40 text-left transition-all hover:scale-[1.01] active:scale-[0.99] group cursor-pointer shadow-xs hover:shadow-indigo-500/5 shrink-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-xl bg-white/[0.05] group-hover:bg-indigo-600/25 border border-white/[0.08] group-hover:border-indigo-500/40 text-slate-300 group-hover:text-indigo-300 transition-colors shrink-0">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">{tab.label}</span>
                              {tab.count && (
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${tab.badgeColor || "bg-white/[0.06] text-slate-400"}`}>
                                  {tab.count}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 group-hover:text-slate-300 truncate mt-0.5">{tab.desc}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </button>
                    );
                  })}
                </nav>

                {/* Mobile & Small Tablet Full Screen Live Preview Switcher Button */}
                <div className="p-2.5 px-3 border-t border-white/[0.08] bg-slate-950/80 backdrop-blur-md md:hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPreviewOnlyMode(true);
                      setIsSidebarOpen(false);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    <Eye className="h-4 w-4 text-cyan-200 animate-pulse" />
                    <span>Live Page Preview</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/30 border border-white/20 ml-1">
                      Full View
                    </span>
                  </button>
                </div>

                {/* Single Sidebar Footer */}
                <div className="p-3 border-t border-white/[0.08] bg-white/[0.02] backdrop-blur-md flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                    <span className="text-[11px] font-semibold text-slate-300">Keys-Link Studio v360</span>
                  </div>
                  <span className="text-[10px] text-indigo-400/90 font-mono font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">Pro Editor</span>
                </div>
              </div>
            ) : (
              /* LEVEL 2: ACTIVE TOOL SLIDING VIEW (Replaces 2nd Sidebar) */
              <div className="flex flex-col h-full w-full animate-in fade-in slide-in-from-right-4 duration-200 overflow-hidden">
                {/* Sliding Header with [← Menu] back button and tool name */}
                <div className="p-3 border-b border-white/[0.08] flex items-center justify-between bg-slate-950/70 backdrop-blur-xl shrink-0 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (studioNavTab === "settings" && settingsSubPanel !== "root") {
                          setSettingsSubPanel("root");
                          return;
                        }
                        setStudioNavTab("menu");
                        setShowThanksPage(false);
                        setEditorTab("Edit");
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-indigo-300 hover:text-white text-xs font-bold border border-white/[0.08] shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
                      title={studioNavTab === "settings" && settingsSubPanel !== "root" ? "Back to Page Settings" : "Return to Main Menu"}
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>{studioNavTab === "settings" && settingsSubPanel !== "root" ? "Settings" : "Menu"}</span>
                    </button>

                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 truncate">
                      {studioNavTab === "library" && "🚀 Add Blocks"}
                      {studioNavTab === "layers" && `📑 Structure (${canvasBlocks.length})`}
                      {studioNavTab === "inspector" && "✏️ Block Inspector"}
                      {studioNavTab === "theme" && "🎨 Themes & Styling"}
                      {studioNavTab === "settings" && (
                        settingsSubPanel === "seo" ? "🌐 SEO & Meta" :
                        settingsSubPanel === "payment" ? "💳 Form Payment" :
                        settingsSubPanel === "ai" ? "🤖 AI Assistant" :
                        settingsSubPanel === "devices" ? "📱 Target Devices" :
                        settingsSubPanel === "thanks" ? "🎉 Thank You Page" :
                        "⚙️ Page Settings"
                      )}
                      {studioNavTab === "drafts" && "💾 Saved Templates"}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setStudioNavTab("menu");
                      setShowThanksPage(false);
                      setEditorTab("Edit");
                    }}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Close Panel and return to Menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Scrollable Tool Content */}
                <div className="flex-1 overflow-y-auto p-3.5 space-y-4 no-scrollbar">
                {studioNavTab === "settings" && (
                <div className="max-w-xl mx-auto key-workspace key-workspace--stack w-full space-y-4">
                  {/* ROOT OVERVIEW PANEL */}
                  {settingsSubPanel === "root" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                        <div>
                          <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
                            <Settings className="w-4.5 h-4.5 text-indigo-400" />
                            <span>Page Settings</span>
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Select any section below to customize in a dedicated slidebar
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-400 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25">
                          5 Sections
                        </span>
                      </div>

                      {/* Modular Glass Cards */}
                      <div className="space-y-3">
                        {/* 1. SEO & Meta Data Card */}
                        <div
                          onClick={() => setSettingsSubPanel("seo")}
                          className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-blue-500/50 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-blue-500/10"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
                            <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 group-hover:bg-blue-500/25 transition-all">
                              <Globe className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                                  SEO & Search Meta
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                                  seoIndexingEnabled
                                    ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                                    : "bg-slate-700/30 text-slate-400 border-slate-600/30"
                                }`}>
                                  {seoIndexingEnabled ? "Index Active" : "No-Index"}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                Meta title, description, keywords & search preview
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={seoIndexingEnabled}
                                onChange={(e) => {
                                  const val = e.target.checked;
                                  setSeoIndexingEnabled(val);
                                  if (val) setSettingsSubPanel("seo");
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 border border-white/20"></div>
                            </label>
                            <button
                              type="button"
                              onClick={() => setSettingsSubPanel("seo")}
                              className="p-1 rounded-lg text-slate-400 group-hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                              title="Open SEO Slidebar"
                            >
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          </div>
                        </div>

                        {/* 2. Razorpay Form Payment Card */}
                        <div
                          onClick={() => setSettingsSubPanel("payment")}
                          className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-pink-500/50 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-pink-500/10"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
                            <div className="w-11 h-11 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0 group-hover:scale-105 group-hover:bg-pink-500/25 transition-all">
                              <CreditCard className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors">
                                  Form Payment (Razorpay)
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                                  paymentEnabled
                                    ? "bg-pink-500/15 text-pink-300 border-pink-500/30"
                                    : "bg-slate-700/30 text-slate-400 border-slate-600/30"
                                }`}>
                                  {paymentEnabled ? `₹${paymentAmountInr} Active` : "Disabled"}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                Collect instant fees on forms or smart forms
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={paymentEnabled}
                                onChange={(e) => {
                                  const val = e.target.checked;
                                  setPaymentEnabled(val);
                                  if (val) setSettingsSubPanel("payment");
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600 border border-white/20"></div>
                            </label>
                            <button
                              type="button"
                              onClick={() => setSettingsSubPanel("payment")}
                              className="p-1 rounded-lg text-slate-400 group-hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                              title="Open Payment Slidebar"
                            >
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          </div>
                        </div>

                        {/* 3. AI Sales Assistant Card */}
                        <div
                          onClick={() => setSettingsSubPanel("ai")}
                          className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-cyan-500/50 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-cyan-500/10"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
                            <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 group-hover:bg-cyan-500/25 transition-all">
                              <Sparkles className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                                  AI Sales Assistant
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                                  aiAssistantEnabled
                                    ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                                    : "bg-slate-700/30 text-slate-400 border-slate-600/30"
                                }`}>
                                  {aiAssistantEnabled ? (aiBotName || "Active") : "Disabled"}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                24/7 intelligent sales agent trained on your brand
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={aiAssistantEnabled}
                                onChange={(e) => {
                                  const val = e.target.checked;
                                  setAiAssistantEnabled(val);
                                  if (val) setSettingsSubPanel("ai");
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600 border border-white/20"></div>
                            </label>
                            <button
                              type="button"
                              onClick={() => setSettingsSubPanel("ai")}
                              className="p-1 rounded-lg text-slate-400 group-hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                              title="Open AI Assistant Slidebar"
                            >
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          </div>
                        </div>

                        {/* 4. Target Devices Scope Card */}
                        <div
                          onClick={() => setSettingsSubPanel("devices")}
                          className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-indigo-500/50 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-indigo-500/10"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
                            <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 group-hover:bg-indigo-500/25 transition-all">
                              <Smartphone className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                                  Target Devices Scope
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                                  isTargetDevicesCustomEnabled
                                    ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                                    : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                }`}>
                                  {isTargetDevicesCustomEnabled
                                    ? (editorDeviceScope === "mobile_only"
                                        ? "Mobile Only"
                                        : editorDeviceScope === "mobile_tablet"
                                          ? "Tablet Only"
                                          : editorDeviceScope === "mobile_tablet_laptop"
                                            ? "Laptop/PC"
                                            : "All Devices")
                                    : "All Devices (Ultra-Wide)"}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                Ultra-Wide automated fluid vs locked viewport
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isTargetDevicesCustomEnabled}
                                onChange={(e) => {
                                  const enabled = e.target.checked;
                                  setIsTargetDevicesCustomEnabled(enabled);
                                  setEditorDeviceScope("all_devices");
                                  if (enabled) setSettingsSubPanel("devices");
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 border border-white/20"></div>
                            </label>
                            <button
                              type="button"
                              onClick={() => setSettingsSubPanel("devices")}
                              className="p-1 rounded-lg text-slate-400 group-hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                              title="Open Target Devices Slidebar"
                            >
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          </div>
                        </div>

                        {/* 5. Thank You Page Card */}
                        <div
                          onClick={() => setSettingsSubPanel("thanks")}
                          className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-purple-500/50 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-purple-500/10"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
                            <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-105 group-hover:bg-purple-500/25 transition-all">
                              <CheckCircle className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                                  Thank You Page Screen
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                                  isThankYouEnabled
                                    ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                                    : "bg-slate-700/30 text-slate-400 border-slate-600/30"
                                }`}>
                                  {isThankYouEnabled ? "Enabled" : "Disabled"}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                Post-submit confirmation screen for forms & payments
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isThankYouEnabled}
                                onChange={(e) => {
                                  const val = e.target.checked;
                                  setIsThankYouEnabled(val);
                                  if (val) setSettingsSubPanel("thanks");
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 border border-white/20"></div>
                            </label>
                            <button
                              type="button"
                              onClick={() => setSettingsSubPanel("thanks")}
                              className="p-1 rounded-lg text-slate-400 group-hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                              title="Open Thank You Page Slidebar"
                            >
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUBPANEL 1: SEO & META DATA */}
                  {settingsSubPanel === "seo" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                        <button
                          type="button"
                          onClick={() => setSettingsSubPanel("root")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white text-xs font-bold border border-white/10 transition-all cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4 text-blue-400" />
                          <span>← Back to Settings</span>
                        </button>
                        <span className="text-[10px] font-bold text-blue-300 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-blue-400" />
                          <span>SEO Meta</span>
                        </span>
                      </div>

                      <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 space-y-4 shadow-2xl">
                        {/* Indexing Switch */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                          <div>
                            <span className="text-xs font-bold text-white block">Search Engine Indexing</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Allow Google, Bing & DuckDuckGo to index this page</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={seoIndexingEnabled}
                              onChange={(e) => setSeoIndexingEnabled(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 border border-white/20"></div>
                          </label>
                        </div>

                        {/* Meta Title */}
                        <div>
                          <label className="block text-[11px] text-slate-300 font-semibold mb-1.5">
                            Meta Title <span className="text-slate-500 font-normal">({editorTitle.length}/60 chars)</span>
                          </label>
                          <input
                            type="text"
                            value={editorTitle}
                            onChange={(e) => setEditorTitle(e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/10 focus:border-blue-500 focus:bg-white/[0.06] focus:outline-none rounded-xl py-2 px-3 text-xs text-white placeholder:text-slate-500 transition-all"
                            placeholder="Official Marvel-Inspired Toys & Collectibles..."
                          />
                        </div>

                        {/* Meta Description */}
                        <div>
                          <label className="block text-[11px] text-slate-300 font-semibold mb-1.5">
                            Meta Description <span className="text-slate-500 font-normal">({editorMetaDescription.length}/160 chars)</span>
                          </label>
                          <textarea
                            value={editorMetaDescription}
                            onChange={(e) => setEditorMetaDescription(e.target.value)}
                            rows={3}
                            className="w-full bg-white/[0.04] border border-white/10 focus:border-blue-500 focus:bg-white/[0.06] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-200 placeholder:text-slate-500 resize-none transition-all"
                            placeholder="Safe, fun & exciting collectibles for young superheroes and fans..."
                          />
                        </div>

                        {/* Google Live Search Snippet */}
                        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/10 space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Google Search Live Preview
                          </span>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded-full bg-blue-500/20 text-blue-400 inline-flex items-center justify-center text-[9px] font-bold">G</span>
                            <span className="truncate">https://keyslink360.com/{selectedEditPage.slug || "page"}</span>
                          </div>
                          <div className="text-xs font-semibold text-blue-400 hover:underline cursor-pointer truncate">
                            {editorTitle || "Official Bio Page"} | KEYLINK360
                          </div>
                          <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                            {editorMetaDescription || "Explore links, products, portfolio, and contact info in one place."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUBPANEL 2: RAZORPAY FORM PAYMENT */}
                  {settingsSubPanel === "payment" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                        <button
                          type="button"
                          onClick={() => setSettingsSubPanel("root")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white text-xs font-bold border border-white/10 transition-all cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4 text-pink-400" />
                          <span>← Back to Settings</span>
                        </button>
                        <span className="text-[10px] font-bold text-pink-300 px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/25 flex items-center gap-1.5">
                          <CreditCard className="w-3 h-3 text-pink-400" />
                          <span>Razorpay</span>
                        </span>
                      </div>

                      <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 space-y-4 shadow-2xl">
                        {/* Main Payment Switch */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-pink-500/[0.06] border border-pink-500/20">
                          <div>
                            <span className="text-xs font-bold text-white block">Form Payment (Razorpay)</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Charge a fixed fee when visitors submit a form</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={paymentEnabled}
                              onChange={(e) => setPaymentEnabled(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600 border border-white/20"></div>
                          </label>
                        </div>

                        {paymentEnabled ? (
                          <div className="space-y-3.5 pt-1">
                            <div>
                              <label className="block text-[11px] text-pink-300 font-semibold mb-1.5">
                                Fee Amount (INR)
                              </label>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-pink-400 px-2.5 py-1.5 bg-pink-500/10 border border-pink-500/20 rounded-xl">₹</span>
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
                                  className="w-full bg-slate-950/70 border border-white/10 focus:border-pink-500 focus:outline-none rounded-xl py-2 px-3 text-xs text-white"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] text-pink-300 font-semibold mb-1.5">
                                Checkout Description
                              </label>
                              <input
                                type="text"
                                value={paymentDescription}
                                onChange={(e) => setPaymentDescription(e.target.value)}
                                className="w-full bg-slate-950/70 border border-white/10 focus:border-pink-500 focus:outline-none rounded-xl py-2 px-3 text-xs text-white"
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
                              className="w-full rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold py-2.5 shadow-lg shadow-pink-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Preview Form Pay (₹{paymentAmountInr})</span>
                            </button>

                            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                              🔒 Payments are safely processed via Razorpay standard checkout popup.
                            </p>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center space-y-1.5">
                            <span className="text-xs font-bold text-slate-300 block">Form Payment is Currently Inactive</span>
                            <p className="text-[11px] text-slate-400">
                              Toggle the switch above to collect payments directly on your bio page form blocks.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUBPANEL 3: AI SALES ASSISTANT */}
                  {settingsSubPanel === "ai" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                        <button
                          type="button"
                          onClick={() => setSettingsSubPanel("root")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white text-xs font-bold border border-white/10 transition-all cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4 text-cyan-400" />
                          <span>← Back to Settings</span>
                        </button>
                        <span className="text-[10px] font-bold text-cyan-300 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span>AI Agent</span>
                        </span>
                      </div>

                      <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 space-y-4 shadow-2xl">
                        {/* Main AI Switch & Tutorial */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-500/[0.06] border border-cyan-500/20">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white block">AI Sales Assistant</span>
                              <button
                                type="button"
                                onClick={() => setIsGuideModalOpen(true)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold hover:bg-cyan-500/30 transition-colors cursor-pointer"
                              >
                                <BookOpen className="w-2.5 h-2.5 text-cyan-300" />
                                <span>Tutorial</span>
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">24/7 intelligent sales agent on your bio page</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={aiAssistantEnabled}
                              onChange={(e) => setAiAssistantEnabled(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600 border border-white/20"></div>
                          </label>
                        </div>

                        {aiAssistantEnabled ? (
                          <div className="space-y-3.5 pt-1">
                            <div>
                              <label className="block text-[11px] text-cyan-200 font-semibold mb-1">
                                Bot Name
                              </label>
                              <input
                                type="text"
                                value={aiBotName}
                                onChange={(e) => setAiBotName(e.target.value)}
                                className="w-full bg-slate-950/70 border border-white/10 focus:border-cyan-500 focus:outline-none rounded-xl py-2 px-3 text-xs text-white"
                                placeholder="e.g. Maya, Sales Bot"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] text-cyan-200 font-semibold mb-1">
                                Welcome Greeting
                              </label>
                              <textarea
                                value={aiWelcomeMessage}
                                onChange={(e) => setAiWelcomeMessage(e.target.value)}
                                rows={2}
                                className="w-full bg-slate-950/70 border border-white/10 focus:border-cyan-500 focus:outline-none rounded-xl py-2 px-3 text-xs text-white resize-none"
                                placeholder="👋 Hi! How can I assist you today?"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] text-cyan-200 font-semibold mb-1">
                                  Brand Name
                                </label>
                                <input
                                  type="text"
                                  value={aiBusinessName}
                                  onChange={(e) => setAiBusinessName(e.target.value)}
                                  className="w-full bg-slate-950/70 border border-white/10 focus:border-cyan-500 focus:outline-none rounded-xl py-2 px-3 text-xs text-white"
                                  placeholder={editorTitle || "Brand Name"}
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-cyan-200 font-semibold mb-1">
                                  WhatsApp Contact
                                </label>
                                <input
                                  type="tel"
                                  value={aiContactPhone}
                                  onChange={(e) => setAiContactPhone(e.target.value)}
                                  className="w-full bg-slate-950/70 border border-white/10 focus:border-cyan-500 focus:outline-none rounded-xl py-2 px-3 text-xs text-white"
                                  placeholder="+91 9876543210"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] text-cyan-200 font-semibold mb-1">
                                Offerings & Knowledge Base
                              </label>
                              <textarea
                                value={aiBusinessDescription}
                                onChange={(e) => setAiBusinessDescription(e.target.value)}
                                rows={3}
                                className="w-full bg-slate-950/70 border border-white/10 focus:border-cyan-500 focus:outline-none rounded-xl py-2 px-3 text-xs text-white resize-none"
                                placeholder="Products, pricing, delivery times, store hours..."
                              />
                            </div>

                            {/* Custom FAQs */}
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-200">
                                  Instant FAQs
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAiCustomFaqs((prev) => [
                                      ...prev,
                                      { question: "", answer: "" }
                                    ])
                                  }
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>Add FAQ</span>
                                </button>
                              </div>

                              {aiCustomFaqs.map((faq, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 bg-slate-950/70 border border-white/10 rounded-xl space-y-1.5 relative group"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <input
                                      type="text"
                                      value={faq.question}
                                      onChange={(e) => {
                                        const updated = [...aiCustomFaqs];
                                        updated[idx].question = e.target.value;
                                        setAiCustomFaqs(updated);
                                      }}
                                      placeholder="Question..."
                                      className="flex-1 text-xs font-semibold text-white border-b border-white/10 focus:border-cyan-500 focus:outline-none py-1 bg-transparent"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAiCustomFaqs((prev) =>
                                          prev.filter((_, i) => i !== idx)
                                        )
                                      }
                                      className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  <textarea
                                    value={faq.answer}
                                    onChange={(e) => {
                                      const updated = [...aiCustomFaqs];
                                      updated[idx].answer = e.target.value;
                                      setAiCustomFaqs(updated);
                                    }}
                                    rows={2}
                                    placeholder="Answer..."
                                    className="w-full text-xs text-slate-300 bg-transparent focus:outline-none resize-none pt-1"
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between py-2 border-t border-cyan-500/20 pt-3">
                              <div>
                                <span className="text-xs font-bold block text-slate-200">
                                  Auto Lead Capture
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                  Save visitor phone & email to CRM
                                </span>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={aiAutoLeadCapture}
                                  onChange={(e) => setAiAutoLeadCapture(e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600 border border-white/20"></div>
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center space-y-1.5">
                            <span className="text-xs font-bold text-slate-300 block">AI Assistant is Inactive</span>
                            <p className="text-[11px] text-slate-400">
                              Toggle the switch above to empower your bio page with a 24/7 AI conversational agent.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUBPANEL 4: TARGET DEVICES SCOPE */}
                  {settingsSubPanel === "devices" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                        <button
                          type="button"
                          onClick={() => setSettingsSubPanel("root")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white text-xs font-bold border border-white/10 transition-all cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4 text-indigo-400" />
                          <span>← Back to Settings</span>
                        </button>
                        <span className="text-[10px] font-bold text-indigo-300 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center gap-1.5">
                          <Smartphone className="w-3 h-3 text-indigo-400" />
                          <span>Screen Scope</span>
                        </span>
                      </div>

                      <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 space-y-4 shadow-2xl">
                        {/* Scope Toggle Switch */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white block">TARGET DEVICES</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                {isTargetDevicesCustomEnabled ? "Custom Mode" : "Auto Fluid"}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Default is Ultra-Wide responsive. Enable to choose locked screen divisions.
                            </span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={isTargetDevicesCustomEnabled}
                              onChange={(e) => {
                                const enabled = e.target.checked;
                                setIsTargetDevicesCustomEnabled(enabled);
                                setEditorDeviceScope("all_devices");
                                triggerToast(
                                  enabled
                                    ? "Target Devices enabled · All Devices (Ultra-Wide) active by default"
                                    : "Target Devices disabled · Reset to All Devices (Ultra-Wide) fluid"
                                );
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-indigo-600 border border-white/20"></div>
                          </label>
                        </div>

                        {/* When Checkbox is NOT enabled: Default Ultra-Wide Active State */}
                        {!isTargetDevicesCustomEnabled ? (
                          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-purple-950/30 border border-indigo-500/30 shadow-lg shadow-indigo-950/30 space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="flex h-2 w-2 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-xs font-bold text-emerald-300">
                                  All Devices (Ultra-Wide) · Default Active
                                </span>
                              </div>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                Fluid Auto
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              Published bio site automatically scales across all visitor screens — Ultra-Wide (up to 1680px, 4-col), Laptops (3-col), Tablets (2-col), and Mobile phones (1-col) via dynamic responsive media queries.
                            </p>
                            <div className="pt-2 flex items-center justify-between text-[10px] text-indigo-300/80 font-medium bg-black/20 p-2.5 rounded-xl border border-white/[0.04]">
                              <div className="flex items-center gap-1.5">
                                <Monitor className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span>Ultra-Wide</span>
                              </div>
                              <span className="text-slate-600">→</span>
                              <div className="flex items-center gap-1.5">
                                <Laptop className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span>Laptop</span>
                              </div>
                              <span className="text-slate-600">→</span>
                              <div className="flex items-center gap-1.5">
                                <Tablet className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span>Tablet</span>
                              </div>
                              <span className="text-slate-600">→</span>
                              <div className="flex items-center gap-1.5">
                                <Smartphone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span>Mobile</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* When Checkbox IS enabled: show all selectable device divisions with All Devices Ultra-Wide selected by default */
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between px-0.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Select Target Screen Division
                              </span>
                              <span className="text-[10px] text-indigo-400 font-semibold">
                                {editorDeviceScope === "all_devices"
                                  ? "Ultra-Wide Fluid (Default)"
                                  : editorDeviceScope === "mobile_only"
                                    ? "Mobile Locked (430px)"
                                    : editorDeviceScope === "mobile_tablet"
                                      ? "Tablet Locked (768px)"
                                      : "Laptop/Desktop (1150px)"}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 gap-2.5">
                              {[
                                {
                                  id: "all_devices" as const,
                                  title: "All Devices (Ultra-Wide)",
                                  desc: "Automated fluid responsiveness across 4K, Desktop, Tablet & Phone",
                                  badge: "Default · Recommended",
                                  badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                  icon: Monitor
                                },
                                {
                                  id: "mobile_only" as const,
                                  title: "Mobile Only",
                                  desc: "Strictly locked to phone screen (430px card) on all laptops & PCs",
                                  badge: "Phone Only",
                                  badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                  icon: Smartphone
                                },
                                {
                                  id: "mobile_tablet" as const,
                                  title: "Tablet Only",
                                  desc: "Locked to tablet viewport (768px container) across all devices",
                                  badge: "Tablet View",
                                  badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
                                  icon: Tablet
                                },
                                {
                                  id: "mobile_tablet_laptop" as const,
                                  title: "Laptop & Desktop Only",
                                  desc: "Standard desktop/laptop layout (1150px container)",
                                  badge: "Laptop / PC",
                                  badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                                  icon: Laptop
                                }
                              ].map((option) => {
                                const isSelected = editorDeviceScope === option.id;
                                const IconComponent = option.icon;
                                return (
                                  <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                      setEditorDeviceScope(option.id);
                                      triggerToast(`Target device set to: ${option.title}`);
                                    }}
                                    className={`text-left p-3 sm:p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer min-w-0 ${
                                      isSelected
                                        ? "bg-indigo-600/20 border-indigo-500/70 shadow-lg shadow-indigo-500/15 ring-1 ring-indigo-500/40"
                                        : "bg-white/[0.03] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.06]"
                                    }`}
                                  >
                                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                      <div className={`mt-0.5 p-1.5 rounded-lg border shrink-0 ${
                                        isSelected
                                          ? "bg-indigo-500/20 border-indigo-400/50 text-indigo-300"
                                          : "bg-white/[0.04] border-white/10 text-slate-400"
                                      }`}>
                                        <IconComponent className="h-4 w-4" />
                                      </div>
                                      <div className="space-y-0.5 min-w-0 flex-1 overflow-hidden">
                                        <div className="flex items-center gap-2">
                                          <span className={`text-xs font-bold truncate ${isSelected ? "text-indigo-200" : "text-slate-200"}`}>
                                            {option.title}
                                          </span>
                                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${option.badgeColor}`}>
                                            {option.badge}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 leading-snug">
                                          {option.desc}
                                        </p>
                                      </div>
                                    </div>
                                    <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                                      isSelected ? "border-indigo-400 bg-indigo-600" : "border-white/20 bg-slate-900"
                                    }`}>
                                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUBPANEL 5: THANK YOU PAGE */}
                  {settingsSubPanel === "thanks" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                        <button
                          type="button"
                          onClick={() => setSettingsSubPanel("root")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white text-xs font-bold border border-white/10 transition-all cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4 text-purple-400" />
                          <span>← Back to Settings</span>
                        </button>
                        <span className="text-[10px] font-bold text-purple-300 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3 text-purple-400" />
                          <span>Thank You</span>
                        </span>
                      </div>

                      <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 space-y-4 shadow-2xl">
                        {/* Thank You Page Switch & Preview Button */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/[0.06] border border-purple-500/20">
                          <div>
                            <span className="text-xs font-bold text-white block">Thank You Page Screen</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Shown after lead capture, forms & payments</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                const nextState = !showThanksPage;
                                setShowThanksPage(nextState);
                                setEditorTab(nextState ? "Thank You" : "Settings");
                                triggerToast(nextState ? "Previewing Thank You Page Screen" : "Back to Page Settings View");
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                                showThanksPage
                                  ? "bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-500/30 ring-1 ring-purple-400"
                                  : "bg-white/[0.05] hover:bg-white/[0.1] text-purple-300 border-purple-500/30 hover:border-purple-500/60"
                              }`}
                            >
                              <Eye className="w-3 h-3" />
                              <span>{showThanksPage ? "Preview Active" : "Preview"}</span>
                            </button>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isThankYouEnabled}
                                onChange={(e) => setIsThankYouEnabled(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 border border-white/20"></div>
                            </label>
                          </div>
                        </div>

                        {isThankYouEnabled ? (
                          <div className="space-y-3.5 pt-1">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="block text-[11px] font-semibold text-purple-300 mb-1.5">Nav Title</label>
                                <input
                                  type="text"
                                  value={thankYouTitle}
                                  onChange={(e) => setThankYouTitle(e.target.value)}
                                  className="w-full bg-white/[0.04] border border-white/10 focus:border-purple-500 focus:bg-white/[0.06] focus:outline-none rounded-xl py-2 px-3 text-xs font-bold text-white placeholder:text-slate-500 transition-all"
                                  placeholder="Thank You"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-purple-300 mb-1.5">Hero Mark</label>
                                <input
                                  type="text"
                                  value={thankYouEmoji}
                                  onChange={(e) => setThankYouEmoji(e.target.value)}
                                  className="w-full bg-white/[0.04] border border-white/10 focus:border-purple-500 focus:bg-white/[0.06] focus:outline-none rounded-xl py-2 px-3 text-xs font-bold text-white placeholder:text-slate-500 transition-all"
                                  placeholder="✓"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-purple-300 mb-1.5">Supporting Message</label>
                              <textarea
                                value={thankYouMessage}
                                onChange={(e) => setThankYouMessage(e.target.value)}
                                rows={3}
                                className="w-full bg-white/[0.04] border border-white/10 focus:border-purple-500 focus:bg-white/[0.06] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-200 placeholder:text-slate-500 resize-none transition-all"
                                placeholder="Thanks for connecting with us on KEYLINK360..."
                              />
                            </div>

                            {showThanksPage && (
                              <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs">
                                <span className="text-purple-200 font-medium text-[11px]">
                                  🎉 Live Preview is showing the Thank You page in the phone simulator!
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowThanksPage(false);
                                    setEditorTab("Settings");
                                  }}
                                  className="text-[10px] font-bold text-white bg-purple-600 hover:bg-purple-500 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                >
                                  Back to Main View
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center space-y-1.5">
                            <span className="text-xs font-bold text-slate-300 block">Thank You Page is Inactive</span>
                            <p className="text-[11px] text-slate-400">
                              Toggle the switch above to display a dedicated celebratory completion screen after visitors submit forms.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* DRAFTS & RECOVERY PANEL */}
              {studioNavTab === "drafts" && (
                <div className="key-workspace key-workspace--stack w-full space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
                      <Save className="w-4 h-4 text-indigo-400" />
                      <span>Drafts & Recovery</span>
                    </h3>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 space-y-4 shadow-2xl">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">
                      Saved Session Snapshots
                    </span>
                    {savedDrafts.filter((draft) => draft.pageId === selectedEditPage.id).length === 0 ? (
                      <div className="text-center py-8 px-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
                        <p className="text-xs text-slate-400 font-medium">No saved drafts yet. Click "Save Draft" in the left sidebar to snapshot your work.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {savedDrafts.filter((draft) => draft.pageId === selectedEditPage.id).map((draft) => (
                          <div key={draft.id} className="flex items-center justify-between p-3 bg-white/[0.04] border border-white/[0.08] hover:border-indigo-500/40 rounded-xl transition-all gap-3 min-w-0">
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <span className="text-xs font-bold block text-slate-200 truncate">{getDraftDisplayName(draft)}</span>
                              <span className="text-[9px] text-slate-400 block font-mono mt-0.5">{getDraftBlockCount(draft)} block{getDraftBlockCount(draft) !== 1 ? "s" : ""} saved</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                hydrateEditorFromState(draft.data);
                                triggerToast(`✨ Restored editor blocks to draft "${getDraftDisplayName(draft)}"!`);
                              }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm shrink-0 cursor-pointer"
                            >
                              Restore
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BLOCK LIBRARY PANEL */}
              {studioNavTab === "library" && (
                <div className="space-y-3.5 key-editor-zone key-editor-zone--blocks w-full">
                  {/* Search and Category Filter Pills */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={blockLibrarySearch}
                        onChange={(e) => setBlockLibrarySearch(e.target.value)}
                        placeholder="Search 50+ pro widgets..."
                        className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/70 focus:bg-white/[0.07] rounded-xl pl-8.5 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                      {[
                        { id: "all", label: "All (50+)" },
                        { id: "hero", label: "🚀 Hero" },
                        { id: "commerce", label: "💎 Commerce" },
                        { id: "social", label: "🌟 Social" },
                        { id: "media", label: "🎬 Media" },
                        { id: "forms", label: "📝 Forms" },
                        { id: "core", label: "⚡ Core" }
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setBlockLibraryCategory(cat.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                            blockLibraryCategory === cat.id
                              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                              : "bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06]"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="key-editor-zone__body key-workspace--stack no-scrollbar">
                    {/* 1. Hero & Headlines */}
                    {(blockLibraryCategory === "all" || blockLibraryCategory === "hero") && (
                    <div className="key-editor-blocks-palette">
                      <div className="mb-2.5 flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          🚀 Hero & Headers
                        </span>
                        <span className="text-[9px] text-indigo-400 font-bold bg-indigo-500/15 border border-indigo-500/25 px-2 py-0.5 rounded-full">
                          Hero
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Navbar")}
                          onClick={() => handleAddBlock("Navbar")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Floating navigation bar"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-indigo-500/20 border border-white/[0.07] group-hover:border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            🧭
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Navbar</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Top menu bar</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Split Hero")}
                          onClick={() => handleAddBlock("Split Hero")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Split headline & visual banner"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-indigo-500/20 border border-white/[0.07] group-hover:border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            🚀
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Split Hero</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Headline & media</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Main Feature")}
                          onClick={() => handleAddBlock("Main Feature")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="4-feature highlight grid"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-amber-500/20 border border-white/[0.07] group-hover:border-amber-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            🔥
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Feature Grid</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">4 key benefits</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Video Hero")}
                          onClick={() => handleAddBlock("Video Hero")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Cinematic video hero with CTA"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-purple-500/20 border border-white/[0.07] group-hover:border-purple-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            🎬
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Video Hero</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Cinematic banner</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Glow Badge")}
                          onClick={() => handleAddBlock("Glow Badge")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Animated glowing pill announcement"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-amber-500/20 border border-white/[0.07] group-hover:border-amber-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            ✨
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Glow Badge</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Notice pill</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Feature Hero")}
                          onClick={() => handleAddBlock("Feature Hero")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="3-pillar feature hero overview"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-teal-500/20 border border-white/[0.07] group-hover:border-teal-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            ⚡
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Feature Pillars</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">3 core features</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Header")}
                          onClick={() => handleAddBlock("Header")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Section headline"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-emerald-500/20 border border-white/[0.07] group-hover:border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-400 shrink-0 transition-transform group-hover:scale-105">
                            H1
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Headline</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Section title</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Banner")}
                          onClick={() => handleAddBlock("Banner")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Notice & alert banner"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-sky-500/20 border border-white/[0.07] group-hover:border-sky-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            📢
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Alert Banner</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Notice & promo</span>
                          </div>
                        </button>
                      </div>
                    </div>
                    )}

                    {/* 2. Pricing & Commerce */}
                    {(blockLibraryCategory === "all" || blockLibraryCategory === "commerce") && (
                    <div className="key-editor-blocks-palette">
                      <div className="mb-2.5 flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          💳 Sales & Commerce
                        </span>
                        <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                          Sales
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Flash Offer")}
                          onClick={() => handleAddBlock("Flash Offer")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Flash offer discount sale"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-rose-500/20 border border-white/[0.07] group-hover:border-rose-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            ⚡
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Flash Deal</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Timed discount</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Toggle Pricing")}
                          onClick={() => handleAddBlock("Toggle Pricing")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Monthly vs Yearly toggle pricing table"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-indigo-500/20 border border-white/[0.07] group-hover:border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            ⚖️
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Plan Toggle</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Monthly & annual</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Product Showcase")}
                          onClick={() => handleAddBlock("Product Showcase")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Featured product showcase"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-rose-500/20 border border-white/[0.07] group-hover:border-rose-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            📦
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Product Card</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Featured item</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Comparison Table")}
                          onClick={() => handleAddBlock("Comparison Table")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Plan feature comparison table"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-blue-500/20 border border-white/[0.07] group-hover:border-blue-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            📊
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Compare Table</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Feature matrix</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Payment Button")}
                          onClick={() => handleAddBlock("Payment Button")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Instant payment checkout button"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-emerald-500/20 border border-white/[0.07] group-hover:border-emerald-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            💳
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Quick Pay</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Instant checkout</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Pricing")}
                          onClick={() => handleAddBlock("Pricing")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Pricing plans and tiers"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-amber-500/20 border border-white/[0.07] group-hover:border-amber-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            💰
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Price Cards</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Plan tiers</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Shop")}
                          onClick={() => handleAddBlock("Shop")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Store product catalogue"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-teal-500/20 border border-white/[0.07] group-hover:border-teal-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            🛒
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Store Grid</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Product catalog</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Coupon")}
                          onClick={() => handleAddBlock("Coupon")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Coupon discount code"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-amber-500/20 border border-white/[0.07] group-hover:border-amber-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            🎟️
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Coupon Code</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Tap to copy</span>
                          </div>
                        </button>
                      </div>
                    </div>
                    )}

                    {/* 3. Social Proof & Community */}
                    {(blockLibraryCategory === "all" || blockLibraryCategory === "social") && (
                    <div className="key-editor-blocks-palette">
                      <div className="mb-2.5 flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          🌟 Social Proof & Community
                        </span>
                        <span className="text-[9px] text-amber-400 font-bold bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 rounded-full">
                          Trust
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Community Hub")}
                          onClick={() => handleAddBlock("Community Hub")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="VIP community hub with chat"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-emerald-500/20 border border-white/[0.07] group-hover:border-emerald-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            💬
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Community Hub</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">WhatsApp & Discord</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Brand Logos")}
                          onClick={() => handleAddBlock("Brand Logos")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Animated client and partner logo marquee"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-slate-500/20 border border-white/[0.07] group-hover:border-slate-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            🏢
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Brand Logos</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Partner marquee</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Star Ratings")}
                          onClick={() => handleAddBlock("Star Ratings")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Star review rating badge"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-amber-500/20 border border-white/[0.07] group-hover:border-amber-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            ⭐
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Star Reviews</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">5★ user ratings</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Press Mentions")}
                          onClick={() => handleAddBlock("Press Mentions")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Press & media review quotes"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-purple-500/20 border border-white/[0.07] group-hover:border-purple-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            📰
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Press Quotes</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Media highlights</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Testimonials")}
                          onClick={() => handleAddBlock("Testimonials")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Customer testimonial reviews"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-amber-500/20 border border-white/[0.07] group-hover:border-amber-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            💬
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Testimonials</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Client feedback</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Stats")}
                          onClick={() => handleAddBlock("Stats")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Key achievements and numbers"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-emerald-500/20 border border-white/[0.07] group-hover:border-emerald-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            📊
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Key Stats</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Milestones & proof</span>
                          </div>
                        </button>
                      </div>
                    </div>
                    )}

                    {/* 4. Interactive Media & Feeds */}
                    {(blockLibraryCategory === "all" || blockLibraryCategory === "media") && (
                    <div className="key-editor-blocks-palette">
                      <div className="mb-2.5 flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          🎨 Interactive Media & Feeds
                        </span>
                        <span className="text-[9px] text-purple-400 font-bold bg-purple-500/15 border border-purple-500/25 px-2 py-0.5 rounded-full">
                          Visual
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Auto Slider")}
                          onClick={() => handleAddBlock("Auto Slider")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Autoplay image carousel slider"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-indigo-500/20 border border-white/[0.07] group-hover:border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            🎠
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Photo Slider</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Auto carousel</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "YouTube Channel")}
                          onClick={() => handleAddBlock("YouTube Channel")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="YouTube channel and player"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-red-500/20 border border-white/[0.07] group-hover:border-red-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            🔴
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">YouTube Video</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Channel & player</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Instagram Feed")}
                          onClick={() => handleAddBlock("Instagram Feed")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Instagram photo grid"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-pink-500/20 border border-white/[0.07] group-hover:border-pink-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            📸
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Instagram Grid</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Photo gallery</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Before/After Slider")}
                          onClick={() => handleAddBlock("Before/After Slider")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Interactive comparison slider"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-cyan-500/20 border border-white/[0.07] group-hover:border-cyan-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            ↔️
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Compare Slider</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Before & after</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Portfolio Gallery")}
                          onClick={() => handleAddBlock("Portfolio Gallery")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Portfolio showcase"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-pink-500/20 border border-white/[0.07] group-hover:border-pink-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            💼
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Portfolio</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Filterable work</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Video Showcase")}
                          onClick={() => handleAddBlock("Video Showcase")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Video player with playlist"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-red-500/20 border border-white/[0.07] group-hover:border-red-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            📺
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Video Playlist</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Chapters & courses</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Audio Player")}
                          onClick={() => handleAddBlock("Audio Player")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Podcast & music audio player"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-emerald-500/20 border border-white/[0.07] group-hover:border-emerald-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            🎙️
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Podcast Player</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Audio tracks</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Gallery")}
                          onClick={() => handleAddBlock("Gallery")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Image gallery grid"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-sky-500/20 border border-white/[0.07] group-hover:border-sky-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            🖼️
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Photo Grid</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Image showcase</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Video")}
                          onClick={() => handleAddBlock("Video")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Stream video embed"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-red-500/20 border border-white/[0.07] group-hover:border-red-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            🎥
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Video Embed</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Stream player</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Music")}
                          onClick={() => handleAddBlock("Music")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Music track player"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-violet-500/20 border border-white/[0.07] group-hover:border-violet-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            🎵
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Music Track</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Audio stream</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Image")}
                          onClick={() => handleAddBlock("Image")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Single image photo"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-fuchsia-500/20 border border-white/[0.07] group-hover:border-fuchsia-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            🖼️
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Single Image</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">High-res photo</span>
                          </div>
                        </button>
                      </div>
                    </div>
                    )}

                    {/* 5. Conversion & Forms */}
                    {(blockLibraryCategory === "all" || blockLibraryCategory === "forms") && (
                    <div className="key-editor-blocks-palette">
                      <div className="mb-2.5 flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          ⚡ Conversion & Forms
                        </span>
                        <span className="text-[9px] text-rose-400 font-bold bg-rose-500/15 border border-rose-500/25 px-2 py-0.5 rounded-full">
                          Leads
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Google Form")}
                          onClick={() => handleAddBlock("Google Form")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Google Form embed or native survey"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-purple-500/20 border border-white/[0.07] group-hover:border-purple-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            📋
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Google Form</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Embed survey</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Multi-Step Form")}
                          onClick={() => handleAddBlock("Multi-Step Form")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Interactive 3-step lead wizard"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-indigo-500/20 border border-white/[0.07] group-hover:border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            🧙‍♂️
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Lead Wizard</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Multi-step flow</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Lead Magnet")}
                          onClick={() => handleAddBlock("Lead Magnet")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Free PDF / eBook download card"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-emerald-500/20 border border-white/[0.07] group-hover:border-emerald-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            🎁
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Free Download</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">PDF & opt-in</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Meeting Booker")}
                          onClick={() => handleAddBlock("Meeting Booker")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Calendly meeting scheduler card"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-blue-500/20 border border-white/[0.07] group-hover:border-blue-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            🗓️
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Meeting Booker</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Calendly sync</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Newsletter Box")}
                          onClick={() => handleAddBlock("Newsletter Box")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Email capture newsletter subscription"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-amber-500/20 border border-white/[0.07] group-hover:border-amber-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            💌
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Newsletter</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Email capture</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Countdown")}
                          onClick={() => handleAddBlock("Countdown")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Countdown timer"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-red-500/20 border border-white/[0.07] group-hover:border-red-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            ⏱️
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Timer Clock</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Urgency counter</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Link Spin")}
                          onClick={() => handleAddBlock("Link Spin")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Prize wheel spinner"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-rose-500/20 border border-white/[0.07] group-hover:border-rose-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            🎡
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Lucky Wheel</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Reward spinner</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Smart Form")}
                          onClick={() => handleAddBlock("Smart Form")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Smart lead capture form"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-blue-500/20 border border-white/[0.07] group-hover:border-blue-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            📋
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Smart Form</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Lead capture</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Form")}
                          onClick={() => handleAddBlock("Form")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Custom form fields"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-violet-500/20 border border-white/[0.07] group-hover:border-violet-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            📝
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Custom Form</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Contact builder</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "FAQ")}
                          onClick={() => handleAddBlock("FAQ")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="FAQ accordion dropdown"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-indigo-500/20 border border-white/[0.07] group-hover:border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            ❓
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">FAQ Accordion</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Q&A dropdown</span>
                          </div>
                        </button>
                      </div>
                    </div>
                    )}

                    {/* 6. Core, Connect & Footer */}
                    {(blockLibraryCategory === "all" || blockLibraryCategory === "core") && (
                    <div className="key-editor-blocks-palette">
                      <div className="mb-2.5 flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          🔗 Core, Connect & Footer
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 rounded-full">
                          Essential
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Footer")}
                          onClick={() => handleAddBlock("Footer")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Modern clean footer"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-slate-500/20 border border-white/[0.07] group-hover:border-slate-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            🦶
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Page Footer</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Links & copyright</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Button")}
                          onClick={() => handleAddBlock("Button")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Clickable button"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-indigo-500/20 border border-white/[0.07] group-hover:border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            🔗
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Action Button</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Clickable CTA</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Deep Link")}
                          onClick={() => handleAddBlock("Deep Link")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="App deep link redirect"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-purple-500/20 border border-white/[0.07] group-hover:border-purple-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            ⚡
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Deep Link</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">App launcher</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "WhatsApp")}
                          onClick={() => handleAddBlock("WhatsApp")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Direct WhatsApp chat"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-green-500/20 border border-white/[0.07] group-hover:border-green-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            💬
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">WhatsApp Chat</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Direct message</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Socials")}
                          onClick={() => handleAddBlock("Socials")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Social media icon links"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-pink-500/20 border border-white/[0.07] group-hover:border-pink-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            🌐
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Social Bar</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Social handles</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Call")}
                          onClick={() => handleAddBlock("Call")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Click to phone call"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-slate-500/20 border border-white/[0.07] group-hover:border-slate-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            📞
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Call Button</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Tap to call</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Email")}
                          onClick={() => handleAddBlock("Email")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Click to email"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-indigo-500/20 border border-white/[0.07] group-hover:border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            ✉️
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Email Link</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Mailto button</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "vCard")}
                          onClick={() => handleAddBlock("vCard")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Save contact vCard file"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-amber-500/20 border border-white/[0.07] group-hover:border-amber-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            🪪
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Save Contact</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Digital vCard</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Events")}
                          onClick={() => handleAddBlock("Events")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Event RSVP and ticketing"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-indigo-500/20 border border-white/[0.07] group-hover:border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            📅
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">RSVP Event</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Date & booking</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Map")}
                          onClick={() => handleAddBlock("Map")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Google Maps location pin"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-rose-500/20 border border-white/[0.07] group-hover:border-rose-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            📍
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Google Map</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Location pin</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Tip Jar")}
                          onClick={() => handleAddBlock("Tip Jar")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Donations & tip jar"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-rose-500/20 border border-white/[0.07] group-hover:border-rose-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            ☕
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Tip / Donate</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Coffee & tips</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "PDF")}
                          onClick={() => handleAddBlock("PDF")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="PDF document download"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-emerald-500/20 border border-white/[0.07] group-hover:border-emerald-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            📄
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">PDF Document</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">File download</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Text")}
                          onClick={() => handleAddBlock("Text")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Paragraph rich text"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-indigo-500/20 border border-white/[0.07] group-hover:border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            📝
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Rich Text</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Paragraph note</span>
                          </div>
                        </button>

                        <button
                          draggable={true}
                          onDragStart={(e) => handleDragStartBlockType(e, "Divider")}
                          onClick={() => handleAddBlock("Divider")}
                          className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-indigo-500/40 px-2.5 py-1.5 rounded-xl text-left transition-all group relative shadow-xs hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:scale-[1.01] backdrop-blur-md min-w-0 overflow-hidden h-[54px]"
                          title="Spacer & divider line"
                        >
                          <span className="h-8 w-8 rounded-lg bg-white/[0.05] group-hover:bg-slate-500/20 border border-white/[0.07] group-hover:border-slate-500/30 flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105">
                            —
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-xs font-bold block text-slate-100 group-hover:text-white truncate">Divider Line</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 block truncate mt-0.5">Spacer divider</span>
                          </div>
                        </button>
                      </div>
                    </div>
                    )}

                    {/* Saved Templates & Session Drafts in Editor Sidebar */}
                    {(savedTemplates.length > 0 || savedDrafts.length > 0) && (
                      <div className="pt-4 border-t border-white/[0.08] space-y-4">
                        <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest block">
                          SAVED TEMPLATES & DRAFTS
                        </span>
                        
                        {savedTemplates.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Templates</span>
                            <div className="grid grid-cols-1 gap-2">
                              {savedTemplates.map((tpl) => (
                                <div key={tpl.id} className="flex items-center justify-between p-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-indigo-500/30 rounded-xl transition-all shadow-xs">
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-slate-200 block truncate">💎 {getTemplateDisplayName(tpl)}</span>
                                    <span className="text-[9px] text-slate-400 font-medium block">{getTemplateBlockCount(tpl)} blocks</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      hydrateEditorFromState(tpl.data);
                                      setLinkedTemplateId(tpl.id);
                                      triggerToast(`✨ Applied Template "${getTemplateDisplayName(tpl)}" to editor!`);
                                    }}
                                    className="px-2.5 py-1 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-[9px] font-bold rounded-lg transition-colors border border-indigo-500/30 cursor-pointer"
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
                                <div key={draft.id} className="flex items-center justify-between p-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-indigo-500/30 rounded-xl transition-all shadow-xs">
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-slate-200 block truncate">📝 {getDraftDisplayName(draft)}</span>
                                    <span className="text-[9px] text-slate-400 font-medium block">{getDraftBlockCount(draft)} blocks</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      hydrateEditorFromState(draft.data);
                                      triggerToast(`✨ Restored Draft for "${getDraftDisplayName(draft)}"!`);
                                    }}
                                    className="px-2.5 py-1 bg-white/[0.08] hover:bg-white/[0.14] text-white text-[9px] font-bold rounded-lg transition-colors border border-white/[0.1] cursor-pointer"
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
                )}

                {/* THEME & COVER PANEL */}
                {studioNavTab === "theme" && (
                  <div className="space-y-4 w-full">
                    {/* Visual Studio Theme Mode Selector (7 Circular Modes) */}
                    <div className="p-3.5 rounded-2xl border border-white/[0.08] bg-slate-900/60 backdrop-blur-xl shadow-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Palette className="h-3.5 w-3.5 text-indigo-400" />
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                            Visual Theme Modes ({ALL_THEMES.length})
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsStudioPersonalizationOpen(true)}
                          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                        >
                          Studio View →
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 pt-0.5 px-0.5">
                        {ALL_THEMES.map((th) => {
                          const isThActive = currentUiTheme === th.id;
                          return (
                            <div key={th.id} className="relative group flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => handleApplyStudioTheme(th.id)}
                                className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full border transition-all duration-150 flex items-center justify-center cursor-pointer shadow-sm relative ${
                                  isThActive
                                    ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 scale-110 border-white"
                                    : "border-white/20 hover:border-white/60 hover:scale-105 opacity-85 hover:opacity-100"
                                }`}
                                style={{ background: th.previewBg }}
                                title={th.name}
                                aria-label={th.name}
                              >
                                {isThActive && (
                                  <span className="w-3.5 h-3.5 rounded-full bg-slate-950/70 text-emerald-400 flex items-center justify-center text-[8px] font-black drop-shadow">
                                    ✓
                                  </span>
                                )}
                              </button>
                              {/* Hover Tooltip: Very small text */}
                              <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 px-1.5 py-0.5 rounded bg-slate-950 text-[8px] font-bold text-white border border-slate-800 whitespace-nowrap shadow-xl z-50">
                                {th.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl border border-white/[0.08] bg-slate-900/60 backdrop-blur-xl shadow-2xl space-y-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
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
                        </div>
                      </div>

                      {/* Dropzone/Preview Frame */}
                      <div className="relative key-editor-cover-panel__frame-wrap group rounded-2xl overflow-hidden border border-white/10">
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
                          className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-xs font-bold gap-1.5 p-4 text-center"
                        >
                          <span className="text-xl">📷</span>
                          <span>Drop cover photo or browse</span>
                          <span className="text-[9px] font-normal opacity-75">PNG, JPG, GIF up to 5MB</span>
                        </label>
                      </div>

                      {/* Title, handle & bio */}
                      <div className="grid grid-cols-1 gap-3.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">Biolink Title</label>
                          <input
                            type="text"
                            value={editorTitle}
                            onChange={(e) => setEditorTitle(e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/10 focus:border-indigo-500 focus:bg-white/[0.06] focus:outline-none rounded-xl py-2 px-3 text-xs font-bold text-white placeholder:text-slate-500 transition-all"
                            placeholder="My BioLink"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">Page Handle (@watermark)</label>
                          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 focus-within:border-indigo-500 focus-within:bg-white/[0.06] rounded-xl px-3 transition-all">
                            <span className="text-xs font-bold text-slate-400 shrink-0 select-none" aria-hidden>
                              @
                            </span>
                            <input
                              type="text"
                              value={editorHandle}
                              onChange={(e) => setEditorHandle(normalizeHandleInput(e.target.value))}
                              className="flex-1 min-w-0 bg-transparent border-0 focus:outline-none focus:ring-0 py-2 text-xs font-semibold text-white font-mono placeholder:text-slate-500"
                              placeholder={handlePlaceholder}
                              aria-label="Page handle"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">Short Bio</label>
                          <textarea
                            value={editorBio}
                            onChange={(e) => setEditorBio(e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/10 focus:border-indigo-500 focus:bg-white/[0.06] focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-200 placeholder:text-slate-500 resize-none transition-all"
                            placeholder="Write a short bio..."
                            rows={2}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">Theme Palette</label>
                          <BioPageThemePicker value={editorPageTheme} onChange={handlePreviewThemeChange} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1. STRUCTURE TREE TAB (Bricks Builder DOM Outline Panel) */}
                {studioNavTab === "layers" && (
                  <div className="space-y-3.5 w-full">
                    <BuilderStructureTree
                      blocks={canvasBlocks as BioEditorBlock[]}
                      selectedBlockId={expandedBlockId || selectedCanvasBlockId}
                      onSelectBlock={(id) => {
                        setSelectedCanvasBlockId(id);
                        setExpandedBlockId(id);
                        setStudioNavTab("inspector");
                        const el = document.getElementById(`editor-block-${id}`);
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      onMoveUp={(idx) => {
                        if (idx > 0) reorderEditorBlocks(idx, idx - 1);
                      }}
                      onMoveDown={(idx) => {
                        if (idx < canvasBlocks.length - 1) reorderEditorBlocks(idx, idx + 1);
                      }}
                      onDuplicate={handleDuplicateBlock}
                      onDelete={handleDeleteBlock}
                      onToggleHidden={handleToggleBlockHidden}
                      onToggleLock={handleToggleBlockLock}
                      getBlockIcon={getBlockIcon}
                    />
                  </div>
                )}

                {/* 2. BLOCK INSPECTOR (DUAL TAB: CONTENT & STYLE - Bricks Builder Style) */}
                {studioNavTab === "inspector" && (
                  <div className="space-y-3.5 w-full">
                    {expandedBlockId ? (
                      <>
                        {/* Inspector Quick Info Banner */}
                        <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl mb-1 flex items-center justify-between backdrop-blur-md">
                          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-xs shadow-emerald-400/50" />
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <span className="text-xs font-bold text-slate-100 block truncate">
                                {canvasBlocks.find((b) => b.id === expandedBlockId)?.label || "Active Block"}
                              </span>
                              <span className="text-[9px] text-indigo-400 font-mono uppercase block truncate">
                                {canvasBlocks.find((b) => b.id === expandedBlockId)?.type || "Inspector"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={() => handleToggleBlockLock(expandedBlockId)}
                              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                              title="Lock / Unlock component"
                            >
                              {Boolean(canvasBlocks.find((b) => b.id === expandedBlockId)?.isLocked || (canvasBlocks.find((b) => b.id === expandedBlockId)?.styles as any)?.isLocked) ? (
                                <Lock className="h-3.5 w-3.5 text-amber-400" />
                              ) : (
                                <Unlock className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleBlockHidden(expandedBlockId)}
                              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                              title="Hide / Show component"
                            >
                              {Boolean(canvasBlocks.find((b) => b.id === expandedBlockId)?.isHidden || (canvasBlocks.find((b) => b.id === expandedBlockId)?.styles as any)?.isHidden) ? (
                                <EyeOff className="h-3.5 w-3.5 text-amber-400" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateBlock(expandedBlockId)}
                              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                              title="Duplicate block"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBlock(expandedBlockId)}
                              className="p-1.5 hover:bg-rose-500/20 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete block"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Dual Tab Switcher: Content vs Style */}
                        <div className="grid grid-cols-2 gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
                          <button
                            type="button"
                            onClick={() => setInspectorTab("content")}
                            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              inspectorTab === "content"
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Content</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setInspectorTab("style")}
                            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              inspectorTab === "style"
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                            }`}
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Style (CSS)</span>
                          </button>
                        </div>

                        {/* If Style Tab is Active: Render BlockStyleInspector */}
                        {inspectorTab === "style" && (
                          <div className="p-3.5 bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-2xl">
                            <BlockStyleInspector
                              styles={(canvasBlocks.find((b) => b.id === expandedBlockId) as any)?.styles as BlockDeveloperStyles}
                              onChange={(newStyles) => handleUpdateBlockStyles(expandedBlockId, newStyles)}
                              blockLabel={canvasBlocks.find((b) => b.id === expandedBlockId)?.label}
                              blockType={canvasBlocks.find((b) => b.id === expandedBlockId)?.type}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12 px-4 space-y-3 bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-dashed border-white/10">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-xl shadow-lg shadow-indigo-500/10">
                          🎯
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">Canvas Click-to-Inspect</h4>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-xs mx-auto">
                            Click any block on the canvas or Structure Tree to customize.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStudioNavTab("layers")}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
                        >
                          Open Structure Tree
                        </button>
                      </div>
                    )}

                    {/* CONTENT TAB: Render existing accordion blocks */}
                    {inspectorTab === "content" && (
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
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="block text-[8.5px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                                          {block.type}
                                        </span>
                                        {block.deviceVisibility === "mobile_only" && (
                                          <span className="text-[7.5px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-600 border border-blue-200 uppercase">
                                            📱 Phone Only
                                          </span>
                                        )}
                                        {block.deviceVisibility === "desktop_only" && (
                                          <span className="text-[7.5px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-600 border border-purple-200 uppercase">
                                            💻 Desktop Only
                                          </span>
                                        )}
                                        {block.colSpan === "half" && (
                                          <span className="text-[7.5px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase">
                                            ½ Grid
                                          </span>
                                        )}
                                      </div>
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
                                      block.type !== "Image" &&
                                      block.type !== "Split Hero" &&
                                      block.type !== "Video Hero" &&
                                      block.type !== "Glow Badge" &&
                                      block.type !== "Feature Hero" &&
                                      block.type !== "Toggle Pricing" &&
                                      block.type !== "Product Showcase" &&
                                      block.type !== "Comparison Table" &&
                                      block.type !== "Payment Button" &&
                                      block.type !== "Brand Logos" &&
                                      block.type !== "Star Ratings" &&
                                      block.type !== "Press Mentions" &&
                                      block.type !== "Before/After Slider" &&
                                      block.type !== "Portfolio Gallery" &&
                                      block.type !== "Video Showcase" &&
                                      block.type !== "Audio Player" &&
                                      block.type !== "Multi-Step Form" &&
                                      block.type !== "Lead Magnet" &&
                                      block.type !== "Meeting Booker" &&
                                      block.type !== "Newsletter Box" && (
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

                                     {/* --- DEVELOPER-GRADE BLOCK ACCORDION EDITORS --- */}
                                     {/* 1. Split Hero */}
                                     {block.type === "Split Hero" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Badge Text</label>
                                           <input
                                             type="text"
                                             value={(block as any).badgeText || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "badgeText", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800"
                                             placeholder="e.g. 🚀 Next-Gen Micro-Site Builder"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Main Headline</label>
                                           <input
                                             type="text"
                                             value={(block as any).headline || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "headline", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800"
                                             placeholder="Headline..."
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subheadline</label>
                                           <textarea
                                             rows={2}
                                             value={(block as any).subheadline || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "subheadline", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800"
                                             placeholder="Supporting description..."
                                           />
                                         </div>
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Primary Button</label>
                                             <input
                                               type="text"
                                               value={(block as any).primaryCtaLabel || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "primaryCtaLabel", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800"
                                               placeholder="Get Started Free"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Primary URL</label>
                                             <input
                                               type="text"
                                               value={(block as any).primaryCtaUrl || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "primaryCtaUrl", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 font-mono"
                                               placeholder="https://..."
                                             />
                                           </div>
                                         </div>
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Secondary Button</label>
                                             <input
                                               type="text"
                                               value={(block as any).secondaryCtaLabel || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "secondaryCtaLabel", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800"
                                               placeholder="Book a Demo"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Secondary URL</label>
                                             <input
                                               type="text"
                                               value={(block as any).secondaryCtaUrl || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "secondaryCtaUrl", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 font-mono"
                                               placeholder="https://..."
                                             />
                                           </div>
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hero Image URL</label>
                                           <input
                                             type="text"
                                             value={(block as any).imageUrl || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "imageUrl", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 font-mono"
                                             placeholder="https://images.unsplash.com/..."
                                           />
                                         </div>
                                       </div>
                                     )}

                                     {/* 2. Video Hero */}
                                     {block.type === "Video Hero" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Badge Text</label>
                                           <input
                                             type="text"
                                             value={(block as any).badgeText || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "badgeText", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Headline</label>
                                           <input
                                             type="text"
                                             value={(block as any).headline || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "headline", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subheadline</label>
                                           <input
                                             type="text"
                                             value={(block as any).subheadline || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "subheadline", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Video Stream URL (MP4 / WebM)</label>
                                           <input
                                             type="text"
                                             value={(block as any).videoUrl || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "videoUrl", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                             placeholder="https://..."
                                           />
                                         </div>
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CTA Label</label>
                                             <input
                                               type="text"
                                               value={(block as any).ctaLabel || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "ctaLabel", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CTA URL</label>
                                             <input
                                               type="text"
                                               value={(block as any).ctaUrl || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "ctaUrl", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                             />
                                           </div>
                                         </div>
                                       </div>
                                     )}

                                     {/* 3. Glow Badge */}
                                     {block.type === "Glow Badge" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Announcement Text</label>
                                           <input
                                             type="text"
                                             value={(block as any).badgeText || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "badgeText", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                             placeholder="⚡ Introducing new feature..."
                                           />
                                         </div>
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Link URL</label>
                                             <input
                                               type="text"
                                               value={(block as any).badgeLink || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "badgeLink", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Glow Theme</label>
                                             <select
                                               value={(block as any).badgeStyle || "purple"}
                                               onChange={(e) => handleUpdateBlockField(block.id, "badgeStyle", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                             >
                                               <option value="purple">Purple Glow</option>
                                               <option value="emerald">Emerald Glow</option>
                                               <option value="amber">Amber Glow</option>
                                               <option value="cyan">Cyan Glow</option>
                                             </select>
                                           </div>
                                         </div>
                                       </div>
                                     )}

                                     {/* 4. Feature Hero */}
                                     {block.type === "Feature Hero" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Headline</label>
                                           <input
                                             type="text"
                                             value={(block as any).headline || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "headline", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subheadline</label>
                                           <input
                                             type="text"
                                             value={(block as any).subheadline || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "subheadline", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                       </div>
                                     )}

                                     {/* 5. Toggle Pricing */}
                                     {block.type === "Toggle Pricing" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Annual Discount Badge</label>
                                           <input
                                             type="text"
                                             value={(block as any).discountBadge || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "discountBadge", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                             placeholder="Save 20% Yearly"
                                           />
                                         </div>
                                       </div>
                                     )}

                                     {/* 6. Product Showcase */}
                                     {block.type === "Product Showcase" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Product Title</label>
                                           <input
                                             type="text"
                                             value={(block as any).productName || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "productName", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                         <div className="grid grid-cols-3 gap-2">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Price</label>
                                             <input
                                               type="text"
                                               value={(block as any).price || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "price", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-2 text-xs"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Original Price</label>
                                             <input
                                               type="text"
                                               value={(block as any).originalPrice || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "originalPrice", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-2 text-xs"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Badge</label>
                                             <input
                                               type="text"
                                               value={(block as any).discountPercent || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "discountPercent", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-2 text-xs"
                                             />
                                           </div>
                                         </div>
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Urgency Text</label>
                                             <input
                                               type="text"
                                               value={(block as any).stockUrgency || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "stockUrgency", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Buy URL</label>
                                             <input
                                               type="text"
                                               value={(block as any).buyUrl || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "buyUrl", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                             />
                                           </div>
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Image URL</label>
                                           <input
                                             type="text"
                                             value={(block as any).imageUrl || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "imageUrl", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                           />
                                         </div>
                                       </div>
                                     )}

                                     {/* 8. Payment Button */}
                                     {block.type === "Payment Button" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Button CTA Text</label>
                                           <input
                                             type="text"
                                             value={(block as any).buttonText || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "buttonText", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Amount</label>
                                             <input
                                               type="text"
                                               value={(block as any).amount || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "amount", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Checkout URL</label>
                                             <input
                                               type="text"
                                               value={(block as any).paymentUrl || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "paymentUrl", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                             />
                                           </div>
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Guarantee Subtext</label>
                                           <input
                                             type="text"
                                             value={(block as any).guaranteeText || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "guaranteeText", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                       </div>
                                     )}

                                     {/* 9. Brand Logos */}
                                     {block.type === "Brand Logos" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Title</label>
                                           <input
                                             type="text"
                                             value={(block as any).title || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "title", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Display Mode</label>
                                           <select
                                             value={(block as any).displayMode || "marquee"}
                                             onChange={(e) => handleUpdateBlockField(block.id, "displayMode", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           >
                                             <option value="marquee">Continuous Scrolling Marquee</option>
                                             <option value="grid">Clean Static Grid</option>
                                           </select>
                                         </div>
                                       </div>
                                     )}

                                     {/* 10. Star Ratings */}
                                     {block.type === "Star Ratings" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Score</label>
                                             <input
                                               type="text"
                                               value={(block as any).ratingScore || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "ratingScore", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Review Count Label</label>
                                             <input
                                               type="text"
                                               value={(block as any).reviewCount || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "reviewCount", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                             />
                                           </div>
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Headline</label>
                                           <input
                                             type="text"
                                             value={(block as any).headline || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "headline", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                       </div>
                                     )}

                                     {/* 12. Before/After Slider */}
                                     {block.type === "Before/After Slider" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Caption</label>
                                           <input
                                             type="text"
                                             value={(block as any).caption || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "caption", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Before Label</label>
                                             <input
                                               type="text"
                                               value={(block as any).beforeLabel || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "beforeLabel", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">After Label</label>
                                             <input
                                               type="text"
                                               value={(block as any).afterLabel || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "afterLabel", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                             />
                                           </div>
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Before Image URL</label>
                                           <input
                                             type="text"
                                             value={(block as any).beforeImage || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "beforeImage", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">After Image URL</label>
                                           <input
                                             type="text"
                                             value={(block as any).afterImage || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "afterImage", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                           />
                                         </div>
                                       </div>
                                     )}

                                     {/* 14. Video Showcase */}
                                     {block.type === "Video Showcase" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Course / Video Title</label>
                                           <input
                                             type="text"
                                             value={(block as any).title || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "title", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Featured Video URL</label>
                                           <input
                                             type="text"
                                             value={(block as any).featuredVideoUrl || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "featuredVideoUrl", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                           />
                                         </div>
                                       </div>
                                     )}

                                     {/* 15. Audio Player */}
                                     {block.type === "Audio Player" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Episode / Track Title</label>
                                           <input
                                             type="text"
                                             value={(block as any).title || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "title", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Show / Podcast Name</label>
                                             <input
                                               type="text"
                                               value={(block as any).podcastName || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "podcastName", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Artist / Host</label>
                                             <input
                                               type="text"
                                               value={(block as any).artist || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "artist", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                             />
                                           </div>
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Audio Stream URL (MP3 / AAC)</label>
                                           <input
                                             type="text"
                                             value={(block as any).audioUrl || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "audioUrl", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                           />
                                         </div>
                                       </div>
                                     )}

                                     {/* 16. Multi-Step Form */}
                                     {block.type === "Multi-Step Form" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Form Title</label>
                                           <input
                                             type="text"
                                             value={(block as any).formTitle || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "formTitle", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Submit Button Text</label>
                                           <input
                                             type="text"
                                             value={(block as any).submitButtonText || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "submitButtonText", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                       </div>
                                     )}

                                     {/* 17. Lead Magnet */}
                                     {block.type === "Lead Magnet" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Badge Text</label>
                                           <input
                                             type="text"
                                             value={(block as any).badgeText || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "badgeText", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ebook / Resource Title</label>
                                           <input
                                             type="text"
                                             value={(block as any).title || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "title", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">File Size Info</label>
                                             <input
                                               type="text"
                                               value={(block as any).fileSize || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "fileSize", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Download URL</label>
                                             <input
                                               type="text"
                                               value={(block as any).downloadUrl || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "downloadUrl", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                             />
                                           </div>
                                         </div>
                                       </div>
                                     )}

                                     {/* 18. Meeting Booker */}
                                     {block.type === "Meeting Booker" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Host Name</label>
                                             <input
                                               type="text"
                                               value={(block as any).hostName || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "hostName", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Host Role</label>
                                             <input
                                               type="text"
                                               value={(block as any).hostRole || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "hostRole", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                             />
                                           </div>
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Meeting Title</label>
                                           <input
                                             type="text"
                                             value={(block as any).meetingTitle || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "meetingTitle", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Duration</label>
                                             <input
                                               type="text"
                                               value={(block as any).durationMinutes || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "durationMinutes", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Booking / Calendly URL</label>
                                             <input
                                               type="text"
                                               value={(block as any).bookingUrl || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "bookingUrl", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                             />
                                           </div>
                                         </div>
                                       </div>
                                     )}

                                     {/* 19. Newsletter Box */}
                                     {block.type === "Newsletter Box" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Headline</label>
                                           <input
                                             type="text"
                                             value={(block as any).title || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "title", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subtext</label>
                                           <input
                                             type="text"
                                             value={(block as any).subtitle || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "subtitle", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Button Label</label>
                                             <input
                                               type="text"
                                               value={(block as any).buttonLabel || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "buttonLabel", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Social Proof Badge</label>
                                             <input
                                               type="text"
                                               value={(block as any).subscriberBadge || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "subscriberBadge", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                             />
                                           </div>
                                         </div>
                                       </div>
                                     )}

                                     {/* 20. Navbar Block */}
                                     {block.type === "Navbar" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Brand Name</label>
                                             <input
                                               type="text"
                                               value={(block as any).brandName || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "brandName", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                               placeholder="KEYLINKS 360"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tagline</label>
                                             <input
                                               type="text"
                                               value={(block as any).tagline || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "tagline", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                               placeholder="Micro Site"
                                             />
                                           </div>
                                         </div>
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CTA Label</label>
                                             <input
                                               type="text"
                                               value={(block as any).ctaLabel || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "ctaLabel", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold"
                                               placeholder="Get Started ⚡"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CTA URL</label>
                                             <input
                                               type="url"
                                               value={(block as any).ctaUrl || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "ctaUrl", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                               placeholder="https://..."
                                             />
                                           </div>
                                         </div>
                                         <div className="flex items-center justify-between py-1">
                                           <span className="text-xs text-slate-700 font-semibold">Glassmorphic Blur Effect</span>
                                           <input
                                             type="checkbox"
                                             checked={(block as any).isGlassmorphic !== false}
                                             onChange={(e) => handleUpdateBlockField(block.id, "isGlassmorphic", e.target.checked)}
                                             className="rounded border-slate-300 accent-indigo-600 h-4 w-4"
                                           />
                                         </div>
                                       </div>
                                     )}

                                     {/* 21. Footer Block */}
                                     {block.type === "Footer" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Brand Name</label>
                                             <input
                                               type="text"
                                               value={(block as any).brandName || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "brandName", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Support Email</label>
                                             <input
                                               type="email"
                                               value={(block as any).supportEmail || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "supportEmail", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                             />
                                           </div>
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tagline</label>
                                           <input
                                             type="text"
                                             value={(block as any).tagline || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "tagline", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Copyright Text</label>
                                           <input
                                             type="text"
                                             value={(block as any).copyrightText || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "copyrightText", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                           />
                                         </div>
                                       </div>
                                     )}

                                     {/* 22. Main Feature Block */}
                                     {block.type === "Main Feature" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Badge Text</label>
                                           <input
                                             type="text"
                                             value={(block as any).badge || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "badge", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Headline</label>
                                           <input
                                             type="text"
                                             value={(block as any).headline || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "headline", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subheadline</label>
                                           <textarea
                                             rows={2}
                                             value={(block as any).subheadline || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "subheadline", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs resize-none"
                                           />
                                         </div>
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CTA Label</label>
                                             <input
                                               type="text"
                                               value={(block as any).ctaText || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "ctaText", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CTA URL</label>
                                             <input
                                               type="url"
                                               value={(block as any).ctaUrl || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "ctaUrl", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                             />
                                           </div>
                                         </div>
                                       </div>
                                     )}

                                     {/* 23. Auto Slider Block */}
                                     {block.type === "Auto Slider" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div className="flex items-center justify-between py-1">
                                           <span className="text-xs text-slate-700 font-semibold">Autoplay Slides</span>
                                           <input
                                             type="checkbox"
                                             checked={(block as any).autoplay !== false}
                                             onChange={(e) => handleUpdateBlockField(block.id, "autoplay", e.target.checked)}
                                             className="rounded border-slate-300 accent-indigo-600 h-4 w-4"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Slide Interval (Seconds)</label>
                                           <input
                                             type="number"
                                             min={2}
                                             max={15}
                                             value={(block as any).intervalSeconds || 4}
                                             onChange={(e) => handleUpdateBlockField(block.id, "intervalSeconds", Number(e.target.value))}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                         <div className="space-y-2">
                                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Slide Images</span>
                                           {Array.isArray((block as any).slides) && (block as any).slides.map((sl: any, sIdx: number) => (
                                             <div key={sl.id || sIdx} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                                               <input
                                                 type="text"
                                                 value={sl.title || ""}
                                                 onChange={(e) => {
                                                   const updated = [...(block as any).slides];
                                                   updated[sIdx] = { ...updated[sIdx], title: e.target.value };
                                                   handleUpdateBlockField(block.id, "slides", updated);
                                                 }}
                                                 placeholder="Slide title"
                                                 className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2 text-xs font-bold"
                                               />
                                               <input
                                                 type="text"
                                                 value={sl.imageUrl || ""}
                                                 onChange={(e) => {
                                                   const updated = [...(block as any).slides];
                                                   updated[sIdx] = { ...updated[sIdx], imageUrl: e.target.value };
                                                   handleUpdateBlockField(block.id, "slides", updated);
                                                 }}
                                                 placeholder="Image URL"
                                                 className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2 text-xs font-mono"
                                               />
                                               <input
                                                 type="text"
                                                 value={sl.linkUrl || ""}
                                                 onChange={(e) => {
                                                   const updated = [...(block as any).slides];
                                                   updated[sIdx] = { ...updated[sIdx], linkUrl: e.target.value };
                                                   handleUpdateBlockField(block.id, "slides", updated);
                                                 }}
                                                 placeholder="Target click URL"
                                                 className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2 text-xs font-mono"
                                               />
                                             </div>
                                           ))}
                                         </div>
                                       </div>
                                     )}

                                     {/* 24. Google Form Block */}
                                     {block.type === "Google Form" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Form Title</label>
                                           <input
                                             type="text"
                                             value={(block as any).formTitle || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "formTitle", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description / Instructions</label>
                                           <input
                                             type="text"
                                             value={(block as any).formDescription || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "formDescription", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Google Form Embed URL (Optional)</label>
                                           <input
                                             type="url"
                                             value={(block as any).embedUrl || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "embedUrl", e.target.value)}
                                             placeholder="https://docs.google.com/forms/d/e/.../viewform?embedded=true"
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                           />
                                           <p className="text-[10px] text-slate-400 mt-1">Leave empty to use the native interactive inquiry form.</p>
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Submit Button Label</label>
                                           <input
                                             type="text"
                                             value={(block as any).submitButtonText || "Submit Inquiry 🚀"}
                                             onChange={(e) => handleUpdateBlockField(block.id, "submitButtonText", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold"
                                           />
                                         </div>
                                       </div>
                                     )}

                                     {/* 25. Flash Offer Block */}
                                     {block.type === "Flash Offer" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Urgency Badge</label>
                                           <input
                                             type="text"
                                             value={(block as any).badgeText || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "badgeText", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-rose-600"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Discount Headline</label>
                                           <input
                                             type="text"
                                             value={(block as any).discountHeadline || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "discountHeadline", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold"
                                           />
                                         </div>
                                         <div className="grid grid-cols-3 gap-2">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Coupon Code</label>
                                             <input
                                               type="text"
                                               value={(block as any).couponCode || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "couponCode", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-2 text-xs font-mono font-bold uppercase text-indigo-600"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Original Price</label>
                                             <input
                                               type="text"
                                               value={(block as any).originalPrice || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "originalPrice", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-2 text-xs line-through text-slate-400"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sale Price</label>
                                             <input
                                               type="text"
                                               value={(block as any).salePrice || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "salePrice", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-2 text-xs font-bold text-emerald-600"
                                             />
                                           </div>
                                         </div>
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Claim Button Text</label>
                                             <input
                                               type="text"
                                               value={(block as any).ctaLabel || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "ctaLabel", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Claim Redirect URL</label>
                                             <input
                                               type="url"
                                               value={(block as any).ctaUrl || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "ctaUrl", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                             />
                                           </div>
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Terms Note</label>
                                           <input
                                             type="text"
                                             value={(block as any).termsNote || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "termsNote", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                       </div>
                                     )}

                                     {/* 26. Community Hub Block */}
                                     {block.type === "Community Hub" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Group Name</label>
                                           <input
                                             type="text"
                                             value={(block as any).groupName || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "groupName", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold"
                                           />
                                         </div>
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Members</label>
                                             <input
                                               type="text"
                                               value={(block as any).memberCount || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "memberCount", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                               placeholder="5,000+ Members"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Online Now Badge</label>
                                             <input
                                               type="text"
                                               value={(block as any).onlineCount || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "onlineCount", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-emerald-600"
                                               placeholder="420 Online"
                                             />
                                           </div>
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Group Description</label>
                                           <textarea
                                             rows={2}
                                             value={(block as any).groupDescription || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "groupDescription", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs resize-none"
                                           />
                                         </div>
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Join Button Label</label>
                                             <input
                                               type="text"
                                               value={(block as any).joinButtonLabel || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "joinButtonLabel", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Invite URL (WhatsApp / Telegram / Discord)</label>
                                             <input
                                               type="url"
                                               value={(block as any).inviteUrl || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "inviteUrl", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                             />
                                           </div>
                                         </div>
                                       </div>
                                     )}

                                     {/* 27. YouTube Channel Block */}
                                     {block.type === "YouTube Channel" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Channel Name</label>
                                             <input
                                               type="text"
                                               value={(block as any).channelName || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "channelName", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subscribers</label>
                                             <input
                                               type="text"
                                               value={(block as any).subscriberCount || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "subscriberCount", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                               placeholder="100K Subscribers"
                                             />
                                           </div>
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Video Title</label>
                                           <input
                                             type="text"
                                             value={(block as any).videoTitle || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "videoTitle", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                           />
                                         </div>
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Video Stream URL (MP4 / WebM)</label>
                                             <input
                                               type="url"
                                               value={(block as any).videoUrl || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "videoUrl", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subscribe URL</label>
                                             <input
                                               type="url"
                                               value={(block as any).subscribeUrl || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "subscribeUrl", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                             />
                                           </div>
                                         </div>
                                       </div>
                                     )}

                                     {/* 28. Instagram Feed Block */}
                                     {block.type === "Instagram Feed" && (
                                       <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <div className="grid grid-cols-2 gap-3">
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Instagram Handle</label>
                                             <input
                                               type="text"
                                               value={(block as any).instagramHandle || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "instagramHandle", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold"
                                               placeholder="@username"
                                             />
                                           </div>
                                           <div>
                                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Followers Badge</label>
                                             <input
                                               type="text"
                                               value={(block as any).followerCount || ""}
                                               onChange={(e) => handleUpdateBlockField(block.id, "followerCount", e.target.value)}
                                               className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                               placeholder="50K Followers"
                                             />
                                           </div>
                                         </div>
                                         <div>
                                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Profile URL</label>
                                           <input
                                             type="url"
                                             value={(block as any).profileUrl || ""}
                                             onChange={(e) => handleUpdateBlockField(block.id, "profileUrl", e.target.value)}
                                             className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono"
                                           />
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

                                     {/* Responsive Device Visibility & Column Span */}
                                     <div className="pt-3 border-t border-slate-100 space-y-2.5">
                                       <div className="flex items-center justify-between">
                                         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                           Device Visibility
                                         </label>
                                         <span className="text-[10px] font-semibold text-slate-400">
                                           {block.deviceVisibility === "mobile_only"
                                             ? "📱 Phone Only"
                                             : block.deviceVisibility === "desktop_only"
                                               ? "💻 Desktop & Tablet"
                                               : "🌐 All Devices"}
                                         </span>
                                       </div>
                                       <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
                                         {[
                                           { id: "all", label: "All Devices", icon: Globe },
                                           { id: "mobile_only", label: "Phone Only", icon: Smartphone },
                                           { id: "desktop_only", label: "Desktop Only", icon: Laptop }
                                         ].map((dev) => {
                                           const isSelected = (block.deviceVisibility || "all") === dev.id;
                                           const DevIcon = dev.icon;
                                           return (
                                             <button
                                               key={dev.id}
                                               type="button"
                                               onClick={() => handleUpdateBlockField(block.id, "deviceVisibility", dev.id)}
                                               className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                                 isSelected
                                                   ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                                                   : "text-slate-500 hover:text-slate-900"
                                               }`}
                                             >
                                               <DevIcon className="h-3 w-3 shrink-0" />
                                               <span className="truncate">{dev.label}</span>
                                             </button>
                                           );
                                         })}
                                       </div>

                                       <div className="flex items-center justify-between pt-1">
                                         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                           Large Screen Width
                                         </label>
                                         <div className="flex items-center gap-0.5 bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/80">
                                           <button
                                             type="button"
                                             onClick={() => handleUpdateBlockField(block.id, "colSpan", "full")}
                                             className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                               (block.colSpan || "full") === "full"
                                                 ? "bg-white text-indigo-600 shadow-xs"
                                                 : "text-slate-500 hover:text-slate-800"
                                             }`}
                                           >
                                             Full Width
                                           </button>
                                           <button
                                             type="button"
                                             onClick={() => handleUpdateBlockField(block.id, "colSpan", "half")}
                                             className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                               block.colSpan === "half"
                                                 ? "bg-white text-indigo-600 shadow-xs"
                                                 : "text-slate-500 hover:text-slate-800"
                                             }`}
                                           >
                                             ½ Grid Column
                                           </button>
                                         </div>
                                       </div>
                                     </div>

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
                    )}
                  </div>
                )}

                {/* Mobile & Small Tablet Full Screen Live Preview Button from Active Tool Panel */}
                <div className="p-2.5 px-3 border-t border-slate-800/80 bg-slate-900/95 md:hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPreviewOnlyMode(true);
                      setIsSidebarOpen(false);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    <Eye className="h-4 w-4 text-cyan-200 animate-pulse" />
                    <span>Live Page Preview</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/30 border border-white/20 ml-1">
                      Full View
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </aside>
      )}

          {/* ZONE 2: CENTER LIVE PREVIEW STAGE */}
          <main
            className={`key-studio-stage flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden relative transition-colors duration-200 ${
              isDraggingOutsidePreview && draggingCanvasBlockId ? "bg-rose-950/20 ring-2 ring-rose-500/50 ring-inset" : ""
            }`}
            onClick={() => {
              // Close sliding sidebar tool panel (ADD BLOCKS, Layers, Inspector, Theme, Settings, etc.) when clicking anywhere in the workspace/preview free space
              if (studioNavTab !== "menu") {
                setStudioNavTab("menu");
                setShowThanksPage(false);
                setEditorTab("Edit");
              }
              setSelectedCanvasBlockId(null);
            }}
            onDragOver={(e) => {
              if (draggingCanvasBlockId) {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (!isDraggingOutsidePreview) {
                  setIsDraggingOutsidePreview(true);
                }
              }
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              setIsDraggingOutsidePreview(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const draggedBlockId = e.dataTransfer.getData("application/keylink-block-id") || draggingCanvasBlockId;
              if (draggedBlockId) {
                const removedBlock = canvasBlocks.find((b) => b.id === draggedBlockId);
                handleDeleteBlock(draggedBlockId);
                triggerToast(`🗑️ Dragged outside preview: Deleted "${removedBlock?.label || removedBlock?.type || 'block'}"!`);
              }
              setDraggingCanvasBlockId(null);
              setDragOverCanvasBlockId(null);
              setIsDraggingOutsidePreview(false);
            }}
          >
            {/* Visual banner indicator when dragging block outside preview to delete */}
            {isDraggingOutsidePreview && draggingCanvasBlockId && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce">
                <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-rose-600/95 text-white font-bold text-xs shadow-2xl shadow-rose-950/80 border border-rose-400 backdrop-blur-md">
                  <Trash2 className="w-4 h-4 animate-pulse text-white" />
                  <span>Drop outside preview model to DELETE block</span>
                </div>
              </div>
            )}
            {/* Top Right Stage Action Buttons: Target Scope Shortcut, Edit Preview (Eye) & Global Preview (Globe) */}
            <div className="absolute top-4 right-4 z-40 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {/* 1. Target Devices Scope Shortcut Selector */}
              <div className="relative group/targetscope">
                <button
                  type="button"
                  onClick={() => setIsTargetScopePopoverOpen(!isTargetScopePopoverOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border shadow-xl backdrop-blur-xl transition-all cursor-pointer hover:scale-105 active:scale-95 text-xs font-bold ${
                    isTargetScopePopoverOpen
                      ? "border-indigo-400 bg-indigo-950/60 text-indigo-300 ring-1 ring-indigo-500/50"
                      : "border-slate-700/80 text-slate-300 hover:text-white ring-1 ring-white/10"
                  }`}
                  aria-label="Target Devices Scope"
                >
                  {editorDeviceScope === "mobile_only" ? (
                    <Smartphone className="h-4 w-4 text-blue-400" />
                  ) : editorDeviceScope === "mobile_tablet" ? (
                    <Tablet className="h-4 w-4 text-indigo-400" />
                  ) : editorDeviceScope === "mobile_tablet_laptop" ? (
                    <Laptop className="h-4 w-4 text-purple-400" />
                  ) : (
                    <Monitor className="h-4 w-4 text-emerald-400" />
                  )}
                  <span className="hidden sm:inline text-[11px] font-semibold">
                    {editorDeviceScope === "all_devices"
                      ? "All Devices (Ultra-Wide)"
                      : editorDeviceScope === "mobile_only"
                        ? "Mobile Only"
                        : editorDeviceScope === "mobile_tablet"
                          ? "Tablet Only"
                          : "Laptop/Desktop"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {isTargetScopePopoverOpen && (
                  <div
                    className="absolute right-0 top-12 z-50 w-72 p-3 bg-slate-950/98 border border-slate-700/90 rounded-2xl shadow-2xl backdrop-blur-2xl text-xs text-slate-200 space-y-2 animate-in fade-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <Target className="h-4 w-4 text-indigo-400" />
                        <span>Target Devices Scope</span>
                      </div>
                      <span className="text-[9px] font-mono uppercase text-indigo-400 font-bold px-1.5 py-0.5 rounded bg-indigo-500/20">
                        Quick Switch
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-0.5">
                      {[
                        {
                          id: "all_devices" as const,
                          title: "All Devices (Ultra-Wide)",
                          desc: "Fluid responsiveness (4K, Desktop, Tablet, Phone)",
                          badge: "Default",
                          badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                          icon: Monitor
                        },
                        {
                          id: "mobile_only" as const,
                          title: "Mobile Only",
                          desc: "Strictly locked to phone screen (430px) on PC & Laptop",
                          badge: "Phone",
                          badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                          icon: Smartphone
                        },
                        {
                          id: "mobile_tablet" as const,
                          title: "Tablet Only",
                          desc: "Locked to tablet viewport (768px)",
                          badge: "Tablet",
                          badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
                          icon: Tablet
                        },
                        {
                          id: "mobile_tablet_laptop" as const,
                          title: "Laptop & Desktop Only",
                          desc: "Standard laptop / PC layout (1150px)",
                          badge: "Laptop",
                          badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                          icon: Laptop
                        }
                      ].map((opt) => {
                        const isSelected = editorDeviceScope === opt.id;
                        const IconComp = opt.icon;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setEditorDeviceScope(opt.id);
                              setIsTargetScopePopoverOpen(false);
                              triggerToast(`Target scope set to: ${opt.title}`);
                            }}
                            className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
                              isSelected
                                ? "bg-indigo-600/25 border-indigo-500/80 text-white shadow-sm ring-1 ring-indigo-500/40"
                                : "bg-white/[0.03] border-white/[0.08] text-slate-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                            }`}
                          >
                            <div className="flex items-start gap-2 min-w-0 flex-1">
                              <div className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${
                                isSelected ? "bg-indigo-500/30 border-indigo-400/50 text-indigo-300" : "bg-white/[0.04] border-white/10 text-slate-400"
                              }`}>
                                <IconComp className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-bold truncate leading-tight">
                                    {opt.title}
                                  </span>
                                  <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${opt.badgeColor}`}>
                                    {opt.badge}
                                  </span>
                                </div>
                                <div className="text-[9px] text-slate-400 truncate leading-tight mt-0.5">
                                  {opt.desc}
                                </div>
                              </div>
                            </div>
                            {isSelected && <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Edit Preview Toggle Button (Hidden when icons bar is open, visible when closed) */}
              {!showSimulatorToolbar && (
                <div className="relative group/editprev">
                  <button
                    type="button"
                    onClick={() => setShowSimulatorToolbar(true)}
                    className="flex items-center justify-center p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-xl backdrop-blur-xl transition-all cursor-pointer hover:scale-105 active:scale-95 ring-1 ring-cyan-500/30"
                    aria-label="Edit Preview"
                  >
                    <Eye className="h-4 w-4 text-cyan-400" />
                  </button>
                  <span className="pointer-events-none absolute -bottom-7 right-1/2 translate-x-1/2 hidden group-hover/editprev:flex px-2 py-0.5 rounded-md bg-slate-950/90 text-[9px] font-normal text-slate-300 border border-slate-800/80 whitespace-nowrap shadow-lg z-50">
                    Edit Preview
                  </span>
                </div>
              )}

              {/* 2. Global Preview Button */}
              <div className="relative group/globalprev">
                <button
                  type="button"
                  onClick={() => setIsGlobalPreviewOpen(true)}
                  className="flex items-center justify-center p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-xl backdrop-blur-xl transition-all cursor-pointer hover:scale-105 active:scale-95 ring-1 ring-indigo-500/30"
                  aria-label="Global Preview"
                >
                  <Globe className="h-4 w-4 text-indigo-400" />
                </button>
                <span className="pointer-events-none absolute -bottom-7 right-1/2 translate-x-1/2 hidden group-hover/globalprev:flex px-2 py-0.5 rounded-md bg-slate-950/90 text-[9px] font-normal text-slate-300 border border-slate-800/80 whitespace-nowrap shadow-lg z-50">
                  Global Preview
                </span>
              </div>
            </div>

            {/* Floating Exit Button when in Full Preview Mode - ONLY Back Icon, NO text */}
            {isPreviewOnlyMode && (
              <div className="fixed top-4 left-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 group/exitpreviewbtn" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => {
                    setIsPreviewOnlyMode(false);
                    setIsSidebarOpen(true);
                  }}
                  className="flex items-center justify-center h-10 w-10 bg-slate-900/95 hover:bg-slate-800 text-white rounded-full shadow-2xl border border-slate-700/80 backdrop-blur-xl hover:scale-110 active:scale-95 transition-all cursor-pointer ring-1 ring-cyan-500/40"
                  aria-label="Exit Preview (Esc)"
                >
                  <ArrowLeft className="w-5 h-5 text-cyan-400 group-hover/exitpreviewbtn:-translate-x-0.5 transition-transform" />
                </button>
                <span className="pointer-events-none absolute -bottom-7 left-0 hidden group-hover/exitpreviewbtn:flex px-2 py-0.5 rounded bg-slate-950 text-[10px] font-bold text-white border border-slate-800 whitespace-nowrap shadow-xl z-50">
                  Exit Preview (Esc)
                </span>
              </div>
            )}

            <div className="key-editor-preview-rail__stage w-full h-full overflow-hidden flex justify-center items-center relative p-2">
                <DeviceMockupFrame
                  device={selectedDevice}
                  zoom={viewportZoom}
                  isLandscape={isLandscape}
                  customFinish={mockupFrameFinish}
                  displayUrl={selectedEditPageLink?.displayLabel || `keylink360.today/${editorTitle || "yourname"}`}
                  screenRef={phonePreviewScreenRef}
                  isDropTarget={isDraggingOverPreview && !showThanksPage}
                  onDragOver={showThanksPage ? undefined : handleDragOverTarget}
                  onDragEnter={showThanksPage ? undefined : handleDragEnterPreview}
                  onDragLeave={showThanksPage ? undefined : handleDragLeavePreview}
                  onDrop={showThanksPage ? undefined : handleDropOnPreview}
                  className="w-full h-full"
                >
                  <div
                    className={`key-preview-isolate w-full min-h-full ${getBioPageThemeClass(editorPageTheme)} no-scrollbar transition-all duration-200 ${
                      showThanksPage ? "key-phone-preview__screen--thanks-open" : ""
                    } ${isLandscape ? "key-preview-isolate--landscape" : "key-preview-isolate--portrait"}`}
                    data-orientation={isLandscape ? "landscape" : "portrait"}
                    style={{
                      ...getBioPageThemeStyle(editorPageTheme),
                      minHeight: "100%"
                    }}
                  >
                    {/* Bio page content layout matching target device scope */}
                    <div
                      className={`key-phone-preview__bio-layer transition-all duration-300 ${
                        isLandscape
                          ? "w-full max-w-full px-2 sm:px-4 md:px-6"
                          : editorDeviceScope === "mobile_only"
                            ? "max-w-md mx-auto"
                            : editorDeviceScope === "mobile_tablet"
                              ? "max-w-2xl mx-auto"
                              : editorDeviceScope === "mobile_tablet_laptop"
                                ? "max-w-4xl mx-auto"
                                : editorDeviceScope === "all_devices"
                                  ? "max-w-6xl mx-auto"
                                  : "max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto"
                      }`}
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
                          className={`key-phone-preview__cover key-public-bio-page__cover ${isLandscape ? "w-full !max-w-full" : ""}`}
                        />

                        <div className="key-phone-preview__body key-public-bio-page__body">
                          <div className="key-public-bio-page__profile">
                            <h3 className="key-public-bio-page__title font-display">
                              <InlineEditableText
                                value={editorTitle || "Marvel Products"}
                                onChange={(newT) => {
                                  setEditorTitle(newT);
                                  triggerToast("✨ Updated page title!");
                                }}
                                isEditingAllowed={!showThanksPage}
                                tagName="span"
                              />
                            </h3>
                            {previewHandle && (
                              <p className="key-public-bio-page__handle">
                                <InlineEditableText
                                  value={previewHandle}
                                  onChange={(newH) => {
                                    setEditorHandle(normalizeHandleInput(newH));
                                    triggerToast("✨ Updated handle!");
                                  }}
                                  isEditingAllowed={!showThanksPage}
                                  tagName="span"
                                />
                              </p>
                            )}
                          </div>

                          {editorBio ? (
                            <div className="key-phone-preview__bio-text">
                              <InlineEditableText
                                value={editorBio}
                                onChange={(newB) => {
                                  setEditorBio(newB);
                                  triggerToast("✨ Updated bio!");
                                }}
                                isEditingAllowed={!showThanksPage}
                                multiline
                                tagName="p"
                              />
                            </div>
                          ) : (
                            <div className="key-phone-preview__bio-text opacity-40 hover:opacity-100 transition-opacity">
                              <InlineEditableText
                                value=""
                                placeholder="Double-click to add a short bio..."
                                onChange={(newB) => {
                                  setEditorBio(newB);
                                  triggerToast("✨ Added bio!");
                                }}
                                isEditingAllowed={!showThanksPage}
                                multiline
                                tagName="p"
                              />
                            </div>
                          )}

                          {(() => {
                            const isMobileCategory =
                              selectedDevice?.category === "android" ||
                              selectedDevice?.category === "apple" ||
                              (selectedDevice?.width || 0) < 600;
                            const isTabletCategory =
                              selectedDevice?.category === "tablets" ||
                              selectedDevice?.frameType === "tablet-classic" ||
                              selectedDevice?.frameType === "tablet-ipad" ||
                              selectedDevice?.frameType === "tablet-android";

                            const isMobileMockup =
                              !isLandscape &&
                              (editorDeviceScope === "mobile_only" ||
                                (isMobileCategory && editorDeviceScope !== "all_devices"));

                            const gridLayoutClass = isLandscape
                              ? (isTabletCategory || editorDeviceScope === "mobile_tablet"
                                  ? "grid-cols-1 md:grid-cols-2 gap-4"
                                  : "grid-cols-1 sm:grid-cols-2 gap-3.5")
                              : (isMobileMockup
                                  ? "grid-cols-1 gap-3.5"
                                  : isTabletCategory || editorDeviceScope === "mobile_tablet"
                                    ? "grid-cols-1 sm:grid-cols-2 gap-3.5"
                                    : "grid-cols-1 md:grid-cols-2 gap-4");

                            return (
                              <div className={`key-phone-preview__blocks grid ${gridLayoutClass} w-full`}>
                                {filterVisibleBioBlocks(editorBlocks).map((block) => {
                                  const isDesktopPreview =
                                    isLandscape ||
                                    (editorDeviceScope !== "mobile_only" && !isMobileMockup && viewportMode !== "mobile");
                                  const isHiddenOnThisDevice =
                                    (block.deviceVisibility === "mobile_only" && isDesktopPreview && !isLandscape) ||
                                    (block.deviceVisibility === "desktop_only" && !isDesktopPreview);
                                  const isBlockHidden = Boolean(block.isHidden || (block as any).styles?.isHidden);
                                  const isBlockLocked = Boolean(block.isLocked || (block as any).styles?.isLocked);
                                  const colSpanClass = isMobileMockup
                                    ? "col-span-1"
                                    : isLandscape && block.colSpan === "half"
                                      ? "col-span-1"
                                      : isDesktopPreview && block.colSpan === "half"
                                        ? "col-span-1"
                                        : "col-span-1 sm:col-span-2 md:col-span-2";
                                  const isSelected = selectedCanvasBlockId === block.id;

                                  const devStyles = computeBlockInlineStyles((block as any).styles);
                                  const devMeta = getBlockCustomMeta((block as any).styles);

                                  const isBeingDragged = draggingCanvasBlockId === block.id;
                                  const isDragOver = dragOverCanvasBlockId === block.id && draggingCanvasBlockId !== block.id;

                      return (
                        <div
                          key={block.id}
                          style={devStyles}
                          aria-label={devMeta.ariaLabel}
                          draggable={!isBlockLocked && !showThanksPage}
                          onDragStart={(e) => {
                            if (isBlockLocked || showThanksPage) return;
                            e.dataTransfer.setData("application/keylink-block-id", block.id);
                            e.dataTransfer.setData("text/plain", block.id);
                            e.dataTransfer.effectAllowed = "move";
                            setDraggingCanvasBlockId(block.id);
                          }}
                          onDragEnd={() => {
                            setDraggingCanvasBlockId(null);
                            setDragOverCanvasBlockId(null);
                            setIsDraggingOutsidePreview(false);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.dataTransfer.dropEffect = "move";
                            if (dragOverCanvasBlockId !== block.id) {
                              setDragOverCanvasBlockId(block.id);
                            }
                          }}
                          onDragLeave={(e) => {
                            e.stopPropagation();
                            if (dragOverCanvasBlockId === block.id) {
                              setDragOverCanvasBlockId(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const draggedBlockId = e.dataTransfer.getData("application/keylink-block-id") || (draggingCanvasBlockId !== block.id ? draggingCanvasBlockId : null);
                            const newBlockType = e.dataTransfer.getData("text/plain") || activeDraggedBlockType;

                            if (draggedBlockId && draggedBlockId !== block.id) {
                              handleReorderCanvasBlock(draggedBlockId, block.id, "after");
                            } else if (newBlockType && newBlockType !== block.id) {
                              const targetIdx = canvasBlocks.findIndex((b) => b.id === block.id);
                              handleAddBlock(newBlockType, targetIdx + 1);
                            }

                            setDraggingCanvasBlockId(null);
                            setDragOverCanvasBlockId(null);
                            setIsDraggingOutsidePreview(false);
                          }}
                          className={`group relative p-2 rounded-2xl border transition-all duration-200 cursor-pointer ${colSpanClass} ${devMeta.className} ${
                            isBeingDragged
                              ? "opacity-30 scale-95 border-dashed border-indigo-400 bg-indigo-500/10 ring-2 ring-indigo-400/40"
                              : isDragOver
                                ? "ring-2 ring-indigo-500 border-indigo-500 bg-indigo-500/10 shadow-lg scale-[1.01]"
                                : isSelected
                                  ? "key-canvas-block-active ring-2 ring-indigo-500 shadow-xl border-indigo-500 bg-indigo-500/5"
                                  : isBlockHidden
                                    ? "opacity-35 border-dashed border-slate-400/80 bg-slate-500/5"
                                    : isHiddenOnThisDevice
                                      ? "opacity-40 border-dashed border-amber-400/80 bg-amber-500/5 hover:opacity-80"
                                      : "border-transparent hover:border-dashed hover:border-[#6366f1]/55 hover:bg-[#6366f1]/5"
                          }`}
                          onClick={(e) => {
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
                            setSelectedCanvasBlockId(block.id);
                            setExpandedBlockId(block.id);
                            setStudioNavTab("inspector");
                            setIsDrawerOpen(true);
                            const el = document.getElementById(`editor-block-${block.id}`);
                            if (el) {
                              el.scrollIntoView({ behavior: "smooth", block: "center" });
                            }
                          }}
                        >
                          {/* Device Hidden Badge in Live Preview */}
                          {isHiddenOnThisDevice && (
                            <div className="absolute -top-2 left-2 z-30 flex items-center gap-1 bg-amber-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">
                              <span>⚠️ Hidden on {isDesktopPreview ? "Tablet/Desktop" : "Phone"}</span>
                            </div>
                          )}

                          {isBlockHidden && (
                            <div className="absolute -top-2 right-2 z-30 flex items-center gap-1 bg-slate-700 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">
                              <span>Hidden Node</span>
                            </div>
                          )}

                          {/* Floating Action Pill over selected canvas block (Blocks Edit & Bricks Builder Style) */}
                          {isSelected ? (
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
                              <button
                                type="button"
                                className="key-canvas-block-actions-pill__btn key-canvas-block-actions-pill__btn--primary"
                                onClick={() => {
                                  setStudioNavTab("inspector");
                                  setInspectorTab("content");
                                  setIsDrawerOpen(true);
                                  setExpandedBlockId(block.id);
                                }}
                                title="Edit Block Content & Markup"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Content</span>
                              </button>
                              <button
                                type="button"
                                className="key-canvas-block-actions-pill__btn"
                                onClick={() => {
                                  setStudioNavTab("inspector");
                                  setInspectorTab("style");
                                  setIsDrawerOpen(true);
                                  setExpandedBlockId(block.id);
                                }}
                                title="Edit Visual CSS Styles (Bricks Builder)"
                              >
                                <Sliders className="w-3 h-3 text-indigo-400" />
                                <span>Style</span>
                              </button>
                              <button
                                type="button"
                                className="key-canvas-block-actions-pill__btn"
                                onClick={() => handleToggleBlockLock(block.id)}
                                title={isBlockLocked ? "Unlock Component" : "Lock Component (Blocks Edit)"}
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
                          ) : (
                            <div className="absolute -top-3.5 right-1.5 hidden max-lg:flex lg:group-hover:flex items-center gap-1 bg-white dark:bg-slate-900 border border-[#6366f1]/30 shadow-md py-0.5 px-1.5 rounded-lg z-30 animate-in zoom-in-95 duration-150">
                              <span className="text-[7px] font-mono font-bold text-[#6366f1] uppercase tracking-widest mr-1">
                                {block.type}
                              </span>
                              {isBlockLocked && (
                                <span className="text-[7px] font-bold text-amber-600 bg-amber-50 px-1 rounded mr-1">
                                  🔒
                                </span>
                              )}
                              {isBlockHidden && (
                                <span className="text-[7px] font-bold text-slate-500 bg-slate-100 px-1 rounded mr-1">
                                  HIDDEN
                                </span>
                              )}
                              {block.colSpan === "half" && isDesktopPreview && (
                                <span className="text-[7px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded mr-1">
                                  ½ Grid
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCanvasBlockId(block.id);
                                  setExpandedBlockId(block.id);
                                  setStudioNavTab("inspector");
                                  setInspectorTab("content");
                                  setIsDrawerOpen(true);
                                  const el = document.getElementById(`editor-block-${block.id}`);
                                  if (el) {
                                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                                  }
                                }}
                                title="Edit Widget Content"
                                className="p-1 hover:bg-indigo-500/10 rounded text-slate-500 hover:text-[#6366f1] transition-colors"
                              >
                                <Edit3 className="h-2.5 w-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCanvasBlockId(block.id);
                                  setExpandedBlockId(block.id);
                                  setStudioNavTab("inspector");
                                  setInspectorTab("style");
                                  setIsDrawerOpen(true);
                                  const el = document.getElementById(`editor-block-${block.id}`);
                                  if (el) {
                                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                                  }
                                }}
                                title="Edit Visual CSS (Bricks Builder)"
                                className="p-1 hover:bg-indigo-500/10 rounded text-slate-500 hover:text-[#6366f1] transition-colors"
                              >
                                <Sliders className="h-2.5 w-2.5 text-indigo-500" />
                              </button>
                            </div>
                          )}

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
                );
              })()}

                  <div className="key-bio-page-footer key-phone-preview__footer">
                    <span>Powered by KEYLINK360</span>
                  </div>
                  </div>
                        </div>

                  {/* Live Interactive Bio AI Chat Widget in Editor Preview */}
                  {aiAssistantEnabled && (
                    <BioAiChatWidget
                      isEditorPreview={true}
                      pageId={selectedEditPage?.id || "preview-editor"}
                      pageTitle={editorTitle || "My Bio Page"}
                      pageSlug={selectedEditPage?.slug || ""}
                      pageBio={editorBio}
                      settings={{
                        enabled: aiAssistantEnabled,
                        botName: aiBotName,
                        welcomeMessage: aiWelcomeMessage,
                        businessName: aiBusinessName || editorTitle,
                        businessDescription: aiBusinessDescription || editorBio,
                        contactPhone: aiContactPhone,
                        contactEmail: aiContactEmail,
                        primaryColor: aiPrimaryColor,
                        autoLeadCapture: aiAutoLeadCapture,
                        customFaqs: aiCustomFaqs
                      }}
                      blocks={editorBlocks as BioEditorBlock[]}
                      onLeadCaptured={(name, phone) => {
                        triggerSimulatorToast(`Lead captured by AI Assistant: ${name} (${phone})`);
                      }}
                    />
                  )}

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

                  </div>
                </DeviceMockupFrame>
              </div>

              {/* Phone Simulator Vertical Floating Toolbar */}
              {showSimulatorToolbar && (
                <PhoneSimulatorToolbar
                  selectedDevice={selectedDevice}
                  onOpenDeviceDrawer={() => setIsDeviceDrawerOpen(!isDeviceDrawerOpen)}
                  isDeviceDrawerOpen={isDeviceDrawerOpen}
                  isPreviewMode={isPreviewOnlyMode}
                  onTogglePreviewMode={() => setIsPreviewOnlyMode(!isPreviewOnlyMode)}
                  onCloseToolbar={() => setShowSimulatorToolbar(false)}
                  deviceScope={editorDeviceScope}
                  onChangeDeviceScope={(scope) => {
                    setEditorDeviceScope(scope);
                    triggerSimulatorToast(`Target scope set to: ${scope.replace(/_/g, " ")}`);
                  }}
                  zoom={viewportZoom}
                  onChangeZoom={setViewportZoom}
                  onOpenThemePicker={() => {
                    setStudioNavTab("theme");
                    setIsSidebarOpen(true);
                  }}
                  isLandscape={isLandscape}
                  onToggleOrientation={() => {
                    const isRotatable =
                      selectedDevice?.category === "apple" ||
                      selectedDevice?.category === "android" ||
                      selectedDevice?.category === "mobile" ||
                      selectedDevice?.category === "tablets" ||
                      selectedDevice?.category === "tablet";
                    if (!isRotatable) {
                      triggerToast("Rotation is only supported for Mobile and Tablet devices.");
                      return;
                    }
                    const nextLandscape = !isLandscape;
                    setIsLandscape(nextLandscape);
                    triggerSimulatorToast(nextLandscape ? "Rotated to Landscape" : "Rotated to Portrait");
                  }}
                  activeThemeSwatch={BIO_PAGE_THEME_PRESETS.find((p) => p.id === editorPageTheme)?.swatch}
                  activeFrameFinish={mockupFrameFinish}
                  onSelectFrameFinish={setMockupFrameFinish}
                  onShare={() => {
                    const url = `${getShareableOrigin()}/${editorTitle || "page"}`;
                    navigator.clipboard?.writeText?.(url);
                    triggerSimulatorToast("Live link copied to clipboard!");
                  }}
                />
              )}

              {/* Visible Devices in the Tab Drawer (Screenshot 2) */}
              <VisibleDevicesDrawer
                isOpen={isDeviceDrawerOpen}
                onClose={() => setIsDeviceDrawerOpen(false)}
                selectedDevice={selectedDevice}
                onSelectDevice={(dev) => {
                  setSelectedDevice(dev);
                  setIsDeviceDrawerOpen(false);
                  if (dev.category === "apple" || dev.category === "android") {
                    setViewportMode("mobile");
                    setEditorDeviceScope("mobile_only");
                  } else if (dev.category === "tablets") {
                    setViewportMode("tablet");
                    setEditorDeviceScope("mobile_tablet");
                  } else if (
                    dev.frameType === "laptop-macbook" ||
                    dev.frameType === "laptop-macbook-rose" ||
                    dev.frameType === "laptop-dell" ||
                    dev.frameType === "laptop-asus-rog" ||
                    dev.frameType === "laptop-asus-tuf" ||
                    dev.frameType === "laptop-msi"
                  ) {
                    setIsLandscape(false);
                    setViewportMode("laptop");
                    setEditorDeviceScope("mobile_tablet_laptop");
                  } else {
                    setIsLandscape(false);
                    setViewportMode("desktop");
                    setEditorDeviceScope("all_devices");
                  }
                }}
              />

              {/* Centered Publish Success Modal Overlay */}
              {showPublishSuccess && (
                <div
                  className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                  onClick={() => setShowPublishSuccess(false)}
                >
                  <div
                    className="bg-white rounded-3xl p-6 sm:p-8 text-center text-slate-900 shadow-2xl max-w-lg w-full border border-slate-100 animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Check className="h-12 w-12 mx-auto mb-3 bg-emerald-600 text-white p-2.5 rounded-full shadow-md" />
                    <h4 className="font-display font-extrabold text-xl text-slate-900">
                      Site Published Successfully!
                    </h4>
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 shadow-2xs">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Active Device Target:</span>
                      <span className="font-extrabold capitalize text-indigo-700">
                        {editorDeviceScope === "auto_adaptive"
                          ? "🌐 Smart Fluid Responsive"
                          : editorDeviceScope === "mobile_only"
                            ? "📱 Mobile First Only"
                            : editorDeviceScope === "mobile_tablet"
                              ? "📟 Mobile + Tablets"
                              : editorDeviceScope === "mobile_tablet_laptop"
                                ? "💻 Mobile + Tablets + Laptops"
                                : "🖥️ All Devices (Ultra-Wide)"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-3.5 leading-relaxed">
                      Your changes are live and accessible globally at:
                      {selectedEditPageLink && (
                        <span className="block mt-1.5 font-mono font-bold text-indigo-600 bg-indigo-50/50 py-1.5 px-3 rounded-xl border border-indigo-100 break-all select-all">
                          {selectedEditPageLink.displayLabel}
                        </span>
                      )}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                      {selectedEditPageLink && (
                        <a
                          href={selectedEditPageLink.openUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Open Live Page</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedEditPageLink) return;
                          void copyText(selectedEditPageLink.shareUrl, "🔗 Public shareable link copied!");
                        }}
                        className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-2xs"
                      >
                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                        <span>Copy Share Link</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPublishSuccess(false)}
                        className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
                      >
                        <span>Continue Editing</span>
                      </button>
                      <button
                        type="button"
                        onClick={exitEditor}
                        className="text-xs font-bold text-emerald-800 hover:underline px-2 py-1"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </main>

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

          {/* FULLSCREEN IMMERSIVE GLOBAL PREVIEW OVERLAY */}
          {isGlobalPreviewOpen && (
            <div
              className="fixed inset-0 z-[200] bg-[#090d16] overflow-y-auto no-scrollbar animate-in fade-in duration-150 flex flex-col items-center justify-start min-h-screen w-full"
              style={{
                backgroundColor: "#090d16",
                backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.09) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
                backgroundAttachment: "fixed",
                backgroundRepeat: "repeat"
              }}
            >
              <PublicBioPageView
                pageId={selectedEditPage?.id || "preview-global"}
                pageTitle={editorTitle || "BioLink"}
                pageSlug={selectedEditPage?.slug || "preview"}
                pageBio={editorBio}
                pageCoverPhoto={editorCoverPhoto}
                initialBlocks={editorBlocks as any}
                initialDetails={{
                  title: editorTitle,
                  bio: editorBio,
                  coverPhoto: editorCoverPhoto,
                  coverSettings: editorCoverSettings,
                  pageTheme: editorPageTheme,
                  deviceScope: editorDeviceScope,
                  targetDevicesCustomEnabled: isTargetDevicesCustomEnabled,
                  paymentEnabled,
                  paymentAmountInr,
                  paymentDescription,
                  thankYouTitle,
                  thankYouMessage,
                  thankYouEmoji,
                  thankYouBlocks: thankYouBlocks as any
                }}
                mode="preview"
                onExitPreview={() => setIsGlobalPreviewOpen(false)}
                onUpdateBlocks={(newBlocks) => {
                  setEditorBlocks(newBlocks as any);
                  if (selectedEditPage) {
                    try {
                      localStorage.setItem(`biolink_blocks_${selectedEditPage.id}`, JSON.stringify(newBlocks));
                      if (selectedEditPage.slug) {
                        localStorage.setItem(`biolink_blocks_${selectedEditPage.slug}`, JSON.stringify(newBlocks));
                      }
                      window.dispatchEvent(
                        new CustomEvent("key-page-preview-updated", {
                          detail: { pageId: selectedEditPage.id, pageSlug: selectedEditPage.slug, blocks: newBlocks }
                        })
                      );
                    } catch {
                      /* ignore */
                    }
                  }
                }}
              />
            </div>
          )}

          {toast && (
            <div className="key-editor-toast fixed bottom-6 right-6 z-[120] bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-indigo-500/40 animate-in fade-in slide-in-from-bottom-5 duration-300">
              <span className="text-sm font-bold">{toast}</span>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* 2.1 - Studio Personalization Themes Modal */}
      {selectedEditPage && (
        <PersonalizationModal
          isOpen={isStudioPersonalizationOpen}
          onClose={() => setIsStudioPersonalizationOpen(false)}
          currentTheme={currentUiTheme}
          onThemeChange={handleApplyStudioTheme}
        />
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

      {/* Multi-Language Interactive Setup Guide Modal */}
      <InteractiveSetupGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        initialTopic="bio_ai"
      />
    </PageShell>
  );
}
