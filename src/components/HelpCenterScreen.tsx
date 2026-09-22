import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HelpArticle, ScreenId } from "../types";
import {
  BookOpen,
  Search,
  ArrowRight,
  MessageSquare,
  Shield,
  Key,
  Globe,
  X,
  Clock,
  ThumbsUp,
  ThumbsDown,
  CreditCard,
  Sparkles,
  Languages,
  Check
} from "lucide-react";
import InteractiveSetupGuideModal from "./guides/InteractiveSetupGuideModal";
import PageShell from "./layout/PageShell";

function HelpArticleBody({ content }: { content: string }) {
  const parts: Array<{ type: "text" | "table" | "heading"; value: string }> = [];
  const lines = content.split("\n");

  let currentBlock: string[] = [];
  for (const line of lines) {
    if (line.startsWith("━━━━━━━━━━━━━━━━━━━━")) {
      if (currentBlock.length) {
        parts.push({ type: "text", value: currentBlock.join("\n").trim() });
        currentBlock = [];
      }
    } else if (line.startsWith("STEP ") || line.startsWith("HOW ") || line.startsWith("OVERVIEW") || line.startsWith("KEY BENEFIT") || line.startsWith("CRM ") || line.startsWith("ANTI-SPAM")) {
      if (currentBlock.length) {
        parts.push({ type: "text", value: currentBlock.join("\n").trim() });
        currentBlock = [];
      }
      parts.push({ type: "heading", value: line });
    } else {
      currentBlock.push(line);
    }
  }
  if (currentBlock.length) {
    parts.push({ type: "text", value: currentBlock.join("\n").trim() });
  }

  return (
    <div className="space-y-4">
      {parts.map((part, index) => {
        if (part.type === "heading") {
          return (
            <div key={index} className="pt-2 border-b border-[var(--key-border)] pb-1">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono">
                {part.value}
              </span>
            </div>
          );
        }
        return (
          <p key={index} className="text-xs sm:text-sm text-[var(--key-text)] leading-relaxed whitespace-pre-line font-medium opacity-90">
            {part.value}
          </p>
        );
      })}
    </div>
  );
}

interface HelpCenterScreenProps {
  articles: HelpArticle[];
  onNavigate?: (screen: ScreenId) => void;
}

const CATEGORY_META: Record<
  string,
  { icon: typeof BookOpen; color: string }
> = {
  "AI & Automation": { icon: Sparkles, color: "text-emerald-400 bg-emerald-500/15" },
  "Getting Started": { icon: BookOpen, color: "text-blue-400 bg-blue-500/15" },
  "Custom Domains": { icon: Globe, color: "text-teal-400 bg-teal-500/15" },
  "APIs & Webhooks": { icon: Key, color: "text-purple-400 bg-purple-500/15" },
  "Security & Privacy": { icon: Shield, color: "text-rose-400 bg-rose-500/15" },
  Billing: { icon: CreditCard, color: "text-amber-400 bg-amber-500/15" }
};

type LanguageMode = "en" | "ta" | "hi";

export default function HelpCenterScreen({ articles, onNavigate }: HelpCenterScreenProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [selectedLang, setSelectedLang] = useState<LanguageMode>("en");
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const articleId = searchParams.get("article");
    if (!articleId) return;
    const match = articles.find((item) => item.id === articleId);
    if (match) {
      setSelectedArticle(match);
      setActiveCategory(match.category);
      setFeedback(null);
    }
  }, [articles, searchParams]);

  const triggerToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  };

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const article of articles) {
      counts.set(article.category, (counts.get(article.category) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        count,
        icon: CATEGORY_META[name]?.icon || BookOpen,
        color: CATEGORY_META[name]?.color || "text-slate-400 bg-slate-500/15"
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [articles]);

  const getLocalizedArticle = (art: HelpArticle, lang: LanguageMode) => {
    if (lang === "en" || !art.translations || !art.translations[lang]) {
      return {
        ...art,
        displayTitle: art.title,
        displayExcerpt: art.excerpt,
        displayContent: art.content || art.excerpt
      };
    }
    const t = art.translations[lang]!;
    return {
      ...art,
      displayTitle: t.title || art.title,
      displayExcerpt: t.excerpt || art.excerpt,
      displayContent: t.content || art.content || art.excerpt
    };
  };

  const localizedArticles = useMemo(() => {
    return articles.map((art) => getLocalizedArticle(art, selectedLang));
  }, [articles, selectedLang]);

  const filteredArticles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return localizedArticles.filter((article) => {
      const matchesCategory = !activeCategory || article.category === activeCategory;
      const matchesSearch =
        !query ||
        article.displayTitle.toLowerCase().includes(query) ||
        article.displayExcerpt.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query) ||
        article.displayContent.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [localizedArticles, searchQuery, activeCategory]);

  const openArticle = (article: HelpArticle) => {
    setSelectedArticle(article);
    setFeedback(null);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategory(null);
  };

  const hasFilters = searchQuery.trim().length > 0 || activeCategory !== null;

  const activeLocalizedSelected = selectedArticle
    ? getLocalizedArticle(selectedArticle, selectedLang)
    : null;

  return (
    <PageShell className="font-sans text-[var(--key-text)]">
      {/* Header Banner with Language Switcher */}
      <div className="bg-[var(--key-surface-strong)] border border-[var(--key-border)] rounded-2xl p-6 sm:p-8 text-center text-[var(--key-text)] space-y-4 relative overflow-hidden shadow-lg" data-aos="fade-up">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-emerald-500/5 to-transparent pointer-events-none" />
        
        <div className="relative space-y-3 z-10 max-w-xl mx-auto">
          {/* Multi-Language Switcher Pills */}
          <div className="inline-flex items-center gap-1.5 p-1 bg-[var(--key-surface)] rounded-2xl border border-[var(--key-border)] mb-2 shadow-inner">
            <span className="text-[10px] font-bold text-[var(--key-muted)] uppercase tracking-wider px-2 flex items-center gap-1">
              <Languages className="h-3.5 w-3.5 text-indigo-400" /> Language:
            </span>
            <button
              type="button"
              onClick={() => setSelectedLang("en")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedLang === "en"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-[var(--key-muted)] hover:text-[var(--key-text)]"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setSelectedLang("ta")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedLang === "ta"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-[var(--key-muted)] hover:text-[var(--key-text)]"
              }`}
            >
              தமிழ் (Tamil)
            </button>
            <button
              type="button"
              onClick={() => setSelectedLang("hi")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedLang === "hi"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-[var(--key-muted)] hover:text-[var(--key-text)]"
              }`}
            >
              हिन्दी (Hindi)
            </button>
          </div>

          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-[var(--key-text)]">
            {selectedLang === "ta"
              ? "நாங்கள் உங்களுக்கு எவ்வாறு உதவலாம்?"
              : selectedLang === "hi"
                ? "हम आपकी कैसे मदद कर सकते हैं?"
                : "How can we help you?"}
          </h2>
          <p className="text-[var(--key-muted)] text-xs sm:text-sm">
            {selectedLang === "ta"
              ? "AI Sales Bot, WhatsApp Cloud API, QR ஸ்கேனர் மற்றும் டொமைன் அமைவு வழிகாட்டிகள்."
              : selectedLang === "hi"
                ? "AI सेल्स बॉट, व्हाट्सएप ऑटोमेशन, QR कोड और डोमेन सेटअप के आसान गाइड्स।"
                : "Explore step-by-step setup guides for AI Sales Assistant, WhatsApp Cloud API, and Bio Websites."}
          </p>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsGuideModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-bold text-xs shadow-md transition-all hover:scale-105 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>
                {selectedLang === "ta"
                  ? "நேரடி செயல்முறை வழிகாட்டியைத் திற (Interactive Visual Guide) →"
                  : selectedLang === "hi"
                    ? "इंटरएक्टिव विजुअल गाइड खोलें (Visual Setup Guide) →"
                    : "Launch Interactive Step-by-Step Visual Guide →"}
              </span>
            </button>
          </div>

          <div className="pt-2 max-w-md mx-auto">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--key-muted)]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={
                  selectedLang === "ta"
                    ? "வழிகாட்டிகள், AI, WhatsApp அல்லது DNS தேடவும்..."
                    : selectedLang === "hi"
                      ? "गाइड्स, AI, WhatsApp या DNS सर्च करें..."
                      : "Search guides, AI bot, WhatsApp setup, domains..."
                }
                className="w-full bg-[var(--key-input-bg)] text-[var(--key-text)] border border-[var(--key-input-border)] rounded-2xl pl-10 pr-4 py-3 text-xs placeholder-[var(--key-muted)] focus:outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-display font-bold text-base text-[var(--key-text)] tracking-tight">
            Browse Knowledge Categories
          </h3>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-bold text-indigo-400 hover:underline self-start sm:self-auto"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => {
            const CatIcon = cat.icon;
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() =>
                  setActiveCategory((current) => (current === cat.name ? null : cat.name))
                }
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isActive
                    ? "bg-indigo-600/15 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                    : "bg-[var(--key-surface-strong)] border-[var(--key-border)] hover:border-indigo-500/40 hover:bg-[var(--key-surface-hover)]"
                }`}
              >
                <div>
                  <div
                    className={`h-9 w-9 rounded-xl ${cat.color} flex items-center justify-center shrink-0 mb-3`}
                  >
                    <CatIcon className="h-4 w-4" />
                  </div>
                  <h4 className="font-display font-bold text-xs text-[var(--key-text)] leading-tight">
                    {cat.name}
                  </h4>
                </div>
                <span className="text-[10px] text-[var(--key-muted)] font-semibold block mt-3">
                  {cat.count} guide{cat.count === 1 ? "" : "s"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-base text-[var(--key-text)] tracking-tight">
          {searchQuery
            ? `Search results for "${searchQuery}"`
            : activeCategory
              ? activeCategory
              : "Recommended Setup Guides"}
        </h3>

        {filteredArticles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--key-border)] p-8 text-center space-y-3 bg-[var(--key-surface-strong)]">
            <p className="text-xs text-[var(--key-muted)]">
              No guides found{searchQuery ? ` matching "${searchQuery}"` : ""}.
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-indigo-400 text-xs font-bold hover:underline"
              >
                Clear search filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArticles.map((art) => (
              <article
                key={art.id}
                className="rounded-2xl border border-[var(--key-border)] bg-[var(--key-surface-strong)] p-5 hover:border-indigo-500/40 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {art.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--key-muted)] font-mono">
                      <Clock className="h-3 w-3" />
                      {art.readTime}
                    </span>
                  </div>

                  <h4 className="font-display font-bold text-[var(--key-text)] text-sm leading-snug">
                    {art.displayTitle}
                  </h4>
                  <p className="text-[var(--key-muted)] text-xs leading-relaxed line-clamp-3">
                    {art.displayExcerpt}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openArticle(art)}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-4 transition-colors self-start"
                >
                  <span>
                    {selectedLang === "ta"
                      ? "முழு வழிகாட்டியைப் படிக்கவும்"
                      : selectedLang === "hi"
                        ? "पूरा गाइड पढ़ें"
                        : "Read interactive guide"}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && activeLocalizedSelected && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-article-title"
            className="bg-[var(--key-surface-strong)] rounded-2xl max-w-2xl w-full shadow-2xl border border-[var(--key-border)] max-h-[90vh] flex flex-col overflow-hidden text-[var(--key-text)] animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--key-border)] flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {selectedArticle.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-[var(--key-muted)] font-mono">
                    <Clock className="h-3 w-3" />
                    {selectedArticle.readTime}
                  </span>
                </div>
                <h3
                  id="help-article-title"
                  className="font-display font-bold text-base sm:text-lg text-[var(--key-text)] leading-snug"
                >
                  {activeLocalizedSelected.displayTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedArticle(null);
                  if (searchParams.has("article")) {
                    const next = new URLSearchParams(searchParams);
                    next.delete("article");
                    setSearchParams(next, { replace: true });
                  }
                }}
                className="text-[var(--key-muted)] hover:text-[var(--key-text)] p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              <div className="rounded-2xl bg-[var(--key-surface)] border border-[var(--key-border)] p-4 sm:p-5">
                <HelpArticleBody content={activeLocalizedSelected.displayContent} />
              </div>

              <div className="pt-2 border-t border-[var(--key-border)] flex items-center justify-between">
                <p className="text-xs font-semibold text-[var(--key-muted)]">Was this guide helpful?</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFeedback("up");
                      triggerToast("Thanks for the feedback!");
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      feedback === "up"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-[var(--key-surface)] text-[var(--key-muted)] border-[var(--key-border)] hover:bg-[var(--key-surface-hover)]"
                    }`}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFeedback("down");
                      triggerToast("Thanks — we’ll refine this guide.");
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      feedback === "down"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : "bg-[var(--key-surface)] text-[var(--key-muted)] border-[var(--key-border)] hover:bg-[var(--key-surface-hover)]"
                    }`}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                    No
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--key-border)] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2 text-xs font-bold text-[var(--key-muted)] hover:text-[var(--key-text)] rounded-xl"
              >
                Close Guide
              </button>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedArticle(null);
                    onNavigate(ScreenId.CONTACT_SUPPORT);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Ask Support Team
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-[var(--key-surface-strong)] text-[var(--key-text)] border border-[var(--key-border)] text-xs font-bold py-3 px-5 rounded-2xl shadow-2xl z-[150] animate-in slide-in-from-bottom-4 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          {toast}
        </div>
      )}

      {/* Multi-Language Interactive Setup Guide Modal */}
      <InteractiveSetupGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        initialLanguage={selectedLang}
      />
    </PageShell>
  );
}
