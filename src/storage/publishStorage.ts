import { PublishSettings } from "../types";

const STORAGE_KEY = "keylink360_publish_settings";
export const PRIMARY_DOMAIN = "keylink360.mindflo.today";
export const DEFAULT_DNS_TARGET = "cname.vercel-dns.com";

function defaultSettings(): PublishSettings {
  return {
    primaryUrl: `https://${PRIMARY_DOMAIN}`,
    customDomains: [
      {
        id: "domain_primary",
        hostname: PRIMARY_DOMAIN,
        status: "verified",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    visibility: "public",
    selectedMemberIds: [],
    updatedAt: new Date().toISOString()
  };
}

export function getPublishSettings(): PublishSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("keyslink_publish_settings");
    if (!raw) return defaultSettings();

    const saved = JSON.parse(raw) as Partial<PublishSettings>;
    const defaults = defaultSettings();
    const domains = Array.isArray(saved.customDomains) ? saved.customDomains : defaults.customDomains;

    if (!domains.some((domain) => domain.hostname === PRIMARY_DOMAIN)) {
      domains.unshift(defaults.customDomains[0]);
    }

    return {
      primaryUrl: saved.primaryUrl || defaults.primaryUrl,
      customDomains: domains,
      visibility: saved.visibility || "public",
      selectedMemberIds: saved.selectedMemberIds || [],
      publishedAt: saved.publishedAt,
      updatedAt: saved.updatedAt || defaults.updatedAt
    };
  } catch {
    return defaultSettings();
  }
}

export function persistPublishSettings(settings: PublishSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Unable to save publish settings:", error);
  }
}

export function normaliseHostname(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

export function isValidHostname(hostname: string): boolean {
  return /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(
    hostname
  );
}
