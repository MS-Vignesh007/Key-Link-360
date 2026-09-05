import { getRootStore, setRootStore, flushRootStore } from "../db/rootStore";
import { readAuthStore, writeAuthStore, findUserById } from "../auth/store";
import { getPlanDefinition, getPlanLimits, normalizePlanId, PlanId, PlanLimits } from "./plans";

export type SubscriptionStatus = "FREE" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
export type BillingInterval = "monthly" | "yearly";

export interface SubscriptionRecord {
  userId: string;
  planId: PlanId;
  planName: string;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  amountInr: number;
  provider: "razorpay" | "manual";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySubscriptionId?: string;
  startDate: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BillingHistoryRecord {
  id: string;
  userId: string;
  planId: PlanId;
  planName: string;
  billingInterval: BillingInterval;
  amountInr: number;
  currency: "INR";
  status: "paid" | "failed" | "refunded";
  providerPaymentId: string;
  providerOrderId: string;
  createdAt: string;
}

export interface ResourceUsage {
  pages: number;
  customDomains: number;
  qrCodes: number;
  shortLinks: number;
  rotators: number;
}

export interface UserSubscriptionSummary {
  subscription: SubscriptionRecord;
  plan: ReturnType<typeof getPlanDefinition>;
  usage: ResourceUsage;
  limits: PlanLimits;
  history: BillingHistoryRecord[];
}

function defaultFreeSubscription(userId: string): SubscriptionRecord {
  const now = new Date().toISOString();
  // 100 years out for free plan
  const farFuture = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();
  return {
    userId,
    planId: "FREE",
    planName: "Free Plan",
    status: "FREE",
    billingInterval: "monthly",
    amountInr: 0,
    provider: "manual",
    startDate: now,
    currentPeriodEnd: farFuture,
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now
  };
}

export function getUserSubscription(userId: string): SubscriptionRecord {
  const store = getRootStore();
  const subs = (store["subscriptions"] || {}) as Record<string, SubscriptionRecord>;
  let sub = subs[userId];

  // If no subscription record, check auth user's plan
  if (!sub) {
    const authStore = readAuthStore();
    const user = findUserById(authStore, userId);
    const planId = normalizePlanId(user?.plan);
    const planDef = getPlanDefinition(planId);

    sub = {
      ...defaultFreeSubscription(userId),
      planId,
      planName: planDef.name,
      status: planId === "PRO" ? "ACTIVE" : "FREE"
    };
    subs[userId] = sub;
    store["subscriptions"] = subs;
    setRootStore(store);
    void flushRootStore();
  }

  // Check if subscription has expired
  if (sub.status === "ACTIVE" && sub.currentPeriodEnd) {
    const expiresAt = new Date(sub.currentPeriodEnd).getTime();
    if (expiresAt < Date.now()) {
      sub.status = "EXPIRED";
      sub.planId = "FREE";
      sub.planName = "Free Plan";
      sub.updatedAt = new Date().toISOString();
      subs[userId] = sub;
      store["subscriptions"] = subs;
      setRootStore(store);
      void flushRootStore();

      // Sync auth store
      const authStore = readAuthStore();
      const user = findUserById(authStore, userId);
      if (user) {
        user.plan = "Free Plan";
        user.updatedAt = new Date().toISOString();
        writeAuthStore(authStore);
      }
    }
  }

  return sub;
}

export function upsertUserSubscription(sub: SubscriptionRecord): SubscriptionRecord {
  const store = getRootStore();
  const subs = (store["subscriptions"] || {}) as Record<string, SubscriptionRecord>;
  const updated: SubscriptionRecord = {
    ...sub,
    updatedAt: new Date().toISOString()
  };
  subs[sub.userId] = updated;
  store["subscriptions"] = subs;
  setRootStore(store);
  void flushRootStore();

  // Sync auth store user plan
  const authStore = readAuthStore();
  const user = findUserById(authStore, sub.userId);
  if (user) {
    user.plan = updated.planName;
    user.updatedAt = new Date().toISOString();
    writeAuthStore(authStore);
  }

  return updated;
}

export function getUserResourceUsage(userId: string): ResourceUsage {
  const store = getRootStore();

  const pages = (Array.isArray(store["pages_list"]) ? store["pages_list"] : []) as any[];
  const userPages = pages.filter((p) => p.ownerUserId === userId);

  const domains = (Array.isArray(store["custom_domains"]) ? store["custom_domains"] : []) as any[];
  const userDomains = domains.filter((d) => d.ownerUserId === userId);

  const qrCodes = (Array.isArray(store["qr_codes"]) ? store["qr_codes"] : []) as any[];
  const userQrCodes = qrCodes.filter((q) => q.ownerUserId === userId);

  const shortLinks = (Array.isArray(store["short_links"]) ? store["short_links"] : []) as any[];
  const userShortLinks = shortLinks.filter((l) => l.ownerUserId === userId);

  const rotators = (Array.isArray(store["link_rotators"]) ? store["link_rotators"] : []) as any[];
  const userRotators = rotators.filter((r) => r.ownerUserId === userId);

  return {
    pages: userPages.length,
    customDomains: userDomains.length,
    qrCodes: userQrCodes.length,
    shortLinks: userShortLinks.length,
    rotators: userRotators.length
  };
}

export function recordBillingPayment(entry: BillingHistoryRecord): BillingHistoryRecord {
  const store = getRootStore();
  const history = (Array.isArray(store["billing_history"]) ? store["billing_history"] : []) as BillingHistoryRecord[];
  
  // Idempotent check: prevent duplicate billing records
  const existingIdx = history.findIndex((h) => h.providerOrderId === entry.providerOrderId || (entry.providerPaymentId && h.providerPaymentId === entry.providerPaymentId));
  if (existingIdx >= 0) {
    history[existingIdx] = { ...history[existingIdx], ...entry };
  } else {
    history.unshift(entry);
  }

  store["billing_history"] = history;
  setRootStore(store);
  void flushRootStore();
  return entry;
}

export function listBillingHistory(userId: string): BillingHistoryRecord[] {
  const store = getRootStore();
  const history = (Array.isArray(store["billing_history"]) ? store["billing_history"] : []) as BillingHistoryRecord[];
  return history.filter((h) => h.userId === userId);
}

export function listAllSubscriptions(): SubscriptionRecord[] {
  const store = getRootStore();
  const subs = (store["subscriptions"] || {}) as Record<string, SubscriptionRecord>;
  return Object.values(subs);
}

export function listAllBillingHistory(): BillingHistoryRecord[] {
  const store = getRootStore();
  return (Array.isArray(store["billing_history"]) ? store["billing_history"] : []) as BillingHistoryRecord[];
}

export function getUserSubscriptionSummary(userId: string): UserSubscriptionSummary {
  const subscription = getUserSubscription(userId);
  const plan = getPlanDefinition(subscription.planId);
  const usage = getUserResourceUsage(userId);
  const limits = getPlanLimits(subscription.planId);
  const history = listBillingHistory(userId);

  return {
    subscription,
    plan,
    usage,
    limits,
    history
  };
}
