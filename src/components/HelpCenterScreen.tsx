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
  CreditCard
} from "lucide-react";
import PageShell from "./layout/PageShell";

function HelpArticleBody({ content }: { content: string }) {
  const parts: Array<{ type: "text" | "table"; value: string }> = [];
  const chunks = content.split(/\n(?=TABLE:)/);
  for (const chunk of chunks) {
    if (!chunk.startsWith("TABLE:")) {
      if (chunk.trim()) parts.push({ type: "text", value: chunk.trim() });
      continue;
    }
    const lines = chunk.split("\n");
    const tableLines: string[] = [];
    const rest: string[] = [];
    let inTable = true;
    for (let i = 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (inTable && line.includes("|")) tableLines.push(line);
      else {
        inTable = false;
        if (line.trim()) rest.push(line);
      }
    }
    if (tableLines.length >= 2) {
      parts.push({ type: "table", value: tableLines.join("\n") });
    }
    if (rest.length) parts.push({ type: "text", value: rest.join("\n").trim() });
  }

  return (
    <div className="space-y-4">
      {parts.map((part, index) => {
        if (part.type === "table") {
          const rows = part.value.split("\n").map((line) => line.split("|").map((cell) => cell.trim()));
          const [header, ...body] = rows;
          return (
            <div key={index} className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="key-help-table">
                <thead>
                  <tr>
                    {header.map((cell) => (
                      <th key={cell}>{cell}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return (
          <p key={index} className="text-sm text-slate-700 leading-relaxed whitespace-pre-line font-medium">
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
  "Getting Started": { icon: BookOpen, color: "text-blue-600 bg-blue-50" },
  "Custom Domains": { icon: Globe, color: "text-emerald-600 bg-emerald-50" },
  "APIs & Webhooks": { icon: Key, color: "text-purple-600 bg-purple-50" },
  "Security & Privacy": { icon: Shield, color: "text-rose-500 bg-rose-50" },
  Billing: { icon: CreditCard, color: "text-amber-600 bg-amber-50" }
};

export default function HelpCenterScreen({ articles, onNavigate }: HelpCenterScreenProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
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
        color: CATEGORY_META[name]?.color || "text-slate-600 bg-slate-50"
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [articles]);

  const filteredArticles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return articles.filter((article) => {
      const matchesCategory = !activeCategory || article.category === activeCategory;
      const matchesSearch =
        !query ||
        article.title.toLowerCase().includes(query) ||
        article.excerpt.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query) ||
        (article.content || "").toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [articles, searchQuery, activeCategory]);

  const openArticle = (article: HelpArticle) => {
    setSelectedArticle(article);
    setFeedback(null);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategory(null);
  };

  const hasFilters = searchQuery.trim().length > 0 || activeCategory !== null;

  return (
    <PageShell>
      <div className="bg-slate-900 rounded-2xl p-4 sm:p-8 text-center text-white space-y-3 relative overflow-hidden shadow-xl shadow-slate-900/10">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#FF6B4A]/10 to-[#4F46E5]/20" />
        <div className="relative space-y-3 z-10 max-w-lg mx-auto">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">How can we help?</h2>
          <p className="text-slate-300 text-sm">
            Search support articles or browse topics below.
          </p>

          <div className="key-icon-field pt-3">
            <span className="key-icon-field__icon">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search guides, setup answers..."
              aria-label="Search help articles"
              className="key-icon-field__input w-full bg-white text-slate-900 border border-transparent rounded-2xl py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-display font-bold text-lg text-gray-900 tracking-tight">Browse Categories</h3>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-bold text-[#4F46E5] hover:underline self-start sm:self-auto"
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const CatIcon = cat.icon;
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.name}
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  setActiveCategory((current) => (current === cat.name ? null : cat.name))
                }
                className={`key-glass-card p-4 sm:p-8 text-left transition-all flex flex-col justify-between min-w-0 ${
                  isActive
                    ? "border-[#4F46E5] ring-2 ring-indigo-100 shadow-md"
                    : "border-gray-100 hover:border-indigo-150 hover:shadow-md"
                }`}
              >
                <div>
                  <div
                    className={`h-10 w-10 rounded-xl ${cat.color} flex items-center justify-center shrink-0 mb-3 sm:mb-4`}
                  >
                    <CatIcon className="h-5 w-5" />
                  </div>
                  <h4 className="font-display font-semibold text-sm text-gray-950 leading-tight">
                    {cat.name}
                  </h4>
                </div>
                <span className="text-[11px] text-gray-400 font-semibold block mt-3 sm:mt-4">
                  {cat.count} article{cat.count === 1 ? "" : "s"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="font-display font-bold text-lg text-gray-900 tracking-tight">
          {searchQuery
            ? `Search results for "${searchQuery}"`
            : activeCategory
              ? activeCategory
              : "Frequently Asked Questions"}
        </h3>

        {filteredArticles.length === 0 ? (
          <div className="key-glass-card border-dashed p-5 sm:p-6 text-center space-y-3">
            <p className="text-sm text-gray-500">
              No articles found{searchQuery ? ` matching "${searchQuery}"` : ""}.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-[#4F46E5] text-sm font-semibold hover:underline"
                >
                  Clear filters
                </button>
              )}
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate(ScreenId.CONTACT_SUPPORT)}
                  className="inline-flex items-center gap-1.5 bg-[#4F46E5] text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Contact support
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {filteredArticles.map((art) => (
              <article
                key={art.id}
                className="key-glass-card p-4 sm:p-6 hover:shadow-md hover:border-indigo-50 transition-all flex flex-col justify-between min-w-0"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-indigo-50 text-[#4F46E5] text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      {art.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 font-semibold">
                      <Clock className="h-3 w-3" />
                      {art.readTime}
                    </span>
                  </div>
                  <h4 className="font-display font-semibold text-gray-900 text-base mt-2.5 leading-snug">
                    {art.title}
                  </h4>
                  <p className="text-gray-500 text-xs mt-2 leading-relaxed line-clamp-3">
                    {art.excerpt}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openArticle(art)}
                  className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1 mt-4 transition-colors self-start"
                >
                  <span>Read article</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="key-section-card p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="min-w-0">
          <h3 className="font-display font-bold text-gray-950 text-base">Still need help?</h3>
          <p className="text-gray-500 text-xs mt-1">
            Reach our support team for account, billing, or setup questions.
          </p>
        </div>
        {onNavigate ? (
          <button
            type="button"
            onClick={() => onNavigate(ScreenId.CONTACT_SUPPORT)}
            className="inline-flex items-center justify-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm shrink-0"
          >
            <MessageSquare className="h-4 w-4" />
            Contact Support
          </button>
        ) : null}
      </div>

      {selectedArticle && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-article-title"
            className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="bg-indigo-50 text-[#4F46E5] text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    {selectedArticle.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 font-semibold">
                    <Clock className="h-3 w-3" />
                    {selectedArticle.readTime}
                  </span>
                </div>
                <h3
                  id="help-article-title"
                  className="font-display font-bold text-lg text-slate-900 leading-snug"
                >
                  {selectedArticle.title}
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
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full shrink-0"
                aria-label="Close article"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 sm:p-5">
                <HelpArticleBody content={selectedArticle.content || selectedArticle.excerpt} />
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-2">Was this article helpful?</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFeedback("up");
                      triggerToast("Thanks for the feedback.");
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      feedback === "up"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFeedback("down");
                      triggerToast("Thanks — we’ll use this to improve our docs.");
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      feedback === "down"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                    No
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl"
              >
                Close
              </button>
              <div className="flex flex-wrap items-center gap-2">
                {onNavigate && selectedArticle.category === "Custom Domains" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedArticle(null);
                      onNavigate(ScreenId.CUSTOM_DOMAINS);
                    }}
                    className="inline-flex items-center gap-1.5 border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-4 py-2.5 rounded-xl text-xs font-bold"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Open Custom Domains
                  </button>
                )}
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedArticle(null);
                      onNavigate(ScreenId.CONTACT_SUPPORT);
                    }}
                    className="inline-flex items-center gap-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white px-4 py-2.5 rounded-xl text-xs font-bold"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Still need help?
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 left-6 sm:left-auto bg-slate-900 text-white border border-slate-800 text-xs font-black py-3 px-5 rounded-2xl shadow-2xl z-50 max-w-sm sm:ml-auto">
          {toast}
        </div>
      )}
    </PageShell>
  );
}
