export enum ScreenId {
  LOGIN = "LOGIN",
  DASHBOARD = "DASHBOARD",
  BIO_PAGES = "BIO_PAGES",
  CONTACTS = "CONTACTS",
  WHATSAPP = "WHATSAPP",
  LINKS = "LINKS",
  LINK_ROTATOR = "LINK_ROTATOR",
  QR_CODES = "QR_CODES",
  TEMPLATES = "TEMPLATES",
  INTEGRATIONS = "INTEGRATIONS",
  PIXELS = "PIXELS",
  MEDIA_LIBRARY = "MEDIA_LIBRARY",
  CUSTOM_DOMAINS = "CUSTOM_DOMAINS",
  HELP_CENTER = "HELP_CENTER",
  CONTACT_SUPPORT = "CONTACT_SUPPORT",
  ACCOUNT = "ACCOUNT",
  SUPER_ADMIN = "SUPER_ADMIN"
}

export interface UserProfile {
  name: string;
  email: string;
  role?: "MAIN_OWNER" | "SUB_OWNER";
  avatarUrl: string;
  plan: string;
  isVerified: boolean;
  mfaEnabled?: boolean;
}

export interface BioPage {
  id: string;
  title: string;
  slug: string;
  status: "Live" | "Paused" | "Draft";
  views: number;
  createdAt: string;
  bio?: string;
  coverPhoto?: string;
  handle?: string;
  /** Bio link page (default) or full customizable Thanks page after form/button submit. */
  pageKind?: "bio" | "thanks";
  /** True while editing a template before Save Draft / Publish — hidden from Bio Pages history. */
  isUncommitted?: boolean;
}

export interface ContactFormFieldEntry {
  label: string;
  value: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  tags: string[];
  capturedAt: string;
  maskedEmail: string;
  maskedPhone: string;
  marketingOptIn?: boolean;
  /** Full submitted form/smart-form field values for Contacts UI. */
  formFields?: ContactFormFieldEntry[];
  notes?: string;
  pageId?: string;
  pageTitle?: string;
  blockId?: string;
  blockLabel?: string;
  ownerUserId?: string;
  /** Hostname where the public bio form was submitted (e.g. custom domain). */
  sourceDomain?: string;
  /** Template used for the bio page when the lead was captured. */
  templateId?: string;
  templateName?: string;
  pageSlug?: string;
}

export interface WhatsAppCampaign {
  id: string;
  name: string;
  status: "Sent" | "Active" | "Draft";
  recipients: string;
  openRate: string;
  templateId?: string;
  createdAt?: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  status: "Approved" | "Pending" | "Rejected";
  body?: string;
  createdAt?: string;
}

export interface SmartLink {
  id: string;
  title: string;
  slug: string;
  /** Hostname used in the public short URL (platform or custom domain). */
  hostDomain: string;
  shortUrl: string;
  destinationUrl?: string;
  status: "Live" | "Paused";
  clicks: number;
  retargeting: ("fb" | "google" | "tiktok" | "snapchat")[];
  createdAt?: string;
  updatedAt?: string;
}

export type ShortLinkPeriodCounts = {
  total: number;
  today: number;
  week: number;
  month: number;
};

export type ShortLinkDeviceBreakdown = {
  mobile: number;
  desktop: number;
  tablet: number;
  other: number;
};

export type ShortLinkAnalytics = {
  link: SmartLink;
  summary: ShortLinkPeriodCounts;
  devices: ShortLinkDeviceBreakdown;
  daily: Array<{ label: string; value: number }>;
};

export interface LinkRotatorDestination {
  id: string;
  url: string;
  probability: number;
  /** Lifetime clicks sent to this destination. */
  clicks?: number;
}

export type LinkRotatorPeriodCounts = {
  total: number;
  today: number;
  week: number;
  month: number;
};

export type LinkRotatorDestinationAnalytics = {
  id: string;
  url: string;
  probability: number;
  clicks: LinkRotatorPeriodCounts;
  /** Share of all recorded clicks (0–100). */
  clickSharePercent: number;
};

export type LinkRotatorAnalytics = {
  rotator: LinkRotator;
  summary: LinkRotatorPeriodCounts;
  destinations: LinkRotatorDestinationAnalytics[];
};

export interface LinkRotator {
  id: string;
  name: string;
  description?: string;
  slug: string;
  /** Hostname used in the public rotator URL (platform or custom domain). */
  hostDomain: string;
  rotatorUrl: string;
  status: "Active" | "Inactive";
  destinations: LinkRotatorDestination[];
  totalClicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface QRCodeItem {
  id: string;
  name: string;
  status: "Active" | "Paused";
  scans: string;
  uniqueScanners: string;
  topLocation?: string;
  conversionRate?: string;
  qrUrl: string;
  targetUrl: string;
  /** When destination was last changed — keeps mobile scans on the latest Edit URL. */
  targetUpdatedAt?: string;
  /** Fixed public redirect URL encoded in the QR matrix — never changes after create. */
  scanUrl?: string;
  /** Short code for /q/:code — never changes after create. */
  publicCode?: string;
  customDesign: boolean;
  designColor?: string;
  designLogo?: "none" | "user" | "link" | "whatsapp" | "star" | "custom";
  /** Custom brand mark image (data URL or hosted URL). */
  designLogoUrl?: string;
  designPattern?: "rounded" | "square" | "compact";
}

export interface TemplateItem {
  id: string;
  name: string;
  category: string;
  widgets: number;
  usedCount: string;
  imageUrl: string;
  description: string;
  price?: string;
  suggested?: boolean;
}

export interface IntegrationItem {
  id: string;
  name: string;
  type: "Messaging" | "Email Marketing" | "Payments";
  status: "Locked" | "Connected" | "Coming Soon";
  description: string;
  upgradeMessage: string;
  waitlisted?: boolean;
  apiKeyHint?: string;
  connectedAt?: string;
}

export interface IntegrationVote {
  id: string;
  name: string;
  votes: number;
  voted: boolean;
}

export interface TrackingPixel {
  id: string;
  name: string;
  type: string;
  pixelId: string;
  status: "Active" | "Validation Required" | "Inactive";
}

export interface MediaFile {
  id: string;
  name: string;
  type: "image" | "video" | "document" | "archive";
  size: string;
  url: string;
  uploadedAt?: string;
  dimensions?: string;
  duration?: string;
}

export interface CustomDomain {
  id: string;
  pageId: string;
  domainName: string;
  type: "A" | "CNAME";
  dnsTarget: string;
  dnsHostLabel?: string;
  status: "Pending DNS" | "DNS Verified" | "Provisioning SSL" | "Verified" | "Error";
  dnsVerifiedAt: string | null;
  provider: "cloudflare" | "manual";
  providerStatus: string;
  sslStatus: string;
  ownershipVerification: Record<string, unknown> | null;
  lastCheckedAt: string | null;
  errorMessage: string | null;
  setupHint?: string | null;
  dnsProviderName?: string | null;
  dnsProviderId?: string | null;
  providerConnected?: boolean;
  providerAccountId?: string | null;
  dnsLastVerified?: string | null;
  selfServeEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DnsProviderId =
  | "cloudflare"
  | "godaddy"
  | "hostinger"
  | "namecheap"
  | "porkbun"
  | "squarespace"
  | "other";

export interface DnsProviderCapability {
  id: DnsProviderId;
  name: string;
  supportsAutoDns: boolean;
  supportsOAuth: boolean;
  logoUrl: string;
  helpUrl: string;
  blurb: string;
}

export interface CustomDomainDnsRecordTemplate {
  id: string;
  type: "A" | "CNAME" | "TXT";
  hostLabel: string;
  hostDisplay: string;
  value: string;
}

export interface CustomDomainPlatformConfig {
  provider: "cloudflare" | "manual";
  platformUrl: string;
  aRecordTarget: string;
  cnameTarget?: string;
  selfServeEnabled: boolean;
  sslAutomatic: boolean;
  cloudflareEnvConfigured?: boolean;
  registerCloudflareCustomHostnames?: boolean;
  customHostnameEnabled?: boolean;
  autoDnsViaCloudflare?: boolean;
  cloudflareOAuthEnabled?: boolean;
  dnsProviders?: DnsProviderCapability[];
  steps: string[];
  registrars: { id: string; name: string; dnsHelpUrl: string }[];
}

/** Free tier address: {slug}.keylink360.mindflo.today */
export interface PlatformSubdomain {
  id: string;
  slug: string;
  pageId: string;
  hostname: string;
  publicUrl: string;
  status: "active" | "disabled";
  createdAt: string;
  updatedAt: string;
}

export interface HelpArticle {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  readTime: string;
  content?: string;
}

/** Bio Page Editor block — supports extra widget fields via index signature */
export interface BioEditorBlock {
  id: string;
  type: string;
  label: string;
  value: string;
  [key: string]: unknown;
}

/** Published / preview page appearance preset */
export type BioPagePreviewTheme =
  | "dark"
  | "light"
  | "midnight"
  | "ocean"
  | "rose"
  | "forest"
  | "sunset"
  | "lavender"
  | "slate"
  | "gold"
  | "coral"
  | "arctic";

export type CoverFitMode = "cover" | "contain" | "fill";
export type CoverFocusPoint = "center" | "top" | "bottom" | "left" | "right";
export type CoverBandHeight = "sm" | "md" | "lg";

export interface BioCoverPhotoSettings {
  fit: CoverFitMode;
  zoom: number;
  focus: CoverFocusPoint;
  height: CoverBandHeight;
  /** Optional px override for band height (overrides sm/md/lg preset). */
  customHeight?: number;
  /** Cover band width relative to page (60–100%). */
  widthPercent: number;
  /** Image width inside the band (50–150%). */
  imageWidthPercent: number;
  /** Image height inside the band (50–150%). */
  imageHeightPercent: number;
  /** Inner inset between band edge and image (0–40px). */
  padding: number;
  /** Horizontal outer spacing on the cover band (0–32px). */
  marginX: number;
  /** Vertical outer spacing on the cover band (0–24px). */
  marginY: number;
}

export interface BioPagePreviewDetails {
  title: string;
  bio: string;
  coverPhoto: string;
  handle?: string;
  pageTheme?: BioPagePreviewTheme;
  coverSettings?: BioCoverPhotoSettings;
  /** Linked template used to build / last save this page. */
  templateId?: string;
  templateName?: string;
  /** 2nd-page Thank You after Form submit (not a popup / not a separate BioPage). */
  thankYouTitle?: string;
  thankYouMessage?: string;
  thankYouEmoji?: string;
  thankYouBlocks?: BioEditorBlock[];
  /** Platform Razorpay: charge fixed page amount after Form / Smart Form submit. */
  paymentEnabled?: boolean;
  /** Amount in INR rupees (e.g. 499). Server converts to paise. */
  paymentAmountInr?: number;
  paymentDescription?: string;
}

/** Full restorable editor state for drafts and templates */
export interface BioEditorState {
  pageMeta: {
    title: string;
    slug?: string;
    shortBio: string;
    coverImage: string;
    handle?: string;
    pageTheme?: BioPagePreviewTheme;
    coverSettings?: BioCoverPhotoSettings;
    thankYouTitle?: string;
    thankYouMessage?: string;
    thankYouEmoji?: string;
    paymentEnabled?: boolean;
    paymentAmountInr?: number;
    paymentDescription?: string;
  };
  blocks: BioEditorBlock[];
  thankYouBlocks?: BioEditorBlock[];
}

export interface BioPageDraft {
  id: string;
  pageId: string;
  pageSlug?: string;
  ownerUserId?: string;
  data: BioEditorState;
  createdAt: string;
  updatedAt: string;
}

export interface BioPageTemplate {
  id: string;
  name: string;
  sourcePageId?: string;
  previewImage?: string;
  description?: string;
  data: BioEditorState;
  createdAt: string;
  updatedAt: string;
  isBuiltIn?: boolean;
}

export type PublishVisibility = "public" | "workspace" | "selected_members";

export type CustomDomainStatus = "verified" | "pending_dns";

export interface PublishedDomain {
  id: string;
  hostname: string;
  status: CustomDomainStatus;
  dnsTarget?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublishSettings {
  primaryUrl: string;
  customDomains: PublishedDomain[];
  visibility: PublishVisibility;
  selectedMemberIds: string[];
  publishedAt?: string;
  updatedAt: string;
}

export type NotificationType =
  | "page_published"
  | "draft_saved"
  | "template_saved"
  | "template_used"
  | "page_duplicated"
  | "contact_added"
  | "analytics_event"
  | "qr_generated"
  | "pixel_added"
  | "general";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  targetScreen?: ScreenId;
  meta?: Record<string, string>;
}
