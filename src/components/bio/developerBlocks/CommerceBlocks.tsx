import React, { useState } from "react";
import { Check, CheckCircle2, X, Star, ShoppingBag, ShieldCheck, ArrowRight, Zap } from "lucide-react";
import type { BlockRecord } from "../../../lib/bioBlocks";
import { resolveDestination } from "../../../lib/bioBlocks";
import type { BlockRendererContext, BlockRendererHandlers, BlockRenderMode } from "../blockTypes";

interface DeveloperBlockProps {
  block: BlockRecord;
  mode: BlockRenderMode;
  context: BlockRendererContext;
  handlers: BlockRendererHandlers;
}

/**
 * 5. Toggle Pricing Table:
 * Monthly / Annual toggle switch with savings badge, recommended highlight, and feature checklists.
 */
export function TogglePricingBlockView({ block, mode, handlers }: DeveloperBlockProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const discountBadge = (block.discountBadge as string) || "Save 20% Yearly";

  const monthlyPlans = Array.isArray(block.monthlyPlans)
    ? (block.monthlyPlans as any[])
    : [
        {
          id: "m1",
          name: "Starter",
          price: "₹499",
          period: "/mo",
          description: "Best for individual creators and solopreneurs.",
          features: ["1 Custom Domain", "Unlimited Bio Links", "Standard Analytics", "Mobile Optimized"],
          url: "https://keylink360.in",
          highlighted: false
        },
        {
          id: "m2",
          name: "Pro Agency",
          price: "₹1,499",
          period: "/mo",
          description: "Ideal for growing businesses and agencies.",
          features: ["5 Custom Domains", "AI Sales Bot", "Multi-Device Responsive", "Priority 24/7 Support", "Zero KeyLink Branding"],
          url: "https://keylink360.in",
          highlighted: true
        }
      ];

  const annualPlans = Array.isArray(block.annualPlans)
    ? (block.annualPlans as any[])
    : [
        {
          id: "y1",
          name: "Starter",
          price: "₹399",
          period: "/mo (billed annually)",
          description: "Best for individual creators and solopreneurs.",
          features: ["1 Custom Domain", "Unlimited Bio Links", "Standard Analytics", "Mobile Optimized"],
          url: "https://keylink360.in",
          highlighted: false
        },
        {
          id: "y2",
          name: "Pro Agency",
          price: "₹1,199",
          period: "/mo (billed annually)",
          description: "Ideal for growing businesses and agencies.",
          features: ["5 Custom Domains", "AI Sales Bot", "Multi-Device Responsive", "Priority 24/7 Support", "Zero KeyLink Branding"],
          url: "https://keylink360.in",
          highlighted: true
        }
      ];

  const currentPlans = billingCycle === "monthly" ? monthlyPlans : annualPlans;

  const handlePlanClick = (plan: any) => {
    resolveDestination(plan.url, plan.name, handlers, mode);
  };

  return (
    <div className="w-full bg-slate-900 text-white rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-xl space-y-6">
      <div className="text-center space-y-3">
        <h3 className="font-display font-black text-xl sm:text-2xl text-white">
          Simple, Transparent Pricing
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Choose the plan that fits your ambition. Switch or cancel anytime.
        </p>

        {/* Toggle Switch */}
        <div className="inline-flex items-center gap-2 p-1 rounded-full bg-slate-800 border border-slate-700">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              billingCycle === "monthly"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("annual")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              billingCycle === "annual"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Annual</span>
            {discountBadge && (
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                {discountBadge}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {currentPlans.map((plan, idx) => {
          const isHighlighted = plan.highlighted;
          return (
            <div
              key={plan.id || idx}
              className={`rounded-2xl p-5 flex flex-col justify-between transition-all relative ${
                isHighlighted
                  ? "bg-gradient-to-b from-indigo-950/80 to-slate-900 border-2 border-indigo-500 shadow-2xl ring-1 ring-indigo-500/40"
                  : "bg-slate-800/60 border border-slate-700/80"
              }`}
            >
              {isHighlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                  Most Popular
                </div>
              )}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-base text-white">{plan.name}</h4>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display font-black text-3xl text-white">{plan.price}</span>
                  <span className="text-xs text-slate-400">{plan.period}</span>
                </div>
                <p className="text-xs text-slate-400 leading-snug">{plan.description}</p>
                <div className="pt-2 border-t border-slate-700/60 space-y-2 text-left">
                  {(plan.features || []).map((feat: string, fIdx: number) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-5 mt-4">
                <button
                  type="button"
                  onClick={() => handlePlanClick(plan)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                    isHighlighted
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                      : "bg-slate-700 hover:bg-slate-600 text-white"
                  }`}
                >
                  Choose {plan.name}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 6. Product Showcase:
 * E-commerce highlight card with image, price, discount badge, stock urgency, and "Buy Now".
 */
export function ProductShowcaseBlockView({ block, mode, handlers }: DeveloperBlockProps) {
  const productName = (block.productName as string) || block.label || "Studio Wireless Headphones";
  const price = (block.price as string) || "₹4,999";
  const originalPrice = (block.originalPrice as string) || "₹8,999";
  const discountPercent = (block.discountPercent as string) || "45% OFF";
  const imageUrl = (block.imageUrl as string) || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=500";
  const buyUrl = (block.buyUrl as string) || (block.value as string) || "https://amazon.in";
  const rating = (block.rating as string) || "4.9";
  const reviewCount = (block.reviewCount as string) || "1,420";
  const stockUrgency = (block.stockUrgency as string) || "⚡ Only 7 units remaining in stock";
  const features = Array.isArray(block.features)
    ? (block.features as string[])
    : ["40h Battery Life", "Active Noise Cancellation", "Fast USB-C Charging"];

  const handleBuy = () => {
    resolveDestination(buyUrl, productName, handlers, mode);
  };

  return (
    <div className="w-full rounded-3xl p-5 sm:p-6 bg-slate-900 text-white border border-slate-800 shadow-xl overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 group">
          <img
            src={imageUrl}
            alt={productName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {discountPercent && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider shadow-md">
              {discountPercent}
            </span>
          )}
        </div>

        <div className="space-y-3 text-left">
          <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{rating}</span>
            <span className="text-slate-400 font-normal">({reviewCount} reviews)</span>
          </div>

          <h3 className="font-display font-black text-lg sm:text-xl text-white leading-snug">
            {productName}
          </h3>

          <div className="flex items-baseline gap-2">
            <span className="font-display font-black text-2xl text-emerald-400">{price}</span>
            {originalPrice && (
              <span className="text-xs text-slate-500 line-through font-semibold">{originalPrice}</span>
            )}
          </div>

          {stockUrgency && (
            <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              <Zap className="h-3 w-3" />
              <span>{stockUrgency}</span>
            </div>
          )}

          <div className="space-y-1.5 pt-1">
            {features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleBuy}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Buy Now · Instant Dispatch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 7. Feature Comparison Table:
 * Side-by-side SaaS comparison matrix with checks & crosses.
 */
export function ComparisonTableBlockView({ block }: DeveloperBlockProps) {
  const tierLabels = Array.isArray(block.tierLabels)
    ? (block.tierLabels as string[])
    : ["Free", "Pro", "Business"];

  const features = Array.isArray(block.features)
    ? (block.features as any[])
    : [
        { name: "Custom Domain Connection", free: false, pro: true, biz: true },
        { name: "Multi-Device Layouts", free: false, pro: true, biz: true },
        { name: "Lead Capture Forms", free: true, pro: true, biz: true },
        { name: "AI Sales Chat Assistant", free: false, pro: false, biz: true },
        { name: "Zero Platform Branding", free: false, pro: true, biz: true }
      ];

  return (
    <div className="w-full rounded-3xl p-5 sm:p-6 bg-slate-900 text-white border border-slate-800 shadow-xl overflow-x-auto no-scrollbar">
      <h3 className="font-display font-black text-lg sm:text-xl text-white text-center mb-4">
        Plan Comparison Matrix
      </h3>
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-800 text-slate-400">
            <th className="py-2.5 pr-4 font-bold">Feature</th>
            {tierLabels.map((tier, idx) => (
              <th
                key={idx}
                className={`py-2.5 px-3 text-center font-bold ${
                  tier.toLowerCase().includes("pro") ? "text-indigo-400" : ""
                }`}
              >
                {tier}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {features.map((feat, fIdx) => (
            <tr key={fIdx} className="hover:bg-slate-800/30 transition-colors">
              <td className="py-3 pr-4 font-medium text-slate-200">{feat.name}</td>
              <td className="py-3 px-3 text-center">
                {feat.free ? (
                  <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                ) : (
                  <X className="h-4 w-4 text-slate-600 mx-auto" />
                )}
              </td>
              <td className="py-3 px-3 text-center bg-indigo-500/5">
                {feat.pro ? (
                  <Check className="h-4 w-4 text-indigo-400 mx-auto font-bold" />
                ) : (
                  <X className="h-4 w-4 text-slate-600 mx-auto" />
                )}
              </td>
              <td className="py-3 px-3 text-center">
                {feat.biz ? (
                  <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                ) : (
                  <X className="h-4 w-4 text-slate-600 mx-auto" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * 8. Payment Button:
 * Direct one-click payment button with Razorpay/UPI/cards guarantee badge.
 */
export function PaymentButtonBlockView({ block, mode, handlers }: DeveloperBlockProps) {
  const buttonText = (block.buttonText as string) || block.label || "Pay ₹999 Now · Instant Access";
  const gatewayLabel = (block.gatewayLabel as string) || "Secured by Razorpay · UPI, Cards & NetBanking";
  const guaranteeText = (block.guaranteeText as string) || "🛡️ 100% Money Back Guarantee within 7 days";
  const paymentUrl = (block.paymentUrl as string) || (block.value as string) || "https://rzp.io";

  const handlePay = () => {
    resolveDestination(paymentUrl, buttonText, handlers, mode);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-center shadow-md space-y-2.5">
      <button
        type="button"
        onClick={handlePay}
        className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 active:scale-95 text-white font-black text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <ShieldCheck className="h-4.5 w-4.5 text-indigo-200" />
        <span>{buttonText}</span>
        <ArrowRight className="h-4 w-4" />
      </button>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-slate-400 font-medium px-1">
        <span>{gatewayLabel}</span>
        <span className="text-emerald-400">{guaranteeText}</span>
      </div>
    </div>
  );
}
