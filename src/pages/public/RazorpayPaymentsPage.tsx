import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Sparkles,
  ArrowRight,
  Check,
  Zap,
  ShieldCheck,
  ChevronDown,
  TrendingUp,
  Lock,
  Smartphone,
  Download,
  DollarSign,
  Percent,
  Wallet,
  ShoppingBag,
  Clock,
  ArrowUpRight
} from "lucide-react";
import PublicPageLayout from "./PublicPageLayout";

export default function RazorpayPaymentsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Does KeyLink360 take any percentage or commission from my sales?",
      a: "No! KeyLink360 charges 0% platform commission on your sales. You connect your own Razorpay account credentials (Key ID & Secret), and 100% of customer funds are settled directly into your linked bank account subject only to standard payment gateway processing fees."
    },
    {
      q: "Which payment methods can my customers use?",
      a: "Customers can pay via all Indian UPI apps (Google Pay, PhonePe, Paytm, BHIM, CRED), all Major Credit/Debit cards (Visa, MasterCard, RuPay, Amex), NetBanking (50+ banks), and international cards."
    },
    {
      q: "How does digital product delivery work?",
      a: "When a customer successfully completes payment for a digital download (PDF, video, preset, template, ZIP), KeyLink360 automatically reveals the instant download link and sends an email invoice receipt with the file link."
    },
    {
      q: "Is payment processing secure and RBI compliant?",
      a: "Yes. All transactions are securely processed through Razorpay's PCI-DSS Level 1 certified payment gateway with 128-bit SSL encryption and mandatory bank 2FA OTP verification."
    },
    {
      q: "Can I collect tips or accept custom donations?",
      a: "Yes! You can add tip jar buttons, open donation fields where supporters choose their own amount, or fixed price consultation booking buttons directly on your bio website."
    }
  ];

  return (
    <PublicPageLayout activeGroup="features">
      
      {/* 1. HERO SHOWCASE SECTION */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-emerald-300 text-xs font-bold backdrop-blur-md">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>RAZORPAY DIRECT INTEGRATION • DIRECT MERCHANT SETTLEMENT</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Accept UPI & Cards <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                  Direct to Your Bank
                </span> <br />
                With Zero Platform Markup.
              </h1>

              <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Sell digital downloads, paid consultations, and product pre-orders directly from your bio link. Instant UPI and card checkouts powered directly by your own Razorpay merchant account.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/login?mode=signup"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-slate-950 font-black text-base shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <span>Connect Razorpay & Sell</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#payment-comparison"
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700/80 transition-all flex items-center justify-center gap-2"
                >
                  <span>Compare Workflow Models</span>
                </a>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-xs font-medium text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>0% Platform Commission</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Direct Razorpay Gateway</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Instant UPI & Card Checkout</span>
                </div>
              </div>
            </div>

            {/* Visual Checkout Drawer Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md rounded-3xl p-6 bg-gradient-to-b from-slate-900 via-slate-950 to-[#070b14] border border-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.8)] space-y-5">
                
                {/* Checkout Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Instant Checkout</div>
                      <div className="text-[10px] text-slate-400">Direct Razorpay Settlement</div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-400">Direct Gateway</span>
                </div>

                {/* Product Summary Item */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">100+ Lightroom Presets Bundle</div>
                    <div className="text-[10px] text-slate-400">Instant ZIP Download Included</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-400">₹499</div>
                    <div className="text-[10px] text-slate-500 line-through">₹1,499</div>
                  </div>
                </div>

                {/* Payment Method Selector Mockup */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-300">Select Instant Payment Method</div>
                  
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
                        UPI
                      </div>
                      <span className="text-xs font-bold text-white">Google Pay / PhonePe / Paytm</span>
                    </div>
                    <div className="w-4 h-4 rounded-full border-4 border-emerald-400 bg-slate-900" />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between opacity-80">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-300">Credit / Debit Card (All Banks)</span>
                    </div>
                    <div className="w-4 h-4 rounded-full border border-slate-700 bg-transparent" />
                  </div>
                </div>

                {/* CTA Pay Button */}
                <button className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>PAY SECURELY ₹499 (1-TAP UPI)</span>
                </button>

                <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    PCI-DSS Level 1
                  </span>
                  <span>•</span>
                  <span>128-Bit Encryption</span>
                  <span>•</span>
                  <span>Direct Bank Settlement</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM VS KEYLINK360 SOLUTION */}
      <section className="py-20 border-y border-slate-800/60 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Avoid Intermediary Platforms That Take Heavy Cuts
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Many storefront platforms impose heavy revenue shares and hold payouts in escrow. KeyLink360 connects directly with your merchant account.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                <Percent className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">No Platform Markup</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                KeyLink360 charges 0% platform commission. You only pay standard payment gateway processing fees directly to Razorpay.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Native Indian UPI Checkout</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Indian buyers can pay seamlessly via Google Pay, PhonePe, Paytm, or cards with fast mobile checkout flows.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Direct Merchant Settlement</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Funds settle straight into your linked bank account per your standard Razorpay settlement schedule without third-party holding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURE MATRIX & COMPARISON */}
      <section id="payment-comparison" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              What Can You Monetize on KeyLink360?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Turn your social traffic into a streamlined monetization hub in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Download className="w-5 h-5 text-emerald-400" />,
                title: "Digital Downloads",
                desc: "PDF guides, Notion templates, Adobe presets, fitness plans, audio tracks, and graphic packs."
              },
              {
                icon: <Clock className="w-5 h-5 text-cyan-400" />,
                title: "1-on-1 Consultation Slots",
                desc: "Collect payment for portfolio reviews, advisory calls, or coaching sessions before booking calendar slots."
              },
              {
                icon: <DollarSign className="w-5 h-5 text-amber-400" />,
                title: "Audience Support & Tips",
                desc: "Allow supporters to contribute voluntary tips or donations directly to your merchant account."
              },
              {
                icon: <ShoppingBag className="w-5 h-5 text-pink-400" />,
                title: "Product Pre-Orders",
                desc: "Collect advance token payments and buyer details for custom merchandise or craft pre-orders."
              }
            ].map((prod, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                  {prod.icon}
                </div>
                <h4 className="text-base font-bold text-white">{prod.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{prod.desc}</p>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-2xl">
            <div className="p-6 bg-slate-900/80 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Payment Workflow & Platform Fee Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400">
                    <th className="p-4 font-semibold">Workflow / Capability</th>
                    <th className="p-4 font-bold text-emerald-400">KeyLink360 + Razorpay</th>
                    <th className="p-4 font-semibold text-slate-400">Third-Party Marketplace Storefronts</th>
                    <th className="p-4 font-semibold text-slate-400">Basic Aggregator Link Tools</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  <tr>
                    <td className="p-4 font-medium text-white">Platform Commission</td>
                    <td className="p-4 text-emerald-400 font-bold">0% Platform Fee (Standard gateway fee applies)</td>
                    <td className="p-4 text-slate-400">5% to 15% Platform Cut</td>
                    <td className="p-4 text-slate-400">Tier-based platform fee + gateway</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Indian UPI & RuPay Support</td>
                    <td className="p-4 text-emerald-400 font-bold">Native Direct UPI (GPay, PhonePe, Paytm)</td>
                    <td className="p-4 text-slate-400">Limited / International Cards Only</td>
                    <td className="p-4 text-slate-400">Third-party redirect depending on tier</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Payout Settlement Flow</td>
                    <td className="p-4 text-emerald-400 font-bold">Direct to merchant bank per Razorpay schedule</td>
                    <td className="p-4 text-slate-400">Platform payout schedule / Thresholds</td>
                    <td className="p-4 text-slate-400">Escrow or delayed transfer</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Automated Digital Delivery</td>
                    <td className="p-4 text-emerald-400 font-bold">Built-in Instant File Unlock</td>
                    <td className="p-4 text-emerald-400 font-bold">Included</td>
                    <td className="p-4 text-slate-400">Requires external webhook / integration</td>
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
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  ILLUSTRATIVE SCENARIO • DIGITAL PRODUCT SALES
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  How Independent Creators & Educators Sell Digital Assets Directly
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Creators selling downloadable workout plans, design assets, guides, or consulting calls can connect their own Razorpay account to KeyLink360. When buyers complete payment via UPI or card, funds settle directly into the creator's merchant account, and digital file access is unlocked automatically.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-300">
                    DS
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Representative Creator Monetization Workflow</div>
                    <div className="text-xs text-slate-400">Typical Direct-to-Consumer Digital Sales Pattern</div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 flex flex-col gap-3 text-center">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-3xl font-black text-emerald-400">Direct Gateway</div>
                  <div className="text-xs text-slate-400">Funds go straight to your account</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-3xl font-black text-teal-400">Instant Access</div>
                  <div className="text-xs text-slate-400">Automated post-payment file delivery</div>
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
            <p className="text-slate-400 text-sm">Everything you need to know about Razorpay direct monetization.</p>
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
                    className={`w-5 h-5 text-emerald-400 shrink-0 transition-transform duration-200 ${
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
      <section className="py-16 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Start Collecting Payments Directly Today.
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Connect your Razorpay account in 2 minutes and start selling digital products with 0% platform commission.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/login?mode=signup"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-base shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02]"
            >
              Get Started Free
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
