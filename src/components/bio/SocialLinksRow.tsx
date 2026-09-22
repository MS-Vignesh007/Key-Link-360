import React, { memo, useState } from "react";
import { BlockRecord, getSocialLinksFromBlock, normalizeExternalUrl } from "../../lib/bioBlocks";
import { Plus, X, Check, ChevronLeft, ChevronRight, Trash2, Globe } from "lucide-react";

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

const AVAILABLE_PLATFORMS = [
  { id: "instagram", label: "Instagram", brandColor: "#E4405F", defaultUrl: "https://instagram.com/" },
  { id: "youtube", label: "YouTube", brandColor: "#FF0000", defaultUrl: "https://youtube.com/" },
  { id: "whatsapp", label: "WhatsApp", brandColor: "#25D366", defaultUrl: "https://wa.me/" },
  { id: "tiktok", label: "TikTok", brandColor: "#000000", defaultUrl: "https://tiktok.com/@" },
  { id: "x", label: "X (Twitter)", brandColor: "#000000", defaultUrl: "https://x.com/" },
  { id: "linkedin", label: "LinkedIn", brandColor: "#0A66C2", defaultUrl: "https://linkedin.com/in/" },
  { id: "facebook", label: "Facebook", brandColor: "#1877F2", defaultUrl: "https://facebook.com/" },
  { id: "telegram", label: "Telegram", brandColor: "#26A5E4", defaultUrl: "https://t.me/" }
];

interface SocialLinksRowProps {
  block: BlockRecord;
  onLinkClick?: (link: { id: string; label: string; url: string }) => void;
  compact?: boolean;
  isInlineEditingAllowed?: boolean;
  onUpdateSocials?: (newSocialLinks: any[]) => void;
}

const SocialLinksRow = memo(function SocialLinksRow({
  block,
  onLinkClick,
  compact = false,
  isInlineEditingAllowed = false,
  onUpdateSocials
}: SocialLinksRowProps) {
  const links = getSocialLinksFromBlock(block);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [showAddMenu, setShowAddMenu] = useState(false);

  const buttonSize = compact ? "p-2" : "p-3";
  const iconSize = compact ? "h-3.5 w-3.5" : "h-4 w-4";

  const handleMove = (index: number, direction: "left" | "right") => {
    if (!onUpdateSocials) return;
    const target = direction === "left" ? index - 1 : index + 1;
    if (target < 0 || target >= links.length) return;
    const copy = [...links];
    const item = copy.splice(index, 1)[0];
    copy.splice(target, 0, item);
    onUpdateSocials(copy);
  };

  const handleDelete = (id: string) => {
    if (!onUpdateSocials) return;
    const copy = links.filter((l) => l.id !== id);
    onUpdateSocials(copy);
  };

  const handleAddPlatform = (plat: (typeof AVAILABLE_PLATFORMS)[0]) => {
    if (!onUpdateSocials) return;
    if (links.some((l) => l.id === plat.id)) {
      setShowAddMenu(false);
      return;
    }
    const next = [...links, { id: plat.id, label: plat.label, url: plat.defaultUrl, brandColor: plat.brandColor }];
    onUpdateSocials(next);
    setShowAddMenu(false);
  };

  const handleSaveUrl = (id: string) => {
    if (!onUpdateSocials) return;
    const next = links.map((l) => (l.id === id ? { ...l, url: editUrl } : l));
    onUpdateSocials(next);
    setEditingLinkId(null);
  };

  return (
    <div className="flex flex-col items-center w-full relative">
      <div className={`flex flex-wrap items-center justify-center ${compact ? "gap-2 py-1" : "gap-3 py-2"}`}>
        {links.map((link, idx) => (
          <div key={link.id} className="relative group/socialitem">
            <button
              type="button"
              aria-label={link.label}
              title={isInlineEditingAllowed ? `Click to edit ${link.label} URL` : link.label}
              onClick={() => {
                if (isInlineEditingAllowed) {
                  setEditingLinkId(link.id);
                  setEditUrl(link.url);
                  return;
                }
                if (onLinkClick) {
                  onLinkClick(link);
                  return;
                }
                window.open(normalizeExternalUrl(link.url), "_blank", "noopener,noreferrer");
              }}
              className={`${buttonSize} rounded-full border border-slate-200 bg-white text-white shadow-sm transition-all active:scale-90 hover:shadow-md cursor-pointer ${
                isInlineEditingAllowed ? "hover:ring-2 hover:ring-indigo-400" : ""
              }`}
              style={{ backgroundColor: link.brandColor, borderColor: "transparent" }}
            >
              <SocialBrandIcon id={link.id} className={iconSize} />
            </button>

            {/* In-canvas Canva Mini Floating Controls */}
            {isInlineEditingAllowed && (
              <div
                className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover/socialitem:flex items-center gap-0.5 bg-slate-900/95 text-white p-0.5 rounded-lg shadow-xl border border-slate-700 z-30 animate-in fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => handleMove(idx, "left")}
                    className="p-0.5 hover:bg-slate-800 text-slate-300 rounded"
                    title="Move Left"
                  >
                    <ChevronLeft className="w-2.5 h-2.5" />
                  </button>
                )}
                {idx < links.length - 1 && (
                  <button
                    type="button"
                    onClick={() => handleMove(idx, "right")}
                    className="p-0.5 hover:bg-slate-800 text-slate-300 rounded"
                    title="Move Right"
                  >
                    <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(link.id)}
                  className="p-0.5 hover:bg-rose-950 text-rose-400 rounded"
                  title="Remove Icon"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Canva In-place Add Social Icon Button */}
        {isInlineEditingAllowed && (
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddMenu((m) => !m);
              }}
              className={`${buttonSize} rounded-full border-2 border-dashed border-indigo-400/80 hover:border-indigo-600 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer`}
              title="Add Social Link Icon"
            >
              <Plus className={iconSize} />
            </button>

            {showAddMenu && (
              <div
                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-56 p-2 bg-slate-900/95 border border-indigo-500 text-white rounded-xl shadow-2xl backdrop-blur-xl animate-in zoom-in-95 space-y-1"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span className="text-[10px] font-bold text-cyan-300">Add Social Platform</span>
                  <button type="button" onClick={() => setShowAddMenu(false)} className="text-slate-400 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1 pt-1 max-h-48 overflow-y-auto no-scrollbar">
                  {AVAILABLE_PLATFORMS.map((plat) => (
                    <button
                      key={plat.id}
                      type="button"
                      onClick={() => handleAddPlatform(plat)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center gap-1.5 text-xs text-left"
                    >
                      <SocialBrandIcon id={plat.id} className="w-3.5 h-3.5" />
                      <span className="text-[10px] truncate">{plat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editing Social Link URL Popover */}
      {editingLinkId && isInlineEditingAllowed && (
        <div
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-64 p-2.5 bg-slate-900/95 border border-indigo-500 rounded-xl shadow-2xl text-white backdrop-blur-xl animate-in zoom-in-95 space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <span className="text-[10px] font-bold text-cyan-300">Edit Link Address</span>
            <button type="button" onClick={() => setEditingLinkId(null)} className="text-slate-400 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1 px-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              placeholder="https://..."
            />
            <button
              type="button"
              onClick={() => handleSaveUrl(editingLinkId)}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white"
            >
              <Check className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default SocialLinksRow;
