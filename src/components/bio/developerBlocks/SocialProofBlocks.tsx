import React from "react";
import { Star, ShieldCheck, Quote } from "lucide-react";
import type { BlockRecord } from "../../../lib/bioBlocks";
import type { BlockRendererContext, BlockRendererHandlers, BlockRenderMode } from "../blockTypes";

interface DeveloperBlockProps {
  block: BlockRecord;
  mode: BlockRenderMode;
  context: BlockRendererContext;
  handlers: BlockRendererHandlers;
}

/**
 * 9. Brand Logos Block:
 * Marquee or responsive grid of client / partner brand logos.
 */
export function BrandLogosBlockView({ block }: DeveloperBlockProps) {
  const title = (block.title as string) || block.label || "Trusted by 5,000+ Fast-Growing Companies";
  const logos = Array.isArray(block.logos)
    ? (block.logos as Array<{ name: string; logoUrl: string }>)
    : [
        { name: "Google", logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/google.svg" },
        { name: "Stripe", logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/stripe.svg" },
        { name: "Meta", logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/meta.svg" },
        { name: "Amazon", logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/amazon.svg" },
        { name: "Spotify", logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/spotify.svg" },
        { name: "Shopify", logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/shopify.svg" }
      ];

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 text-center space-y-4">
      {title && (
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 block">
          {title}
        </span>
      )}

      {/* Responsive Grid of Brand Logos */}
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 opacity-75 hover:opacity-100 transition-opacity">
        {logos.map((logo, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all text-slate-400 hover:text-white"
            title={logo.name}
          >
            {logo.logoUrl ? (
              <img
                src={logo.logoUrl}
                alt={logo.name}
                className="h-5 w-auto invert opacity-80"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : null}
            <span className="text-xs font-bold tracking-tight">{logo.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 10. Star Ratings & Review Summary:
 * Trust card featuring 5-star ratings, review tally, and customer avatar stack.
 */
export function StarRatingsBlockView({ block }: DeveloperBlockProps) {
  const ratingScore = (block.ratingScore as string) || "4.9";
  const reviewCount = (block.reviewCount as string) || "2,840+ Happy Clients";
  const headline = (block.headline as string) || block.label || "Overwhelmingly 5-Star Rated Worldwide";
  const subtitle = (block.subtitle as string) || (block.value as string) || "Consistently rated #1 for conversion rate and ease of use.";
  const avatars = Array.isArray(block.avatars)
    ? (block.avatars as string[])
    : [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100"
      ];

  return (
    <div className="w-full bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-lg text-center space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Avatars Stack */}
        <div className="flex -space-x-2 overflow-hidden">
          {avatars.map((av, idx) => (
            <img
              key={idx}
              src={av}
              alt="Customer"
              className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 object-cover"
              loading="lazy"
            />
          ))}
        </div>

        {/* 5 Stars */}
        <div className="flex items-center gap-0.5 text-amber-400">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
          ))}
        </div>

        <span className="font-bold text-xs text-amber-300">
          {ratingScore} / 5.0 ({reviewCount})
        </span>
      </div>

      <h4 className="font-display font-black text-base sm:text-lg text-white">
        {headline}
      </h4>
      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
}

/**
 * 11. Press Mentions:
 * "As Seen On" media strip featuring top publications.
 */
export function PressMentionsBlockView({ block }: DeveloperBlockProps) {
  const headline = (block.headline as string) || block.label || "As Featured In Top Media";
  const items = Array.isArray(block.items)
    ? (block.items as Array<{ name: string; quote: string }>)
    : [
        { name: "TechCrunch", quote: "The easiest way to turn social bios into full ecommerce powerhouses." },
        { name: "Forbes", quote: "Top 10 essential SaaS tools for digital creators in 2026." },
        { name: "ProductHunt", quote: "#1 Product of the Week with over 1,500 upvotes." }
      ];

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
      <div className="text-center">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">
          {headline}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-left space-y-2 relative"
          >
            <Quote className="h-4 w-4 text-indigo-400/40" />
            <p className="text-xs text-slate-300 italic leading-relaxed">"{item.quote}"</p>
            <span className="font-bold text-[11px] text-white block pt-1 border-t border-slate-700/50">
              — {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
