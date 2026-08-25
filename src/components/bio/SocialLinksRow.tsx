import React, { memo } from "react";
import { BlockRecord, getSocialLinksFromBlock, normalizeExternalUrl } from "../../lib/bioBlocks";

function SocialBrandIcon({ id, className }: { id: string; className?: string }) {
  const cn = className || "h-4 w-4";

  switch (id) {
    case "instagram":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
        </svg>
      );
    case "facebook":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M13.5 3H16V0h-2.5C10.9 0 9 1.9 9 4.5V7H6v3h3v14h3.5V10H16l.5-3h-3.5V4.8c0-.7.6-1.3 1.3-1.3z" />
        </svg>
      );
    case "youtube":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.8 4.6 12 4.6 12 4.6s-5.8 0-7.6.6a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2 12a29 29 0 0 0 .4 4.8 2.8 2.8 0 0 0 2 2c1.8.6 7.6.6 7.6.6s5.8 0 7.6-.6a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .4-4.8 29 29 0 0 0-.4-4.8zM10 15.5v-7l6 3.5-6 3.5z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M16.6 5.8c1 1.1 2.2 1.8 3.6 2v3.1a7.8 7.8 0 0 1-3.6-.9v6.8a5.2 5.2 0 1 1-5.2-5.2c.3 0 .7 0 1 .1v3.2a2 2 0 1 0 1.4 1.9V2h3.2c.2 1.2.8 2.3 1.6 3.8z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zm7.5 0h3.8v2.2h.1c.5-1 1.8-2.2 3.8-2.2 4.1 0 4.8 2.7 4.8 6.2V24h-4v-7.1c0-1.7 0-3.8-2.3-3.8-2.3 0-2.7 1.8-2.7 3.7V24h-4V8z" />
        </svg>
      );
    case "x":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.5 3H20l-6.2 7.1L21 21h-5.2l-4-5.2-4.6 5.2H3.4l6.6-7.6L3 3h5.3l3.6 4.8L17.5 3zm-1.8 16h1.4L8.7 5H7.2l8.5 14z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2a10 10 0 0 0-8.7 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.2 1.1-1.7 1.1-.4 0-1 .2-3.3-1.1-2.7-1.5-4.5-4.3-4.6-4.5-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5.2.5.7 1.7.8 1.8.1.1.1.2 0 .4-.1.1-.2.3-.3.4-.1.1-.2.2-.1.4.1.2.4.7 1 1.1.9.8 1.6 1 1.9 1.1.2.1.4.1.5 0 .2-.1.6-.7.8-1 .2-.3.4-.2.7-.1.3.1 1.8.8 2.1 1 .3.2.5.3.6.5.1.2.1 1-.1 1.6z" />
        </svg>
      );
    case "telegram":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M21.9 4.6 2.8 11.5c-1.1.4-1.1 1.1-.2 1.4l4.9 1.5 1.9 5.9c.2.6.4.8.8.8.4 0 .6-.2.9-.6l2.7-2.6 5.6 4.1c1 .6 1.7.3 1.9-1.1L23.7 6c.3-1.3-.5-1.9-1.8-1.4zM8.8 13.8l9.9-6.2c.5-.3.9-.1.5.2L10.6 15l-.4 3.4-1.4-4.6z" />
        </svg>
      );
    default:
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
        </svg>
      );
  }
}

interface SocialLinksRowProps {
  block: BlockRecord;
  onLinkClick?: (link: { id: string; label: string; url: string }) => void;
  compact?: boolean;
}

const SocialLinksRow = memo(function SocialLinksRow({
  block,
  onLinkClick,
  compact = false
}: SocialLinksRowProps) {
  const links = getSocialLinksFromBlock(block);

  if (links.length === 0) {
    return (
      <p className={`text-center ${compact ? "text-[9px]" : "text-[10px]"} text-slate-400 py-1`}>
        Add social links in the block settings
      </p>
    );
  }

  const buttonSize = compact ? "p-2" : "p-3";
  const iconSize = compact ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className={`flex flex-wrap items-center justify-center ${compact ? "gap-2 py-1" : "gap-3 py-2"}`}>
      {links.map((link) => (
        <button
          key={link.id}
          type="button"
          aria-label={link.label}
          title={link.label}
          onClick={() => {
            if (onLinkClick) {
              onLinkClick(link);
              return;
            }
            window.open(normalizeExternalUrl(link.url), "_blank", "noopener,noreferrer");
          }}
          className={`${buttonSize} rounded-full border border-slate-200 bg-white text-white shadow-sm transition-all active:scale-90 hover:shadow-md`}
          style={{ backgroundColor: link.brandColor, borderColor: "transparent" }}
        >
          <SocialBrandIcon id={link.id} className={iconSize} />
        </button>
      ))}
    </div>
  );
});

export default SocialLinksRow;
