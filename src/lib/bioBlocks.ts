import type { BioEditorBlock } from "../types";

export type BlockRecord = BioEditorBlock & Record<string, unknown>;

export interface SocialPlatformDef {
  id: string;
  label: string;
  field: string;
  placeholder: string;
  brandColor: string;
}

export const SOCIAL_PLATFORMS: SocialPlatformDef[] = [
  { id: "instagram", label: "Instagram", field: "instagramUrl", placeholder: "https://instagram.com/yourbrand", brandColor: "#E4405F" },
  { id: "facebook", label: "Facebook", field: "facebookUrl", placeholder: "https://facebook.com/yourpage", brandColor: "#1877F2" },
  { id: "youtube", label: "YouTube", field: "youtubeUrl", placeholder: "https://youtube.com/@yourchannel", brandColor: "#FF0000" },
  { id: "tiktok", label: "TikTok", field: "tiktokUrl", placeholder: "https://tiktok.com/@yourbrand", brandColor: "#010101" },
  { id: "linkedin", label: "LinkedIn", field: "linkedinUrl", placeholder: "https://linkedin.com/in/you", brandColor: "#0A66C2" },
  { id: "x", label: "X (Twitter)", field: "xUrl", placeholder: "https://x.com/yourhandle", brandColor: "#000000" },
  { id: "whatsapp", label: "WhatsApp", field: "whatsappUrl", placeholder: "https://wa.me/919876543210", brandColor: "#25D366" },
  { id: "telegram", label: "Telegram", field: "telegramUrl", placeholder: "https://t.me/yourchannel", brandColor: "#229ED9" }
];

export function createDefaultSocialFields(): Record<string, string> {
  return Object.fromEntries(SOCIAL_PLATFORMS.map((platform) => [platform.field, ""]));
}

export interface SocialLinkItem {
  id: string;
  label: string;
  url: string;
  brandColor: string;
}

export function getSocialLinksFromBlock(block: BlockRecord): SocialLinkItem[] {
  const legacyWebsite =
    typeof block.websiteUrl === "string" && block.websiteUrl.trim() ? block.websiteUrl.trim() : "";

  const links: SocialLinkItem[] = [];

  for (const platform of SOCIAL_PLATFORMS) {
    const raw = block[platform.field];
    const url = typeof raw === "string" ? raw.trim() : "";
    if (url) {
      links.push({
        id: platform.id,
        label: platform.label,
        url,
        brandColor: platform.brandColor
      });
    }
  }

  if (links.length === 0 && legacyWebsite) {
    links.push({
      id: "website",
      label: "Website",
      url: legacyWebsite,
      brandColor: "#6366f1"
    });
  }

  return links;
}

export function getGalleryImages(block: BlockRecord): string[] {
  return getGalleryItems(block)
    .map((item) => item.url.trim())
    .filter(Boolean);
}

export interface GalleryItemRecord {
  id: string;
  url: string;
  caption: string;
  linkUrl: string;
}

export function createGalleryItem(partial?: Partial<GalleryItemRecord>): GalleryItemRecord {
  return {
    id: `gal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    url: "",
    caption: "",
    linkUrl: "",
    ...partial
  };
}

export function createDefaultGalleryItems(): GalleryItemRecord[] {
  return [
    createGalleryItem({
      url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400",
      caption: "Photo 1"
    }),
    createGalleryItem({
      url: "https://images.unsplash.com/photo-1626278664285-f7c05fd17571?auto=format&fit=crop&q=80&w=400",
      caption: "Photo 2"
    })
  ];
}

export function getGalleryItems(block: BlockRecord): GalleryItemRecord[] {
  if (Array.isArray(block.galleryItems)) {
    const normalized = block.galleryItems
      .map((raw, index) => {
        if (!raw || typeof raw !== "object") return null;
        const item = raw as Record<string, unknown>;
        const url = typeof item.url === "string" ? item.url.trim() : "";
        if (!url) return null;
        return {
          id: typeof item.id === "string" && item.id ? item.id : `gal_${index}`,
          url,
          caption: typeof item.caption === "string" ? item.caption : "",
          linkUrl: typeof item.linkUrl === "string" ? item.linkUrl : ""
        } satisfies GalleryItemRecord;
      })
      .filter((item): item is GalleryItemRecord => Boolean(item));
    if (normalized.length > 0) return normalized;
  }

  const legacy = [block.img1, block.img2, block.img3]
    .filter((url): url is string => typeof url === "string" && url.trim().length > 0)
    .map((url, index) =>
      createGalleryItem({
        id: `gal_legacy_${index}`,
        url: url.trim(),
        caption: `Photo ${index + 1}`
      })
    );
  return legacy.length > 0 ? legacy : createDefaultGalleryItems();
}

export function defaultCountdownEndAt(daysFromNow = 9): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(23, 59, 0, 0);
  return date.toISOString();
}

function parseLegacyCountdownDays(value: string | undefined, fallback = 9): number {
  const parsed = Number.parseInt(String(value || "").replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function resolveCountdownEndAt(block: BlockRecord): number {
  const endAt = typeof block.endAt === "string" ? block.endAt.trim() : "";
  if (endAt) {
    const parsed = Date.parse(endAt);
    if (Number.isFinite(parsed)) return parsed;
  }

  const days = parseLegacyCountdownDays(block.value, 9);
  return Date.parse(defaultCountdownEndAt(days));
}

export interface CountdownParts {
  days: number;
  hrs: number;
  mins: number;
  secs: number;
  expired: boolean;
}

export function computeCountdownParts(endAtMs: number, nowMs = Date.now()): CountdownParts {
  const diff = Math.max(0, endAtMs - nowMs);
  if (diff <= 0) {
    return { days: 0, hrs: 0, mins: 0, secs: 0, expired: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hrs = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return { days, hrs, mins, secs, expired: false };
}

export function toDatetimeLocalValue(iso: string | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): string {
  if (!value.trim()) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

export function normalizeExternalUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(https?:\/\/|mailto:|tel:|whatsapp:)/i.test(trimmed)) return trimmed;
  if (/^[\w.-]+@[\w.-]+\.\w+$/.test(trimmed)) return `mailto:${trimmed}`;
  if (/^\+?[\d\s()-]{7,}$/.test(trimmed)) return `tel:${trimmed.replace(/\s/g, "")}`;
  return `https://${trimmed}`;
}

export interface ShopProductRecord {
  id: string;
  name: string;
  url: string;
  image: string;
  price: string;
}

export const DEFAULT_SHOP_PRODUCTS: ShopProductRecord[] = [
  {
    id: "p1",
    name: "Iron man",
    url: "https://www.amazon.in/Toys-Action-Figure-Collectibles-Interchangeable/dp/BOFKTLP65H?source=ps-sl-sl",
    image: "https://images.unsplash.com/photo-1626278664285-f7c05fd17571?auto=format&fit=crop&q=80&w=300",
    price: "3999"
  },
  {
    id: "p2",
    name: "spiderman",
    url: "https://www.amazon.in/Toys-Action-Figure-Collectibles-Interchangeable/dp/BOFKTLP65H?source=ps-sl-sl",
    image: "https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&q=80&w=300",
    price: "2999"
  },
  {
    id: "p3",
    name: "halk",
    url: "https://www.amazon.in/Toys-Action-Figure-Collectibles-Interchangeable/dp/BOFKTLP65H?source=ps-sl-sl",
    image: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&q=80&w=300",
    price: "1899"
  }
];

export const DEFAULT_LINK_SPIN_PRIZES = [
  "20% discount unlocked!",
  "Free gift with your next order!",
  "Free shipping on your order!",
  "Try again on your next visit!"
];

export function getCurrencySymbol(currency: string = "\u20B9 INR"): string {
  if (currency.startsWith("\u20B9")) return "\u20B9";
  if (currency.startsWith("$")) return "$";
  if (currency.startsWith("\u20AC")) return "\u20AC";
  if (currency.startsWith("\u00A3")) return "\u00A3";
  if (currency.startsWith("\u00A5")) return "\u00A5";
  return currency.split(" ")[0] || "\u20B9";
}

export function getVideoThumbnail(block: BlockRecord): string {
  const customThumb = typeof block.thumbUrl === "string" ? block.thumbUrl.trim() : "";
  if (customThumb) return customThumb;
  const url = typeof block.value === "string" ? block.value : "";
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/i);
  if (ytMatch?.[1]) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  return "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800";
}

export function getLinkSpinPrizes(block: BlockRecord): string[] {
  if (Array.isArray(block.prizes)) {
    const prizes = block.prizes
      .filter((prize): prize is string => typeof prize === "string" && prize.trim().length > 0)
      .map((prize) => prize.trim());
    if (prizes.length) return prizes;
  }
  if (typeof block.prizesText === "string" && block.prizesText.trim()) {
    const prizes = block.prizesText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (prizes.length) return prizes;
  }
  return DEFAULT_LINK_SPIN_PRIZES;
}

export function getLinkSpinCouponCode(block: BlockRecord, fallback = "LUCKYSPIN20"): string {
  const code = typeof block.couponCode === "string" ? block.couponCode.trim() : "";
  return code || fallback;
}

export function destinationEmailFromBlock(block: BlockRecord): string | undefined {
  const direct = typeof block.email === "string" ? block.email.trim() : "";
  if (direct.includes("@")) return direct;
  const value = typeof block.value === "string" ? block.value.trim() : "";
  return value.includes("@") ? value : undefined;
}

export function downloadVCard(options: {
  name: string;
  phone?: string;
  email?: string;
  handle?: string;
}): void {
  const phone = options.phone?.replace(/[^\d+]/g, "") || "";
  const email = options.email?.includes("@") ? options.email : "";
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${options.name}`,
    options.handle ? `NICKNAME:${options.handle.replace(/^@/, "")}` : "",
    phone ? `TEL;TYPE=CELL:${phone}` : "",
    email ? `EMAIL:${email}` : "",
    "END:VCARD"
  ]
    .filter(Boolean)
    .join("\r\n");
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${options.name.replace(/\s+/g, "-").toLowerCase() || "contact"}.vcf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function createDefaultLinkSpinFields(): Record<string, unknown> {
  return {
    couponCode: "LUCKYSPIN20",
    prizesText: DEFAULT_LINK_SPIN_PRIZES.join("\n")
  };
}

export function createDefaultVCardFields(): Record<string, string> {
  return {
    contactName: "",
    phone: "",
    email: ""
  };
}

export function createDefaultEventFields(): Record<string, string> {
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return {
    eventMonth: month,
    eventDay: String(now.getDate()),
    subtext: "Tap to RSVP"
  };
}

export type DynamicFormFieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "number"
  | "url"
  | "select"
  | "checkbox";

export interface DynamicFormField {
  id: string;
  label: string;
  placeholder: string;
  type: DynamicFormFieldType;
  required: boolean;
  options: string;
}

/** Submitted form values keyed by field id (and optionally field labels in mailto). */
export type FormSubmitPayload = Record<string, string>;

export const FORM_FIELD_TYPE_OPTIONS: { value: DynamicFormFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "textarea", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "url", label: "URL" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" }
];

export function createDefaultFormFieldList(): DynamicFormField[] {
  return [
    { id: "ff_name", label: "Name", placeholder: "Your name", type: "text", required: true, options: "" },
    { id: "ff_email", label: "Email", placeholder: "Your email", type: "email", required: true, options: "" },
    { id: "ff_phone", label: "Phone", placeholder: "Your phone", type: "phone", required: false, options: "" },
    { id: "ff_message", label: "Message", placeholder: "Your message", type: "textarea", required: false, options: "" }
  ];
}

export function createFormField(partial?: Partial<DynamicFormField>): DynamicFormField {
  return {
    id: `ff_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    label: "New Field",
    placeholder: "",
    type: "text",
    required: false,
    options: "",
    ...partial
  };
}

function normalizeFormField(raw: unknown, index: number): DynamicFormField | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const id = typeof item.id === "string" && item.id.trim() ? item.id.trim() : `ff_${index}`;
  const label = typeof item.label === "string" && item.label.trim() ? item.label.trim() : `Field ${index + 1}`;
  const placeholder = typeof item.placeholder === "string" ? item.placeholder : "";
  const typeRaw = typeof item.type === "string" ? item.type : "text";
  const type = (FORM_FIELD_TYPE_OPTIONS.some((opt) => opt.value === typeRaw) ? typeRaw : "text") as DynamicFormFieldType;
  const required = item.required === true || item.required === "Yes" || item.required === "true";
  const options = typeof item.options === "string" ? item.options : "";
  return { id, label, placeholder, type, required, options };
}

export function createDefaultFormFields(): Record<string, unknown> {
  return {
    submitLabel: "Submit",
    description: "",
    formFields: createDefaultFormFieldList()
  };
}

/** Resolve form fields - supports new dynamic list and legacy showName/showEmail toggles. */
export function getFormFields(block: BlockRecord): DynamicFormField[] {
  if (Array.isArray(block.formFields)) {
    const normalized = block.formFields
      .map((item, index) => normalizeFormField(item, index))
      .filter((item): item is DynamicFormField => Boolean(item));
    if (normalized.length > 0) return normalized;
  }

  const legacy: DynamicFormField[] = [];
  const pushLegacy = (key: "name" | "email" | "phone" | "message", field: DynamicFormField) => {
    const showKey = `show${key.charAt(0).toUpperCase()}${key.slice(1)}`;
    const raw = block[showKey];
    if (typeof raw === "string" && raw.toLowerCase() === "no") return;
    legacy.push(field);
  };
  pushLegacy("name", {
    id: "ff_name",
    label: "Name",
    placeholder: "Your name",
    type: "text",
    required: true,
    options: ""
  });
  pushLegacy("email", {
    id: "ff_email",
    label: "Email",
    placeholder: "Your email",
    type: "email",
    required: true,
    options: ""
  });
  pushLegacy("phone", {
    id: "ff_phone",
    label: "Phone",
    placeholder: "Your phone",
    type: "phone",
    required: false,
    options: ""
  });
  pushLegacy("message", {
    id: "ff_message",
    label: "Message",
    placeholder: "Your message",
    type: "textarea",
    required: false,
    options: ""
  });
  return legacy.length > 0 ? legacy : createDefaultFormFieldList();
}

export function getFormSelectOptions(field: DynamicFormField): string[] {
  return field.options
    .split(/\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function getFormSubmitLabel(block: BlockRecord): string {
  const label = typeof block.submitLabel === "string" ? block.submitLabel.trim() : "";
  return label || "Submit";
}

/** Collect social links from the first Socials block on a page. */
export function collectPageSocialLinks(blocks: BlockRecord[]): SocialLinkItem[] {
  for (const block of blocks) {
    if (block.type === "socials" || block.type === "Socials") {
      const links = getSocialLinksFromBlock(block);
      if (links.length) return links;
    }
  }
  return [];
}

/** Legacy End Title Page blocks — hidden from public/preview render. */
export function isEndTitlePageBlock(block: { type?: string } | null | undefined): boolean {
  return Boolean(block && (block.type === "End Title Page" || block.type === "EndTitlePage"));
}

export function filterVisibleBioBlocks<T extends { type?: string; id?: string }>(blocks: T[]): T[] {
  return blocks.filter((block) => !isEndTitlePageBlock(block));
}

export interface FaqItemRecord {
  id: string;
  question: string;
  answer: string;
}

export function createDefaultFaqItems(): FaqItemRecord[] {
  return [
    { id: "faq_1", question: "What do you offer?", answer: "Tell visitors about your main service or product." },
    { id: "faq_2", question: "How can I contact you?", answer: "Share your preferred contact method or response time." }
  ];
}

export function createFaqItem(partial?: Partial<FaqItemRecord>): FaqItemRecord {
  return {
    id: `faq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    question: "New question",
    answer: "Write the answer here.",
    ...partial
  };
}

export function getFaqItems(block: BlockRecord): FaqItemRecord[] {
  if (!Array.isArray(block.faqItems)) return createDefaultFaqItems();
  return block.faqItems
    .map((raw, index) => {
      if (!raw || typeof raw !== "object") return null;
      const item = raw as Record<string, unknown>;
      return {
        id: typeof item.id === "string" && item.id ? item.id : `faq_${index}`,
        question: typeof item.question === "string" ? item.question : `Question ${index + 1}`,
        answer: typeof item.answer === "string" ? item.answer : ""
      } satisfies FaqItemRecord;
    })
    .filter((item): item is FaqItemRecord => Boolean(item));
}

export interface TestimonialRecord {
  id: string;
  quote: string;
  author: string;
  role: string;
}

export function createDefaultTestimonials(): TestimonialRecord[] {
  return [
    {
      id: "tm_1",
      quote: "Amazing experience - highly recommended!",
      author: "Alex",
      role: "Customer"
    }
  ];
}

export function createTestimonial(partial?: Partial<TestimonialRecord>): TestimonialRecord {
  return {
    id: `tm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    quote: "Share a customer quote.",
    author: "Customer",
    role: "",
    ...partial
  };
}

export function getTestimonials(block: BlockRecord): TestimonialRecord[] {
  if (!Array.isArray(block.testimonials)) return createDefaultTestimonials();
  return block.testimonials
    .map((raw, index) => {
      if (!raw || typeof raw !== "object") return null;
      const item = raw as Record<string, unknown>;
      return {
        id: typeof item.id === "string" && item.id ? item.id : `tm_${index}`,
        quote: typeof item.quote === "string" ? item.quote : "",
        author: typeof item.author === "string" ? item.author : "Customer",
        role: typeof item.role === "string" ? item.role : ""
      } satisfies TestimonialRecord;
    })
    .filter((item): item is TestimonialRecord => Boolean(item));
}

export interface TipOptionRecord {
  id: string;
  label: string;
  url: string;
  amount: string;
}

export function createDefaultTipOptions(): TipOptionRecord[] {
  return [
    { id: "tip_1", label: "Buy me a coffee", url: "https://www.buymeacoffee.com/", amount: "?99" },
    { id: "tip_2", label: "Support the work", url: "https://paypal.me/", amount: "?249" }
  ];
}

export function createTipOption(partial?: Partial<TipOptionRecord>): TipOptionRecord {
  return {
    id: `tip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    label: "New tip option",
    url: "https://",
    amount: "",
    ...partial
  };
}

export function getTipOptions(block: BlockRecord): TipOptionRecord[] {
  if (!Array.isArray(block.tipOptions)) return createDefaultTipOptions();
  return block.tipOptions
    .map((raw, index) => {
      if (!raw || typeof raw !== "object") return null;
      const item = raw as Record<string, unknown>;
      return {
        id: typeof item.id === "string" && item.id ? item.id : `tip_${index}`,
        label: typeof item.label === "string" ? item.label : `Option ${index + 1}`,
        url: typeof item.url === "string" ? item.url : "",
        amount: typeof item.amount === "string" ? item.amount : ""
      } satisfies TipOptionRecord;
    })
    .filter((item): item is TipOptionRecord => Boolean(item));
}

export function createDefaultMapFields(): Record<string, string> {
  return {
    address: "Marina Beach, Chennai, Tamil Nadu",
    buttonLabel: "Open in Google Maps",
    subtext: "Visit us",
    zoom: "15",
    mapHeight: "md",
    showAddress: "Yes"
  };
}

export interface ResolvedGoogleMap {
  embedUrl: string;
  openUrl: string;
  queryLabel: string;
  hasLocation: boolean;
}

function clampMapZoom(raw: unknown, fallback = 15): number {
  const parsed = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(21, Math.max(1, parsed));
}

function extractQueryParam(url: URL, keys: string[]): string {
  for (const key of keys) {
    const value = url.searchParams.get(key);
    if (value && value.trim()) return value.trim();
  }
  return "";
}

/** Parse Google Maps share/search URLs, embed links, lat/lng, or plain addresses into embed + open URLs. */
export function resolveGoogleMap(block: BlockRecord): ResolvedGoogleMap {
  const mapsUrl = typeof block.value === "string" ? block.value.trim() : "";
  const address = typeof block.address === "string" ? block.address.trim() : "";
  const zoom = clampMapZoom(block.zoom, 15);

  let query = "";
  let embedFromShare = "";
  let openFromInput = "";

  if (mapsUrl) {
    // Already an embed URL (from Google "Share ? Embed a map")
    if (/google\.[^/]+\/maps\/embed/i.test(mapsUrl) || mapsUrl.includes("/maps/embed?")) {
      embedFromShare = mapsUrl;
      openFromInput = mapsUrl.replace("/maps/embed", "/maps").replace("&output=embed", "");
    } else {
      try {
        const parsed = new URL(mapsUrl.startsWith("http") ? mapsUrl : `https://${mapsUrl}`);
        const host = parsed.hostname.toLowerCase();
        const isGoogleMaps =
          host.includes("google.") ||
          host.includes("goo.gl") ||
          host.includes("maps.app.goo.gl");

        if (isGoogleMaps) {
          openFromInput = parsed.toString();

          const q = extractQueryParam(parsed, ["q", "query", "destination", "daddr"]);
          if (q) query = q;

          // /maps/place/Place+Name/@lat,lng
          if (!query) {
            const placeMatch = parsed.pathname.match(/\/maps\/place\/([^/]+)/i);
            if (placeMatch?.[1]) {
              query = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
            }
          }

          // @lat,lng,zoom in path or hash
          if (!query) {
            const coordMatch =
              parsed.pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/) ||
              parsed.href.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
            if (coordMatch) {
              query = `${coordMatch[1]},${coordMatch[2]}`;
            }
          }

          // ll= or center=
          if (!query) {
            const ll = extractQueryParam(parsed, ["ll", "center"]);
            if (ll) query = ll.split(",").slice(0, 2).join(",");
          }
        } else {
          // Non-Google URL - still try as open link; use address for embed
          openFromInput = parsed.toString();
        }
      } catch {
        // Treat as free-text location query
        query = mapsUrl;
      }
    }
  }

  if (!query && address) query = address;
  if (!query && !embedFromShare) {
    return {
      embedUrl: "",
      openUrl: openFromInput || "https://maps.google.com/",
      queryLabel: "",
      hasLocation: false
    };
  }

  const queryLabel = query || address || "Location";
  const openUrl =
    openFromInput ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryLabel)}`;

  const embedUrl =
    embedFromShare ||
    `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`;

  return {
    embedUrl,
    openUrl,
    queryLabel,
    hasLocation: true
  };
}

export function createDefaultImageFields(): Record<string, string> {
  return {
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
    linkUrl: "",
    caption: "",
    altText: "Image"
  };
}

export function createDefaultDividerFields(): Record<string, string> {
  return {
    style: "line",
    spacing: "md"
  };
}

export function createDefaultCallFields(): Record<string, string> {
  return {
    phone: "+919876543210",
    subtext: "Mon-Sat 10am-6pm",
    bgColor: "#0f172a",
    textColor: "#ffffff"
  };
}

export function createDefaultEmailFields(): Record<string, string> {
  return {
    email: "hello@example.com",
    subject: "Hello from your bio page",
    subtext: "We reply within 24 hours",
    bgColor: "#4f46e5",
    textColor: "#ffffff"
  };
}

export function getCallPhone(block: BlockRecord): string {
  const phone = typeof block.phone === "string" ? block.phone.trim() : "";
  if (phone) return phone;
  const value = typeof block.value === "string" ? block.value.trim() : "";
  return value.replace(/^tel:/i, "");
}

export function getEmailAddress(block: BlockRecord): string {
  const email = typeof block.email === "string" ? block.email.trim() : "";
  if (email) return email;
  const value = typeof block.value === "string" ? block.value.trim() : "";
  return value.replace(/^mailto:/i, "").split("?")[0] || "";
}

export function buildTelUrl(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned ? `tel:${cleaned}` : "";
}

export function buildMailtoUrl(email: string, subject?: string): string {
  if (!email.trim()) return "";
  const params = subject?.trim() ? `?subject=${encodeURIComponent(subject.trim())}` : "";
  return `mailto:${email.trim()}${params}`;
}

export interface PricingPlanRecord {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string;
  url: string;
  highlighted: boolean;
}

export function createPricingPlan(partial?: Partial<PricingPlanRecord>): PricingPlanRecord {
  return {
    id: `price_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: "Basic Plan",
    price: "?999",
    period: "/month",
    description: "Perfect to get started",
    features: "Feature one\nFeature two",
    url: "",
    highlighted: false,
    ...partial
  };
}

export function createDefaultPricingPlans(): PricingPlanRecord[] {
  return [
    createPricingPlan({
      name: "Starter",
      price: "?499",
      period: "/month",
      description: "For individuals",
      features: "1 bio page\nBasic analytics\nEmail support"
    }),
    createPricingPlan({
      name: "Pro",
      price: "?999",
      period: "/month",
      description: "For growing brands",
      features: "Unlimited blocks\nPriority support\nCustom domain",
      highlighted: true
    })
  ];
}

export function getPricingPlans(block: BlockRecord): PricingPlanRecord[] {
  if (!Array.isArray(block.pricingPlans)) return createDefaultPricingPlans();
  return block.pricingPlans
    .map((raw, index) => {
      if (!raw || typeof raw !== "object") return null;
      const item = raw as Record<string, unknown>;
      return {
        id: typeof item.id === "string" && item.id ? item.id : `price_${index}`,
        name: typeof item.name === "string" ? item.name : `Plan ${index + 1}`,
        price: typeof item.price === "string" ? item.price : "",
        period: typeof item.period === "string" ? item.period : "",
        description: typeof item.description === "string" ? item.description : "",
        features: typeof item.features === "string" ? item.features : "",
        url: typeof item.url === "string" ? item.url : "",
        highlighted: item.highlighted === true || item.highlighted === "Yes"
      } satisfies PricingPlanRecord;
    })
    .filter((item): item is PricingPlanRecord => Boolean(item));
}

export function getPricingPlanFeatures(plan: PricingPlanRecord): string[] {
  return plan.features
    .split(/\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function createDefaultBannerFields(): Record<string, string> {
  return {
    bannerEmoji: "\u2728",
    bannerTitle: "New offer live!",
    bannerMessage: "Check out our latest collection today.",
    bannerLink: "",
    bannerLinkLabel: "Learn more",
    bannerStyle: "info"
  };
}

export type BannerStyle = "info" | "success" | "warning" | "promo";

export function getBannerStyle(block: BlockRecord): BannerStyle {
  const raw = typeof block.bannerStyle === "string" ? block.bannerStyle : "info";
  if (raw === "success" || raw === "warning" || raw === "promo") return raw;
  return "info";
}

export interface StatItemRecord {
  id: string;
  value: string;
  label: string;
}

export function createStatItem(partial?: Partial<StatItemRecord>): StatItemRecord {
  return {
    id: `stat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    value: "10K+",
    label: "Happy customers",
    ...partial
  };
}

export function createDefaultStatItems(): StatItemRecord[] {
  return [
    createStatItem({ value: "10K+", label: "Happy customers" }),
    createStatItem({ value: "4.9\u2605", label: "Average rating" }),
    createStatItem({ value: "24/7", label: "Support" })
  ];
}

export function getStatItems(block: BlockRecord): StatItemRecord[] {
  if (!Array.isArray(block.statItems)) return createDefaultStatItems();
  return block.statItems
    .map((raw, index) => {
      if (!raw || typeof raw !== "object") return null;
      const item = raw as Record<string, unknown>;
      return {
        id: typeof item.id === "string" && item.id ? item.id : `stat_${index}`,
        value: typeof item.value === "string" ? item.value : "0",
        label: typeof item.label === "string" ? item.label : `Stat ${index + 1}`
      } satisfies StatItemRecord;
    })
    .filter((item): item is StatItemRecord => Boolean(item));
}

export function createDefaultGalleryBlockFields(): Record<string, unknown> {
  return { galleryItems: createDefaultGalleryItems() };
}
