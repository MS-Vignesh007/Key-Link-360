import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Smartphone,
  Sparkles,
  ArrowRight,
  Check,
  Zap,
  Layers,
  Palette,
  Eye,
  Share2,
  Lock,
  ChevronDown,
  Play,
  Music,
  ShoppingBag,
  Star,
  Bot,
  MessageCircle
} from "lucide-react";
import PublicPageLayout from "./PublicPageLayout";

export default function MobileBioWebsitesPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does the AI Sales Assistant work on my Bio Website?",
      a: "Powered by Google Gemini 1.5 Flash Free Tier, your AI Sales Assistant greets visitors 24/7, answers product & pricing queries using your custom FAQs, and captures customer WhatsApp numbers directly into your KeyLink360 CRM at ₹0 cost."
    },
    {
      q: "How many bio pages can I create on KeyLink360?",
      a: "You can create unlimited mobile bio pages even on the Starter Free tier. Build separate pages for your Instagram, TikTok, client campaigns, or seasonal promotions without artificial caps."
    },
    {
      q: "Can I connect WhatsApp for customer inquiries?",
      a: "Yes! You can add direct 1-tap WhatsApp chat buttons, or integrate with Meta WhatsApp Cloud API / Web QR Bot for automated replies and order alerts."
    },
    {
      q: "Do my bio pages work fast on mobile networks?",
      a: "Yes! KeyLink360 pages are lightweight and mobile-first, ensuring quick and responsive loading across mobile networks and social app in-app browsers."
    },
    {
      q: "Can I sell digital products and collect payments directly?",
      a: "Yes! By connecting your Razorpay account, customers can buy downloadable files, book consultations, or send tips directly through standard gateway UPI, card, and netbanking flows."
    },
    {
      q: "Can I connect my own custom domain to my bio page?",
      a: "Yes! You can link your custom domain (e.g. links.yourbrand.com or yourbrand.com) with automated free SSL certificate provisioning."
    },
    {
      q: "Are the design blocks customizable?",
      a: "Yes. You have full access to 27+ modular blocks including Spotify/YouTube video embeds, countdown timers, product cards, WhatsApp direct chats, lead capture forms, and custom theme styling."
    }
  ];

  return (
    <PublicPageLayout activeGroup="features">
      
      {/* 1. HERO SHOWCASE SECTION */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-cyan-300 text-xs font-bold backdrop-blur-md">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>MOBILE BIO WEBSITES • 27+ DYNAMIC BLOCKS</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
                The Ultra-Fast Mobile <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                  Bio Website Builder
                </span> <br />
                for Modern Creators.
              </h1>

              <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Transform your single Instagram or social bio link into an interactive digital storefront. Showcase media, capture customer leads, and collect payments — zero coding required.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/login?mode=signup"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-black text-base shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <span>Build Your Bio Page Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#comparison"
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700/80 transition-all flex items-center justify-center gap-2"
                >
                  <span>See How It Compares</span>
                </a>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-xs font-medium text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>100% Free Forever Plan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>No Credit Card Needed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Mobile-First Performance</span>
                </div>
              </div>
            </div>

            {/* Visual Glass Phone Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[320px] sm:max-w-[350px] aspect-[9/18] rounded-[42px] p-3 bg-gradient-to-b from-slate-700 via-slate-900 to-slate-950 shadow-[0_25px_70px_rgba(0,0,0,0.9)] border-4 border-slate-700/80 relative overflow-hidden">
                <div className="w-full h-full rounded-[34px] bg-[#070b14] overflow-hidden border border-slate-800 flex flex-col p-4 space-y-4 relative">
                  
                  {/* Mock Profile Header */}
                  <div className="flex flex-col items-center text-center space-y-2 pt-2">
                    <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-cyan-400 to-fuchsia-500 shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                      <img
                        src="/brand-infinity-key.png"
                        alt="Demo Creator"
                        className="w-full h-full rounded-full object-cover bg-slate-900"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-black text-white flex items-center justify-center gap-1">
                        <span>Aria Vance Music</span>
                        <Star className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                      </div>
                      <div className="text-[11px] text-slate-400">Indie Producer & Digital Artist</div>
                    </div>
                  </div>

                  {/* Interactive Mock Blocks */}
                  <div className="space-y-2.5 flex-1 overflow-hidden">
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white">Stream New Single "Neon Echoes"</span>
                      </div>
                      <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                    </div>

                    <div className="p-3 rounded-xl bg-gradient-to-r from-fuchsia-950/80 to-purple-950/80 border border-fuchsia-500/30 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-fuchsia-400" />
                        <span className="text-xs font-bold text-white">VIP Backstage Pass (Direct UPI)</span>
                      </div>
                      <span className="text-[10px] font-bold text-fuchsia-300 bg-fuchsia-900/80 px-2 py-0.5 rounded-full">₹499</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center text-xs font-semibold text-slate-300">
                      Exclusive Fanclub Newsletter
                    </div>

                    {/* Floating Live AI Sales Assistant Badge */}
                    <div className="p-2.5 rounded-2xl bg-gradient-to-r from-cyan-950/90 to-indigo-950/90 border border-cyan-400/40 flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-cyan-400/20 text-cyan-400 flex items-center justify-center">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-left">
                          <div className="text-[10px] font-bold text-white flex items-center gap-1">
                            <span>AI Sales Rep</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          </div>
                          <div className="text-[8.5px] text-cyan-300">"Ask me about VIP passes!"</div>
                        </div>
                      </div>
                      <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                        Gemini AI
                      </span>
                    </div>
                  </div>

                  <div className="text-center text-[9px] font-mono text-slate-500 pt-1">
                    Powered by KeyLink360
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. CORE PROBLEM SOLVED */}
      <section className="py-20 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Why Static Bio Links <span className="text-cyan-400">Limit Your Reach</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Traditional bio link aggregators offer basic button lists with limited branding, restrictive blocks, and disconnected destinations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-7 rounded-3xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xl">
                ✦
              </div>
              <h3 className="text-lg font-bold text-white">Static Button Walls</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Simple text lists fail to capture attention. Modern audiences expect video previews, interactive music players, and visual product showcases.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xl">
                ✦
              </div>
              <h3 className="text-lg font-bold text-white">Scattered Management</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Managing separate links for payments, social channels, and leads creates confusion. A unified bio page keeps all destinations in one clean home.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xl">
                ✦
              </div>
              <h3 className="text-lg font-bold text-white">Restricted Personalization</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Generic templates dilute brand authority. KeyLink360 offers 27+ customizable blocks, theme presets, and custom domain connectivity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMPARISON GRID */}
      <section id="comparison" className="py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>The Modern Advantage</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Traditional Bio Links vs. <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">KeyLink360</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse rounded-3xl overflow-hidden bg-slate-900/60 border border-slate-800">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/90 text-xs uppercase tracking-wider text-slate-400">
                <th className="p-4 sm:p-6 font-bold">Feature / Capability</th>
                <th className="p-4 sm:p-6 font-bold text-slate-400">Traditional Link Lists</th>
                <th className="p-4 sm:p-6 font-extrabold text-cyan-300 bg-cyan-950/40">KeyLink360 Advantage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm text-slate-300">
              <tr>
                <td className="p-4 sm:p-6 font-semibold text-white">24/7 AI Sales Assistant</td>
                <td className="p-4 sm:p-6 text-slate-400">Not Available</td>
                <td className="p-4 sm:p-6 font-bold text-emerald-300 bg-cyan-950/20">Google Gemini 1.5 Flash Free Tier + Auto Lead Capture</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-6 font-semibold text-white">Dynamic Content Blocks</td>
                <td className="p-4 sm:p-6 text-slate-400">Basic Text Buttons</td>
                <td className="p-4 sm:p-6 font-bold text-cyan-300 bg-cyan-950/20">27+ Interactive Blocks (Video, Audio, Lead, Products)</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-6 font-semibold text-white">Payment Integration</td>
                <td className="p-4 sm:p-6 text-slate-400">External Redirections</td>
                <td className="p-4 sm:p-6 font-bold text-emerald-300 bg-cyan-950/20">Direct Razorpay Gateway Integration</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-6 font-semibold text-white">Custom Domain Hosting</td>
                <td className="p-4 sm:p-6 text-slate-400">Limited / Paid Add-on</td>
                <td className="p-4 sm:p-6 font-bold text-cyan-300 bg-cyan-950/20">Supported with Automated Free SSL</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-6 font-semibold text-white">QR Code Integration</td>
                <td className="p-4 sm:p-6 text-slate-400">Static Black & White</td>
                <td className="p-4 sm:p-6 font-bold text-cyan-300 bg-cyan-950/20">Vector Dynamic Studio with Logo & Colors</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-6 font-semibold text-white">Mobile Optimization</td>
                <td className="p-4 sm:p-6 text-slate-400">Standard Web Views</td>
                <td className="p-4 sm:p-6 font-bold text-emerald-300 bg-cyan-950/20">Lightweight Mobile-First Rendering</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. ILLUSTRATIVE USE CASE SCENARIO */}
      <section className="py-20 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border-2 border-cyan-500/30 shadow-2xl relative overflow-hidden">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
                <span>ILLUSTRATIVE SCENARIO • CREATOR WORKFLOW</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                How an independent creator can bring multiple channels, music streams, and direct support into one shareable hub.
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-xs sm:text-sm">
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="font-bold text-slate-300">Traditional Approach:</div>
                  <p className="text-slate-400 leading-relaxed">
                    Sharing disconnected single links across Instagram stories and YouTube descriptions, requiring followers to hunt for music releases, merchandise, and contact details separately.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-cyan-950/50 border border-cyan-500/40 space-y-2">
                  <div className="font-bold text-cyan-300">KeyLink360 Workflow:</div>
                  <p className="text-slate-200 leading-relaxed">
                    A single branded bio website hosting an in-line playable Spotify track, downloadable digital assets with Razorpay checkout, and an instant WhatsApp contact button for inquiries.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-slate-400 text-sm">Everything you need to know about KeyLink360 Mobile Bio Pages.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left font-bold text-sm sm:text-base text-white flex items-center justify-between gap-4 hover:text-cyan-400 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? "rotate-180 text-cyan-400" : ""}`} />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. BOTTOM ACTION BANNER */}
      <section className="py-20 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <h2 className="text-3xl sm:text-5xl font-black text-white">
          Create your high-converting <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
            Mobile Bio Website in 2 Minutes.
          </span>
        </h2>
        <div className="pt-2">
          <Link
            to="/login?mode=signup"
            className="inline-flex items-center gap-2 px-10 py-4.5 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 text-slate-950 font-black text-base sm:text-lg shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02]"
          >
            <span>Get Started for Free Today →</span>
          </Link>
        </div>
      </section>

    </PublicPageLayout>
  );
}
