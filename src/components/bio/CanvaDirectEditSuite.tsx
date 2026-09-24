import React, { useState, useRef, useEffect, memo } from "react";
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Check,
  X,
  Sparkles,
  Palette,
  Type,
  Image as ImageIcon,
  Link,
  ChevronUp,
  ChevronDown,
  Trash2,
  Copy,
  Plus,
  ArrowLeft,
  ArrowRight,
  Smile,
  Sliders,
  Upload,
  RefreshCw,
  Eye,
  Flame,
  Zap,
  Star,
  Heart,
  ShoppingBag,
  Phone,
  Mail,
  Globe,
  ExternalLink
} from "lucide-react";

// ============================================================================
// 1. SMART INLINE TEXT WITH FLOATING FORMATTING QUICK-BAR
// ============================================================================

export function parseFormattedText(val: string | unknown) {
  if (!val) return { text: "", bold: false, italic: false, align: "center" as const, color: "" };
  const str = typeof val === "string" ? val : String(val || "");
  const spanMatch = str.match(/^<span style="([^"]*)">(.*)<\/span>$/s);
  if (spanMatch) {
    const styleStr = spanMatch[1];
    const text = spanMatch[2];
    const bold = styleStr.includes("font-weight:bold");
    const italic = styleStr.includes("font-style:italic");
    const colorMatch = styleStr.match(/color:\s*([^;]+)/);
    const alignMatch = styleStr.match(/text-align:\s*([^;]+)/);
    return {
      text,
      bold,
      italic,
      align: (alignMatch?.[1] as "left" | "center" | "right") || "center",
      color: colorMatch?.[1] || ""
    };
  }
  let text = str;
  let bold = false;
  let italic = false;
  if (text.startsWith("**") && text.endsWith("**") && text.length >= 4) {
    bold = true;
    text = text.slice(2, -2);
  }
  return { text, bold, italic, align: "center" as const, color: "" };
}

export function serializeFormattedText(text: string, bold: boolean, italic: boolean, align: string, color: string): string {
  if (!bold && !italic && !color && (!align || align === "center")) {
    return text;
  }
  const styles: string[] = [];
  if (bold) styles.push("font-weight:bold");
  if (italic) styles.push("font-style:italic");
  if (align && align !== "center") styles.push(`text-align:${align}`);
  if (color) styles.push(`color:${color}`);
  return `<span style="${styles.join(";")}">${text}</span>`;
}

export interface CanvaInlineTextProps {
  value: string;
  onChange: (newValue: string) => void;
  isEditingAllowed?: boolean;
  enabled?: boolean;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  tagName?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "div";
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  allowFormatting?: boolean;
}

const COLOR_SWATCHES = [
  { label: "White", value: "#FFFFFF" },
  { label: "Slate", value: "#0F172A" },
  { label: "Indigo", value: "#6366F1" },
  { label: "Cyan", value: "#06B6D4" },
  { label: "Emerald", value: "#10B981" },
  { label: "Amber", value: "#F59E0B" },
  { label: "Rose", value: "#F43F5E" },
  { label: "Purple", value: "#A855F7" }
];

const POPULAR_EMOJIS = ["🔥", "✨", "🚀", "💎", "💡", "⚡", "⭐", "❤️", "📱", "🎯", "🛒", "🏷️", "👑", "🎉"];

export const CanvaInlineText: React.FC<CanvaInlineTextProps> = ({
  value,
  onChange,
  isEditingAllowed: isEditingAllowedProp,
  enabled: enabledProp,
  className = "",
  placeholder = "Type something...",
  multiline = false,
  tagName = "span",
  style,
  onClick,
  onDoubleClick,
  allowFormatting = true
}) => {
  const isEditingAllowed = isEditingAllowedProp ?? enabledProp ?? true;
  const initialParsed = parseFormattedText(value || "");

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(initialParsed.text);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isBold, setIsBold] = useState(initialParsed.bold);
  const [isItalic, setIsItalic] = useState(initialParsed.italic);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">(initialParsed.align);
  const [customColor, setCustomColor] = useState<string>(initialParsed.color);
  const [toolbarPlacement, setToolbarPlacement] = useState<"top" | "bottom">("top");

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastTapRef = useRef<number>(0);

  // Sync state if value prop changes from outside
  useEffect(() => {
    const parsed = parseFormattedText(value || "");
    setDraft(parsed.text);
    setIsBold(parsed.bold);
    setIsItalic(parsed.italic);
    setTextAlign(parsed.align);
    setCustomColor(parsed.color);
  }, [value]);

  // Focus & measure position on start editing
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      const rect = inputRef.current.getBoundingClientRect();
      if (rect.top < 110) {
        setToolbarPlacement("bottom");
      } else {
        setToolbarPlacement("top");
      }
    }
  }, [isEditing]);

  const handleStartEditing = (e?: React.MouseEvent | React.TouchEvent) => {
    if (!isEditingAllowed) return;
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const parsed = parseFormattedText(value || "");
    setDraft(parsed.text);
    setIsBold(parsed.bold);
    setIsItalic(parsed.italic);
    setTextAlign(parsed.align);
    setCustomColor(parsed.color);
    setIsEditing(true);
    if (e && "clientX" in e) {
      onDoubleClick?.(e as React.MouseEvent);
    }
  };

  const handleCommit = () => {
    setIsEditing(false);
    setShowColorPicker(false);
    setShowEmojiPicker(false);
    const finalVal = serializeFormattedText(draft, isBold, isItalic, textAlign, customColor);
    if (finalVal !== (value || "")) {
      onChange(finalVal);
    }
  };

  const handleCancel = () => {
    const parsed = parseFormattedText(value || "");
    setDraft(parsed.text);
    setIsBold(parsed.bold);
    setIsItalic(parsed.italic);
    setTextAlign(parsed.align);
    setCustomColor(parsed.color);
    setIsEditing(false);
    setShowColorPicker(false);
    setShowEmojiPicker(false);
  };

  // Auto-Save when clicking outside the smart edit box
  useEffect(() => {
    if (!isEditing) return;

    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleCommit();
      }
    };

    document.addEventListener("mousedown", handlePointerDownOutside);
    document.addEventListener("touchstart", handlePointerDownOutside);
    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside);
      document.removeEventListener("touchstart", handlePointerDownOutside);
    };
  }, [isEditing, draft, isBold, isItalic, textAlign, customColor, value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (!multiline || !e.shiftKey) {
        e.preventDefault();
        handleCommit();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const insertEmoji = (emoji: string) => {
    if (inputRef.current) {
      const input = inputRef.current;
      const start = input.selectionStart ?? draft.length;
      const end = input.selectionEnd ?? draft.length;
      const nextDraft = draft.slice(0, start) + emoji + draft.slice(end);
      setDraft(nextDraft);
      setShowEmojiPicker(false);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 10);
    } else {
      setDraft((prev) => `${prev} ${emoji}`.trim());
      setShowEmojiPicker(false);
    }
  };

  // Double tap / double click detection
  const handlePointerOrClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isEditingAllowed) return;
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      e.stopPropagation();
      e.preventDefault();
      lastTapRef.current = 0;
      handleStartEditing(e);
    } else {
      lastTapRef.current = now;
      if ("clientX" in e) {
        onClick?.(e as React.MouseEvent);
      }
    }
  };

  if (isEditing && isEditingAllowed) {
    const toolbarPosClass =
      toolbarPlacement === "bottom"
        ? "top-full mt-2 left-1/2 -translate-x-1/2"
        : "-top-12 left-1/2 -translate-x-1/2";

    return (
      <div
        ref={containerRef}
        className="key-canva-inline-active relative inline-block w-full max-w-full z-[999] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Floating Smart Edit Pro Quick Action Toolbar */}
        <div
          className={`absolute ${toolbarPosClass} z-[9999] flex items-center gap-1 p-1 bg-slate-900/98 text-white rounded-xl shadow-2xl border border-indigo-500/60 backdrop-blur-xl pointer-events-auto ring-1 ring-cyan-500/30 whitespace-nowrap`}
          onMouseDown={(e) => {
            // Keep input focus alive when interacting with toolbar!
            e.preventDefault();
            e.stopPropagation();
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-indigo-950/90 border border-indigo-500/40 text-[9px] font-extrabold text-cyan-300 font-mono select-none mr-0.5">
            <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
            <span>SMART EDIT</span>
          </div>

          {allowFormatting && (
            <>
              {/* Bold Toggle */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => setIsBold((b) => !b)}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  isBold ? "bg-indigo-600 text-white" : "hover:bg-slate-800 text-slate-300"
                }`}
                title="Bold (Ctrl+B)"
              >
                <Bold className="w-3 h-3" />
              </button>

              {/* Italic Toggle */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => setIsItalic((i) => !i)}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  isItalic ? "bg-indigo-600 text-white" : "hover:bg-slate-800 text-slate-300"
                }`}
                title="Italic (Ctrl+I)"
              >
                <Italic className="w-3 h-3" />
              </button>

              {/* Alignment Selector */}
              <div className="flex items-center gap-0.5 bg-slate-800/80 rounded-md p-0.5">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => setTextAlign("left")}
                  className={`p-1 rounded cursor-pointer ${textAlign === "left" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                  title="Align Left"
                >
                  <AlignLeft className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => setTextAlign("center")}
                  className={`p-1 rounded cursor-pointer ${textAlign === "center" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                  title="Align Center"
                >
                  <AlignCenter className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => setTextAlign("right")}
                  className={`p-1 rounded cursor-pointer ${textAlign === "right" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                  title="Align Right"
                >
                  <AlignRight className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Color Swatches Popover Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => {
                    setShowColorPicker((c) => !c);
                    setShowEmojiPicker(false);
                  }}
                  className="p-1 hover:bg-slate-800 rounded-md text-slate-300 flex items-center gap-1 cursor-pointer"
                  title="Text Color"
                >
                  <Palette className="w-3 h-3 text-pink-400" />
                  {customColor && (
                    <span className="w-2 h-2 rounded-full border border-white" style={{ backgroundColor: customColor }} />
                  )}
                </button>

                {showColorPicker && (
                  <div
                    className="absolute top-8 left-1/2 -translate-x-1/2 p-2 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl flex items-center gap-1.5 z-50 animate-in zoom-in-95"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {COLOR_SWATCHES.map((sw) => (
                      <button
                        key={sw.value}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={() => {
                          setCustomColor((prev) => (prev === sw.value ? "" : sw.value));
                          setShowColorPicker(false);
                        }}
                        className={`w-4 h-4 rounded-full border hover:scale-125 transition-transform cursor-pointer ${
                          customColor === sw.value ? "ring-2 ring-cyan-400 border-white scale-110" : "border-white/30"
                        }`}
                        style={{ backgroundColor: sw.value }}
                        title={sw.label}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Emoji Quick Insert Popover */}
              <div className="relative">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => {
                    setShowEmojiPicker((e) => !e);
                    setShowColorPicker(false);
                  }}
                  className="p-1 hover:bg-slate-800 rounded-md text-amber-400 cursor-pointer"
                  title="Quick Emoji Insert"
                >
                  <Smile className="w-3 h-3" />
                </button>

                {showEmojiPicker && (
                  <div
                    className="absolute top-8 left-1/2 -translate-x-1/2 p-2 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl grid grid-cols-7 gap-1 z-50 w-48 animate-in zoom-in-95"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {POPULAR_EMOJIS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={() => insertEmoji(em)}
                        className="p-1 text-sm hover:bg-slate-800 rounded text-center hover:scale-125 transition-transform cursor-pointer"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="h-4 w-px bg-slate-700 mx-0.5" />

          {/* Save Button */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCommit();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCommit();
            }}
            className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors flex items-center gap-0.5 px-1.5 text-[10px] font-bold cursor-pointer"
            title="Save changes (Enter)"
          >
            <Check className="w-3 h-3" />
            <span>Save</span>
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCancel();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCancel();
            }}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
            title="Cancel (Esc)"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* In-place Editable Input with Live Styling */}
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              ...style,
              fontWeight: isBold ? "bold" : undefined,
              fontStyle: isItalic ? "italic" : undefined,
              textAlign,
              color: customColor || undefined
            }}
            rows={2}
            className={`w-full resize-none rounded-xl bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white border-2 border-indigo-500 ring-4 ring-indigo-500/25 shadow-2xl p-2 outline-none font-inherit leading-relaxed ${className}`}
            placeholder={placeholder}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              ...style,
              fontWeight: isBold ? "bold" : undefined,
              fontStyle: isItalic ? "italic" : undefined,
              textAlign,
              color: customColor || undefined
            }}
            className={`w-full rounded-xl bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white border-2 border-indigo-500 ring-4 ring-indigo-500/25 shadow-2xl px-2.5 py-1 outline-none font-inherit ${className}`}
            placeholder={placeholder}
          />
        )}
      </div>
    );
  }

  const currentParsed = parseFormattedText(value || "");
  const Tag = tagName as any;

  return (
    <Tag
      style={{
        ...style,
        fontWeight: currentParsed.bold ? "bold" : style?.fontWeight,
        fontStyle: currentParsed.italic ? "italic" : style?.fontStyle,
        textAlign: currentParsed.align !== "center" ? currentParsed.align : style?.textAlign,
        color: currentParsed.color || style?.color
      }}
      onClick={handlePointerOrClick}
      onTouchEnd={handlePointerOrClick}
      onDoubleClick={handleStartEditing}
      title={isEditingAllowed ? "Smart Edit: Double-click or double-tap to edit & format inline" : undefined}
      className={`${className} ${
        isEditingAllowed
          ? "cursor-text hover:outline-dashed hover:outline-2 hover:outline-indigo-500 hover:bg-indigo-500/10 hover:rounded-lg transition-all duration-150 relative group/canvatext"
          : ""
      }`}
    >
      {currentParsed.text || placeholder}
    </Tag>
  );
};

// ============================================================================
// 2. CANVA INLINE IMAGE & AVATAR REPLACER
// ============================================================================

export interface CanvaInlineImageProps {
  src?: string;
  currentUrl?: string;
  alt?: string;
  altText?: string;
  onChange?: (newSrc: string) => void;
  onSave?: (newSrc: string) => void;
  isEditingAllowed?: boolean;
  className?: string;
  shape?: "circle" | "rounded" | "square" | "banner";
  aspectRatio?: string;
}

const PRESET_STOCK_IMAGES = [
  { label: "Modern Avatar", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400" },
  { label: "Tech Executive", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400" },
  { label: "Creative Designer", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400" },
  { label: "Modern Product", url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800" },
  { label: "Cyberpunk Glow", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800" },
  { label: "Minimalist Gradient", url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=800" }
];

export const CanvaInlineImage: React.FC<CanvaInlineImageProps> = ({
  src,
  currentUrl,
  alt,
  altText,
  onChange,
  onSave,
  isEditingAllowed = true,
  className = "",
  shape = "rounded",
  aspectRatio
}) => {
  const activeSrc = src || currentUrl || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800";
  const activeAlt = alt || altText || "Image";
  const handleSave = (val: string) => {
    onChange?.(val);
    onSave?.(val);
  };

  const [isOpen, setIsOpen] = useState(false);
  const [urlInput, setUrlInput] = useState(activeSrc);
  const [hasError, setHasError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setUrlInput(activeSrc);
    setHasError(false);
  }, [activeSrc]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      handleSave(result);
      setUrlInput(result);
      setIsOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const shapeClass =
    shape === "circle"
      ? "rounded-full"
      : shape === "square"
        ? "rounded-xl"
        : shape === "banner"
          ? "rounded-2xl"
          : "rounded-2xl";

  return (
    <div className="relative inline-block group/canvaimg w-full max-w-full">
      <img
        src={hasError ? "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800" : activeSrc}
        alt={activeAlt}
        onError={() => setHasError(true)}
        className={`${className} ${shapeClass} transition-all duration-200 ${
          isEditingAllowed ? "hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2 cursor-pointer" : ""
        }`}
        style={aspectRatio ? { aspectRatio } : undefined}
        onClick={(e) => {
          if (!isEditingAllowed) return;
          e.stopPropagation();
          setIsOpen((o) => !o);
        }}
      />

      {/* Floating Hover Badge on Image */}
      {isEditingAllowed && !isOpen && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/canvaimg:opacity-100 bg-black/40 backdrop-blur-2xs transition-all pointer-events-none rounded-inherit">
          <span className="px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[9px] font-bold shadow-lg flex items-center gap-1">
            <ImageIcon className="w-3 h-3" />
            <span>Click to Replace</span>
          </span>
        </div>
      )}

      {/* Canva Floating Image Menu Modal */}
      {isOpen && isEditingAllowed && (
        <div
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-72 p-3 bg-slate-900/95 border border-indigo-500/60 text-white rounded-2xl shadow-2xl backdrop-blur-xl animate-in zoom-in-95 space-y-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Canva Image Replacer</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* URL Input */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Image URL
            </label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1 px-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  onChange(urlInput);
                  setIsOpen(false);
                }}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold text-xs"
                title="Apply URL"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick File Upload */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Upload className="w-3 h-3 text-indigo-400" />
              <span>Upload Local Photo</span>
            </button>
          </div>

          {/* Curated Presets Grid */}
          <div className="space-y-1 pt-1 border-t border-slate-800">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
              Curated Stock Presets
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {PRESET_STOCK_IMAGES.map((img) => (
                <button
                  key={img.label}
                  type="button"
                  onClick={() => {
                    onChange(img.url);
                    setUrlInput(img.url);
                    setIsOpen(false);
                  }}
                  className="h-10 rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-400 relative group transition-transform hover:scale-105"
                  title={img.label}
                >
                  <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                  <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[7px] font-bold text-white text-center leading-none p-0.5">
                    {img.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. CANVA INLINE ICON & EMOJI SELECTOR
// ============================================================================

export interface CanvaInlineIconProps {
  value: string;
  onChange: (newIcon: string) => void;
  isEditingAllowed?: boolean;
  className?: string;
}

const POPULAR_ICON_LIST = [
  "⚡", "🚀", "🔥", "💎", "👑", "🛍️", "📱", "✉️", "🔗", "🎯",
  "⭐", "❤️", "💡", "🛡️", "🌍", "📅", "🎵", "🎬", "📍", "💬",
  "💳", "🎁", "🛒", "📸", "🔒", "📞", "🏆", "🌟", "✨", "☕"
];

export const CanvaInlineIcon: React.FC<CanvaInlineIconProps> = ({
  value,
  onChange,
  isEditingAllowed = true,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <span
        onClick={(e) => {
          if (!isEditingAllowed) return;
          e.stopPropagation();
          setIsOpen((o) => !o);
        }}
        title={isEditingAllowed ? "Click to change icon / emoji" : undefined}
        className={`${className} ${
          isEditingAllowed
            ? "cursor-pointer hover:scale-125 hover:ring-2 hover:ring-indigo-400 rounded-md transition-transform inline-flex items-center justify-center"
            : ""
        }`}
      >
        {value || "✨"}
      </span>

      {isOpen && isEditingAllowed && (
        <div
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-52 p-2 bg-slate-900/95 border border-indigo-500 rounded-xl shadow-2xl backdrop-blur-xl animate-in zoom-in-95 space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <span className="text-[10px] font-bold text-cyan-300">Choose Icon</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-6 gap-1">
            {POPULAR_ICON_LIST.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => {
                  onChange(ic);
                  setIsOpen(false);
                }}
                className="p-1 text-sm hover:bg-slate-800 rounded flex items-center justify-center hover:scale-125 transition-transform"
              >
                {ic}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 4. CANVA INLINE ITEM REORDER & ACTIONS CONTROLS (for list children)
// ============================================================================

export interface CanvaInlineItemControlsProps {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  className?: string;
}

export const CanvaInlineItemControls: React.FC<CanvaInlineItemControlsProps> = ({
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  isFirst = false,
  isLast = false,
  className = ""
}) => {
  return (
    <div
      className={`absolute top-1 right-1 z-30 flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-900/90 text-white border border-slate-700 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {onMoveUp && !isFirst && (
        <button
          type="button"
          onClick={onMoveUp}
          className="p-1 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 rounded"
          title="Move Up (↑)"
        >
          <ChevronUp className="w-2.5 h-2.5" />
        </button>
      )}
      {onMoveDown && !isLast && (
        <button
          type="button"
          onClick={onMoveDown}
          className="p-1 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 rounded"
          title="Move Down (↓)"
        >
          <ChevronDown className="w-2.5 h-2.5" />
        </button>
      )}
      {onDuplicate && (
        <button
          type="button"
          onClick={onDuplicate}
          className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded"
          title="Duplicate Item"
        >
          <Copy className="w-2.5 h-2.5" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="p-1 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded"
          title="Delete Item"
        >
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
};

// ============================================================================
// 5. CANVA INLINE ADD BUTTON (for adding items to FAQs, Features, Stats, etc.)
// ============================================================================

export interface CanvaInlineAddButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

export const CanvaInlineAddButton: React.FC<CanvaInlineAddButtonProps> = ({
  label,
  onClick,
  className = ""
}) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-full py-1.5 px-3 border border-dashed border-indigo-400/60 hover:border-indigo-500 bg-indigo-500/5 hover:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] mt-2 ${className}`}
    >
      <Plus className="w-3 h-3" />
      <span>{label}</span>
    </button>
  );
};

export default {
  CanvaInlineText,
  CanvaInlineImage,
  CanvaInlineIcon,
  CanvaInlineItemControls,
  CanvaInlineAddButton
};
