import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Store,
  Sparkles,
  ArrowRight,
  Check,
  Zap,
  MessageSquare,
  QrCode,
  MapPin,
  Clock,
  Phone,
  ChevronDown,
  ShoppingBag,
  Star,
  Layers,
  Smartphone,
  Share2
} from "lucide-react";
import PublicPageLayout from "./PublicPageLayout";

export default function LocalShopsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does 1-tap WhatsApp Ordering work?",
      a: "Customers browse your digital catalog on their phone and tap 'Order on WhatsApp'. KeyLink360 instantly opens WhatsApp with the selected items, total price, and customer details neatly pre-formatted so you can confirm and deliver with zero manual typing."
    },
    {
      q: "Can I print dynamic QR codes for our physical checkout counter and tables?",
      a: "Yes! KeyLink360 generates high-resolution vector QR codes that you can print on acrylic stands, tent cards, product packaging, and bills. You can update your store hours, daily menu, or specials at any time without reprinting the QR codes."
    },
    {
      q: "Can customers easily find our physical shop on Google Maps?",
      a: "Yes! You can add a prominent 'Directions & Location' block that launches Google Maps turn-by-turn navigation directly to your store doorstep with a single tap."
    },
    {
      q: "Can I collect Google 5-Star reviews from walk-in customers?",
      a: "Yes! You can set up a dedicated 'Review Us on Google' QR stand or link that opens your direct Google Business review submission dialog, boosting your local search ranking."
    },
    {
      q: "Do I need technical skills or a domain to get started?",
      a: "None at all! You can launch your complete mobile storefront in under 5 minutes from your smartphone or laptop on our 100% free plan."
    }
  ];

  return (
    <PublicPageLayout activeGroup="solutions">
      
      {/* 1. HERO SHOWCASE SECTION */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-cyan-300 text-xs font-bold backdrop-blur-md">
                <Store className="w-4 h-4 text-cyan-400" />
                <span>SOLUTIONS FOR LOCAL SHOPS & D2C • WHATSAPP COMMERCE & QR STANDS</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Take Your Physical <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">
                  Store Online in 5 Mins.
                </span> <br />
                Direct WhatsApp Orders.
              </h1>

              <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Connect your local retail shop, bakery, café, or D2C brand with nearby customers. Showcase your digital catalog, print counter QR codes, and collect WhatsApp orders with zero commission.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/login?mode=signup"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-black text-base shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <span>Launch Shop Storefront Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#local-toolkit"
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700/80 transition-all flex items-center justify-center gap-2"
                >
                  <span>Explore Shop Features</span>
                </a>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-xs font-medium text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>1-Tap WhatsApp Ordering</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Printable Table & Stand QRs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Google Maps Integration</span>
                </div>
              </div>
            </div>

            {/* Visual Local Shop Mobile Catalog Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm rounded-[38px] p-3 bg-gradient-to-b from-slate-700 via-slate-900 to-slate-950 border-4 border-slate-700/80 shadow-[0_25px_70px_rgba(0,0,0,0.9)]">
                <div className="w-full rounded-[30px] bg-[#070b14] border border-slate-800 p-4 space-y-4">
                  
                  {/* Shop Info Header */}
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-lg">
                      ☕
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">Artisan Roast Café & Bakery</div>
                      <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Open Now • Indiranagar, Bangalore
                      </div>
                    </div>
                  </div>

                  {/* Catalog Item Cards */}
                  <div className="space-y-2">
                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">Almond Croissant & Pour-Over</div>
                        <div className="text-[10px] text-slate-400">Fresh daily bake • 100% Arabica</div>
                        <div className="text-xs font-black text-cyan-400 mt-1">₹280</div>
                      </div>
                      <button className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/40 hover:bg-cyan-500 hover:text-black transition-all">
                        + Add
                      </button>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">Cold Brew Bottle (500ml)</div>
                        <div className="text-[10px] text-slate-400">Steeped 18hrs • Single Origin</div>
                        <div className="text-xs font-black text-cyan-400 mt-1">₹190</div>
                      </div>
                      <button className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/40 hover:bg-cyan-500 hover:text-black transition-all">
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* WhatsApp Order Action */}
                  <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-emerald-400" />
                      <div>
                        <div className="text-xs font-black text-white">Order via WhatsApp</div>
                        <div className="text-[10px] text-emerald-300">Direct instant store confirmation</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>

                  {/* Directions Button */}
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center gap-2 text-xs font-bold text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Get Google Maps Directions (1.2 km)</span>
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
              Why Local Businesses Don't Need Expensive ₹50,000 Websites
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Local customers don't want complex e-commerce carts with 5-step checkouts. They want fast digital menus, quick WhatsApp inquiries, and clear Google Maps directions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Direct WhatsApp Sales</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Receive organized customer orders directly into your personal or business WhatsApp with itemized lists and delivery addresses pre-filled.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Print-Ready Counter QRs</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Generate high-resolution vector QR stands for your billing counter. Walk-in customers scan to see your digital catalog or leave 5-star reviews.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Local Foot-Traffic Booster</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Embed direct Google Maps navigation, operational hours, contact phone numbers, and your latest social media updates on one link.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LOCAL SHOP TOOLKIT MATRIX */}
      <section id="local-toolkit" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Everything Your Local Shop Needs to Win
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Built for bakeries, retail boutiques, restaurants, salons, and neighborhood stores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <MessageSquare className="w-5 h-5 text-emerald-400" />,
                title: "Pre-Filled WhatsApp Chat",
                desc: "Customers click to initiate chat with a pre-formatted inquiry text."
              },
              {
                icon: <ShoppingBag className="w-5 h-5 text-cyan-400" />,
                title: "Digital Product Catalog",
                desc: "Showcase bestselling products, prices, and photos with live in-stock badges."
              },
              {
                icon: <MapPin className="w-5 h-5 text-rose-400" />,
                title: "1-Tap Google Navigation",
                desc: "Directs nearby customers straight to your shop with GPS turn-by-turn directions."
              },
              {
                icon: <Star className="w-5 h-5 text-amber-400" />,
                title: "Google Review Accelerator",
                desc: "Boost your Google Map rankings by prompting happy customers for 5-star reviews."
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
              <h3 className="text-lg font-bold text-white">Local Store Solution Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400">
                    <th className="p-4 font-semibold">Capability</th>
                    <th className="p-4 font-bold text-cyan-400">KeyLink360 Shop Store</th>
                    <th className="p-4 font-semibold text-slate-400">Custom Agency Web Build</th>
                    <th className="p-4 font-semibold text-slate-400">Delivery Marketplace Aggregators</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  <tr>
                    <td className="p-4 font-medium text-white">Direct Order Channel</td>
                    <td className="p-4 text-emerald-400 font-bold">Direct Customer WhatsApp / Phone</td>
                    <td className="p-4 text-emerald-400 font-bold">Direct Website</td>
                    <td className="p-4 text-rose-400">Platform-Mediated Flow</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Platform Order Commissions</td>
                    <td className="p-4 text-emerald-400 font-bold">0% Platform Fee</td>
                    <td className="p-4 text-emerald-400 font-bold">0% (Plus Hosting Fees)</td>
                    <td className="p-4 text-slate-400">Standard Marketplace Commission</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Physical In-Store QR Support</td>
                    <td className="p-4 text-emerald-400 font-bold">Built-in Dynamic Vector QR Codes</td>
                    <td className="p-4 text-slate-400">Requires Extra Setup</td>
                    <td className="p-4 text-slate-400">Standard App QR Only</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Setup & Deployment Time</td>
                    <td className="p-4 text-emerald-400 font-bold">Minutes via Mobile / Web</td>
                    <td className="p-4 text-slate-400">Weeks of Development</td>
                    <td className="p-4 text-slate-400">Listing Onboarding Time</td>
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
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
                  ILLUSTRATIVE SCENARIO • LOCAL RETAIL & FOOD WORKFLOW
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  How Local Bakeries & Neighborhood Stores Streamline Direct Ordering
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Neighborhood businesses like bakeries, florists, and specialty retail shops frequently serve repeat walk-in and local customers. By placing a KeyLink360 Dynamic QR code on their billing counter and packaging, customers can scan the code to view the daily catalog, check current hours, and start a pre-filled WhatsApp conversation with their requested items.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center font-bold text-cyan-300">
                    LS
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Representative Local Retail & Food Workflow</div>
                    <div className="text-xs text-slate-400">Typical Neighborhood Storefront Architecture</div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 flex flex-col gap-3 text-center">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-3xl font-black text-cyan-400">Direct Chat</div>
                  <div className="text-xs text-slate-400">Pre-Formatted WhatsApp Orders</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-3xl font-black text-emerald-400">Dynamic QRs</div>
                  <div className="text-xs text-slate-400">Instant Menu & Hours Updates</div>
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
            <p className="text-slate-400 text-sm">Everything local merchants ask about online catalogs & QR stands.</p>
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
                    className={`w-5 h-5 text-cyan-400 shrink-0 transition-transform duration-200 ${
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
      <section className="py-16 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-teal-950/40 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Launch Your Storefront in 5 Minutes.
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Get your digital catalog, WhatsApp order buttons, and counter QR stands setup today for free.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/login?mode=signup"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-500 hover:from-cyan-300 hover:to-teal-400 text-slate-950 font-black text-base shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02]"
            >
              Start Free Shop
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
