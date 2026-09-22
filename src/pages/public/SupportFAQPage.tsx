import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle,
  Search,
  MessageSquare,
  Mail,
  Phone,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Send,
  LifeBuoy,
  FileQuestion,
  Headphones,
  Check
} from "lucide-react";
import PublicPageLayout from "./PublicPageLayout";

export default function SupportFAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  
  // Contact Form State
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "Technical Question",
    subject: "",
    message: ""
  });

  const categories = [
    { id: "all", label: "All Questions" },
    { id: "ai_whatsapp", label: "AI & WhatsApp Automation" },
    { id: "bio", label: "Bio Websites" },
    { id: "shortlinks", label: "Short Links & UTM" },
    { id: "qr", label: "Dynamic QR Studio" },
    { id: "payments", label: "Razorpay & Payouts" },
    { id: "domains", label: "Custom Domains & SSL" },
    { id: "billing", label: "Account & Pricing" }
  ];

  const allFaqs = [
    {
      cat: "ai_whatsapp",
      q: "How does the AI Sales Assistant work on Bio Websites?",
      a: "Powered by Google Gemini 1.5 Flash Free Tier, your AI Sales Assistant acts as a 24/7 intelligent agent on your public bio page. It answers visitor queries about your products, pricing, and services using your custom FAQs and automatically captures lead phone numbers into your KeyLink360 CRM."
    },
    {
      cat: "ai_whatsapp",
      q: "How does Meta WhatsApp Cloud API (BYOK) work?",
      a: "With Bring Your Own Key (BYOK), you connect your official Meta Cloud API credentials directly. Meta gives you 1,000 free service conversations every month. KeyLink360 uses webhooks to trigger instant WhatsApp order confirmations and Razorpay/UPI payment alerts with ₹0 platform markup."
    },
    {
      cat: "ai_whatsapp",
      q: "What is the 1-Click WhatsApp QR Bot and how is it protected against bans?",
      a: "You can scan a QR code from your dashboard to pair any personal or business WhatsApp number in 10 seconds. KeyLink360 enforces an automatic Anti-Spam Safety Guard with 1.5s - 3.5s human-like jitter delays, max 6 msgs/min burst protection, and a daily message limit tracker (50/100/250 msgs/day) to keep your account 100% safe."
    },
    {
      cat: "ai_whatsapp",
      q: "Are tutorials available in Tamil and Hindi?",
      a: "Yes! Our integrated Help Center and in-app setup guides are fully available in English, தமிழ் (Tamil), and हिन्दी (Hindi) with step-by-step visual screenshot mockups."
    },
    {
      cat: "bio",
      q: "How many bio websites can I create on KeyLink360?",
      a: "You can create unlimited mobile bio websites even on the Starter Free tier. You can create separate dedicated landing pages for your Instagram, TikTok, LinkedIn, or client campaigns."
    },
    {
      cat: "bio",
      q: "Can I embed playable YouTube videos, Spotify tracks, and forms?",
      a: "Yes! KeyLink360 supports 27+ modular dynamic blocks including YouTube players, Spotify embeds, product cards, WhatsApp direct chats, lead capture forms, and custom CSS styling."
    },
    {
      cat: "shortlinks",
      q: "Can I edit the destination URL of a short link after publishing?",
      a: "Yes! All short links created on KeyLink360 are dynamic. You can update the destination URL at any time without reprinting marketing materials or breaking existing links."
    },
    {
      cat: "shortlinks",
      q: "What detailed click analytics and UTM data do I get?",
      a: "You get real-time analytics including total vs unique clicks, geographic country/city breakdown, device operating systems (iOS, Android, Windows, Mac), referrers (Instagram, YouTube, Twitter/X), and peak hour heatmaps."
    },
    {
      cat: "shortlinks",
      q: "How does Deep App Linking for Amazon and Flipkart work?",
      a: "Our smart edge routing automatically detects the shopper's mobile device and executes deep universal app links directly into Amazon, Flipkart, or Meesho mobile apps where the buyer is already logged in."
    },
    {
      cat: "qr",
      q: "What makes dynamic QR codes better than static QR codes?",
      a: "Static QR codes permanently hardcode URLs, so if the link changes, the printed material is ruined. Dynamic QR codes route through KeyLink360, allowing you to edit the destination link, menu, or file anytime after printing."
    },
    {
      cat: "qr",
      q: "Can I download vector SVG format for billboards and packaging?",
      a: "Yes! You can download your customized QR codes in scalable SVG vector format (ideal for billboards, store signage, and packaging) as well as ultra-high-resolution 4K PNG files."
    },
    {
      cat: "qr",
      q: "Can I put my company logo in the center of the QR code?",
      a: "Yes. KeyLink360 utilizes advanced error correction (Level H / 30% redundancy) so the QR code scans reliably across all camera apps even with a centered logo."
    },
    {
      cat: "payments",
      q: "Does KeyLink360 take any percentage or commission from my sales?",
      a: "No! KeyLink360 charges 0% platform commission on your sales. You connect your own Razorpay account credentials (Key ID & Secret), and 100% of customer funds are settled directly into your linked bank account."
    },
    {
      cat: "payments",
      q: "How does instant digital download delivery work?",
      a: "When a customer successfully completes payment for a digital product (PDF, video, preset, template, ZIP), KeyLink360 automatically reveals the instant download link and sends an email invoice receipt with the file link."
    },
    {
      cat: "domains",
      q: "How do I connect my custom domain (e.g., links.mybrand.com)?",
      a: "Simply add a CNAME record in your domain registrar (GoDaddy, Cloudflare, Namecheap, Hostinger) pointing your subdomain to cname.keylink360.com. Our automated system handles SSL certificates within minutes."
    },
    {
      cat: "domains",
      q: "Do I have to pay extra for an SSL security certificate?",
      a: "No! Automated SSL certificates are provisioned and auto-renewed for free on every connected custom domain via global edge CDN routing."
    },
    {
      cat: "billing",
      q: "What is included in the ₹7 / 7-Day New User Trial offer?",
      a: "All new first-time registered users can try the full Pro feature suite (normally ₹199/month) for just ₹7 for 7 days. You can test custom domains, advanced analytics, and 0% commission payment tools risk-free."
    },
    {
      cat: "billing",
      q: "How do I cancel or upgrade my subscription plan?",
      a: "You can upgrade or cancel your subscription at any time directly from your Account Settings in the dashboard workspace. There are no lock-ins or cancellation fees."
    },
    {
      cat: "billing",
      q: "Do you offer GST invoices for businesses in India?",
      a: "Yes! Enter your company GSTIN during checkout to receive automatic GST-compliant tax invoices for your business expense claims."
    }
  ];

  const filteredFaqs = useMemo(() => {
    return allFaqs.filter((faq) => {
      const matchesCategory = activeCategory === "all" || faq.cat === activeCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <PublicPageLayout activeGroup="support">
      
      {/* 1. HERO SEARCH SECTION */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-cyan-300 text-xs font-bold backdrop-blur-md">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>HELP & SUPPORT CENTER • 24/7 ASSISTANCE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
            How Can We <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
              Help You Grow Today?
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Search our comprehensive knowledgebase, explore step-by-step setup guides, or connect directly with our dedicated technical support team.
          </p>

          {/* Real-time Search Input Bar */}
          <div className="max-w-2xl mx-auto pt-4">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions (e.g. custom domain, QR vector, Razorpay, UTM tags)..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 text-sm sm:text-base shadow-2xl transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Operational Status Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>All Systems Operational • 99.99% Global Uptime</span>
          </div>
        </div>
      </section>

      {/* 2. DIRECT SUPPORT CHANNELS */}
      <section className="py-12 border-y border-slate-800/60 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Direct Email Support</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Send inquiries regarding account setup, domains, or feature assistance.
              </p>
              <a
                href="mailto:support@keylink360.today"
                className="text-sm font-black text-cyan-300 pt-1 block hover:underline"
              >
                support@keylink360.today
              </a>
              <div className="text-[10px] text-slate-500">Official Inquiries & Helpdesk</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Knowledgebase Guides</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Step-by-step walkthroughs for custom domain DNS, QR vectors, and bio pages.
              </p>
              <div className="text-sm font-black text-emerald-300 pt-1">
                Self-Service Documentation
              </div>
              <div className="text-[10px] text-slate-500">Available on all public & app pages</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Headphones className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Account Inquiries</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Assistance with subscription upgrades, workspace questions, and enterprise needs.
              </p>
              <a
                href="mailto:support@keylink360.today?subject=Account%20Inquiry"
                className="text-sm font-black text-indigo-300 pt-1 block hover:underline"
              >
                support@keylink360.today
              </a>
              <div className="text-[10px] text-slate-500">Account & Billing Assistance</div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. SEARCHABLE ACCORDION KNOWLEDGEBASE */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Knowledgebase & FAQs</h2>
            <p className="text-slate-400 text-sm">Browse common questions categorized by feature and tool.</p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                    : "bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Accordion FAQ Items */}
          <div className="space-y-4 pt-4">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 p-8 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
                <FileQuestion className="w-10 h-10 text-slate-500 mx-auto" />
                <div className="text-base font-bold text-slate-300">No questions found matching "{searchQuery}"</div>
                <div className="text-xs text-slate-400">Try searching for a different keyword or send us an email inquiry below.</div>
              </div>
            ) : (
              filteredFaqs.map((faq, index) => (
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
              ))
            )}
          </div>

        </div>
      </section>

      {/* 4. DIRECT INQUIRY COMPOSER */}
      <section className="py-20 border-t border-slate-800/60 bg-gradient-to-b from-slate-950 to-[#04060c]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>SEND A MESSAGE</span>
            </div>
            <h2 className="text-3xl font-black text-white">Can't Find Your Answer?</h2>
            <p className="text-slate-400 text-sm">
              Submit your inquiry below to compose a direct email to our team at <span className="text-cyan-300 font-mono">support@keylink360.today</span>.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-2xl">
            {formSubmitted ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white">Inquiry Ready!</h3>
                <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
                  Thank you, <strong className="text-white">{formData.name || "User"}</strong>. Your query has been prepared for <strong className="text-white">support@keylink360.today</strong>. If your mail client did not automatically launch, you can directly email us with your details.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <a
                    href={`mailto:support@keylink360.today?subject=${encodeURIComponent(`[${formData.category}] ${formData.subject}`)}&body=${encodeURIComponent(`From: ${formData.name} (${formData.email})\n\n${formData.message}`)}`}
                    className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all"
                  >
                    Open Mail Client
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setFormSubmitted(false);
                      setFormData({ name: "", email: "", category: "Technical Question", subject: "", message: "" });
                    }}
                    className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
                  >
                    Reset Form
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setFormSubmitted(true);
                  const mailtoUrl = `mailto:support@keylink360.today?subject=${encodeURIComponent(`[${formData.category}] ${formData.subject}`)}&body=${encodeURIComponent(`From: ${formData.name} (${formData.email})\n\n${formData.message}`)}`;
                  window.open(mailtoUrl, "_blank");
                }}
                className="space-y-4"
              >
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Vignesh Kumar"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@company.com"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Inquiry Topic</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    >
                      <option>Technical Question</option>
                      <option>Custom Domain & DNS Setup</option>
                      <option>Razorpay & Payouts</option>
                      <option>Dynamic QR Vectors</option>
                      <option>Billing & Enterprise Plan</option>
                      <option>Feature Request</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Subject</label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Brief summary of your query"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Detailed Message</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe how we can help you with your links, domain, or account..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Support Inquiry</span>
                </button>

              </form>
            )}
          </div>

        </div>
      </section>

      {/* 5. CTA BANNER */}
      <section className="py-16 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ready to Take Your Links to the Next Level?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Join thousands of creators, brands, and businesses scaling with KeyLink360.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/login?mode=signup"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-black text-base shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02]"
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
