import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Copy,
  Clock,
  Send,
  MessageCircle,
  Play,
  Heart,
  MessageSquare,
  Instagram,
  Youtube,
  ShieldCheck,
  Flame,
  Zap,
  Tag,
  Menu,
  X
} from "lucide-react";
import type { BlockRecord } from "../../../lib/bioBlocks";
import type { BlockRendererContext, BlockRendererHandlers, BlockRenderMode } from "../blockTypes";
import { CanvaInlineText, CanvaInlineImage } from "../CanvaDirectEditSuite";

interface PersonaBlockProps {
  block: BlockRecord;
  mode: BlockRenderMode;
  context: BlockRendererContext;
  handlers: BlockRendererHandlers;
}

/**
 * 20. Navbar Block:
 * Modern floating glass navigation bar with brand logo, links, mobile hamburger drawer, and action CTA.
 */
export function NavbarBlockView({ block, mode, handlers }: PersonaBlockProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const brandName = (block.brandName as string) || block.label || "KEYLINKS 360";
  const tagline = (block.tagline as string) || "";
  const brandLogo = (block.brandLogo as string) || "";
  const ctaLabel = (block.ctaLabel as string) || "Get Started ⚡";
  const ctaUrl = (block.ctaUrl as string) || "https://keylink360.in";
  const isGlassmorphic = block.isGlassmorphic !== false;
  const showCtaOnMobile = block.showCtaOnMobile !== false;
  const logoSize = (block.logoSize as string) || "md";
  const navLayout = (block.navLayout as string) || "default"; // "default" | "split" | "centered"
  const mobileMenuType = (block.mobileMenuType as string) || "dropdown";

  const navLinks = Array.isArray(block.navLinks)
    ? (block.navLinks as Array<{ id: string; label: string; url: string }>)
    : [
        { id: "nl_1", label: "Features", url: "#features" },
        { id: "nl_2", label: "Pricing", url: "#pricing" },
        { id: "nl_3", label: "Reviews", url: "#reviews" }
      ];

  const handleUpdate = (field: string, val: any) => {
    handlers.onInlineTextChange?.(block.id, field, val);
  };

  const handleCta = () => {
    if (mode === "preview") {
      handlers.onToast?.(`Nav CTA clicked: ${ctaLabel} -> ${ctaUrl}`);
      return;
    }
    handlers.onExternalLink?.(ctaUrl, ctaLabel);
  };

  const handleNavLinkClick = (link: { label: string; url: string }) => {
    setMobileMenuOpen(false);
    if (mode === "preview") {
      handlers.onToast?.(`Nav link: ${link.label} -> ${link.url}`);
      return;
    }
    if (link.url.startsWith("#")) {
      const el = document.querySelector(link.url);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    handlers.onExternalLink?.(link.url, link.label);
  };

  const logoDimensionClass =
    logoSize === "sm"
      ? "h-6 w-6"
      : logoSize === "lg"
      ? "h-9 w-9 sm:h-10 sm:w-10"
      : "h-7 w-7 sm:h-8 sm:w-8";

  return (
    <div className="w-full relative z-40 max-w-full box-border">
      <header
        className={`w-full rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3 transition-all ${
          isGlassmorphic
            ? "bg-slate-900/85 backdrop-blur-xl border border-white/10 shadow-lg text-white"
            : "bg-slate-900 border border-slate-800 text-white shadow-md"
        } ${navLayout === "centered" ? "sm:justify-center sm:gap-6" : ""}`}
      >
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5 min-w-0">
          {brandLogo ? (
            <img
              src={brandLogo}
              alt={brandName}
              className={`${logoDimensionClass} rounded-lg object-contain bg-white/10 p-0.5 shrink-0`}
            />
          ) : (
            <div
              className={`${logoDimensionClass} rounded-lg bg-indigo-600 flex items-center justify-center font-black text-xs text-white shadow-inner shrink-0`}
            >
              ⚡
            </div>
          )}
          <div className="min-w-0 text-left">
            <div className="font-display font-black text-xs sm:text-sm tracking-tight text-white truncate">
              <CanvaInlineText
                value={brandName}
                onChange={(val) => handleUpdate("brandName", val)}
                enabled={Boolean(handlers.isInlineEditingAllowed)}
                placeholder="Brand..."
                className="font-black text-white"
              />
            </div>
            {tagline ? (
              <p className="text-[9px] text-slate-400 font-medium truncate">
                <CanvaInlineText
                  value={tagline}
                  onChange={(val) => handleUpdate("tagline", val)}
                  enabled={Boolean(handlers.isInlineEditingAllowed)}
                  placeholder="Tagline..."
                  className="text-slate-400"
                />
              </p>
            ) : null}
          </div>
        </div>

        {/* Desktop / Tablet Nav Links */}
        <nav
          className={`hidden md:flex items-center gap-3 text-xs font-semibold text-slate-300 ${
            navLayout === "centered" ? "mx-auto" : navLayout === "split" ? "mx-auto" : ""
          }`}
        >
          {navLinks.map((link, idx) => (
            <a
              key={link.id || idx}
              href={link.url}
              onClick={(e) => {
                e.preventDefault();
                handleNavLinkClick(link);
              }}
              className="px-2.5 py-1 rounded-lg hover:text-white hover:bg-white/5 transition-all"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA + Mobile Toggle Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop / Tablet CTA */}
          {ctaLabel && (
            <button
              type="button"
              onClick={handleCta}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all shrink-0 cursor-pointer"
            >
              <CanvaInlineText
                value={ctaLabel}
                onChange={(val) => handleUpdate("ctaLabel", val)}
                enabled={Boolean(handlers.isInlineEditingAllowed)}
                placeholder="CTA..."
                className="font-bold text-white"
              />
            </button>
          )}

          {/* Mobile Hamburger Toggle Button */}
          {navLinks.length > 0 && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all cursor-pointer flex items-center justify-center"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          )}
        </div>
      </header>

      {/* Mobile Menu Dropdown / Accordion Drawer */}
      {mobileMenuOpen && (
        <div
          className={`md:hidden mt-2 w-full rounded-2xl p-3 space-y-2 border shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${
            isGlassmorphic
              ? "bg-slate-900/95 backdrop-blur-xl border-white/10 text-white"
              : "bg-slate-900 border-slate-800 text-white"
          }`}
        >
          <div className="space-y-1">
            {navLinks.map((link, idx) => (
              <button
                key={link.id || idx}
                type="button"
                onClick={() => handleNavLinkClick(link)}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 active:bg-white/15 transition-all flex items-center justify-between"
              >
                <span>{link.label}</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
              </button>
            ))}
          </div>

          {showCtaOnMobile && ctaLabel && (
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleCta();
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <span>{ctaLabel}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 21. Footer Block:
 * Clean multi-link footer with brand, copyright, social icons, legal links.
 */
export function FooterBlockView({ block, mode, handlers }: PersonaBlockProps) {
  const brandName = (block.brandName as string) || block.label || "KeyLinks360 Studio";
  const tagline = (block.tagline as string) || "The #1 biolink & landing page engine.";
  const copyrightText = (block.copyrightText as string) || `© ${new Date().getFullYear()} KeyLinks360. All rights reserved.`;
  const supportEmail = (block.supportEmail as string) || "support@keylinks360.in";
  const badgeText = (block.badgeText as string) || "⚡ Powered by KeyLinks360";
  const footerLinks = Array.isArray(block.footerLinks)
    ? (block.footerLinks as Array<{ id: string; label: string; url: string }>)
    : [
        { id: "fl_1", label: "Privacy Policy", url: "#" },
        { id: "fl_2", label: "Terms of Service", url: "#" },
        { id: "fl_3", label: "Help & Support", url: "#" }
      ];

  const handleUpdate = (field: string, val: any) => {
    handlers.onInlineTextChange?.(block.id, field, val);
  };

  return (
    <footer className="w-full bg-slate-950/80 border border-slate-800 rounded-3xl p-5 sm:p-6 text-slate-400 text-xs space-y-4 shadow-lg text-center">
      <div className="space-y-1">
        <h4 className="font-display font-extrabold text-sm text-white">
          <CanvaInlineText
            value={brandName}
            onChange={(val) => handleUpdate("brandName", val)}
            enabled={Boolean(handlers.isInlineEditingAllowed)}
            placeholder="Brand Name..."
            className="font-bold text-white"
          />
        </h4>
        <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
          <CanvaInlineText
            value={tagline}
            onChange={(val) => handleUpdate("tagline", val)}
            enabled={Boolean(handlers.isInlineEditingAllowed)}
            placeholder="Tagline..."
            className="text-slate-400"
          />
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] pt-1">
        {footerLinks.map((fl, idx) => (
          <a
            key={fl.id || idx}
            href={fl.url}
            onClick={(e) => {
              if (mode === "preview") {
                e.preventDefault();
                handlers.onToast?.(`Footer Link: ${fl.label}`);
              }
            }}
            className="hover:text-indigo-400 transition-colors underline-offset-2 hover:underline"
          >
            {fl.label}
          </a>
        ))}
      </div>

      <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500">
        <span>
          <CanvaInlineText
            value={copyrightText}
            onChange={(val) => handleUpdate("copyrightText", val)}
            enabled={Boolean(handlers.isInlineEditingAllowed)}
            placeholder="Copyright..."
            className="text-slate-500"
          />
        </span>
        {badgeText && (
          <span className="inline-flex items-center gap-1 font-mono text-[9px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
            {badgeText}
          </span>
        )}
      </div>
    </footer>
  );
}

/**
 * 22. Main Feature Block:
 * High-converting 4-pillar grid with badges, icons, and CTA.
 */
export function MainFeatureBlockView({ block, mode, handlers }: PersonaBlockProps) {
  const badge = (block.badge as string) || "🔥 Supercharged Features";
  const headline = (block.headline as string) || block.label || "Everything Built For Unstoppable Business Growth";
  const subheadline = (block.subheadline as string) || (block.value as string) || "Replace 10+ expensive tools with one blazing fast, all-in-one conversion machine.";
  const ctaText = (block.ctaText as string) || "Explore All Features →";
  const ctaUrl = (block.ctaUrl as string) || "https://keylink360.in";
  const features = Array.isArray(block.features)
    ? (block.features as Array<{ id: string; icon: string; title: string; desc: string }>)
    : [
        { id: "mf_1", icon: "⚡", title: "Instant Fast Loading", desc: "Built with Next-Gen edge CDN for sub-second speeds worldwide." },
        { id: "mf_2", icon: "💳", title: "Razorpay & UPI Payments", desc: "Accept 1-click payments directly on your biolink without friction." },
        { id: "mf_3", icon: "🤖", title: "24/7 AI Sales Bot", desc: "Automate customer inquiries and capture warm buyer leads 24/7." },
        { id: "mf_4", icon: "🌐", title: "Custom Domain Connection", desc: "Map your own .com or .in domain with automatic SSL security." }
      ];

  const handleUpdate = (field: string, val: any) => {
    handlers.onInlineTextChange?.(block.id, field, val);
  };

  const handleFeatureUpdate = (idx: number, key: "icon" | "title" | "desc", val: string) => {
    const updated = [...features];
    updated[idx] = { ...updated[idx], [key]: val };
    handleUpdate("features", updated);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5 text-white">
      <div className="text-center max-w-lg mx-auto space-y-2">
        {badge && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <Sparkles className="h-3 w-3" />
            <CanvaInlineText
              value={badge}
              onChange={(val) => handleUpdate("badge", val)}
              enabled={Boolean(handlers.isInlineEditingAllowed)}
              placeholder="Badge..."
              className="font-extrabold"
            />
          </span>
        )}
        <h3 className="font-display font-black text-lg sm:text-2xl text-white tracking-tight leading-snug">
          <CanvaInlineText
            value={headline}
            onChange={(val) => handleUpdate("headline", val)}
            enabled={Boolean(handlers.isInlineEditingAllowed)}
            placeholder="Headline..."
            className="font-black text-white"
          />
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          <CanvaInlineText
            value={subheadline}
            onChange={(val) => handleUpdate("subheadline", val)}
            enabled={Boolean(handlers.isInlineEditingAllowed)}
            placeholder="Subheadline..."
            className="text-slate-300"
          />
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {features.map((feat, idx) => (
          <div
            key={feat.id || idx}
            className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-indigo-500/40 transition-all text-left space-y-1.5 group"
          >
            <div className="text-2xl">{feat.icon}</div>
            <h4 className="font-bold text-xs sm:text-sm text-white">
              <CanvaInlineText
                value={feat.title}
                onChange={(val) => handleFeatureUpdate(idx, "title", val)}
                enabled={Boolean(handlers.isInlineEditingAllowed)}
                placeholder="Title..."
                className="font-bold text-white"
              />
            </h4>
            <div className="text-[11px] text-slate-400 leading-snug">
              <CanvaInlineText
                value={feat.desc}
                onChange={(val) => handleFeatureUpdate(idx, "desc", val)}
                enabled={Boolean(handlers.isInlineEditingAllowed)}
                placeholder="Desc..."
                className="text-slate-400 text-[11px]"
              />
            </div>
          </div>
        ))}
      </div>

      {ctaText && (
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => {
              if (mode === "preview") {
                handlers.onToast?.(`CTA action: ${ctaText} -> ${ctaUrl}`);
                return;
              }
              handlers.onExternalLink?.(ctaUrl, ctaText);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <CanvaInlineText
              value={ctaText}
              onChange={(val) => handleUpdate("ctaText", val)}
              enabled={Boolean(handlers.isInlineEditingAllowed)}
              placeholder="Action text..."
              className="font-bold text-white"
            />
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * 23. Auto Slider / Image Carousel Block:
 * Autoplay carousel with pagination dots, forward/back arrows, and clickable slides.
 */
export function AutoSliderBlockView({ block, mode, handlers }: PersonaBlockProps) {
  const slides = Array.isArray(block.slides) && block.slides.length > 0
    ? (block.slides as Array<{ id: string; imageUrl: string; title: string; caption: string; linkUrl: string }>)
    : [
        {
          id: "sl_1",
          imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
          title: "High Converting Analytics Dashboard",
          caption: "Track real-time visitor traffic, clicks, and sales.",
          linkUrl: "https://keylink360.in"
        },
        {
          id: "sl_2",
          imageUrl: "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&q=80&w=800",
          title: "Developer Grade Responsive Mockups",
          caption: "Pixel-perfect mobile, tablet, and 4K desktop previews.",
          linkUrl: "https://keylink360.in"
        },
        {
          id: "sl_3",
          imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
          title: "Direct E-Commerce & Product Checkout",
          caption: "Sell digital downloads, courses, and physical merchandise.",
          linkUrl: "https://keylink360.in"
        }
      ];

  const autoplay = block.autoplay !== false;
  const intervalSec = typeof block.intervalSeconds === "number" ? block.intervalSeconds : 4;
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (!autoplay || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % slides.length);
    }, intervalSec * 1000);
    return () => clearInterval(timer);
  }, [autoplay, intervalSec, slides.length]);

  const nextSlide = () => setCurrentIdx((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentIdx((prev) => (prev - 1 + slides.length) % slides.length);

  const activeSlide = slides[currentIdx] || slides[0];

  const handleSlideClick = (slide: typeof activeSlide) => {
    if (mode === "preview") {
      handlers.onToast?.(`Slide clicked: ${slide.title} -> ${slide.linkUrl}`);
      return;
    }
    if (slide.linkUrl) handlers.onExternalLink?.(slide.linkUrl, slide.title);
  };

  return (
    <div className="w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl relative group select-none">
      {/* Slide Image Box */}
      <div
        className="relative aspect-[16/9] w-full overflow-hidden cursor-pointer"
        onClick={() => handleSlideClick(activeSlide)}
      >
        <img
          src={activeSlide.imageUrl}
          alt={activeSlide.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Slide Overlay Info */}
        <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 text-left text-white space-y-1">
          <h4 className="font-display font-extrabold text-sm sm:text-base text-white tracking-tight drop-shadow">
            {activeSlide.title}
          </h4>
          {activeSlide.caption && (
            <p className="text-[11px] text-slate-300 line-clamp-2 drop-shadow">
              {activeSlide.caption}
            </p>
          )}
        </div>
      </div>

      {/* Prev / Next Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-2.5 right-4 flex items-center gap-1.5 z-10">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIdx(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                currentIdx === idx ? "w-5 bg-indigo-500" : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 24. Google Form / Embedded Form Block:
 * Responsive Google Form embed with fallback custom interactive lead form.
 */
export function GoogleFormBlockView({ block, mode, handlers }: PersonaBlockProps) {
  const formTitle = (block.formTitle as string) || block.label || "Official Client Inquiry & Feedback Form";
  const formDescription = (block.formDescription as string) || "Fill out the questionnaire below and we will contact you shortly.";
  const embedUrl = (block.embedUrl as string) || "";
  const submitButtonText = (block.submitButtonText as string) || "Submit Inquiry 🚀";
  const successMessage = (block.successMessage as string) || "🎉 Response received successfully!";

  const [formData, setFormData] = useState<Record<string, string>>({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "preview") {
      handlers.onToast?.(`Form simulated submit: ${JSON.stringify(formData)}`);
      setSubmitted(true);
      return;
    }
    handlers.onLeadSubmit?.(block.id, formData.email || formData.phone, "");
    setSubmitted(true);
  };

  const handleUpdate = (field: string, val: any) => {
    handlers.onInlineTextChange?.(block.id, field, val);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl text-left space-y-4">
      <div className="text-center space-y-1">
        <h3 className="font-display font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
          <CanvaInlineText
            value={formTitle}
            onChange={(val) => handleUpdate("formTitle", val)}
            enabled={Boolean(handlers.isInlineEditingAllowed)}
            placeholder="Form Title..."
            className="font-extrabold text-slate-900 dark:text-white"
          />
        </h3>
        {formDescription && (
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            <CanvaInlineText
              value={formDescription}
              onChange={(val) => handleUpdate("formDescription", val)}
              enabled={Boolean(handlers.isInlineEditingAllowed)}
              placeholder="Description..."
              className="text-slate-500 dark:text-slate-400"
            />
          </p>
        )}
      </div>

      {embedUrl ? (
        <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50">
          <iframe
            src={embedUrl}
            title={formTitle}
            className="w-full h-full border-0"
            loading="lazy"
          />
        </div>
      ) : submitted ? (
        <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
          <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">{successMessage}</h4>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">We will reach out to you within a few hours.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Vignesh"
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@gmail.com"
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">WhatsApp / Phone *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Requirement / Note *</label>
            <textarea
              required
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Tell us what you are looking for..."
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{submitButtonText}</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      )}
    </div>
  );
}

/**
 * 25. Flash Offer / Promotion / Coupon Countdown Block:
 * Urgency promotion with countdown timer, discount badge, 1-click code copy, CTA.
 */
export function FlashOfferBlockView({ block, mode, handlers }: PersonaBlockProps) {
  const badgeText = (block.badgeText as string) || "⚡ LIMITED TIME SPECIAL OFFER";
  const discountHeadline = (block.discountHeadline as string) || block.label || "FLAT 50% OFF TODAY ONLY";
  const offerDescription = (block.offerDescription as string) || (block.value as string) || "Upgrade to Pro & get free custom domain + AI Bot included!";
  const couponCode = (block.couponCode as string) || "SUPER50";
  const originalPrice = (block.originalPrice as string) || "₹1,999";
  const salePrice = (block.salePrice as string) || "₹999";
  const ctaLabel = (block.ctaLabel as string) || "Claim Discount Now 🛒";
  const ctaUrl = (block.ctaUrl as string) || "https://keylink360.in";
  const termsNote = (block.termsNote as string) || "* Applicable for first 100 users only.";

  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    handlers.onToast?.(`✓ Coupon code "${couponCode}" copied to clipboard!`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleUpdate = (field: string, val: any) => {
    handlers.onInlineTextChange?.(block.id, field, val);
  };

  const handleCta = () => {
    if (mode === "preview") {
      handlers.onToast?.(`Claim Offer clicked: ${couponCode} -> ${ctaUrl}`);
      return;
    }
    handlers.onExternalLink?.(ctaUrl, ctaLabel);
  };

  return (
    <div className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-950 via-slate-900 to-indigo-950 border-2 border-rose-500/40 p-5 sm:p-7 text-white shadow-2xl text-center space-y-4">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

      {badgeText && (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 border border-rose-400/40 text-rose-300 tracking-wider shadow-inner">
          <Flame className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
          <CanvaInlineText
            value={badgeText}
            onChange={(val) => handleUpdate("badgeText", val)}
            enabled={Boolean(handlers.isInlineEditingAllowed)}
            placeholder="Badge..."
            className="font-black text-rose-300"
          />
        </span>
      )}

      <div className="space-y-1.5 relative z-10">
        <h3 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight leading-snug">
          <CanvaInlineText
            value={discountHeadline}
            onChange={(val) => handleUpdate("discountHeadline", val)}
            enabled={Boolean(handlers.isInlineEditingAllowed)}
            placeholder="Headline..."
            className="font-black text-white"
          />
        </h3>
        <p className="text-xs text-rose-200/80 max-w-md mx-auto leading-relaxed">
          <CanvaInlineText
            value={offerDescription}
            onChange={(val) => handleUpdate("offerDescription", val)}
            enabled={Boolean(handlers.isInlineEditingAllowed)}
            placeholder="Offer description..."
            className="text-rose-200/80"
          />
        </p>
      </div>

      {/* Price pill & 1-Click Coupon Code Box */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
        {(salePrice || originalPrice) && (
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3.5 py-2 rounded-2xl">
            {originalPrice && (
              <span className="text-xs text-slate-400 line-through">{originalPrice}</span>
            )}
            <span className="font-display font-black text-base text-emerald-400">{salePrice}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-mono font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Click to copy coupon code"
        >
          <Tag className="h-3.5 w-3.5 text-rose-400" />
          <span>{couponCode}</span>
          <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold">
            {copied ? "COPIED! ✓" : "TAP TO COPY"}
          </span>
        </button>
      </div>

      {/* Claim CTA Button */}
      <div className="pt-2 relative z-10">
        <button
          type="button"
          onClick={handleCta}
          className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-rose-600/30 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
        >
          <CanvaInlineText
            value={ctaLabel}
            onChange={(val) => handleUpdate("ctaLabel", val)}
            enabled={Boolean(handlers.isInlineEditingAllowed)}
            placeholder="CTA..."
            className="font-extrabold text-white"
          />
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {termsNote && (
        <p className="text-[10px] text-slate-400 font-mono relative z-10">
          <CanvaInlineText
            value={termsNote}
            onChange={(val) => handleUpdate("termsNote", val)}
            enabled={Boolean(handlers.isInlineEditingAllowed)}
            placeholder="Terms note..."
            className="text-slate-400"
          />
        </p>
      )}
    </div>
  );
}

/**
 * 26. Community Hub Block (Discord / WhatsApp / Telegram Group):
 * Live member badge, group avatar/banner, perks list, 1-click Join CTA.
 */
export function CommunityHubBlockView({ block, mode, handlers }: PersonaBlockProps) {
  const groupName = (block.groupName as string) || block.label || "KeyLinks VIP Founders Community";
  const memberCount = (block.memberCount as string) || "4,820+ Active Members";
  const onlineCount = (block.onlineCount as string) || "340 Online Now";
  const groupDescription = (block.groupDescription as string) || (block.value as string) || "Get daily marketing tips, launch feedback, and network with creators.";
  const inviteUrl = (block.inviteUrl as string) || "https://chat.whatsapp.com";
  const joinButtonLabel = (block.joinButtonLabel as string) || "Join Free Community Group 🚀";
  const perks = Array.isArray(block.perks)
    ? (block.perks as string[])
    : [
        "🔥 Daily Growth Hacks & Video Tutorials",
        "🤝 1-on-1 Feedback from top Creators",
        "🎁 Exclusive Pro Themes & Free Templates"
      ];

  const handleUpdate = (field: string, val: any) => {
    handlers.onInlineTextChange?.(block.id, field, val);
  };

  const handleJoin = () => {
    if (mode === "preview") {
      handlers.onToast?.(`Join Community clicked -> ${inviteUrl}`);
      return;
    }
    handlers.onExternalLink?.(inviteUrl, joinButtonLabel);
  };

  return (
    <div className="w-full rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 p-5 sm:p-7 text-white shadow-xl text-left space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-xl text-emerald-400 shadow-inner">
            💬
          </div>
          <div>
            <h3 className="font-display font-extrabold text-sm sm:text-base text-white leading-tight">
              <CanvaInlineText
                value={groupName}
                onChange={(val) => handleUpdate("groupName", val)}
                enabled={Boolean(handlers.isInlineEditingAllowed)}
                placeholder="Group Name..."
                className="font-bold text-white"
              />
            </h3>
            <span className="text-[10px] text-slate-300 font-mono block">
              {memberCount}
            </span>
          </div>
        </div>

        {onlineCount && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{onlineCount}</span>
          </span>
        )}
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        <CanvaInlineText
          value={groupDescription}
          onChange={(val) => handleUpdate("groupDescription", val)}
          enabled={Boolean(handlers.isInlineEditingAllowed)}
          placeholder="Description..."
          className="text-slate-300"
        />
      </p>

      {/* Perks List */}
      <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950/50 border border-white/10">
        {perks.map((pk, idx) => (
          <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>{pk}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleJoin}
        className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <MessageCircle className="h-4 w-4" />
        <CanvaInlineText
          value={joinButtonLabel}
          onChange={(val) => handleUpdate("joinButtonLabel", val)}
          enabled={Boolean(handlers.isInlineEditingAllowed)}
          placeholder="Join CTA..."
          className="font-extrabold text-white"
        />
      </button>
    </div>
  );
}

/**
 * 27. YouTube Channel / Video Stream Block:
 * Channel header with subscriber badge, video preview, "Subscribe on YouTube" CTA.
 */
export function YouTubeChannelBlockView({ block, mode, handlers }: PersonaBlockProps) {
  const channelName = (block.channelName as string) || block.label || "Vignesh Tech & Business";
  const channelHandle = (block.channelHandle as string) || "@keylinks360";
  const channelAvatar = (block.channelAvatar as string) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150";
  const subscriberCount = (block.subscriberCount as string) || "125K Subscribers";
  const videoTitle = (block.videoTitle as string) || "How to Build a ₹1 Lakh/Month Bio-Link Business";
  const videoUrl = (block.videoUrl as string) || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  const subscribeUrl = (block.subscribeUrl as string) || "https://youtube.com";
  const subscribeButtonLabel = (block.subscribeButtonLabel as string) || "Subscribe on YouTube 🔴";

  const handleUpdate = (field: string, val: any) => {
    handlers.onInlineTextChange?.(block.id, field, val);
  };

  const handleSubscribe = () => {
    if (mode === "preview") {
      handlers.onToast?.(`YouTube Subscribe clicked -> ${subscribeUrl}`);
      return;
    }
    handlers.onExternalLink?.(subscribeUrl, subscribeButtonLabel);
  };

  return (
    <div className="w-full rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 text-white shadow-xl space-y-4 text-left">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={channelAvatar}
            alt={channelName}
            className="h-11 w-11 rounded-full object-cover border-2 border-red-500 shrink-0"
          />
          <div className="min-w-0">
            <h3 className="font-display font-black text-sm text-white truncate">
              <CanvaInlineText
                value={channelName}
                onChange={(val) => handleUpdate("channelName", val)}
                enabled={Boolean(handlers.isInlineEditingAllowed)}
                placeholder="Channel Name..."
                className="font-black text-white"
              />
            </h3>
            <p className="text-[10px] text-slate-400 font-mono truncate">
              {channelHandle} • {subscriberCount}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubscribe}
          className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-extrabold text-[11px] shadow-lg shadow-red-600/30 transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
        >
          <Youtube className="h-3.5 w-3.5" />
          <span>Subscribe</span>
        </button>
      </div>

      {/* Video Box */}
      <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-700/80 relative shadow-inner">
        <video
          src={videoUrl}
          controls
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      {videoTitle && (
        <h4 className="font-bold text-xs sm:text-sm text-slate-100 leading-snug">
          <CanvaInlineText
            value={videoTitle}
            onChange={(val) => handleUpdate("videoTitle", val)}
            enabled={Boolean(handlers.isInlineEditingAllowed)}
            placeholder="Video title..."
            className="font-bold text-slate-100"
          />
        </h4>
      )}
    </div>
  );
}

/**
 * 28. Instagram Feed Grid Block:
 * Aesthetic 4-photo Instagram grid with hover likes/comments overlay and Follow CTA.
 */
export function InstagramFeedBlockView({ block, mode, handlers }: PersonaBlockProps) {
  const instagramHandle = (block.instagramHandle as string) || block.label || "@keylinks360.official";
  const followerCount = (block.followerCount as string) || "84.5K Followers";
  const profileUrl = (block.profileUrl as string) || "https://instagram.com";
  const followButtonLabel = (block.followButtonLabel as string) || "Follow on Instagram 📸";
  const posts = Array.isArray(block.posts) && block.posts.length > 0
    ? (block.posts as Array<{ id: string; imageUrl: string; likes: string; comments: string; postUrl: string }>)
    : [
        { id: "ig_1", imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400", likes: "2.4K", comments: "142", postUrl: "https://instagram.com" },
        { id: "ig_2", imageUrl: "https://images.unsplash.com/photo-1626278664285-f7c05fd17571?auto=format&fit=crop&q=80&w=400", likes: "1.8K", comments: "98", postUrl: "https://instagram.com" },
        { id: "ig_3", imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400", likes: "3.1K", comments: "210", postUrl: "https://instagram.com" },
        { id: "ig_4", imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400", likes: "4.5K", comments: "330", postUrl: "https://instagram.com" }
      ];

  const handleUpdate = (field: string, val: any) => {
    handlers.onInlineTextChange?.(block.id, field, val);
  };

  const handleFollow = () => {
    if (mode === "preview") {
      handlers.onToast?.(`Instagram Follow clicked -> ${profileUrl}`);
      return;
    }
    handlers.onExternalLink?.(profileUrl, followButtonLabel);
  };

  return (
    <div className="w-full rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 text-white shadow-xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center p-0.5">
            <Instagram className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 text-left">
            <span className="font-extrabold text-xs sm:text-sm text-white block truncate">
              <CanvaInlineText
                value={instagramHandle}
                onChange={(val) => handleUpdate("instagramHandle", val)}
                enabled={Boolean(handlers.isInlineEditingAllowed)}
                placeholder="Handle..."
                className="font-bold text-white"
              />
            </span>
            <span className="text-[9px] text-slate-400 font-mono block">{followerCount}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFollow}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:scale-95 text-white font-bold text-[11px] shadow-md shadow-pink-600/30 transition-all shrink-0 cursor-pointer"
        >
          Follow
        </button>
      </div>

      {/* 4 Photo Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        {posts.map((p, idx) => (
          <div
            key={p.id || idx}
            onClick={() => {
              if (mode === "preview") {
                handlers.onToast?.(`Instagram Post clicked -> ${p.postUrl}`);
                return;
              }
              handlers.onExternalLink?.(p.postUrl, "Instagram Post");
            }}
            className="aspect-square rounded-2xl overflow-hidden relative group cursor-pointer border border-white/10 bg-slate-950"
          >
            <img
              src={p.imageUrl}
              alt="Post"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 text-white text-xs font-bold">
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                {p.likes}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5 fill-white text-white" />
                {p.comments}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
