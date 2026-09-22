import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Link2,
  BarChart3,
  ArrowRight,
  Check,
  Zap,
  Globe,
  Lock,
  ChevronDown,
  Clock,
  Target,
  Share2,
  TrendingUp,
  MapPin,
  Smartphone,
  ShieldCheck,
  Split,
  Tag
} from "lucide-react";
import PublicPageLayout from "./PublicPageLayout";

export default function ShortLinksPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Can I edit the destination URL of a short link after publishing it?",
      a: "Yes! All KeyLink360 short links are dynamic. If you change a promotional link or fix a typo, you can update the destination URL at any time without breaking existing shared links."
    },
    {
      q: "Can I use campaign tracking parameters on my destination links?",
      a: "Yes! You can attach standard UTM campaign parameters (such as utm_source, utm_medium, and utm_campaign) directly to your destination URLs so your external web analytics capture attribution cleanly."
    },
    {
      q: "What click analytics do I get?",
      a: "You get direct click analytics including total clicks, recent activity logs, and real-time counter updates right inside your dashboard."
    },
    {
      q: "What is a Link Rotator?",
      a: "A Link Rotator allows you to distribute incoming visitors across multiple target URLs with custom traffic percentage weights (e.g. 50% to Offer A and 50% to Offer B) to compare performance."
    },
    {
      q: "Can I use my own branded domain for short links?",
      a: "Absolutely. You can connect your custom domain (e.g. go.yourcompany.com) so every link reinforces your brand trust instead of generic third-party domains."
    }
  ];

  return (
    <PublicPageLayout activeGroup="features">
      
      {/* 1. HERO SHOWCASE SECTION */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-sky-300 text-xs font-bold backdrop-blur-md">
                <Link2 className="w-4 h-4 text-sky-400" />
                <span>SMART SHORT LINKS & REAL-TIME CLICK STATS</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Smart Short Links <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400">
                  Engineered for Growth
                </span> <br />
                & Clean Routing.
              </h1>

              <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Shorten long, messy URLs into clean branded links. Track click counts, customize link slugs, and distribute traffic across multiple destinations with smart link rotators.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/login?mode=signup"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-400 via-cyan-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-slate-950 font-black text-base shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <span>Shorten Links Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#analytics-preview"
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700/80 transition-all flex items-center justify-center gap-2"
                >
                  <span>Explore Features</span>
                </a>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-xs font-medium text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Dynamic Editable Targets</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Custom Slugs & Domains</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Smart Link Rotators</span>
                </div>
              </div>
            </div>

            {/* Visual Analytics Dashboard Card Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md rounded-3xl p-5 bg-gradient-to-b from-slate-900 via-slate-950 to-[#070b14] border border-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.8)] space-y-4">
                
                {/* Link Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-black">
                      <Link2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">keyl.ink/summer-deal</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[180px]">https://yourstore.com/promo/summer...</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    Active • 200 OK
                  </span>
                </div>

                {/* Click Metrics Counter */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Total Clicks</div>
                    <div className="text-base font-black text-white">1,290</div>
                    <div className="text-[9px] text-emerald-400 font-semibold">Active</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Routing</div>
                    <div className="text-base font-black text-sky-400">Direct</div>
                    <div className="text-[9px] text-slate-400 font-semibold">Instant</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Type</div>
                    <div className="text-base font-black text-indigo-400">Dynamic</div>
                    <div className="text-[9px] text-emerald-400 font-semibold">Editable</div>
                  </div>
                </div>

                {/* Traffic Graph Simulation */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">Click Activity Overview</span>
                    <span className="text-[10px] text-sky-400 font-semibold">Live Monitor</span>
                  </div>
                  <div className="h-20 flex items-end gap-1.5 pt-2">
                    {[45, 60, 52, 85, 70, 95, 80, 110, 125, 90, 140, 160].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div
                          style={{ height: `${(h / 160) * 100}%` }}
                          className="w-full rounded-t-md bg-gradient-to-t from-sky-600 to-cyan-400 group-hover:from-sky-400 group-hover:to-cyan-200 transition-all shadow-[0_0_8px_rgba(56,189,248,0.4)]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Geo Breakdown Pills */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>Traffic Routing Destinations</span>
                    <span className="text-slate-400 text-[10px]">Split Rotator</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300">Target A (50% Weight)</span>
                      <span className="font-bold text-white">50%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="w-[50%] h-full bg-cyan-400 rounded-full" />
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
              Why Static Links Limit Modern Campaigns
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Hardcoded URLs cannot be modified after sharing, making campaign updates difficult and causing broken links.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-sky-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Editable Destinations</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Update destination links anytime from your dashboard without changing the short link already shared on social media or printed materials.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-sky-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold">
                <Split className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Traffic Rotator Distribution</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Split traffic dynamically across different product offers, WhatsApp numbers, or landing pages with custom weight controls.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-sky-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                <Tag className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Clean Branded Slugs</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Create memorable custom slugs and connect your own domain to boost click trust and maintain brand consistency across all channels.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURE DEEP DIVE MATRIX */}
      <section id="analytics-preview" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Essential Tools for Clean Link Management
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Built for creators, businesses, and marketing managers who need flexible redirect controls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Split className="w-5 h-5 text-cyan-400" />,
                title: "Link Rotator Testing",
                desc: "Distribute traffic across multiple landing pages with weighted percentages to test different offers."
              },
              {
                icon: <Globe className="w-5 h-5 text-indigo-400" />,
                title: "Custom Domain Support",
                desc: "Route short links through your own verified domain or subdomain with free automated SSL."
              },
              {
                icon: <BarChart3 className="w-5 h-5 text-amber-400" />,
                title: "Click Tracking Stats",
                desc: "Monitor real-time click volume and link activity directly from your management dashboard."
              },
              {
                icon: <Tag className="w-5 h-5 text-emerald-400" />,
                title: "Custom Slug Creation",
                desc: "Personalize short link back-halves to make your URLs readable, memorable, and on-brand."
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

          {/* Feature Comparison Table */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-2xl">
            <div className="p-6 bg-slate-900/80 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Workflow Comparison: Traditional vs KeyLink360 Links</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400">
                    <th className="p-4 font-semibold">Features & Capabilities</th>
                    <th className="p-4 font-bold text-sky-400">KeyLink360</th>
                    <th className="p-4 font-semibold text-slate-500">Standard Static Shorteners</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  <tr>
                    <td className="p-4 font-medium text-white">Editable Destination URLs</td>
                    <td className="p-4 text-emerald-400 font-bold">Yes, Anytime via Dashboard</td>
                    <td className="p-4 text-slate-400">Often Static / Locked</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Traffic Split Rotators</td>
                    <td className="p-4 text-emerald-400 font-bold">Built-in Weighted Distribution</td>
                    <td className="p-4 text-slate-400">Single Target Only</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Custom Domain Connectivity</td>
                    <td className="p-4 text-emerald-400 font-bold">Supported with Free Automated SSL</td>
                    <td className="p-4 text-slate-400">Requires Expensive Upgrades</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Unified Suite Integration</td>
                    <td className="p-4 text-emerald-400 font-bold">Connected with Bio Pages & QR Studio</td>
                    <td className="p-4 text-slate-400">Isolated Tool</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ILLUSTRATIVE USE CASE SCENARIO */}
      <section className="py-20 border-t border-slate-800/60 bg-gradient-to-b from-slate-950 to-[#04060c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
                  ILLUSTRATIVE SCENARIO • D2C CAMPAIGN TRACKING
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Example Workflow: How a growing D2C brand can manage marketing links and A/B offers smoothly.
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  "An online lifestyle brand launching a seasonal collection can create branded short links for different social creators. By using Link Rotators, they can evenly split incoming traffic between two product landing pages to observe which page generates stronger buyer interest."
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center font-bold text-sky-300">
                    EX
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Example Use Case</div>
                    <div className="text-xs text-slate-400">E-Commerce & Campaign Management</div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 flex flex-col gap-3 text-center">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-lg font-bold text-emerald-400">Dynamic Routing</div>
                  <div className="text-xs text-slate-400">Update destination anytime</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-lg font-bold text-sky-400">Split Testing</div>
                  <div className="text-xs text-slate-400">Multi-target Link Rotator</div>
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
            <p className="text-slate-400 text-sm">Everything you need to know about KeyLink360 Short Links & Tracking.</p>
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
                    className={`w-5 h-5 text-sky-400 shrink-0 transition-transform duration-200 ${
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
      <section className="py-16 bg-gradient-to-r from-sky-900/30 via-slate-900 to-indigo-900/30 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Supercharge Your Short Links Today.
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Get instant analytics, custom branded domains, and zero click limits for your marketing campaigns.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/login?mode=signup"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-slate-950 font-black text-base shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02]"
            >
              Create Free Account
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
