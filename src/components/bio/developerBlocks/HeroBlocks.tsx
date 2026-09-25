import React from "react";
import { ArrowRight, Play, Sparkles, CheckCircle2 } from "lucide-react";
import type { BlockRecord } from "../../../lib/bioBlocks";
import type { BlockRendererContext, BlockRendererHandlers, BlockRenderMode } from "../blockTypes";
import { CanvaInlineText, CanvaInlineImage } from "../CanvaDirectEditSuite";

interface DeveloperBlockProps {
  block: BlockRecord;
  mode: BlockRenderMode;
  context: BlockRendererContext;
  handlers: BlockRendererHandlers;
}

/**
 * 1. Split Hero Block:
 * Side-by-side headline + subtitle + dual CTA buttons + hero product/device image mockup.
 */
export function SplitHeroBlockView({ block, mode, handlers }: DeveloperBlockProps) {
  const headline = (block.headline as string) || block.label || "Scale Your Business With High-Converting Sites";
  const subheadline = (block.subheadline as string) || (block.value as string) || "Build developer-grade responsive landing pages in minutes.";
  const primaryCtaLabel = (block.primaryCtaLabel as string) || "Get Started Free";
  const primaryCtaUrl = (block.primaryCtaUrl as string) || "https://keylink360.in";
  const secondaryCtaLabel = (block.secondaryCtaLabel as string) || "Book a Demo";
  const secondaryCtaUrl = (block.secondaryCtaUrl as string) || "";
  const imageUrl = (block.imageUrl as string) || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600";
  const badgeText = (block.badgeText as string) || "🚀 Next-Gen Micro-Site Builder";

  const handleCta = (url: string, label: string) => {
    if (mode === "preview") {
      handlers.onToast?.(`Simulated action: ${label} -> ${url}`);
      return;
    }
    handlers.onExternalLink?.(url, label);
  };

  const handleUpdate = (field: string, val: any) => {
    handlers.onInlineTextChange?.(block.id, field, val);
  };

  return (
    <div className="w-full min-w-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-4 sm:p-7 shadow-xl border border-indigo-500/20 overflow-hidden relative box-border">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="flex flex-col md:flex-row md:items-center gap-5 sm:gap-6 items-stretch relative z-10 w-full min-w-0">
        <div className="space-y-3 sm:space-y-3.5 text-left flex-1 min-w-0 flex flex-col items-start justify-center">
          {badgeText && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 shadow-inner max-w-full">
              <Sparkles className="h-3 w-3 shrink-0" />
              <CanvaInlineText
                value={badgeText}
                onChange={(val) => handleUpdate("badgeText", val)}
                enabled={Boolean(handlers.isInlineEditingAllowed)}
                placeholder="Badge text..."
                className="font-extrabold truncate"
              />
            </span>
          )}
          <h2 className="font-display font-black text-lg sm:text-2xl leading-snug sm:leading-tight tracking-tight text-white w-full">
            <CanvaInlineText
              value={headline}
              onChange={(val) => handleUpdate("headline", val)}
              enabled={Boolean(handlers.isInlineEditingAllowed)}
              placeholder="Headline..."
              className="font-black text-white break-words"
            />
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed w-full">
            <CanvaInlineText
              value={subheadline}
              onChange={(val) => handleUpdate("subheadline", val)}
              enabled={Boolean(handlers.isInlineEditingAllowed)}
              placeholder="Subheadline..."
              className="text-slate-300 break-words"
            />
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1 w-full">
            <button
              type="button"
              onClick={() => handleCta(primaryCtaUrl, primaryCtaLabel)}
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
            >
              <CanvaInlineText
                value={primaryCtaLabel}
                onChange={(val) => handleUpdate("primaryCtaLabel", val)}
                enabled={Boolean(handlers.isInlineEditingAllowed)}
                placeholder="Button text..."
                className="font-bold text-white"
              />
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            {secondaryCtaLabel && (
              <button
                type="button"
                onClick={() => handleCta(secondaryCtaUrl, secondaryCtaLabel)}
                className="inline-flex items-center justify-center px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-slate-200 text-xs font-bold border border-white/10 transition-all cursor-pointer shrink-0"
              >
                <CanvaInlineText
                  value={secondaryCtaLabel}
                  onChange={(val) => handleUpdate("secondaryCtaLabel", val)}
                  enabled={Boolean(handlers.isInlineEditingAllowed)}
                  placeholder="Secondary text..."
                  className="font-bold text-slate-200"
                />
              </button>
            )}
          </div>
        </div>

        {/* High-Tech Glowing Showcase Image */}
        <div className="relative w-full md:w-1/2 aspect-[16/9] min-h-[160px] sm:min-h-[220px] rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-slate-950/80 group shrink-0">
          {handlers.isInlineEditingAllowed ? (
            <CanvaInlineImage
              src={imageUrl}
              onChange={(newUrl) => handleUpdate("imageUrl", newUrl)}
              alt={headline}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <img
              src={imageUrl}
              alt={headline}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800";
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Video Hero Block:
 * Full-width or boxed hero with embedded background video/stream + overlay text + pill badge + CTA.
 */
export function VideoHeroBlockView({ block, mode, handlers }: DeveloperBlockProps) {
  const headline = (block.headline as string) || block.label || "The Modern Creative Agency";
  const subheadline = (block.subheadline as string) || (block.value as string) || "Watch how we transform digital brand experiences.";
  const videoUrl = (block.videoUrl as string) || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  const ctaLabel = (block.ctaLabel as string) || "Start Your Project";
  const ctaUrl = (block.ctaUrl as string) || "https://keylink360.in";
  const badgeText = (block.badgeText as string) || "🎬 Featured Reel 2026";

  const handleCta = () => {
    if (mode === "preview") {
      handlers.onToast?.(`Simulated action: ${ctaLabel} -> ${ctaUrl}`);
      return;
    }
    handlers.onExternalLink?.(ctaUrl, ctaLabel);
  };

  const handleUpdate = (field: string, val: any) => {
    handlers.onInlineTextChange?.(block.id, field, val);
  };

  return (
    <div className="w-full relative rounded-3xl overflow-hidden shadow-xl border border-slate-800 bg-slate-950 text-white min-h-[300px] flex items-center justify-center p-6 sm:p-8">
      {/* Video Background / Stream */}
      <video
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />

      <div className="relative z-10 max-w-xl text-center space-y-4">
        {badgeText && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-inner">
            <Play className="h-3 w-3 fill-white text-white" />
            <CanvaInlineText
              value={badgeText}
              onChange={(val) => handleUpdate("badgeText", val)}
              enabled={Boolean(handlers.isInlineEditingAllowed)}
              placeholder="Badge..."
              className="font-extrabold"
            />
          </span>
        )}
        <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight leading-snug">
          <CanvaInlineText
            value={headline}
            onChange={(val) => handleUpdate("headline", val)}
            enabled={Boolean(handlers.isInlineEditingAllowed)}
            placeholder="Hero headline..."
            className="font-black text-white"
          />
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
          <CanvaInlineText
            value={subheadline}
            onChange={(val) => handleUpdate("subheadline", val)}
            enabled={Boolean(handlers.isInlineEditingAllowed)}
            placeholder="Subheadline..."
            className="text-slate-300"
          />
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={handleCta}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/40 transition-all"
          >
            <CanvaInlineText
              value={ctaLabel}
              onChange={(val) => handleUpdate("ctaLabel", val)}
              enabled={Boolean(handlers.isInlineEditingAllowed)}
              placeholder="Action button..."
              className="font-bold text-white"
            />
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Glow Badge / Announcement:
 * Sleek animated glowing pill badge (e.g. "⚡ Introducing Multi-Device Responsive Sites →").
 */
export function GlowBadgeBlockView({ block, mode, handlers }: DeveloperBlockProps) {
  const badgeText = (block.badgeText as string) || block.label || "⚡ Introducing Multi-Device Responsive Sites · See What's New →";
  const badgeLink = (block.badgeLink as string) || (block.value as string) || "https://keylink360.in";
  const badgeStyle = (block.badgeStyle as string) || "purple";

  const colorClasses =
    badgeStyle === "emerald"
      ? "from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-emerald-500/20"
      : badgeStyle === "amber"
        ? "from-amber-500/20 via-orange-500/20 to-amber-500/20 border-amber-500/40 text-amber-300 shadow-amber-500/20"
        : badgeStyle === "cyan"
          ? "from-cyan-500/20 via-blue-500/20 to-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-cyan-500/20"
          : "from-indigo-500/20 via-purple-500/20 to-indigo-500/20 border-indigo-500/40 text-indigo-200 shadow-indigo-500/20";

  return (
    <div className="w-full flex justify-center my-1">
      <button
        type="button"
        onClick={() => {
          if (mode === "preview") {
            handlers.onToast?.(`Glow badge clicked: ${badgeLink}`);
            return;
          }
          handlers.onExternalLink?.(badgeLink, badgeText);
        }}
        className={`group relative inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-gradient-to-r ${colorClasses} shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer max-w-full`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
        <CanvaInlineText
          value={badgeText}
          onChange={(val) => handlers.onInlineTextChange?.(block.id, "badgeText", val)}
          enabled={Boolean(handlers.isInlineEditingAllowed)}
          placeholder="Glow announcement..."
          className="text-xs font-bold truncate"
        />
      </button>
    </div>
  );
}

/**
 * 4. Feature Hero:
 * Bold centered headline with 3 key benefit cards underneath.
 */
export function FeatureHeroBlockView({ block, handlers }: DeveloperBlockProps) {
  const headline = (block.headline as string) || block.label || "Built For High Performance & Conversions";
  const subheadline = (block.subheadline as string) || (block.value as string) || "Everything you need to turn visitors into paying customers seamlessly.";
  const features = Array.isArray(block.featureItems)
    ? (block.featureItems as Array<{ icon: string; title: string; desc: string }>)
    : [
        { icon: "⚡", title: "Ultra Fast Loading", desc: "Sub-second load times across 4G & 5G networks." },
        { icon: "📱", title: "Universal Responsive", desc: "Pixel-perfect mockups on phones, tablets, & 4K screens." },
        { icon: "🔒", title: "Bank-Grade Security", desc: "Integrated payment gateways with SSL protection." }
      ];

  const handleUpdate = (field: string, val: any) => {
    handlers?.onInlineTextChange?.(block.id, field, val);
  };

  const handleFeatureUpdate = (idx: number, key: "icon" | "title" | "desc", val: string) => {
    const updated = [...features];
    updated[idx] = { ...updated[idx], [key]: val };
    handleUpdate("featureItems", updated);
  };

  return (
    <div className="w-full rounded-3xl p-5 sm:p-7 bg-slate-900 text-white border border-slate-800 shadow-lg space-y-6">
      <div className="text-center max-w-lg mx-auto space-y-2">
        <h2 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight">
          <CanvaInlineText
            value={headline}
            onChange={(val) => handleUpdate("headline", val)}
            enabled={Boolean(handlers?.isInlineEditingAllowed)}
            placeholder="Feature Headline..."
            className="font-black text-white"
          />
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
          <CanvaInlineText
            value={subheadline}
            onChange={(val) => handleUpdate("subheadline", val)}
            enabled={Boolean(handlers?.isInlineEditingAllowed)}
            placeholder="Feature Subheadline..."
            className="text-slate-400"
          />
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {features.map((feat, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-left space-y-2 hover:border-indigo-500/40 transition-colors"
          >
            <div className="text-2xl">{feat.icon}</div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-100">
              <CanvaInlineText
                value={feat.title}
                onChange={(val) => handleFeatureUpdate(idx, "title", val)}
                enabled={Boolean(handlers?.isInlineEditingAllowed)}
                placeholder="Title..."
                className="font-bold text-slate-100"
              />
            </h4>
            <div className="text-[11px] text-slate-400 leading-snug">
              <CanvaInlineText
                value={feat.desc}
                onChange={(val) => handleFeatureUpdate(idx, "desc", val)}
                enabled={Boolean(handlers?.isInlineEditingAllowed)}
                placeholder="Description..."
                className="text-slate-400 text-[11px]"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
