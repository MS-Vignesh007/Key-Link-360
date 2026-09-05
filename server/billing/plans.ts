export type PlanId = "FREE" | "PRO";

export interface PlanLimits {
  pages: number;
  customDomains: number;
  qrCodes: number;
  shortLinks: number;
  rotators: number;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  badge: string;
  description: string;
  priceMonthlyInr: number;
  priceYearlyInr: number;
  strikethroughMonthlyInr?: number;
  strikethroughYearlyInr?: number;
  limits: PlanLimits;
  features: string[];
  isPopular?: boolean;
}

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  FREE: {
    id: "FREE",
    name: "Free Plan",
    badge: "STARTER",
    description: "Ideal for individual creators and personal branding.",
    priceMonthlyInr: 0,
    priceYearlyInr: 0,
    limits: {
      pages: 3,
      customDomains: 1,
      qrCodes: 5,
      shortLinks: 10,
      rotators: 2
    },
    features: [
      "Up to 3 Bio Pages",
      "1 Custom Domain / Platform Subdomain",
      "5 Dynamic Smart QR Codes",
      "10 Branded Short Links",
      "2 Weighted Link Rotators",
      "Basic Click & Visit Analytics",
      "Lead Capture Contact Forms"
    ]
  },
  PRO: {
    id: "PRO",
    name: "Pro Business",
    badge: "RECOMMENDED",
    description: "For agencies, businesses, and power marketers scaling traffic.",
    priceMonthlyInr: 199,
    priceYearlyInr: 999,
    strikethroughMonthlyInr: 499,
    strikethroughYearlyInr: 1999,
    isPopular: true,
    limits: {
      pages: 50,
      customDomains: 10,
      qrCodes: 100,
      shortLinks: 500,
      rotators: 50
    },
    features: [
      "Up to 50 Bio Pages",
      "10 Custom Domains with Auto-SSL",
      "100 Dynamic Smart QR Codes with Custom Logos",
      "500 Branded Short Links & Retargeting",
      "50 Weighted A/B Link Rotators",
      "Full CRM Lead Export & Webhooks",
      "Priority Edge Delivery & Zero Latency",
      "Dedicated Support"
    ]
  }
};

export function normalizePlanId(planInput?: string | null): PlanId {
  if (!planInput) return "FREE";
  const clean = planInput.trim().toUpperCase();
  if (clean === "PRO" || clean === "PRO BUSINESS" || clean === "PRO_BUSINESS" || clean.includes("PRO")) {
    return "PRO";
  }
  return "FREE";
}

export function getPlanDefinition(planInput?: string | null): PlanDefinition {
  const planId = normalizePlanId(planInput);
  return PLAN_DEFINITIONS[planId] || PLAN_DEFINITIONS.FREE;
}

export function getPlanLimits(planInput?: string | null): PlanLimits {
  return getPlanDefinition(planInput).limits;
}
