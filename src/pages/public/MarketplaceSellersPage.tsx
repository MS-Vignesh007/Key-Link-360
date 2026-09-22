import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Check,
  Zap,
  ExternalLink,
  Smartphone,
  ChevronDown,
  TrendingUp,
  Tag,
  Star,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Percent,
  Compass
} from "lucide-react";
import PublicPageLayout from "./PublicPageLayout";

export default function MarketplaceSellersPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does Deep App Linking help Amazon & Flipkart sellers?",
      a: "When shoppers click ordinary links on Instagram, they open inside an in-app browser where they aren't logged in, causing 70%+ abandonment. KeyLink360 Deep Links automatically open the official Amazon, Flipkart, or Meesho app directly on the user's phone where their address and payment methods are already saved."
    },
    {
      q: "Can I show multiple marketplace options for the same product?",
      a: "Yes! You can create a unified product showcase displaying 'Buy on Amazon', 'Buy on Flipkart', and 'Buy Directly (Save 10%)' buttons so customers choose their preferred shopping destination."
    },
    {
      q: "Can I embed promo codes and discount vouchers?",
      a: "Yes. You can add 1-click copy coupon codes directly above your store links so buyers never miss out on your special festival or launch discounts."
    },
    {
      q: "Can I fire Meta / Google Ads tracking pixels on external marketplace links?",
      a: "Yes! KeyLink360 fires your Meta Pixel and Google Ads conversion tags during the edge redirect before routing the shopper into the Amazon or Flipkart app."
    },
    {
      q: "Does it support Meesho, Myntra, and Swiggy Instamart?",
      a: "Yes, all major Indian and international commerce apps are supported for deep app opening, including Amazon, Flipkart, Meesho, Myntra, Nykaa, Blinkit, and Swiggy Instamart."
    }
  ];

  return (
    <PublicPageLayout activeGroup="solutions">
      
      {/* 1. HERO SHOWCASE SECTION */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-amber-300 text-xs font-bold backdrop-blur-md">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>SOLUTIONS FOR MARKETPLACE SELLERS • AMAZON, FLIPKART & MEESHO</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Deep Link Directly <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-rose-400">
                  Into Shopping Apps.
                </span> <br />
                Multiply Sales 3X.
              </h1>

              <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Eliminate in-app browser login friction. Open your Amazon and Flipkart product pages directly inside the native mobile apps with 1-click Buy Now access.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/login?mode=signup"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-400 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-base shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <span>Create Marketplace Deep Link Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#deep-link-benefits"
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700/80 transition-all flex items-center justify-center gap-2"
                >
                  <span>How Deep Linking Works</span>
                </a>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-xs font-medium text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Native Amazon / Flipkart App Open</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Meta Pixel Retargeting</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Multi-Marketplace Routing</span>
                </div>
              </div>
            </div>

            {/* Visual Deep Link Routing Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md rounded-3xl p-6 bg-gradient-to-b from-slate-900 via-slate-950 to-[#070b14] border border-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.8)] space-y-4">
                
                {/* Product Card */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">Amazon Choice</span>
                    <span className="text-emerald-400 font-bold">4.8 ★ (1,240 Reviews)</span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    Premium Ergonomic Wireless Keyboard & Mouse Combo
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-amber-400">₹2,199</span>
                    <span className="text-xs text-slate-500 line-through">₹4,999</span>
                    <span className="text-xs font-bold text-emerald-400">(56% OFF)</span>
                  </div>
                </div>

                {/* Direct App Routing Buttons */}
                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-2xl bg-[#FF9900]/10 border border-[#FF9900]/40 flex items-center justify-between hover:bg-[#FF9900]/20 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FF9900] text-black font-black flex items-center justify-center text-xs">
                        a
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Open in Amazon App</div>
                        <div className="text-[10px] text-amber-300">Instant 1-Click Prime Checkout</div>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-amber-400" />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#2874F0]/10 border border-[#2874F0]/40 flex items-center justify-between hover:bg-[#2874F0]/20 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#2874F0] text-white font-black flex items-center justify-center text-xs">
                        F
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Open in Flipkart App</div>
                        <div className="text-[10px] text-sky-300">Flipkart SuperCoins Available</div>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-sky-400" />
                  </div>
                </div>

                {/* Coupon Code Pill */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Use Extra 10% Coupon: <strong className="text-amber-400 font-mono">SAVE10</strong></span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">Copy</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM VS KEYLINK360 SOLUTION */}
      <section id="deep-link-benefits" className="py-20 border-y border-slate-800/60 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Why Standard Social Links Kill 70% of Marketplace Conversions
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              When a buyer taps a standard link on Instagram or Facebook, the in-app browser prompts them to log in to Amazon. Almost nobody remembers their password on mobile browsers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">No In-App Browser Login Wall</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                KeyLink360 automatically detects mobile OS and executes deep universal app links directly into Amazon & Flipkart apps with zero login required.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                <Tag className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Unified Multi-Platform Hub</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Give buyers the flexibility to choose between Amazon, Flipkart, Meesho, or your direct Shopify store without spreading separate links everywhere.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Ad Retargeting on Marketplaces</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Collect custom audiences on your Meta, Google, and TikTok ad accounts even though the final sale happens on third-party marketplace portals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MARKETPLACE TOOLKIT MATRIX */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Built for High-Velocity Marketplace Merchants
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Everything you need to convert external traffic into Amazon Best-Sellers (BSRA).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Smartphone className="w-5 h-5 text-amber-400" />,
                title: "Universal App Deep Linking",
                desc: "Directs shoppers into Amazon, Flipkart, Meesho, and Myntra mobile apps."
              },
              {
                icon: <Tag className="w-5 h-5 text-emerald-400" />,
                title: "1-Click Promo Vouchers",
                desc: "Prominently display launch coupon codes that buyers can copy with a single tap."
              },
              {
                icon: <Star className="w-5 h-5 text-yellow-400" />,
                title: "Review Booster Links",
                desc: "Generate smart links directing satisfied buyers straight to your 5-star product review page."
              },
              {
                icon: <Compass className="w-5 h-5 text-sky-400" />,
                title: "Geo-Targeted Routing",
                desc: "Route Indian buyers to Amazon.in, US buyers to Amazon.com, and UK buyers to Amazon.co.uk."
              }
            ].map((feat, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                  {feat.icon}
                </div>
                <h4 className="text-base font-bold text-white">{feat.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-2xl">
            <div className="p-6 bg-slate-900/80 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Marketplace Traffic Routing Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400">
                    <th className="p-4 font-semibold">Capability</th>
                    <th className="p-4 font-bold text-amber-400">KeyLink360 Showcase</th>
                    <th className="p-4 font-semibold text-slate-400">Standard Web URLs</th>
                    <th className="p-4 font-semibold text-slate-400">Generic Shortener Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  <tr>
                    <td className="p-4 font-medium text-white">Multi-Marketplace Routing (Amazon, Flipkart, D2C)</td>
                    <td className="p-4 text-emerald-400 font-bold">Unified Product Hub</td>
                    <td className="p-4 text-rose-400">Single URL Only</td>
                    <td className="p-4 text-slate-400">Single Redirect</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">1-Click Promo & Coupon Display</td>
                    <td className="p-4 text-emerald-400 font-bold">Built-in Copyable Codes</td>
                    <td className="p-4 text-rose-400">No</td>
                    <td className="p-4 text-rose-400">No</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Ad Retargeting Pixel Support</td>
                    <td className="p-4 text-emerald-400 font-bold">Meta & Google Pixels Supported</td>
                    <td className="p-4 text-rose-400">No</td>
                    <td className="p-4 text-slate-400">Varies by Plan</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Mobile In-App Browser Experience</td>
                    <td className="p-4 text-emerald-400 font-bold">Fast-Loading Clean Mobile Interface</td>
                    <td className="p-4 text-slate-400">Standard Mobile Page</td>
                    <td className="p-4 text-slate-400">Intermediary Redirect Delay</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ILLUSTRATIVE SCENARIO */}
      <section className="py-20 border-t border-slate-800/60 bg-gradient-to-b from-slate-950 to-[#04060c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950 border border-amber-500/30 text-amber-400 text-xs font-bold">
                  ILLUSTRATIVE SCENARIO • MULTI-MARKETPLACE PROMOTIONS
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  How Multi-Marketplace Sellers Route Social Campaigns Effectively
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Consumer brands and sellers frequently offer their product catalogs across Amazon, Flipkart, and their own brand website. By using a KeyLink360 product showcase hub with copyable promo codes and direct marketplace buttons, customers can choose their preferred checkout portal while sellers capture valuable campaign click analytics.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center font-bold text-amber-300">
                    MP
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Representative Multi-Marketplace Seller Workflow</div>
                    <div className="text-xs text-slate-400">Typical E-Commerce Campaign Architecture</div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 flex flex-col gap-3 text-center">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-3xl font-black text-amber-400">Multi-Store</div>
                  <div className="text-xs text-slate-400">Amazon, Flipkart & Direct In One Hub</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-3xl font-black text-emerald-400">Promo Ready</div>
                  <div className="text-xs text-slate-400">1-Tap Voucher Copy Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ACCORDION FAQS */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-sm">Everything sellers need to know about Amazon & Flipkart deep links.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-200 hover:text-white"
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-amber-400 shrink-0 transition-transform duration-200 ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CTA BANNER */}
      <section className="py-16 bg-gradient-to-r from-amber-950/40 via-slate-900 to-orange-950/40 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Stop Losing 70% of Your Marketplace Traffic.
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Create seamless deep links into Amazon, Flipkart, and Meesho today and watch your sales soar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/login?mode=signup"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-base shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02]"
            >
              Start Deep Linking Free
            </Link>
            <Link
              to="/login"
              className="px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-sm border border-slate-700"
            >
              Sign In to Workspace
            </Link>
          </div>
        </div>
      </section>

    </PublicPageLayout>
  );
}
