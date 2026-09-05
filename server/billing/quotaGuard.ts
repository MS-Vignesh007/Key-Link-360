import { getUserSubscriptionSummary, ResourceUsage } from "./repository";

export type QuotaResourceKey = keyof ResourceUsage;

export interface QuotaCheckResult {
  allowed: boolean;
  resource: QuotaResourceKey;
  used: number;
  limit: number;
  plan: string;
  upgradeAvailable: boolean;
  error?: string;
}

const RESOURCE_LABELS: Record<QuotaResourceKey, string> = {
  pages: "Bio Pages",
  customDomains: "Custom Domains",
  qrCodes: "Smart QR Codes",
  shortLinks: "Short Links",
  rotators: "Link Rotators"
};

export function checkResourceQuota(
  userId: string,
  resource: QuotaResourceKey,
  increment = 1
): QuotaCheckResult {
  const summary = getUserSubscriptionSummary(userId);
  const used = summary.usage[resource] || 0;
  const limit = summary.limits[resource] || 0;
  const planName = summary.plan.name;
  const upgradeAvailable = summary.subscription.planId === "FREE";

  if (used + increment > limit) {
    const label = RESOURCE_LABELS[resource] || resource;
    return {
      allowed: false,
      resource,
      used,
      limit,
      plan: planName,
      upgradeAvailable,
      error: `Resource quota exceeded. You have reached your limit of ${limit} ${label} on the ${planName}. Please upgrade your plan for higher limits.`
    };
  }

  return {
    allowed: true,
    resource,
    used,
    limit,
    plan: planName,
    upgradeAvailable
  };
}
