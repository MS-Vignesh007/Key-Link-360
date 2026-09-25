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

// ==================== DEVELOPER-GRADE BLOCKS DATA HELPERS ====================

// 1. Split Hero
export function createDefaultSplitHeroFields() {
  return {
    headline: "Scale Your Business With High-Converting Sites",
    subheadline: "Build developer-grade responsive landing pages and biolinks in minutes. Zero coding required.",
    primaryCtaLabel: "Get Started Free",
    primaryCtaUrl: "https://keylink360.in",
    secondaryCtaLabel: "Book a Demo",
    secondaryCtaUrl: "https://keylink360.in/demo",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600",
    badgeText: "🚀 Next-Gen Micro-Site Builder"
  };
}

// 2. Video Hero
export function createDefaultVideoHeroFields() {
  return {
    headline: "The Modern Creative Agency",
    subheadline: "Watch how we transform digital brand experiences through design and code.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    ctaLabel: "Start Your Project",
    ctaUrl: "https://keylink360.in",
    badgeText: "🎬 Featured Reel 2026"
  };
}

// 3. Glow Badge
export function createDefaultGlowBadgeFields() {
  return {
    badgeText: "⚡ Introducing Multi-Device Responsive Sites · See What's New →",
    badgeLink: "https://keylink360.in",
    badgeStyle: "purple" // purple | emerald | amber | cyan
  };
}

// 4. Feature Hero
export function createDefaultFeatureHeroFields() {
  return {
    headline: "Built For High Performance & Conversions",
    subheadline: "Everything you need to turn visitors into paying customers seamlessly.",
    featureItems: [
      { icon: "⚡", title: "Ultra Fast Loading", desc: "Sub-second load times across 4G & 5G networks." },
      { icon: "📱", title: "Universal Responsive", desc: "Pixel-perfect mockups on phones, tablets, & 4K screens." },
      { icon: "🔒", title: "Bank-Grade Security", desc: "Integrated payment gateways with SSL protection." }
    ]
  };
}

// 5. Toggle Pricing Table
export function createDefaultTogglePricingFields() {
  return {
    discountBadge: "Save 20% Yearly",
    monthlyPlans: [
      {
        id: "plan_m1",
        name: "Starter",
        price: "₹499",
        period: "/mo",
        description: "Best for individual creators and solopreneurs.",
        features: ["1 Custom Domain", "Unlimited Bio Links", "Standard Analytics", "Mobile Optimized"],
        url: "https://keylink360.in/checkout?plan=starter_m",
        highlighted: false
      },
      {
        id: "plan_m2",
        name: "Pro Agency",
        price: "₹1,499",
        period: "/mo",
        description: "Ideal for growing businesses and agencies.",
        features: ["5 Custom Domains", "AI Sales Bot", "Multi-Device Responsive", "Priority 24/7 Support", "Zero KeyLink Branding"],
        url: "https://keylink360.in/checkout?plan=pro_m",
        highlighted: true
      }
    ],
    annualPlans: [
      {
        id: "plan_y1",
        name: "Starter",
        price: "₹399",
        period: "/mo (billed annually)",
        description: "Best for individual creators and solopreneurs.",
        features: ["1 Custom Domain", "Unlimited Bio Links", "Standard Analytics", "Mobile Optimized"],
        url: "https://keylink360.in/checkout?plan=starter_y",
        highlighted: false
      },
      {
        id: "plan_y2",
        name: "Pro Agency",
        price: "₹1,199",
        period: "/mo (billed annually)",
        description: "Ideal for growing businesses and agencies.",
        features: ["5 Custom Domains", "AI Sales Bot", "Multi-Device Responsive", "Priority 24/7 Support", "Zero KeyLink Branding"],
        url: "https://keylink360.in/checkout?plan=pro_y",
        highlighted: true
      }
    ]
  };
}

// 6. Product Showcase
export function createDefaultProductShowcaseFields() {
  return {
    productName: "Studio Wireless Noise-Cancelling Headphones",
    price: "₹4,999",
    originalPrice: "₹8,999",
    discountPercent: "45% OFF",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=500",
    buyUrl: "https://amazon.in",
    rating: "4.9",
    reviewCount: "1,420",
    stockUrgency: "⚡ Only 7 units remaining in stock",
    features: ["40h Battery Life", "Active Noise Cancellation", "Fast USB-C Charging", "1 Year Warranty"]
  };
}

// 7. Feature Comparison Table
export function createDefaultComparisonTableFields() {
  return {
    tierLabels: ["Free", "Pro", "Business"],
    features: [
      { name: "Custom Domain Connection", free: false, pro: true, biz: true },
      { name: "Multi-Device Layouts", free: false, pro: true, biz: true },
      { name: "Lead Capture Forms", free: true, pro: true, biz: true },
      { name: "AI Sales Chat Assistant", free: false, pro: false, biz: true },
      { name: "Zero Platform Branding", free: false, pro: true, biz: true },
      { name: "Dedicated Account Manager", free: false, pro: false, biz: true }
    ]
  };
}

// 8. Payment Button
export function createDefaultPaymentButtonFields() {
  return {
    buttonText: "Pay ₹999 Now · Instant Access",
    amount: "999",
    currency: "INR",
    gatewayLabel: "Secured by Razorpay · UPI, Cards & NetBanking",
    guaranteeText: "🛡️ 100% Money Back Guarantee within 7 days",
    paymentUrl: "https://rzp.io/l/demo-checkout"
  };
}

// 9. Brand Logos
export function createDefaultBrandLogosFields() {
  return {
    title: "Trusted by 5,000+ Fast-Growing Companies",
    displayMode: "marquee", // marquee | grid
    logos: [
      { name: "Google", logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/google.svg" },
      { name: "Stripe", logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/stripe.svg" },
      { name: "Meta", logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/meta.svg" },
      { name: "Amazon", logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/amazon.svg" },
      { name: "Spotify", logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/spotify.svg" },
      { name: "Shopify", logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/shopify.svg" }
    ]
  };
}

// 10. Star Ratings & Authority
export function createDefaultStarRatingsFields() {
  return {
    ratingScore: "4.9",
    maxScore: "5.0",
    reviewCount: "2,840+ Happy Clients",
    headline: "Overwhelmingly 5-Star Rated Worldwide",
    subtitle: "Consistently rated #1 for conversion rate and ease of use.",
    avatars: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100"
    ]
  };
}

// 11. Press Mentions
export function createDefaultPressMentionsFields() {
  return {
    headline: "As Featured In Top Media",
    items: [
      { name: "TechCrunch", quote: "The easiest way to turn social bios into full ecommerce powerhouses." },
      { name: "Forbes", quote: "Top 10 essential SaaS tools for digital creators in 2026." },
      { name: "ProductHunt", quote: "#1 Product of the Week with over 1,500 upvotes." }
    ]
  };
}

// 12. Before / After Comparison Slider
export function createDefaultBeforeAfterFields() {
  return {
    beforeImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600",
    afterImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600",
    beforeLabel: "Before",
    afterLabel: "After",
    caption: "Dramatic Transformation in 30 Days"
  };
}

// 13. Portfolio Gallery
export function createDefaultPortfolioFields() {
  return {
    headline: "Our Creative Portfolio",
    activeCategory: "All",
    categories: ["All", "Web Design", "Branding", "Mobile Apps"],
    projects: [
      {
        id: "p1",
        title: "Fintech Dashboard UI",
        category: "Web Design",
        imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400",
        linkUrl: "https://keylink360.in"
      },
      {
        id: "p2",
        title: "Modern Coffee Co Brand Identity",
        category: "Branding",
        imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400",
        linkUrl: "https://keylink360.in"
      },
      {
        id: "p3",
        title: "Fitness Companion iOS App",
        category: "Mobile Apps",
        imageUrl: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&q=80&w=400",
        linkUrl: "https://keylink360.in"
      }
    ]
  };
}

// 14. Video Showcase / Playlist
export function createDefaultVideoShowcaseFields() {
  return {
    title: "Masterclass: How to 10X Your Online Conversions",
    featuredVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    playlist: [
      { id: "v1", title: "Lesson 1: The High-Converting Hero Hook", duration: "12:45" },
      { id: "v2", title: "Lesson 2: Irresistible Offer Architecture", duration: "18:20" },
      { id: "v3", title: "Lesson 3: Social Proof & Objection Handling", duration: "15:10" }
    ]
  };
}

// 15. Audio / Podcast Player
export function createDefaultAudioPlayerFields() {
  return {
    title: "Ep. 42: Scaling From Zero to 100K Users",
    podcastName: "The Founder's Playbook",
    artist: "Vignesh & Team KeyLink",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverImage: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&q=80&w=300",
    listenOnSpotifyUrl: "https://spotify.com",
    listenOnAppleUrl: "https://apple.com"
  };
}

// 16. Multi-Step Form
export function createDefaultMultiStepFormFields() {
  return {
    formTitle: "Get Your Free Strategy Consultation",
    steps: [
      {
        stepNumber: 1,
        stepTitle: "Your Contact",
        fields: [
          { id: "f1", label: "Full Name", type: "text", placeholder: "e.g. John Doe", required: true },
          { id: "f2", label: "Email Address", type: "email", placeholder: "john@example.com", required: true }
        ]
      },
      {
        stepNumber: 2,
        stepTitle: "Your Project",
        fields: [
          { id: "f3", label: "Estimated Monthly Budget", type: "select", options: ["₹10,000 - ₹25,000", "₹25,000 - ₹50,000", "₹50,000+"], required: true },
          { id: "f4", label: "What is your main business goal?", type: "text", placeholder: "e.g. Increase sales leads by 50%", required: true }
        ]
      },
      {
        stepNumber: 3,
        stepTitle: "Confirmation",
        fields: [
          { id: "f5", label: "Phone / WhatsApp", type: "tel", placeholder: "+91 98765 43210", required: true }
        ]
      }
    ],
    submitButtonText: "Book My Free Strategy Session 🚀"
  };
}

// 17. Lead Magnet Download
export function createDefaultLeadMagnetFields() {
  return {
    badgeText: "🎁 FREE EBOOK / PDF GUIDE",
    title: "The Ultimate 2026 Bio-Link Conversion Blueprint",
    description: "Download our step-by-step 48-page playbook that helped 1,200+ creators generate over ₹1 Crore in sales.",
    coverImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
    fileSize: "14.2 MB PDF",
    buttonText: "Instant Free Download",
    downloadUrl: "https://example.com/blueprint.pdf"
  };
}

// 18. Meeting Booker / Calendly Embed
export function createDefaultMeetingBookerFields() {
  return {
    hostName: "Vignesh (Founder)",
    hostRole: "Growth & Product Strategist",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    meetingTitle: "15-Minute 1-on-1 Growth Discovery Call",
    description: "Let's review your landing page and discuss how KeyLink360 can double your visitor conversions.",
    durationMinutes: "15 mins",
    bookingUrl: "https://calendly.com",
    buttonText: "Schedule Call Now 🗓️"
  };
}

// 19. Newsletter Box
export function createDefaultNewsletterFields() {
  return {
    title: "Join The Weekly Growth Dispatch",
    subtitle: "Every Tuesday, get 1 actionable marketing tip to grow your brand. No spam, ever.",
    buttonLabel: "Subscribe Free",
    subscriberBadge: "Join 12,400+ smart founders & creators",
    successMessage: "🎉 You're in! Check your inbox for the welcome issue."
  };
}

// 20. Navbar Block (Header navigation bar with logo, links, CTA)
export function createDefaultNavbarFields() {
  return {
    brandLogo: "",
    brandName: "KEYLINKS 360",
    tagline: "High-Converting Micro Sites",
    navLinks: [
      { id: "nl_1", label: "Features", url: "#features" },
      { id: "nl_2", label: "Pricing", url: "#pricing" },
      { id: "nl_3", label: "Reviews", url: "#reviews" }
    ],
    ctaLabel: "Get Started Free ⚡",
    ctaUrl: "https://keylink360.in",
    isGlassmorphic: true,
    isSticky: false
  };
}

// 21. Footer Block (Clean multi-link footer with copyright, socials, legal links)
export function createDefaultFooterFields() {
  return {
    brandName: "KeyLinks360 Studio",
    tagline: "The #1 biolink & landing page engine for creators and high-growth businesses.",
    copyrightText: `© ${new Date().getFullYear()} KeyLinks360. All rights reserved.`,
    supportEmail: "support@keylinks360.in",
    footerLinks: [
      { id: "fl_1", label: "Privacy Policy", url: "https://keylink360.in/privacy" },
      { id: "fl_2", label: "Terms of Service", url: "https://keylink360.in/terms" },
      { id: "fl_3", label: "Help & Docs", url: "https://keylink360.in/docs" },
      { id: "fl_4", label: "Contact Us", url: "https://keylink360.in/contact" }
    ],
    badgeText: "⚡ Powered by KeyLinks360"
  };
}

// 22. Main Feature Block (Hero Grid with feature pills and CTA)
export function createDefaultMainFeatureFields() {
  return {
    badge: "🔥 Supercharged Features",
    headline: "Everything Built For Unstoppable Business Growth",
    subheadline: "Replace 10+ expensive tools with one blazing fast, all-in-one conversion machine.",
    features: [
      { id: "mf_1", icon: "⚡", title: "Instant Fast Loading", desc: "Built with Next-Gen edge CDN for sub-second speeds worldwide." },
      { id: "mf_2", icon: "💳", title: "Razorpay & UPI Payments", desc: "Accept 1-click payments directly on your biolink without friction." },
      { id: "mf_3", icon: "🤖", title: "24/7 AI Sales Bot", desc: "Automate customer inquiries and capture warm buyer leads 24/7." },
      { id: "mf_4", icon: "🌐", title: "Custom Domain Connection", desc: "Map your own .com or .in domain with automatic SSL security." }
    ],
    ctaText: "Explore All Features →",
    ctaUrl: "https://keylink360.in"
  };
}

// 23. Image Auto Slider / Carousel Block
export function createDefaultAutoSliderFields() {
  return {
    autoplay: true,
    intervalSeconds: 4,
    showDots: true,
    showArrows: true,
    aspectRatio: "16/9",
    slides: [
      {
        id: "sl_1",
        imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
        title: "High Converting Analytics Dashboard",
        caption: "Track real-time visitor traffic, clicks, and sales.",
        linkUrl: "https://keylink360.in"
      },
      {
        id: "sl_2",
        imageUrl: "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&q=80&w=800",
        title: "Developer Grade Responsive Mockups",
        caption: "Pixel-perfect mobile, tablet, and 4K desktop previews.",
        linkUrl: "https://keylink360.in"
      },
      {
        id: "sl_3",
        imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
        title: "Direct E-Commerce & Product Checkout",
        caption: "Sell digital downloads, courses, and physical merchandise.",
        linkUrl: "https://keylink360.in"
      }
    ]
  };
}

// 24. Google Form / Embedded Form Block
export function createDefaultGoogleFormFields() {
  return {
    formTitle: "Official Client Inquiry & Feedback Form",
    formDescription: "Fill out the quick questionnaire below and our team will get back to you within 2 hours.",
    embedUrl: "", // Users can paste Google Form embed URL or public iframe URL
    fallbackFields: [
      { id: "gf_1", label: "Full Name", type: "text", required: true, placeholder: "e.g. Vignesh" },
      { id: "gf_2", label: "Email Address", type: "email", required: true, placeholder: "name@company.com" },
      { id: "gf_3", label: "WhatsApp / Phone", type: "tel", required: true, placeholder: "+91 98765 43210" },
      { id: "gf_4", label: "Your Requirement / Message", type: "textarea", required: true, placeholder: "Describe what you need..." }
    ],
    submitButtonText: "Submit Inquiry 🚀",
    successMessage: "🎉 Thanks! We have received your response and will contact you shortly."
  };
}

// 25. Flash Offer / Promotion / Coupon Countdown Block
export function createDefaultFlashOfferFields() {
  return {
    badgeText: "⚡ LIMITED TIME SPECIAL OFFER",
    discountHeadline: "FLAT 50% OFF TODAY ONLY",
    offerDescription: "Upgrade your biolink to Pro Plan & get free custom domain + AI Sales Bot included!",
    couponCode: "SUPER50",
    discountAmount: "50% OFF",
    originalPrice: "₹1,999",
    salePrice: "₹999",
    expiryDate: defaultCountdownEndAt(3), // 3 days from now
    ctaLabel: "Claim Discount Now 🛒",
    ctaUrl: "https://keylink360.in/checkout?coupon=SUPER50",
    termsNote: "* Applicable for first 100 users only. 7-day money-back guarantee."
  };
}

// 26. Community Hub Block (Discord / WhatsApp / Telegram Group)
export function createDefaultCommunityHubFields() {
  return {
    communityPlatform: "whatsapp", // whatsapp | telegram | discord | general
    groupName: "KeyLinks VIP Founders Community",
    memberCount: "4,820+ Active Creators",
    onlineCount: "340 Online Now",
    groupDescription: "Get daily marketing tips, launch feedback, and connect directly with high-earning founders.",
    perks: [
      "🔥 Daily Growth Hacks & Video Tutorials",
      "🤝 1-on-1 Feedback from top Creators",
      "🎁 Exclusive Pro Themes & Free Templates"
    ],
    inviteUrl: "https://chat.whatsapp.com/invite-demo",
    joinButtonLabel: "Join Free WhatsApp Group 🚀"
  };
}

// 27. YouTube Channel / Video Stream Block
export function createDefaultYouTubeChannelFields() {
  return {
    channelName: "Vignesh Tech & Business",
    channelHandle: "@keylinks360",
    channelAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    subscriberCount: "125K Subscribers",
    videoCount: "340 Videos",
    videoTitle: "How to Build a ₹1 Lakh/Month Bio-Link Business in 2026",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    youtubeEmbedId: "dQw4w9WgXcQ",
    subscribeUrl: "https://youtube.com/@keylinks360?sub_confirmation=1",
    subscribeButtonLabel: "Subscribe on YouTube 🔴"
  };
}

// 28. Instagram Feed Grid Block
export function createDefaultInstagramFeedFields() {
  return {
    instagramHandle: "@keylinks360.official",
    followerCount: "84.5K Followers",
    profileUrl: "https://instagram.com/keylinks360",
    followButtonLabel: "Follow on Instagram 📸",
    posts: [
      {
        id: "ig_1",
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400",
        likes: "2.4K",
        comments: "142",
        postUrl: "https://instagram.com"
      },
      {
        id: "ig_2",
        imageUrl: "https://images.unsplash.com/photo-1626278664285-f7c05fd17571?auto=format&fit=crop&q=80&w=400",
        likes: "1.8K",
        comments: "98",
        postUrl: "https://instagram.com"
      },
      {
        id: "ig_3",
        imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400",
        likes: "3.1K",
        comments: "210",
        postUrl: "https://instagram.com"
      },
      {
        id: "ig_4",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
        likes: "4.5K",
        comments: "330",
        postUrl: "https://instagram.com"
      }
    ]
  };
}

export function isWideBlock(type?: string): boolean {
  if (!type) return true;
  const t = type.toLowerCase();
  // Only small single-item buttons, links, or contact icons can be half-width if colSpan is set to half
  const isCompactWidget =
    t === "button" ||
    t === "link" ||
    t === "whatsapp" ||
    t === "call" ||
    t === "email" ||
    t === "socials";
  return !isCompactWidget;
}

export interface SectionDivisionDef {
  id: string;
  name: string;
  badge: string;
  icon: string;
  description: string;
}

export const SECTION_DIVISIONS: SectionDivisionDef[] = [
  { id: "all", name: "All Blocks (60)", badge: "60 Pro", icon: "💎", description: "Complete library of 60 modern section-based blocks" },
  { id: "navbar", name: "Navigation & Headers", badge: "6 Blocks", icon: "🧭", description: "Top navigation bars, sticky headers & announcement bars" },
  { id: "hero", name: "Hero & Banners", badge: "6 Blocks", icon: "🚀", description: "High-impact headlines, video streams & launch hero banners" },
  { id: "main", name: "Main & Features", badge: "6 Blocks", icon: "🧩", description: "Bento grids, core pillars, interactive tabs & stat metrics" },
  { id: "sliders", name: "Sliders & Media", badge: "6 Blocks", icon: "🎬", description: "Autoplay carousels, before/after sliders & video players" },
  { id: "side", name: "Side & Panels", badge: "6 Blocks", icon: "📑", description: "Sticky sidebars, quick contacts, bottom docks & info drawers" },
  { id: "commerce", name: "Store & Pricing", badge: "6 Blocks", icon: "💎", description: "Toggle pricing matrices, product highlights & 1-click checkout" },
  { id: "forms", name: "Leads & Forms", badge: "6 Blocks", icon: "📝", description: "Multi-step wizards, lead magnets, calendars & spin wheel" },
  { id: "socialproof", name: "Social Proof & Trust", badge: "6 Blocks", icon: "🌟", description: "Client logo marquees, star reviews, press quotes & review walls" },
  { id: "community", name: "Community & Social", badge: "6 Blocks", icon: "💬", description: "VIP groups, YouTube streamers, Instagram feeds & vCards" },
  { id: "footers", name: "Footers & Closing", badge: "6 Blocks", icon: "🔻", description: "Multi-column footers, closing CTA banners & copyright lines" }
];

export interface SectionBlockItem {
  id: string;
  type: string;
  divisionId: string;
  title: string;
  description: string;
  icon: string;
  badge: string;
}

export const SECTION_BASED_60_BLOCKS: SectionBlockItem[] = [
  // 1. Navigation & Headers (6)
  { id: "sec_nav_1", type: "Navbar", divisionId: "navbar", title: "Floating Glass Navbar", description: "Glassmorphic bar with logo, links drawer & CTA", icon: "🧭", badge: "Glass" },
  { id: "sec_nav_2", type: "Navbar", divisionId: "navbar", title: "Minimalist Brand Header", description: "Centered clean brand identity with sleek menu", icon: "✨", badge: "Minimal" },
  { id: "sec_nav_3", type: "Navbar", divisionId: "navbar", title: "MegaMenu Dropdown Bar", description: "Multi-column links header with categorized tags", icon: "📂", badge: "Mega" },
  { id: "sec_nav_4", type: "Banner", divisionId: "navbar", title: "Sticky Top Announcement", description: "Urgency banner with countdown & coupon pill", icon: "📢", badge: "Alert" },
  { id: "sec_nav_5", type: "Navbar", divisionId: "navbar", title: "Dual Action Header", description: "Branded header with login & action buttons", icon: "⚡", badge: "Action" },
  { id: "sec_nav_6", type: "Navbar", divisionId: "navbar", title: "Responsive Mobile Drawer", description: "Full-screen mobile drawer menu with socials", icon: "📱", badge: "Mobile" },

  // 2. Hero & Banners (6)
  { id: "sec_hero_1", type: "Split Hero", divisionId: "hero", title: "Split Headline & Mockup", description: "Side-by-side copy, dual CTA & 3D device preview", icon: "🚀", badge: "Split" },
  { id: "sec_hero_2", type: "Video Hero", divisionId: "hero", title: "Cinematic Video Stream", description: "Full-width background video reel with glow text", icon: "🎬", badge: "Video" },
  { id: "sec_hero_3", type: "Glow Badge", divisionId: "hero", title: "Glow Announcement Hero", description: "Pulsing neon pill badge with subheadline", icon: "🌟", badge: "Glow" },
  { id: "sec_hero_4", type: "Split Hero", divisionId: "hero", title: "Mobile App Download Hero", description: "Headline with App Store / Google Play buttons", icon: "📲", badge: "App" },
  { id: "sec_hero_5", type: "Split Hero", divisionId: "hero", title: "SaaS Platform Hero", description: "Software headline with live dashboard metrics", icon: "💻", badge: "SaaS" },
  { id: "sec_hero_6", type: "Header", divisionId: "hero", title: "Creator Avatar Hero", description: "Centered avatar with live ring, bio & stats", icon: "👑", badge: "Creator" },

  // 3. Main & Features (6)
  { id: "sec_main_1", type: "Main Feature", divisionId: "main", title: "Bento Feature Box", description: "4-cell modern bento layout with glowing borders", icon: "🔥", badge: "Bento" },
  { id: "sec_main_2", type: "Feature Hero", divisionId: "main", title: "3-Pillar Benefit Grid", description: "Core product value pillars with learn more links", icon: "⚡", badge: "Pillars" },
  { id: "sec_main_3", type: "Main Feature", divisionId: "main", title: "Dynamic Feature Tabs", description: "Switchable tabs: Features, Speed, Security", icon: "📑", badge: "Tabs" },
  { id: "sec_main_4", type: "Stats", divisionId: "main", title: "1-2-3 Process Timeline", description: "Numbered customer onboarding workflow steps", icon: "🔢", badge: "Steps" },
  { id: "sec_main_5", type: "Stats", divisionId: "main", title: "4-Metric KPI Counters", description: "Statistics grid with metrics, growth & labels", icon: "📈", badge: "Metrics" },
  { id: "sec_main_6", type: "Comparison Table", divisionId: "main", title: "With vs Without Us", description: "Side-by-side visual comparison breakdown", icon: "⚖️", badge: "Compare" },

  // 4. Sliders & Media (6)
  { id: "sec_slide_1", type: "Auto Slider", divisionId: "sliders", title: "Auto Card Carousel", description: "Touch-swipeable slider with pagination dots", icon: "🎠", badge: "Carousel" },
  { id: "sec_slide_2", type: "Before/After Slider", divisionId: "sliders", title: "Interactive Before/After", description: "Draggable image transformation split-slider", icon: "⇄", badge: "Slider" },
  { id: "sec_slide_3", type: "Video Showcase", divisionId: "sliders", title: "Video Reel Player", description: "Responsive video player with chapter markers", icon: "🎥", badge: "Player" },
  { id: "sec_slide_4", type: "Portfolio Gallery", divisionId: "sliders", title: "Filterable Portfolio", description: "Categorized portfolio showcase with zoom", icon: "🖼️", badge: "Portfolio" },
  { id: "sec_slide_5", type: "Audio Player", divisionId: "sliders", title: "Podcast Track Player", description: "Audio player with waveform and episode notes", icon: "🎧", badge: "Podcast" },
  { id: "sec_slide_6", type: "Gallery", divisionId: "sliders", title: "Responsive Photo Grid", description: "Aesthetic 6-photo masonry grid with captions", icon: "📸", badge: "Gallery" },

  // 5. Side & Panels (6)
  { id: "sec_side_1", type: "FAQ", divisionId: "side", title: "Quick-Jump TOC Menu", description: "Vertical quick-jump anchor links to sections", icon: "📌", badge: "Sticky" },
  { id: "sec_side_2", type: "Coupon", divisionId: "side", title: "Floating Corner Promo", description: "Floating corner card with 1-click claim button", icon: "🎁", badge: "Promo" },
  { id: "sec_side_3", type: "WhatsApp", divisionId: "side", title: "Speed-Dial Contact Pill", description: "Quick-connect floating WhatsApp, Call & Email", icon: "📞", badge: "Speed Dial" },
  { id: "sec_side_4", type: "FAQ", divisionId: "side", title: "Slide-Out Spec Sheet", description: "Side drawer panel with full product specs", icon: "📋", badge: "Drawer" },
  { id: "sec_side_5", type: "Button", divisionId: "side", title: "Mobile Bottom Dock", description: "Always-visible fixed bottom dock with primary CTA", icon: "⚓", badge: "Dock" },
  { id: "sec_side_6", type: "Banner", divisionId: "side", title: "Social Activity Popup", description: "Live recent purchaser activity popup badge", icon: "🔔", badge: "Toast" },

  // 6. Store & Pricing (6)
  { id: "sec_comm_1", type: "Toggle Pricing", divisionId: "commerce", title: "Toggle Pricing Matrix", description: "Toggle billing switch with savings badge", icon: "💳", badge: "Toggle" },
  { id: "sec_comm_2", type: "Product Showcase", divisionId: "commerce", title: "Hero Product Card", description: "Product card with discount, urgency & Buy Now", icon: "📦", badge: "Product" },
  { id: "sec_comm_3", type: "Comparison Table", divisionId: "commerce", title: "SaaS Feature Matrix", description: "Detailed checkmark vs cross plan breakdown", icon: "📊", badge: "Matrix" },
  { id: "sec_comm_4", type: "Payment Button", divisionId: "commerce", title: "1-Click Instant Checkout", description: "Instant secure checkout button with badges", icon: "🛡️", badge: "Pay" },
  { id: "sec_comm_5", type: "Shop", divisionId: "commerce", title: "Store Product Catalog", description: "Responsive e-commerce grid with currency selector", icon: "🛒", badge: "Store" },
  { id: "sec_comm_6", type: "Flash Offer", divisionId: "commerce", title: "Flash Sale Countdown", description: "Urgency timer with 1-tap coupon copy code", icon: "⚡", badge: "Sale" },

  // 7. Leads & Forms (6)
  { id: "sec_lead_1", type: "Multi-Step Form", divisionId: "forms", title: "3-Step Lead Funnel", description: "Interactive qualification wizard with progress", icon: "📝", badge: "Wizard" },
  { id: "sec_lead_2", type: "Lead Magnet", divisionId: "forms", title: "E-Book / PDF Opt-in", description: "Free download opt-in with instant file capture", icon: "📥", badge: "Download" },
  { id: "sec_lead_3", type: "Meeting Booker", divisionId: "forms", title: "1-on-1 Meeting Booker", description: "Appointment calendar with booking time slots", icon: "📅", badge: "Booker" },
  { id: "sec_lead_4", type: "Google Form", divisionId: "forms", title: "Google Form Embed", description: "Responsive questionnaire with fallback form", icon: "📋", badge: "Form" },
  { id: "sec_lead_5", type: "Newsletter Box", divisionId: "forms", title: "Email Newsletter Box", description: "Single-line newsletter signup with spam notice", icon: "✉️", badge: "Newsletter" },
  { id: "sec_lead_6", type: "Link Spin", divisionId: "forms", title: "Prize Lucky Wheel", description: "Interactive gamified wheel with discount rewards", icon: "🎡", badge: "Spinner" },

  // 8. Social Proof & Trust (6)
  { id: "sec_sp_1", type: "Brand Logos", divisionId: "socialproof", title: "Partner Logo Marquee", description: "Infinite scrolling client brand logos strip", icon: "🏢", badge: "Brands" },
  { id: "sec_sp_2", type: "Star Ratings", divisionId: "socialproof", title: "5-Star Review Trust Card", description: "Trust card with customer avatars & 5 stars", icon: "⭐", badge: "Ratings" },
  { id: "sec_sp_3", type: "Testimonials", divisionId: "socialproof", title: "Customer Quotes Slider", description: "Client quote cards with avatar and company", icon: "💬", badge: "Quotes" },
  { id: "sec_sp_4", type: "Press Mentions", divisionId: "socialproof", title: "Featured In Media Quotes", description: "Media publication quotes: Forbes & TechCrunch", icon: "📰", badge: "Press" },
  { id: "sec_sp_5", type: "Testimonials", divisionId: "socialproof", title: "Verified Review Wall", description: "Trustpilot-style review cards with verified badges", icon: "✅", badge: "Reviews" },
  { id: "sec_sp_6", type: "Pricing", divisionId: "socialproof", title: "Trust & Guarantee Badges", description: "SSL, Money-back & ISO certification shield row", icon: "🔒", badge: "Guarantees" },

  // 9. Community & Social (6)
  { id: "sec_com_1", type: "Community Hub", divisionId: "community", title: "VIP Community Group", description: "Discord / WhatsApp / Telegram live member badge", icon: "👥", badge: "Community" },
  { id: "sec_com_2", type: "YouTube Channel", divisionId: "community", title: "YouTube Channel Stream", description: "Subscriber counter, video player & subscribe CTA", icon: "🔴", badge: "YouTube" },
  { id: "sec_com_3", type: "Instagram Feed", divisionId: "community", title: "Aesthetic Instagram Grid", description: "4-photo grid with hover likes/comments overlay", icon: "📷", badge: "Instagram" },
  { id: "sec_com_4", type: "Socials", divisionId: "community", title: "Social Links Dock", description: "Brand icon bar with all major social links", icon: "🌐", badge: "Socials" },
  { id: "sec_com_5", type: "Music", divisionId: "community", title: "Audio Soundtrack Stream", description: "Music track player with album art & play button", icon: "🎵", badge: "Music" },
  { id: "sec_com_6", type: "vCard", divisionId: "community", title: "Digital vCard Download", description: "1-click phone address book .vcf download card", icon: "👤", badge: "vCard" },

  // 10. Footers & Closing (6)
  { id: "sec_foot_1", type: "Footer", divisionId: "footers", title: "Multi-Column SaaS Footer", description: "Brand, 3 link columns, newsletter & copyright", icon: "🔻", badge: "SaaS Footer" },
  { id: "sec_foot_2", type: "Footer", divisionId: "footers", title: "Minimal Brand Footer", description: "Clean brand logo, copyright & privacy links", icon: "🌿", badge: "Minimal" },
  { id: "sec_foot_3", type: "Split Hero", divisionId: "footers", title: "Closing CTA Banner", description: "High-impact closing banner with action button", icon: "🎯", badge: "CTA Banner" },
  { id: "sec_foot_4", type: "Footer", divisionId: "footers", title: "Legal & Policies Footer", description: "Terms, Privacy, Refund policy & safe badge", icon: "⚖️", badge: "Legal" },
  { id: "sec_foot_5", type: "Footer", divisionId: "footers", title: "Newsletter Subscribe Footer", description: "Full-width dark footer with email capture", icon: "📬", badge: "Subscribe" },
  { id: "sec_foot_6", type: "Footer", divisionId: "footers", title: "Mobile Bottom App Dock", description: "Fixed mobile footer with Home, Order & Chat", icon: "📱", badge: "App Dock" }
];

export function getSemanticAnchorForBlock(block: { type?: string; label?: string; customAnchor?: string; id?: string }): string | undefined {
  if (block.customAnchor) return block.customAnchor.replace(/^#/, "");
  const type = (block.type || "").toLowerCase();
  const label = (block.label || "").toLowerCase();

  if (type.includes("navbar") || type.includes("navigation")) return "navbar";
  if (type.includes("feature") || label.includes("feature") || type.includes("bento")) return "features";
  if (type.includes("pricing") || type.includes("store") || type.includes("shop") || label.includes("pricing")) return "pricing";
  if (type.includes("rating") || type.includes("testimonial") || type.includes("review") || type.includes("brand logos") || type.includes("press")) return "reviews";
  if (type.includes("contact") || type.includes("whatsapp") || type.includes("meeting") || type.includes("lead form") || type.includes("multi-step")) return "contact";
  if (type.includes("hero")) return "hero";
  if (type.includes("faq")) return "faq";
  if (type.includes("gallery") || type.includes("slider") || type.includes("portfolio")) return "gallery";
  if (type.includes("footer")) return "footer";
  if (type.includes("community") || type.includes("social")) return "community";

  return undefined;
}

export function resolveDestination(
  url: string,
  label: string,
  handlers?: { onToast?: (msg: string) => void; onExternalLink?: (url: string, label?: string) => void },
  mode?: string
) {
  if (!url || url === "#") {
    handlers?.onToast?.(`Link: ${label}`);
    return;
  }
  const trimmed = url.trim();
  if (trimmed.startsWith("#")) {
    const slug = trimmed.slice(1).toLowerCase().trim();
    let elem = document.getElementById(slug) ||
               document.getElementById(`block-${slug}`) ||
               document.querySelector(`[data-block-id="${slug}"]`) ||
               document.querySelector(`[data-block-anchor="${slug}"]`) ||
               document.querySelector(`[data-block-type*="${slug}" i]`) ||
               document.querySelector(`[data-block-label*="${slug}" i]`);

    if (!elem) {
      const aliasMap: Record<string, string[]> = {
        features: ["main feature", "feature", "feature hero", "split hero", "bento"],
        pricing: ["toggle pricing", "pricing", "store", "shop", "comparison table"],
        reviews: ["star ratings", "testimonials", "social proof", "brand logos", "press mentions"],
        contact: ["contact form", "whatsapp", "meeting booker", "multi-step form", "lead form"],
        about: ["header", "hero", "split hero", "stats"],
        faq: ["faq", "accordion"],
        community: ["community hub", "youtube", "instagram", "socials"],
        footer: ["footer"],
        gallery: ["gallery", "portfolio gallery", "auto slider"],
        hero: ["split hero", "video hero", "header", "hero"]
      };
      const candidates = aliasMap[slug] || [];
      for (const cand of candidates) {
        elem = document.querySelector(`[data-block-type*="${cand}" i]`) ||
               document.querySelector(`[data-block-label*="${cand}" i]`);
        if (elem) break;
      }
    }

    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
      handlers?.onToast?.(`Navigating to ${label}...`);
      return;
    }
    handlers?.onToast?.(`Section "${label}" (${trimmed})`);
    return;
  }

  // External link
  if (handlers?.onExternalLink) {
    handlers.onExternalLink(trimmed, label);
  } else {
    try {
      window.open(trimmed, "_blank", "noopener,noreferrer");
    } catch {
      handlers?.onToast?.(`Opening: ${trimmed}`);
    }
  }
}



