import React from "react";
import { createPortal } from "react-dom";
import { X, Check, Palette, Sparkles, Moon, Sun, Terminal, Zap, Crown, Eye, Flame } from "lucide-react";
import { AppTheme, ALL_THEMES } from "../lib/themeStorage";

interface PersonalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
}

export default function PersonalizationModal({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange,
}: PersonalizationModalProps) {
  React.useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getThemeIcon = (id: AppTheme) => {
    switch (id) {
      case "eyevision":
        return <Eye className="h-4 w-4 text-amber-500" />;
      case "dark":
        return <Moon className="h-4 w-4 text-indigo-400" />;
      case "light":
        return <Sun className="h-4 w-4 text-amber-500" />;
      case "cyberpunk":
        return <Zap className="h-4 w-4 text-cyan-400" />;
      case "luxury":
        return <Crown className="h-4 w-4 text-amber-400" />;
      case "synthwave":
        return <Flame className="h-4 w-4 text-pink-400" />;
      case "matrix":
        return <Terminal className="h-4 w-4 text-emerald-400" />;
      default:
        return <Palette className="h-4 w-4 text-indigo-400" />;
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="personalization-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-[var(--key-surface-strong)] border border-[var(--key-border)] shadow-2xl text-[var(--key-text)] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-[var(--key-border)] bg-[var(--key-surface)]">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 shrink-0">
              <Palette className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="personalization-modal-title" className="text-lg sm:text-xl font-bold font-display text-[var(--key-text)]">
                  Personalization Studio
                </h2>
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  Styles & Themes
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--key-muted)] mt-0.5">
                Choose how KEYLINK360 looks across all pages, bio portals, and links.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 text-[var(--key-muted)] hover:text-[var(--key-text)] hover:bg-[var(--key-surface-hover)] rounded-xl transition-colors shrink-0 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Themes Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--key-text)]">
                  Select Visual Mode ({ALL_THEMES.length} Available)
                </h3>
              </div>
              <span className="text-xs font-semibold text-[var(--key-muted)]">Instant Live Preview</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {ALL_THEMES.map((t) => {
                const isActive = currentTheme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onThemeChange(t.id)}
                    className={`group relative text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer ${
                      isActive
                        ? "bg-[var(--key-surface)] border-indigo-500 ring-2 ring-indigo-500/40 shadow-xl"
                        : "bg-[var(--key-surface)] hover:bg-[var(--key-surface-hover)] border-[var(--key-border)] hover:border-indigo-400/50 shadow-sm"
                    }`}
                  >
                    {/* Visual Preview Swatch */}
                    <div className="w-full">
                      <div
                        className="h-20 w-full rounded-xl mb-3.5 p-3 flex flex-col justify-between relative overflow-hidden border border-black/10 dark:border-white/10 shadow-inner"
                        style={{ background: t.previewBg }}
                      >
                        <div className="flex items-center justify-between relative z-10">
                          <span
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm"
                            style={{
                              backgroundColor: t.badgeBg,
                              borderColor: t.accentColor + "44",
                              color: t.accentColor,
                            }}
                          >
                            {getThemeIcon(t.id)}
                            {t.category}
                          </span>

                          {t.tag && (
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-black/50 text-slate-100 border border-white/15">
                              {t.tag}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-2.5 w-2.5 rounded-full ring-2 ring-white/40"
                              style={{ backgroundColor: t.accentColor }}
                            />
                            <span className="text-[10px] font-mono font-bold text-white/95 drop-shadow">
                              {t.accentColor}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
                            {t.id}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm sm:text-base text-[var(--key-text)] flex items-center gap-2">
                          {t.name}
                        </span>
                        {isActive && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            <Check className="h-3.5 w-3.5" /> Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--key-muted)] leading-relaxed min-h-[36px]">
                        {t.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[var(--key-border)] flex items-center justify-between text-xs font-semibold">
                      <span className={`${isActive ? "text-indigo-500 font-bold" : "text-[var(--key-muted)] group-hover:text-[var(--key-text)]"} flex items-center gap-1.5`}>
                        <Eye className="h-3.5 w-3.5" />
                        {isActive ? "Currently Applied" : "Click to Apply"}
                      </span>
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: t.accentColor }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Features & Visual Info */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--key-surface)] border border-[var(--key-border)] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--key-text)] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              Theme Engine Highlights
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[var(--key-muted)]">
              <div className="p-3.5 rounded-xl bg-[var(--key-surface-strong)] border border-[var(--key-border)]">
                <span className="font-bold text-[var(--key-text)] block mb-1">Persistent Storage</span>
                Your chosen theme is automatically saved to your browser preferences.
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--key-surface-strong)] border border-[var(--key-border)]">
                <span className="font-bold text-[var(--key-text)] block mb-1">Full System Glass</span>
                Seamlessly alters sidebar, navigation, modals, tables, and bio previews.
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--key-surface-strong)] border border-[var(--key-border)]">
                <span className="font-bold text-[var(--key-text)] block mb-1">Zero Lag Transition</span>
                Optimized CSS variables guarantee instant, smooth real-time switching.
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-[var(--key-border)] bg-[var(--key-surface)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--key-muted)]">Current Active Theme:</span>
            <span className="text-xs font-bold text-indigo-500 uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              {currentTheme}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer btn-anim btn-swipe"
          >
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
