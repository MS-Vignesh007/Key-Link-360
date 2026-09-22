import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  Sparkles,
  ArrowRight,
  Check,
  Zap,
  ShieldCheck,
  ChevronDown,
  Lock,
  Server,
  RefreshCw,
  ExternalLink,
  Layers,
  Copy,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import PublicPageLayout from "./PublicPageLayout";

export default function CustomDomainsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Can I connect both root domains and subdomains?",
      a: "Yes! You can connect root apex domains (e.g., yourcompany.com) as well as any custom subdomain (e.g., links.yourcompany.com, go.yourcompany.com, or shop.yourcompany.com)."
    },
    {
      q: "Do I have to pay extra for an SSL security certificate?",
      a: "No! Automated SSL certificates are provisioned and auto-renewed for free on every connected custom domain via global edge CDN routing."
    },
    {
      q: "Which domain registrars are supported?",
      a: "All domain registrars and DNS providers are supported, including GoDaddy, Cloudflare, Namecheap, Google Domains / Squarespace, Hostinger, BigRock, and AWS Route 53."
    },
    {
      q: "How long does DNS propagation take?",
      a: "Most DNS changes propagate within 2 to 15 minutes. Our real-time DNS verification checker in the dashboard immediately verifies your CNAME or A-records."
    },
    {
      q: "Can I customize the favicon and social preview meta tags?",
      a: "Yes! With your custom domain, you have complete white-label control over your page title, favicon icon, OpenGraph social card image (when shared on WhatsApp, iMessage, and Twitter), and custom 404 fallback page."
    }
  ];

  return (
    <PublicPageLayout activeGroup="features">
      
      {/* 1. HERO SHOWCASE SECTION */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-amber-300 text-xs font-bold backdrop-blur-md">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>CUSTOM DOMAINS • 100% WHITE-LABEL BRANDING & FREE SSL</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Your Own Domain. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400">
                  Zero Third-Party
                </span> <br />
                Branding Attached.
              </h1>

              <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Connect <code className="text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30 font-mono text-sm">links.yourbrand.com</code> or your root domain in minutes. Build instant client trust with free automated SSL certificates and custom OpenGraph social previews.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/login?mode=signup"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-base shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <span>Connect Your Domain Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#dns-setup-guide"
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700/80 transition-all flex items-center justify-center gap-2"
                >
                  <span>See 2-Step DNS Setup</span>
                </a>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-xs font-medium text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Free Automated SSL</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Custom Favicon & Social Cards</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Global Anycast CDN</span>
                </div>
              </div>
            </div>

            {/* Visual DNS Verification Dashboard Card Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md rounded-3xl p-6 bg-gradient-to-b from-slate-900 via-slate-950 to-[#070b14] border border-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.8)] space-y-5">
                
                {/* Domain Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">links.acmebrand.com</div>
                      <div className="text-[10px] text-slate-400">Connected Root Domain</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    SSL Active
                  </span>
                </div>

                {/* DNS Records Table Simulation */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-300">Active DNS Records</div>
                  
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-amber-300 font-bold">CNAME</span>
                      <span className="text-slate-400 font-mono text-[10px]">Host: links</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span>cname.keylink360.com</span>
                      <span className="text-[10px] text-emerald-400 font-bold font-sans">✓ Verified</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-cyan-300 font-bold">SSL Certificate</span>
                      <span className="text-slate-400 text-[10px]">Let's Encrypt Wildcard</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        TLS 1.3 / 256-Bit
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">Auto-Renewed</span>
                    </div>
                  </div>
                </div>

                {/* Browser URL Preview Bar */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-xs font-mono text-slate-300 truncate">
                    https://<strong className="text-white font-bold">links.acmebrand.com</strong>/summer-sale
                  </span>
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
              Why Third-Party URLs Hurt Your Brand Click-Through Rates
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Sending your audience to generic domain links damages brand recall and creates security hesitation. Branded domains boost link trust and CTR by up to 34%.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Higher Click-Through Rates</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Users trust links that feature your recognizable brand name rather than random shortened strings from unknown 3rd party providers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Automated Free SSL</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                No manual certbot configurations or costly certificates. We automatically generate and auto-renew TLS encryption certificates on global edge nodes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">100% White-Label Experience</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Remove every mention of KeyLink360. Your visitors only see your own brand name, custom logo, custom favicon, and custom metadata.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 2-STEP DNS SETUP GUIDE */}
      <section id="dns-setup-guide" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Connect Any Registrar in Under 2 Minutes
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Works seamlessly with GoDaddy, Cloudflare, Namecheap, Hostinger, and all standard DNS hosts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-black text-lg flex items-center justify-center">
                1
              </div>
              <h3 className="text-xl font-bold text-white">Add CNAME or A-Record</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Log into your domain provider's DNS management panel and add a single CNAME record pointing your desired subdomain to:
              </p>
              <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-amber-300 border border-slate-800 flex items-center justify-between">
                <span>cname.keylink360.com</span>
                <span className="text-slate-500 text-[10px]">TTL: Auto</span>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-lg flex items-center justify-center">
                2
              </div>
              <h3 className="text-xl font-bold text-white">Instant SSL Verification</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Click "Verify Domain" in your KeyLink360 dashboard. Our automated edge bots immediately detect DNS records and provision an SSL certificate in seconds.
              </p>
              <div className="p-3 rounded-xl bg-emerald-950/40 font-sans text-xs text-emerald-400 border border-emerald-500/30 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero configuration required • 100% automated</span>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-2xl">
            <div className="p-6 bg-slate-900/80 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Custom Domain Architecture Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400">
                    <th className="p-4 font-semibold">Capability</th>
                    <th className="p-4 font-bold text-amber-400">KeyLink360</th>
                    <th className="p-4 font-semibold text-slate-400">Standard Bio Link Platforms</th>
                    <th className="p-4 font-semibold text-slate-400">Enterprise Shortener Services</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  <tr>
                    <td className="p-4 font-medium text-white">Custom Domain Inclusion</td>
                    <td className="p-4 text-emerald-400 font-bold">Standard in Plans</td>
                    <td className="p-4 text-slate-400">Restricted to Top-Tier Plans</td>
                    <td className="p-4 text-slate-400">Enterprise Contract Required</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Automated Free SSL / HTTPS</td>
                    <td className="p-4 text-emerald-400 font-bold">Yes — Automated Edge TLS</td>
                    <td className="p-4 text-emerald-400 font-bold">Yes</td>
                    <td className="p-4 text-emerald-400 font-bold">Yes</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Custom Favicon & Social Preview Tags</td>
                    <td className="p-4 text-emerald-400 font-bold">Fully Customizable</td>
                    <td className="p-4 text-slate-400">Limited Customization</td>
                    <td className="p-4 text-slate-400">Varies by Tier</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Multi-Domain & Subdomain Support</td>
                    <td className="p-4 text-emerald-400 font-bold">Yes — Flexible CNAME & Apex Routing</td>
                    <td className="p-4 text-slate-400">Single Domain per Account</td>
                    <td className="p-4 text-slate-400">High Per-Seat Pricing</td>
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
                  ILLUSTRATIVE SCENARIO • MULTI-BRAND & AGENCY WORKFLOW
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  How Digital Teams & Multi-Brand Portfolios Maintain Custom Domain Authority
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Digital agencies and growing multi-brand companies often manage several domains across marketing campaigns. With KeyLink360 custom domain routing, operators point subdomains (such as <code className="text-amber-300 bg-amber-950/60 px-1 py-0.5 rounded font-mono text-xs">links.brand.com</code>) via simple CNAME records, ensuring every public touchpoint carries verified HTTPS and their own recognizable brand identity.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center font-bold text-amber-300">
                    CD
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Representative Agency & Multi-Brand Architecture</div>
                    <div className="text-xs text-slate-400">Typical Domain Configuration Pattern</div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 flex flex-col gap-3 text-center">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-3xl font-black text-amber-400">Brand First</div>
                  <div className="text-xs text-slate-400">Zero Third-Party Redirects</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-3xl font-black text-emerald-400">Auto TLS</div>
                  <div className="text-xs text-slate-400">Automatic SSL Provisioning</div>
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
            <p className="text-slate-400 text-sm">Everything you need to know about Custom Domains and Free SSL.</p>
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
      <section className="py-16 bg-gradient-to-r from-amber-950/40 via-slate-900 to-yellow-950/40 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Elevate Your Brand with a Custom Domain.
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Connect your custom domain today with automated SSL and 100% whitelabel authority.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/login?mode=signup"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-base shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02]"
            >
              Connect Custom Domain
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
