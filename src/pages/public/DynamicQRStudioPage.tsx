import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  QrCode,
  Sparkles,
  ArrowRight,
  Check,
  Zap,
  Layers,
  Palette,
  Eye,
  Download,
  Share2,
  Lock,
  ChevronDown,
  Printer,
  Smartphone,
  RefreshCw,
  Wifi,
  FileText,
  CreditCard,
  MessageSquare
} from "lucide-react";
import PublicPageLayout from "./PublicPageLayout";

export default function DynamicQRStudioPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "What makes dynamic QR codes different from static QR codes?",
      a: "Static QR codes permanently encode the URL into the pixel pattern, meaning if your URL changes or has a typo, the printed code becomes useless. Dynamic QR codes route through KeyLink360, allowing you to edit the destination link, menu, or file at any time without reprinting the physical QR code."
    },
    {
      q: "Can I download vector SVG and high-resolution print-ready files?",
      a: "Yes! You can download your customized QR codes in scalable SVG vector format (ideal for billboards, store signage, and packaging) as well as ultra-high-res 4K PNG files with transparent backgrounds."
    },
    {
      q: "Can I embed my brand logo in the center of the QR code?",
      a: "Yes. You can upload any square or circular logo PNG/SVG. KeyLink360 utilizes advanced error correction (Level H / 30% redundancy) so the QR code scans reliably across all iOS and Android camera apps even with a centered logo."
    },
    {
      q: "What types of QR codes can I create?",
      a: "You can create Website URL, WhatsApp Chat, vCard Digital Contact Card, Direct UPI Payment, WiFi Auto-Connect, PDF Flyer download, and Google Maps Navigation QR codes."
    },
    {
      q: "Do I get scan tracking analytics?",
      a: "Yes! Every dynamic QR code tracks exact scan counts, unique scanners, city & country locations, device operating systems, and scan peak hours in real-time."
    }
  ];

  return (
    <PublicPageLayout activeGroup="features">
      
      {/* 1. HERO SHOWCASE SECTION */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-fuchsia-300 text-xs font-bold backdrop-blur-md">
                <QrCode className="w-4 h-4 text-fuchsia-400" />
                <span>DYNAMIC QR STUDIO • VECTOR PRINT & EDITABLE DESTINATIONS</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Smart Dynamic <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-pink-400 to-cyan-400">
                  QR Codes That Never
                </span> <br />
                Go Out of Date.
              </h1>

              <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Design stunning, on-brand QR codes with custom logos, color gradients, and frame styles. Change the destination link anytime after printing — no reprint costs ever.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/login?mode=signup"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-indigo-500 hover:from-fuchsia-400 hover:to-indigo-400 text-white font-black text-base shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <span>Design Your First QR Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#qr-features"
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700/80 transition-all flex items-center justify-center gap-2"
                >
                  <span>Explore Design Studio</span>
                </a>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-xs font-medium text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Unlimited Dynamic Edits</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Vector SVG & 4K PNG</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Custom Center Logo</span>
                </div>
              </div>
            </div>

            {/* Visual Custom QR Code Generator Card Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md rounded-3xl p-6 bg-gradient-to-b from-slate-900 via-slate-950 to-[#070b14] border border-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.8)] space-y-6">
                
                {/* QR Display Area */}
                <div className="p-6 rounded-2xl bg-white flex flex-col items-center justify-center relative shadow-xl overflow-hidden group">
                  <div className="w-44 h-44 rounded-xl border-4 border-slate-900/10 p-2 flex items-center justify-center relative">
                    {/* Simulated Stylized QR Code Pattern */}
                    <div className="w-full h-full bg-slate-950 rounded-lg p-2 flex flex-col justify-between relative overflow-hidden">
                      <div className="flex justify-between">
                        <div className="w-9 h-9 border-4 border-fuchsia-500 rounded-md p-1 flex items-center justify-center">
                          <div className="w-4 h-4 bg-cyan-400 rounded-sm" />
                        </div>
                        <div className="w-9 h-9 border-4 border-fuchsia-500 rounded-md p-1 flex items-center justify-center">
                          <div className="w-4 h-4 bg-cyan-400 rounded-sm" />
                        </div>
                      </div>
                      
                      {/* Center Brand Icon */}
                      <div className="absolute inset-0 m-auto w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-cyan-400 p-1.5 flex items-center justify-center shadow-lg">
                        <span className="text-white font-black text-xs">360</span>
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="w-9 h-9 border-4 border-fuchsia-500 rounded-md p-1 flex items-center justify-center">
                          <div className="w-4 h-4 bg-cyan-400 rounded-sm" />
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <div className="w-2 h-2 bg-pink-400 rounded-full" />
                          <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                          <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                          <div className="w-2 h-2 bg-fuchsia-400 rounded-full" />
                          <div className="w-2 h-2 bg-pink-400 rounded-full" />
                          <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-black tracking-wider uppercase border border-slate-300">
                    SCAN TO ORDER & PAY
                  </div>
                </div>

                {/* Studio Live Customizer Toolbar Mockup */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">Studio Customizer</span>
                    <span className="text-fuchsia-400 text-[11px] font-semibold">Live Preview</span>
                  </div>

                  {/* Gradient Color Swatches */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 ring-2 ring-fuchsia-400 cursor-pointer" />
                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 cursor-pointer opacity-70" />
                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 cursor-pointer opacity-70" />
                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 cursor-pointer opacity-70" />
                    <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-700 cursor-pointer opacity-70" />
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2">
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Export SVG / PNG</span>
                    </button>
                    <button className="p-2.5 rounded-xl bg-fuchsia-950/60 hover:bg-fuchsia-900/60 text-fuchsia-300 text-xs font-bold border border-fuchsia-800/60 flex items-center justify-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-fuchsia-400" />
                      <span>Update Link Target</span>
                    </button>
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
              Why Static QR Codes Waste Thousands in Reprint Costs
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Printing static QR codes on packaging, business cards, table stands, and brochures is a huge liability. If a link expires, all marketing materials are ruined.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-fuchsia-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Zero Reprint Risk</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Update restaurant menus, seasonal promotional landing pages, or event schedules anytime from your dashboard without changing the printed QR code.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-fuchsia-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 font-bold">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Custom Brand Aesthetic</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Replace ugly, boring black & white squares with eye-catching gradients, rounded nodes, branded center logos, and custom call-to-action framing.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-fuchsia-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Smart Scan Intelligence</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Know exactly which poster location, flyer drop, or table stand generates the highest foot-traffic scans with real-time geographic telemetry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MULTI-PURPOSE QR MODES */}
      <section id="qr-features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              6+ Smart QR Types Built for Every Business Need
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Generate specialized QR formats tailored for fast interactions and immediate conversions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <MessageSquare className="w-5 h-5 text-emerald-400" />,
                title: "WhatsApp Direct Chat QR",
                desc: "Opens a pre-filled WhatsApp conversation with your business number for instant sales inquiries."
              },
              {
                icon: <CreditCard className="w-5 h-5 text-cyan-400" />,
                title: "Instant UPI & Razorpay QR",
                desc: "Customers scan to open Google Pay, PhonePe, or Paytm with the exact payment amount pre-loaded."
              },
              {
                icon: <FileText className="w-5 h-5 text-fuchsia-400" />,
                title: "Digital PDF & Catalog QR",
                desc: "Scan to download restaurant menus, real estate brochures, or product specification sheets."
              },
              {
                icon: <Wifi className="w-5 h-5 text-amber-400" />,
                title: "One-Tap Guest WiFi QR",
                desc: "Guests scan to automatically connect to your café or office WiFi without typing long passwords."
              },
              {
                icon: <Layers className="w-5 h-5 text-sky-400" />,
                title: "Digital vCard Contact QR",
                desc: "Instantly adds your name, phone, email, company, and bio link into the customer's phone contacts."
              },
              {
                icon: <Sparkles className="w-5 h-5 text-pink-400" />,
                title: "Multi-Link Bio Storefront QR",
                desc: "Scans directly into your interactive KeyLink360 mobile bio website with video embeds and shop items."
              }
            ].map((mode, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                  {mode.icon}
                </div>
                <h4 className="text-base font-bold text-white">{mode.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{mode.desc}</p>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-2xl">
            <div className="p-6 bg-slate-900/80 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Dynamic QR Studio Feature Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400">
                    <th className="p-4 font-semibold">Capability</th>
                    <th className="p-4 font-bold text-fuchsia-400">KeyLink360 Dynamic QR</th>
                    <th className="p-4 font-semibold text-slate-400">Standard Static QR Tools</th>
                    <th className="p-4 font-semibold text-slate-400">Basic Redirect Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  <tr>
                    <td className="p-4 font-medium text-white">Edit Destination After Printing</td>
                    <td className="p-4 text-emerald-400 font-bold">Yes — Instant Dashboard Update</td>
                    <td className="p-4 text-rose-400">No (Requires Reprint)</td>
                    <td className="p-4 text-amber-400">Varies by Provider</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Custom Center Logo & Color Styling</td>
                    <td className="p-4 text-emerald-400 font-bold">Supported with High Error Correction</td>
                    <td className="p-4 text-slate-400">Basic Black & White Only</td>
                    <td className="p-4 text-slate-400">Not Applicable</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Vector SVG & High-Res PNG Export</td>
                    <td className="p-4 text-emerald-400 font-bold">Print-Ready Formats Included</td>
                    <td className="p-4 text-slate-400">Standard Resolution Only</td>
                    <td className="p-4 text-slate-400">Standard Only</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">City & Device Scan Analytics</td>
                    <td className="p-4 text-emerald-400 font-bold">Real-Time Telemetry Dashboard</td>
                    <td className="p-4 text-rose-400">No Analytics Tracking</td>
                    <td className="p-4 text-slate-400">Basic Click Counts Only</td>
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
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-950 border border-fuchsia-500/30 text-fuchsia-400 text-xs font-bold">
                  ILLUSTRATIVE SCENARIO • HOSPITALITY & RETAIL WORKFLOW
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  How Multi-Outlet Businesses Eliminate Menu & Signage Reprint Costs
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Restaurants, cafes, and retail stores frequently update seasonal specials, prices, and direct payment links. By placing durable KeyLink360 Dynamic QR codes on table stands and counters once, operators can update digital menus or promotional targets anytime from their central dashboard without replacing physical hardware or acrylic displays.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <div className="w-10 h-10 rounded-full bg-fuchsia-500/20 flex items-center justify-center font-bold text-fuchsia-300">
                    QR
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Representative Retail & Dining Workflow</div>
                    <div className="text-xs text-slate-400">Typical Multi-Location Deployment Pattern</div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 flex flex-col gap-3 text-center">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-3xl font-black text-emerald-400">Zero Reprint</div>
                  <div className="text-xs text-slate-400">Cost on Menu & Promo Updates</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-3xl font-black text-fuchsia-400">Live Telemetry</div>
                  <div className="text-xs text-slate-400">Scans by City, Device & Hour</div>
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
            <p className="text-slate-400 text-sm">Everything you need to know about Dynamic QR Codes & Printing.</p>
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
                    className={`w-5 h-5 text-fuchsia-400 shrink-0 transition-transform duration-200 ${
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
      <section className="py-16 bg-gradient-to-r from-fuchsia-950/40 via-slate-900 to-pink-950/40 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Create High-Res Dynamic QR Codes in Seconds.
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Design vector-quality QR codes with your company logo, custom colors, and lifetime editable redirect destinations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/login?mode=signup"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-400 hover:to-pink-400 text-white font-black text-base shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02]"
            >
              Start Generating Free
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
