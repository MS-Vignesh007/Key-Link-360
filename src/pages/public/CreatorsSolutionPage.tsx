import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Sparkles,
  ArrowRight,
  Check,
  Zap,
  Play,
  Music,
  ShoppingBag,
  Instagram,
  Youtube,
  ChevronDown,
  TrendingUp,
  Heart,
  Share2,
  DollarSign,
  Palette,
  ShieldCheck
} from "lucide-react";
import PublicPageLayout from "./PublicPageLayout";

export default function CreatorsSolutionPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does KeyLink360 help Instagram & YouTube creators?",
      a: "KeyLink360 replaces static single-link bios with an interactive, rich media storefront. You can embed playable YouTube videos, Spotify tracks, affiliate product carousels, brand deal sponsor cards, and instant UPI tip jars all on one sub-100ms loading page."
    },
    {
      q: "Can I embed playable YouTube videos and Spotify tracks directly?",
      a: "Yes! Visitors can watch your latest YouTube video or listen to your podcast episode right inside your bio page without redirecting away, keeping bounce rates exceptionally low."
    },
    {
      q: "How do I organize brand sponsorships and affiliate links?",
      a: "You can group your affiliate recommendations into neat visual categories (e.g., 'My Camera Gear', 'Favorite Books', 'Discount Codes') with high-converting thumbnail images and direct affiliate tracking."
    },
    {
      q: "Can I collect tips and sell digital presets/guides?",
      a: "Yes! KeyLink360 connects directly with your Razorpay account so you can sell digital downloads, presets, workout guides, or accept fan tips with 0% platform commissions."
    },
    {
      q: "Is it mobile responsive?",
      a: "KeyLink360 is built mobile-first from the ground up, specifically engineered for ultra-fast load times inside in-app Instagram, TikTok, and YouTube mobile web browsers."
    }
  ];

  return (
    <PublicPageLayout activeGroup="solutions">
      
      {/* 1. HERO SHOWCASE SECTION */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-pink-300 text-xs font-bold backdrop-blur-md">
                <Users className="w-4 h-4 text-pink-400" />
                <span>SOLUTIONS FOR CREATORS • INFLUENCERS & ARTISTS</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Turn Followers Into <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-indigo-400">
                  Superfans & Steady
                </span> <br />
                Creator Revenue.
              </h1>

              <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                The all-in-one bio website built for modern content creators. Showcase your latest videos, sell presets & merch, organize affiliate gear, and collect instant UPI tips with zero middleman cuts.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/login?mode=signup"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-400 to-indigo-500 hover:from-pink-400 hover:to-indigo-400 text-white font-black text-base shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <span>Build Creator Bio Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#creator-features"
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700/80 transition-all flex items-center justify-center gap-2"
                >
                  <span>See Creator Toolkit</span>
                </a>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-xs font-medium text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Interactive YouTube Embeds</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>0% Fee Tip Jar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Sub-100ms Mobile Speeds</span>
                </div>
              </div>
            </div>

            {/* Visual Creator Bio Card Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm rounded-[38px] p-3 bg-gradient-to-b from-slate-700 via-slate-900 to-slate-950 border-4 border-slate-700/80 shadow-[0_25px_70px_rgba(0,0,0,0.9)]">
                <div className="w-full rounded-[30px] bg-[#070b14] border border-slate-800 p-4 space-y-4">
                  
                  {/* Creator Avatar & Header */}
                  <div className="flex flex-col items-center text-center space-y-2 pt-1">
                    <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-pink-500 to-indigo-500 shadow-[0_0_15px_rgba(236,72,153,0.4)]">
                      <img
                        src="/brand-infinity-key.png"
                        alt="Creator"
                        className="w-full h-full rounded-full object-cover bg-slate-900"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-black text-white flex items-center justify-center gap-1">
                        Rohit Sharma Visuals
                        <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                      </div>
                      <div className="text-[10px] text-slate-400">Photographer & Tech Filmmaker • 240K Subs</div>
                    </div>
                  </div>

                  {/* Playable Video Embed Simulation */}
                  <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden relative group">
                    <div className="h-28 bg-gradient-to-tr from-slate-900 to-indigo-950 flex items-center justify-center relative">
                      <div className="w-10 h-10 rounded-full bg-pink-500/80 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[9px] text-white font-bold">
                        Latest Vlog • 14:20
                      </span>
                    </div>
                    <div className="p-2.5 text-[11px] font-bold text-slate-200">
                      Top 5 Camera Settings for Cinematic Travel Videos 🎥
                    </div>
                  </div>

                  {/* Creator Action Links */}
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-pink-950/60 to-purple-950/60 border border-pink-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-pink-400" />
                        <span className="text-xs font-bold text-white">Cinematic LUTs Pack (₹399)</span>
                      </div>
                      <span className="text-[10px] font-black text-pink-300">BUY (UPI)</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-rose-400" />
                        <span className="text-xs font-semibold text-slate-200">Buy Me a Coffee (Tip Jar)</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Support</span>
                    </div>
                  </div>

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
              Why Basic "List-of-Buttons" Bio Links Don't Cut It Anymore
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Old-school bio tools are lifeless lists of grey buttons. Modern audiences expect rich media, video previews, and instantaneous 1-tap checkout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-pink-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 font-bold">
                <Play className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Interactive Media Richness</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Embed interactive Spotify albums, YouTube premier countdowns, podcast episodes, and image galleries right on your page.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-pink-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">0% Monetization Tax</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Never sacrifice 10% of your digital product or tip jar sales to your bio platform. Connect Razorpay and keep 100% of your earnings.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-pink-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Deep Follower Analytics</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Track exactly which story slide, reel, or video drove the most clicks with built-in UTM parameters and device breakdowns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CREATOR TOOLKIT MATRIX */}
      <section id="creator-features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Everything You Need to Monetize Your Audience
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Built specifically for content creators across Instagram, YouTube, TikTok, and Spotify.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Youtube className="w-5 h-5 text-red-400" />,
                title: "YouTube Video Showcase",
                desc: "Automatically fetch your newest uploaded video or highlight your most viral YouTube playlist."
              },
              {
                icon: <Music className="w-5 h-5 text-emerald-400" />,
                title: "Spotify & Apple Music",
                desc: "In-line playable music tracks and podcast episodes for musicians and podcasters."
              },
              {
                icon: <ShoppingBag className="w-5 h-5 text-pink-400" />,
                title: "Affiliate Gear Curations",
                desc: "Organize Amazon and brand partner affiliate links with eye-catching product imagery."
              },
              {
                icon: <Palette className="w-5 h-5 text-amber-400" />,
                title: "Custom Themes & Fonts",
                desc: "Match your unique personal brand aesthetic with custom color palettes, background blurs, and fonts."
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
              <h3 className="text-lg font-bold text-white">Creator Bio Platform Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400">
                    <th className="p-4 font-semibold">Capability</th>
                    <th className="p-4 font-bold text-pink-400">KeyLink360</th>
                    <th className="p-4 font-semibold text-slate-400">Basic Link Aggregators</th>
                    <th className="p-4 font-semibold text-slate-400">Hosted Creator Storefronts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  <tr>
                    <td className="p-4 font-medium text-white">Platform Commission on Sales</td>
                    <td className="p-4 text-emerald-400 font-bold">0% Platform Cut (Direct Gateway)</td>
                    <td className="p-4 text-slate-400">5% - 9% Platform Fee</td>
                    <td className="p-4 text-slate-400">Monthly Subscriptions + Cuts</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Direct Indian UPI Integration</td>
                    <td className="p-4 text-emerald-400 font-bold">Native via Razorpay</td>
                    <td className="p-4 text-rose-400">No Native Indian UPI</td>
                    <td className="p-4 text-rose-400">Limited / International Gateways</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Interactive Video & Audio Embeds</td>
                    <td className="p-4 text-emerald-400 font-bold">YouTube, Spotify, SoundCloud</td>
                    <td className="p-4 text-slate-400">Basic Redirect Buttons</td>
                    <td className="p-4 text-slate-400">Limited Embed Types</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Custom Branded Domain</td>
                    <td className="p-4 text-emerald-400 font-bold">Included in Standard Plans</td>
                    <td className="p-4 text-slate-400">Higher-Tier Plans Only</td>
                    <td className="p-4 text-emerald-400 font-bold">Supported</td>
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
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-950 border border-pink-500/30 text-pink-400 text-xs font-bold">
                  ILLUSTRATIVE SCENARIO • CREATOR CONTENT WORKFLOW
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  How Reviewers & Content Creators Consolidate Multi-Platform Assets
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Video creators and influencers often manage gear lists, sponsor discount codes, and digital presets across YouTube, Instagram, and TikTok. By organizing affiliate links into visually categorized cards and embedding their latest video directly onto a KeyLink360 bio page, followers can explore recommended products and digital guides with clear navigation.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center font-bold text-pink-300">
                    CR
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Representative Video Creator Workflow</div>
                    <div className="text-xs text-slate-400">Typical Multi-Platform Content Pattern</div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 flex flex-col gap-3 text-center">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-3xl font-black text-pink-400">Direct Hub</div>
                  <div className="text-xs text-slate-400">Centralized Gear & Sponsor Cards</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-3xl font-black text-emerald-400">1-Tap UPI</div>
                  <div className="text-xs text-slate-400">Direct Gateway Digital Sales</div>
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
            <p className="text-slate-400 text-sm">Everything creators ask about bio storefronts & monetization.</p>
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
                    className={`w-5 h-5 text-pink-400 shrink-0 transition-transform duration-200 ${
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
      <section className="py-16 bg-gradient-to-r from-pink-950/40 via-slate-900 to-indigo-950/40 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Build Your Dream Creator Bio Today.
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Get started for free in under 60 seconds. Zero coding, instant UPI monetization, and full creative control.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/login?mode=signup"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-400 hover:to-indigo-400 text-white font-black text-base shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02]"
            >
              Claim Your Creator Link
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
