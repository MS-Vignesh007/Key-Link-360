import { ScreenId } from "./types";
import {
  LayoutDashboard,
  Smartphone,
  Users,
  MessageCircle,
  Link2,
  Shuffle,
  QrCode,
  FileText,
  Puzzle,
  Activity,
  Image as ImageIcon,
  Globe,
  Settings,
  HelpCircle,
  Headphones,
  ShieldAlert,
  LucideIcon
} from "lucide-react";

export interface NavItem {
  id: ScreenId;
  label: string;
  icon: LucideIcon;
  pro?: boolean;
}

export const ADMIN_NAV_ITEM: NavItem = {
  id: ScreenId.SUPER_ADMIN,
  label: "Control Center",
  icon: ShieldAlert
};

export interface NavCategory {
  title: string;
  items: NavItem[];
}

export const NAV_CATEGORIES: NavCategory[] = [
  {
    title: "Smart Marketing",
    items: [
      { id: ScreenId.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
      { id: ScreenId.BIO_PAGES, label: "Bio Pages", icon: Smartphone },
      { id: ScreenId.CONTACTS, label: "Contacts", icon: Users },
      { id: ScreenId.WHATSAPP, label: "WhatsApp", icon: MessageCircle },
      { id: ScreenId.LINKS, label: "Links", icon: Link2 },
      { id: ScreenId.LINK_ROTATOR, label: "Link Rotator", icon: Shuffle },
      { id: ScreenId.QR_CODES, label: "QR Codes", icon: QrCode },
      { id: ScreenId.TEMPLATES, label: "Templates", icon: FileText },
      { id: ScreenId.INTEGRATIONS, label: "Integrations", icon: Puzzle }
    ]
  },
  {
    title: "Tools & Settings",
    items: [
      { id: ScreenId.PIXELS, label: "Pixels", icon: Activity },
      { id: ScreenId.MEDIA_LIBRARY, label: "Media Library", icon: ImageIcon },
      { id: ScreenId.CUSTOM_DOMAINS, label: "Custom Domains", icon: Globe },
      { id: ScreenId.SETTINGS, label: "Settings", icon: Settings }
    ]
  }
];

const SCREEN_TITLES: Partial<Record<ScreenId, string>> = {
  [ScreenId.HOME]: "KeyLink360 — 1 Intelligent Link, Infinite Connections",
  [ScreenId.DASHBOARD]: "Dashboard",
  [ScreenId.BIO_PAGES]: "Bio Pages",
  [ScreenId.CONTACTS]: "Contacts",
  [ScreenId.WHATSAPP]: "WhatsApp",
  [ScreenId.LINKS]: "Links",
  [ScreenId.LINK_ROTATOR]: "Link Rotator",
  [ScreenId.QR_CODES]: "QR Codes",
  [ScreenId.TEMPLATES]: "Templates",
  [ScreenId.INTEGRATIONS]: "Integrations",
  [ScreenId.PIXELS]: "Pixels",
  [ScreenId.MEDIA_LIBRARY]: "Media Library",
  [ScreenId.CUSTOM_DOMAINS]: "Custom Domains",
  [ScreenId.SETTINGS]: "Settings",
  [ScreenId.HELP_CENTER]: "Help Center",
  [ScreenId.CONTACT_SUPPORT]: "Contact Support",
  [ScreenId.ACCOUNT]: "Account",
  [ScreenId.SUPER_ADMIN]: "Control Center"
};

export const APP_BRAND_NAME = "KeyLink360";

export function getScreenTitle(screen: ScreenId): string {
  return SCREEN_TITLES[screen] ?? APP_BRAND_NAME;
}

export function formatDocumentTitle(pageTitle?: string | null): string {
  const clean = pageTitle?.trim();
  if (
    !clean ||
    clean.toLowerCase() === "keylink360" ||
    clean.toLowerCase() === "keylink 360" ||
    clean.toLowerCase() === "keylink-360"
  ) {
    return APP_BRAND_NAME;
  }
  return `${clean} · ${APP_BRAND_NAME}`;
}

/** URL path for each app screen (React Router). */
export const SCREEN_PATHS: Record<ScreenId, string> = {
  [ScreenId.HOME]: "/",
  [ScreenId.LOGIN]: "/login",
  [ScreenId.DASHBOARD]: "/dashboard",
  [ScreenId.BIO_PAGES]: "/bio-pages",
  [ScreenId.CONTACTS]: "/contacts",
  [ScreenId.WHATSAPP]: "/whatsapp",
  [ScreenId.LINKS]: "/links",
  [ScreenId.LINK_ROTATOR]: "/link-rotator",
  [ScreenId.QR_CODES]: "/qr-codes",
  [ScreenId.TEMPLATES]: "/templates",
  [ScreenId.INTEGRATIONS]: "/integrations",
  [ScreenId.PIXELS]: "/pixels",
  [ScreenId.MEDIA_LIBRARY]: "/media-library",
  [ScreenId.CUSTOM_DOMAINS]: "/custom-domains",
  [ScreenId.SETTINGS]: "/settings",
  [ScreenId.HELP_CENTER]: "/help-center",
  [ScreenId.CONTACT_SUPPORT]: "/contact-support",
  [ScreenId.ACCOUNT]: "/account",
  [ScreenId.SUPER_ADMIN]: "/admin"
};

/** Authenticated app routes (excludes login and public landing). */
export const APP_ROUTE_ENTRIES = (
  Object.entries(SCREEN_PATHS) as Array<[ScreenId, string]>
).filter(([screen]) => screen !== ScreenId.LOGIN && screen !== ScreenId.HOME);

export function screenToPath(screen: ScreenId): string {
  return SCREEN_PATHS[screen] ?? "/dashboard";
}

export function pathToScreen(pathname: string): ScreenId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/" || normalized === "/home") return ScreenId.HOME;

  for (const [screen, routePath] of Object.entries(SCREEN_PATHS) as Array<[ScreenId, string]>) {
    if (routePath === normalized) return screen;
  }

  return null;
}

export function isAppPath(pathname: string): boolean {
  const screen = pathToScreen(pathname);
  return screen !== null && screen !== ScreenId.LOGIN && screen !== ScreenId.HOME;
}
