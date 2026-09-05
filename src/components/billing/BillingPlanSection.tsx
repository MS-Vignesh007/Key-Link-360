import React, { useEffect, useState } from "react";
import {
  CreditCard,
  CheckCircle,
  Zap,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  Receipt,
  FileText
} from "lucide-react";
import { getAccessToken } from "../../lib/authApi";

interface ResourceUsage {
  pages: number;
  customDomains: number;
  qrCodes: number;
  shortLinks: number;
  rotators: number;
}

interface PlanLimits {
  pages: number;
  customDomains: number;
  qrCodes: number;
  shortLinks: number;
  rotators: number;
}

interface SubscriptionRecord {
  userId: string;
  planId: string;
  planName: string;
  status: "FREE" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
  billingInterval: "monthly" | "yearly";
  amountInr: number;
  provider: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface BillingHistoryRecord {
  id: string;
  planName: string;
  billingInterval: string;
  amountInr: number;
  currency: string;
  status: string;
  providerPaymentId: string;
  providerOrderId: string;
  createdAt: string;
}

interface SubscriptionSummary {
  subscription: SubscriptionRecord;
  usage: ResourceUsage;
  limits: PlanLimits;
  history: BillingHistoryRecord[];
  gatewayConfigured: boolean;
  razorpayKeyId: string | null;
}

export default function BillingPlanSection() {
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/billing/subscription", { headers });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (e) {
      console.error("Failed to load subscription:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, []);

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      setFeedback(null);
      const token = getAccessToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Step 1: Create checkout order
      const checkoutRes = await fetch("/api/billing/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({ planId: "PRO", interval })
      });

      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        throw new Error(checkoutData.error || "Failed to initialize payment.");
      }

      // Step 2: In browser with Razorpay script or simulated verified checkout
      // Check if window.Razorpay exists
      if (typeof (window as any).Razorpay !== "undefined" && checkoutData.keyId) {
        const options = {
          key: checkoutData.keyId,
          amount: checkoutData.amount,
          currency: checkoutData.currency,
          name: "KEYLINK360",
          description: `Upgrade to ${checkoutData.planName} (${checkoutData.interval})`,
          order_id: checkoutData.orderId,
          handler: async function (response: any) {
            // Step 3: Verify signature server-side
            const verifyRes = await fetch("/api/billing/verify", {
              method: "POST",
              headers,
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planId: "PRO",
                interval
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              setFeedback({ type: "success", text: verifyData.message || "Account upgraded to Pro Business!" });
              setShowUpgradeModal(false);
              loadSubscription();
            } else {
              setFeedback({ type: "error", text: verifyData.error || "Payment signature verification failed." });
            }
          },
          theme: { color: "#6366F1" }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        setFeedback({
          type: "error",
          text: "Razorpay script is not ready or live keys are not configured. Configure Razorpay keys in server environment."
        });
      }
    } catch (e: any) {
      setFeedback({ type: "error", text: e.message || "Upgrade failed." });
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel auto-renewal? You will keep Pro features until the end of your billing cycle.")) {
      return;
    }
    try {
      setCancelling(true);
      const token = getAccessToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/billing/cancel", { method: "POST", headers });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", text: data.message });
        loadSubscription();
      } else {
        setFeedback({ type: "error", text: data.error || "Failed to cancel renewal." });
      }
    } catch (e: any) {
      setFeedback({ type: "error", text: e.message || "Cancel failed." });
    } finally {
      setCancelling(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="key-section-card p-6 flex items-center justify-center">
        <RefreshCw className="h-5 w-5 animate-spin text-indigo-500 mr-2" />
        <span className="text-sm text-slate-400">Loading plan and quotas...</span>
      </div>
    );
  }

  const isPro = summary?.subscription.planId === "PRO";
  const sub = summary?.subscription;
  const usage = summary?.usage || { pages: 0, customDomains: 0, qrCodes: 0, shortLinks: 0, rotators: 0 };
  const limits = summary?.limits || { pages: 3, customDomains: 1, qrCodes: 5, shortLinks: 10, rotators: 2 };

  const resources = [
    { key: "pages", label: "Bio Pages", used: usage.pages, limit: limits.pages },
    { key: "customDomains", label: "Custom Domains", used: usage.customDomains, limit: limits.customDomains },
    { key: "qrCodes", label: "Smart QR Codes", used: usage.qrCodes, limit: limits.qrCodes },
    { key: "shortLinks", label: "Branded Short Links", used: usage.shortLinks, limit: limits.shortLinks },
    { key: "rotators", label: "Link Rotators", used: usage.rotators, limit: limits.rotators }
  ];

  return (
    <div className="space-y-6">
      {/* Current Plan Overview Card */}
      <div className="key-section-card p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-400" />
              <h3 className="font-display font-bold text-base text-slate-900">Subscription & Resource Quotas</h3>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Real-time resource utilization enforced across your KEYLINK360 assets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isPro
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {sub?.planName || "Free Plan"}
            </span>

            {!isPro ? (
              <button
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold hover:from-indigo-500 hover:to-violet-500 shadow-md flex items-center gap-1.5 transition-all"
              >
                <Zap className="h-3.5 w-3.5" />
                Upgrade to Pro
              </button>
            ) : sub?.cancelAtPeriodEnd ? (
              <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Cancels at period end
              </span>
            ) : (
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="text-xs text-slate-400 hover:text-red-500 underline transition-colors"
              >
                {cancelling ? "Processing..." : "Cancel auto-renewal"}
              </button>
            )}
          </div>
        </div>

        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Quota Progress Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          {resources.map((res) => {
            const pct = Math.min(100, Math.round((res.used / res.limit) * 100));
            const isFull = res.used >= res.limit;
            return (
              <div
                key={res.key}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{res.label}</span>
                  <span className={`font-mono font-bold ${isFull ? "text-red-600" : "text-slate-900"}`}>
                    {res.used} / {res.limit}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all rounded-full ${
                      isFull ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-indigo-600"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{pct}% utilized</span>
                  {isFull && <span className="text-red-500 font-bold">Limit reached</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 relative">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full mb-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  PRO BUSINESS PLAN
                </div>
                <h3 className="font-display font-bold text-2xl text-slate-900">Unlock Full Platform Power</h3>
                <p className="text-sm text-slate-500 mt-1">Scale your bio links, QR campaigns, and custom domains.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Interval Toggle */}
            <div className="flex items-center justify-center p-1 bg-slate-100 rounded-2xl max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => setInterval("monthly")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  interval === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                Monthly (₹199)
              </button>
              <button
                type="button"
                onClick={() => setInterval("yearly")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all relative ${
                  interval === "yearly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                Yearly (₹999)
                <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow">
                  SAVE 58%
                </span>
              </button>
            </div>

            {/* Price Box */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold">Total Due Today</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-display font-black text-indigo-900">
                    ₹{interval === "yearly" ? "999" : "199"}
                  </span>
                  <span className="text-sm text-slate-400 line-through">
                    ₹{interval === "yearly" ? "1,999" : "499"}
                  </span>
                  <span className="text-xs text-slate-500">/ {interval}</span>
                </div>
              </div>
              <ShieldCheck className="h-8 w-8 text-indigo-500 opacity-75" />
            </div>

            {/* Features list */}
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                <span><strong>50 Bio Pages</strong> (vs 3 on Free)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                <span><strong>10 Custom Domains</strong> with Automatic SSL</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                <span><strong>100 Smart QR Codes</strong> with high-res logos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                <span><strong>500 Short Links</strong> with Retargeting Pixels</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                <span><strong>50 Weighted Link Rotators</strong> for A/B testing</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleUpgrade}
              disabled={upgrading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-xl hover:from-indigo-500 hover:to-violet-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {upgrading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Initializing Razorpay...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Proceed to Secure Checkout
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Invoices / Billing History */}
      {summary && summary.history && summary.history.length > 0 && (
        <div className="key-section-card p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-indigo-400" />
            <h3 className="font-display font-bold text-base text-slate-900">Billing History & Invoices</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Interval</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Payment ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {summary.history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3 font-semibold">{item.planName}</td>
                    <td className="py-2.5 px-3 capitalize">{item.billingInterval}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">₹{item.amountInr}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle className="h-3 w-3" />
                        Paid
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{item.providerPaymentId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
