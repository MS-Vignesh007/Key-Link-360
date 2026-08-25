import type { CustomDomain, PublishSettings } from "../types";
import { getPublishSettings, persistPublishSettings } from "../storage/publishStorage";

/** When a custom domain is Verified, mirror it as the publish primary URL. */
export function syncPublishPrimaryUrlForVerifiedDomain(domain: CustomDomain): PublishSettings | null {
  if (domain.status !== "Verified") return null;

  const settings = getPublishSettings();
  const customUrl = `https://${domain.domainName}`;
  if (settings.primaryUrl === customUrl) return null;

  const now = new Date().toISOString();
  const customDomains = [...settings.customDomains];
  const existing = customDomains.find((item) => item.hostname === domain.domainName);
  if (existing) {
    existing.status = "verified";
    existing.updatedAt = now;
  } else {
    customDomains.push({
      id: domain.id,
      hostname: domain.domainName,
      status: "verified",
      createdAt: domain.createdAt,
      updatedAt: now
    });
  }

  const next: PublishSettings = {
    ...settings,
    primaryUrl: customUrl,
    customDomains,
    updatedAt: now
  };
  persistPublishSettings(next);
  return next;
}
