import React, { useEffect, useMemo, useState } from "react";
import type { CustomDomain, ShortLinkAnalytics, SmartLink } from "../types";
import {
  Link2,
  TrendingUp,
  MousePointerClick,
  Percent,
  Plus,
  Filter,
  X,
  Smartphone,
  Monitor,
  Tablet,
  Trash2,
  Edit2,
  Sparkles,
  Copy,
  Search,
  ExternalLink
} from "lucide-react";
import PageShell, { PageHeader, SectionCard, Workspace } from "./layout/PageShell";
import {
  createShortLink,
  deleteShortLink,
  fetchShortLinkAnalytics,
  ShortLinkApiError,
  updateShortLink
} from "../lib/shortLinkApi";
import { PRIMARY_DOMAIN } from "../storage/publishStorage";

type RetargetPixel = "fb" | "google" | "tiktok";

interface LinksScreenProps {
  links: SmartLink[];
  domains?: CustomDomain[];
  onReload: () => Promise<void>;
  onUpsertLink?: (link: SmartLink) => void;
  loading?: boolean;
  loadError?: string | null;
}

const RETARGET_OPTIONS: Array<{ id: RetargetPixel; label: string }> = [
  { id: "fb", label: "Facebook" },
  { id: "google", label: "Google Ads" },
  { id: "tiktok", label: "TikTok Pixel" }
];

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

function isValidDestination(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return Boolean(url.hostname.includes("."));
  } catch {
    return false;
  }
}

export default function LinksScreen({
  links,
  domains = [],
  onReload,
  onUpsertLink,
  loading = false,
  loadError = null
}: LinksScreenProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newHostDomain, setNewHostDomain] = useState(PRIMARY_DOMAIN);
  const [newRetargeting, setNewRetargeting] = useState<RetargetPixel[]>(["fb", "google"]);
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [editingLink, setEditingLink] = useState<SmartLink | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editHostDomain, setEditHostDomain] = useState(PRIMARY_DOMAIN);
  const [editStatus, setEditStatus] = useState<"Live" | "Paused">("Live");
  const [editRetargeting, setEditRetargeting] = useState<RetargetPixel[]>([]);
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Live" | "Paused">("All");
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [analyticsById, setAnalyticsById] = useState<Record<string, ShortLinkAnalytics>>({});
  const [activeDevice, setActiveDevice] = useState<"mobile" | "desktop" | "tablet">("mobile");

  const hostOptions = useMemo(() => {
    const custom = domains
      .filter((domain) => domain.status === "Verified" || domain.status === "DNS Verified")
      .map((domain) => domain.domainName.trim().toLowerCase())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    const uniqueCustom = Array.from(new Set(custom));
    return [
      { value: PRIMARY_DOMAIN, label: `KEYLINK360 (${PRIMARY_DOMAIN})` },
      ...uniqueCustom.map((host) => ({ value: host, label: host }))
    ];
  }, [domains]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const next: Record<string, ShortLinkAnalytics> = {};
      await Promise.all(
        links.slice(0, 40).map(async (link) => {
          try {
            next[link.id] = await fetchShortLinkAnalytics(link.id);
          } catch {
            // Keep page usable if analytics lag.
          }
        })
      );
      if (!cancelled) setAnalyticsById(next);
    };
    if (links.length > 0) void load();
    else setAnalyticsById({});
    return () => {
      cancelled = true;
    };
  }, [links]);

  const triggerToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const copyText = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      triggerToast(successMessage);
    } catch {
      triggerToast("Unable to copy. Please copy the URL manually.");
    }
  };

  const filteredLinks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return links.filter((link) => {
      const matchesSearch =
        !query ||
        link.title.toLowerCase().includes(query) ||
        link.shortUrl.toLowerCase().includes(query) ||
        link.slug.toLowerCase().includes(query) ||
        (link.destinationUrl || "").toLowerCase().includes(query);

      const matchesStatus = statusFilter === "All" || link.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [links, searchQuery, statusFilter]);

  const totalClicks = links.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
  const activeLinks = links.filter((link) => link.status === "Live").length;
  const avgClicks = links.length > 0 ? totalClicks / links.length : 0;

  const analyticsList = useMemo(
    () => Object.values(analyticsById) as ShortLinkAnalytics[],
    [analyticsById]
  );

  const aggregatedDevices = useMemo(() => {
    const devices = { mobile: 0, desktop: 0, tablet: 0, other: 0 };
    for (const analytics of analyticsList) {
      devices.mobile += analytics.devices?.mobile || 0;
      devices.desktop += analytics.devices?.desktop || 0;
      devices.tablet += analytics.devices?.tablet || 0;
      devices.other += analytics.devices?.other || 0;
    }
    return devices;
  }, [analyticsList]);

  const deviceTotal =
    aggregatedDevices.mobile +
    aggregatedDevices.desktop +
    aggregatedDevices.tablet +
    aggregatedDevices.other;
  const deviceClicks = aggregatedDevices[activeDevice] || 0;

  const clickTrendPoints = useMemo(() => {
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const totals = labels.map(() => 0);
    for (const analytics of analyticsList) {
      for (const point of analytics.daily || []) {
        const index = labels.indexOf(point.label);
        if (index >= 0) totals[index] += point.value || 0;
      }
    }
    const sample = analyticsList[0]?.daily;
    if (sample?.length) {
      const map = new Map<string, number>();
      for (const analytics of analyticsList) {
        for (const point of analytics.daily || []) {
          map.set(point.label, (map.get(point.label) || 0) + (point.value || 0));
        }
      }
      return sample.map((point) => ({
        label: point.label.toUpperCase(),
        value: map.get(point.label) || 0
      }));
    }
    return labels.map((label, index) => ({
      label: label.toUpperCase(),
      value: totals[index]
    }));
  }, [analyticsList]);

  const maxVal = Math.max(...clickTrendPoints.map((point) => point.value), 1);
  const chartHeight = 150;
  const chartWidth = 500;
  const padding = 25;
  const pointsString = clickTrendPoints
    .map((point, index) => {
      const x =
        clickTrendPoints.length <= 1
          ? chartWidth / 2
          : padding + (index * (chartWidth - padding * 2)) / (clickTrendPoints.length - 1);
      const y = chartHeight - padding - (point.value / maxVal) * (chartHeight - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const resetCreateForm = () => {
    setNewTitle("");
    setNewSlug("");
    setNewTarget("");
    setNewHostDomain(PRIMARY_DOMAIN);
    setNewRetargeting(["fb", "google"]);
    setCreateError("");
  };

  const closeCreateModal = () => {
    if (isCreating) return;
    setIsAdding(false);
    resetCreateForm();
  };

  const openEditModal = (link: SmartLink) => {
    setEditingLink(link);
    setEditTitle(link.title);
    setEditTarget(link.destinationUrl || "");
    setEditSlug(normalizeSlug(link.slug) || link.slug.replace(/^\//, ""));
    setEditHostDomain(link.hostDomain || PRIMARY_DOMAIN);
    setEditStatus(link.status);
    setEditRetargeting((link.retargeting || []).filter((item): item is RetargetPixel =>
      ["fb", "google", "tiktok"].includes(item)
    ));
    setEditError("");
  };

  const closeEditModal = () => {
    if (isSavingEdit) return;
    setEditingLink(null);
    setEditError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError("");

    const title = newTitle.trim();
    const cleanSlug = normalizeSlug(newSlug || title);
    const target = newTarget.trim();

    if (!title) {
      setCreateError("Link title is required.");
      return;
    }
    if (!isValidDestination(target)) {
      setCreateError("Enter a valid destination URL.");
      return;
    }
    if (!cleanSlug) {
      setCreateError("Short slug is required.");
      return;
    }

    setIsCreating(true);
    try {
      const saved = await createShortLink({
        title,
        slug: cleanSlug,
        hostDomain: newHostDomain || PRIMARY_DOMAIN,
        destinationUrl: target,
        status: "Live",
        retargeting: newRetargeting
      });
      onUpsertLink?.(saved);
      setIsAdding(false);
      resetCreateForm();
      triggerToast("Short link created — copy and share the live URL.");
      void onReload();
    } catch (error) {
      setCreateError(
        error instanceof ShortLinkApiError ? error.message : "Unable to create short link."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingLink) return;
    setEditError("");

    const title = editTitle.trim();
    const cleanSlug = normalizeSlug(editSlug);
    const target = editTarget.trim();

    if (!title) {
      setEditError("Link title is required.");
      return;
    }
    if (!isValidDestination(target)) {
      setEditError("Enter a valid destination URL.");
      return;
    }
    if (!cleanSlug) {
      setEditError("Short slug is required.");
      return;
    }

    setIsSavingEdit(true);
    try {
      const saved = await updateShortLink(editingLink.id, {
        title,
        slug: cleanSlug,
        hostDomain: editHostDomain || PRIMARY_DOMAIN,
        destinationUrl: target,
        status: editStatus,
        retargeting: editRetargeting
      });
      onUpsertLink?.(saved);
      setEditingLink(null);
      triggerToast("Short link saved.");
      void onReload();
    } catch (error) {
      setEditError(
        error instanceof ShortLinkApiError ? error.message : "Unable to save short link."
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleToggleStatus = async (link: SmartLink) => {
    const nextStatus = link.status === "Live" ? "Paused" : "Live";
    try {
      const saved = await updateShortLink(link.id, {
        title: link.title,
        slug: normalizeSlug(link.slug) || link.slug.replace(/^\//, ""),
        hostDomain: link.hostDomain || PRIMARY_DOMAIN,
        destinationUrl: link.destinationUrl || "",
        status: nextStatus,
        retargeting: link.retargeting || []
      });
      onUpsertLink?.(saved);
      triggerToast(`Status switched to ${nextStatus}.`);
      void onReload();
    } catch (error) {
      triggerToast(error instanceof ShortLinkApiError ? error.message : "Unable to update status.");
    }
  };

  const handleDelete = async (link: SmartLink) => {
    const confirmed = window.confirm(
      `Delete "${link.title}"?\n\n${link.shortUrl} will stop working.`
    );
    if (!confirmed) return;
    try {
      await deleteShortLink(link.id);
      triggerToast("Short link deleted.");
      void onReload();
    } catch (error) {
      triggerToast(error instanceof ShortLinkApiError ? error.message : "Unable to delete.");
    }
  };

  const openShortUrl = (link: SmartLink) => {
    if (link.status !== "Live") {
      triggerToast("Paused links do not redirect. Set the link to Live first.");
      return;
    }
    window.open(link.shortUrl, "_blank", "noopener,noreferrer");
  };

  const openDestination = (destinationUrl?: string) => {
    if (!destinationUrl || !isValidDestination(destinationUrl)) {
      triggerToast("This link has no valid destination URL.");
      return;
    }
    const url = /^https?:\/\//i.test(destinationUrl) ? destinationUrl : `https://${destinationUrl}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const hasActiveFilters = searchQuery.trim().length > 0 || statusFilter !== "All";

  const toggleRetarget = (
    current: RetargetPixel[],
    pixel: RetargetPixel,
    setter: React.Dispatch<React.SetStateAction<RetargetPixel[]>>
  ) => {
    setter(
      current.includes(pixel) ? current.filter((item) => item !== pixel) : [...current, pixel]
    );
  };

  return (
    <PageShell className="font-sans text-slate-800">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white border border-slate-800 text-xs font-bold py-3 px-5 rounded-2xl shadow-2xl z-50">
          {toast}
        </div>
      )}

      <PageHeader
        title="Smart Short Links"
        subtitle="Create a real short URL that redirects to your destination and tracks live clicks."
        actions={
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 key-btn-chip px-5 py-2.5 text-xs font-extrabold active:scale-95"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Shorten a Link</span>
          </button>
        }
      />

      {loadError && (
        <SectionCard className="border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {loadError}
        </SectionCard>
      )}
      {loading && (
        <p className="text-xs font-semibold text-slate-400">Loading short links…</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Links</p>
            <h3 className="font-display font-black text-3xl text-slate-900 mt-1">
              {activeLinks} / {links.length}
            </h3>
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              {activeLinks} live redirects
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center shrink-0">
            <Link2 className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Click Traffic</p>
            <h3 className="font-display font-black text-3xl text-slate-900 mt-1">
              {totalClicks.toLocaleString()}
            </h3>
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Across all short links
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <MousePointerClick className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg. Engagement</p>
            <h3 className="font-display font-black text-3xl text-slate-900 mt-1">
              {avgClicks.toFixed(1)}
            </h3>
            <span className="text-xs text-indigo-600 font-bold flex items-center gap-1 mt-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Avg clicks / link
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Percent className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 key-workspace-grid">
        <Workspace stack className="lg:col-span-2 min-w-0">
          <Workspace panel stack className="bg-white border border-slate-200/60 rounded-3xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-display font-black text-lg text-slate-900">Configured Links</h3>
              <button
                type="button"
                onClick={() => setShowFilters((open) => !open)}
                className={`inline-flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-colors self-start ${
                  showFilters || hasActiveFilters
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "hover:bg-slate-50 border-slate-200 text-slate-500"
                }`}
                aria-expanded={showFilters}
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">On</span>
                )}
              </button>
            </div>

            {showFilters && (
              <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                <div className="key-icon-field flex-1">
                  <span className="key-icon-field__icon">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search title, slug, or destination..."
                    className="key-icon-field__input w-full bg-white border border-slate-200 rounded-xl py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    aria-label="Search links"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as "All" | "Live" | "Paused")}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none"
                  aria-label="Filter by status"
                >
                  <option value="All">All statuses</option>
                  <option value="Live">Live</option>
                  <option value="Paused">Paused</option>
                </select>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("All");
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-white"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {links.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <p className="text-slate-500 text-sm">No smart links yet.</p>
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="inline-flex items-center gap-2 key-btn-chip px-4 py-2 text-xs font-extrabold"
                >
                  <Plus className="h-4 w-4" />
                  Shorten a Link
                </button>
              </div>
            ) : filteredLinks.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm space-y-2">
                <p>No links match your filters.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("All");
                  }}
                  className="text-[#6366f1] font-semibold hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="lg:hidden divide-y divide-slate-100">
                  {filteredLinks.map((link) => (
                    <div key={link.id} className="py-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{link.title}</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-1 truncate">
                            {link.destinationUrl || "No destination"}
                          </p>
                          <button
                            type="button"
                            onClick={() => void copyText(link.shortUrl, "Short URL copied.")}
                            className="text-indigo-600 font-black font-mono text-xs mt-1 hover:underline"
                          >
                            {link.shortUrl}
                          </button>
                        </div>
                        <button type="button" onClick={() => handleToggleStatus(link)}>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              link.status === "Live"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                          >
                            {link.status}
                          </span>
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-black text-slate-900">{link.clicks} clicks</span>
                        {(link.retargeting || []).map((pixel) => (
                          <span
                            key={pixel}
                            className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-black text-[8px] uppercase"
                          >
                            {pixel}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openShortUrl(link)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1.5 rounded-xl text-[10px] font-black"
                        >
                          Open short URL
                        </button>
                        <button
                          type="button"
                          onClick={() => openDestination(link.destinationUrl)}
                          className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl"
                          aria-label="Open destination"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(link)}
                          className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl"
                          aria-label={`Edit ${link.title}`}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(link)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl"
                          aria-label={`Delete ${link.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black tracking-wider uppercase">
                        <th className="py-3 px-2">Title & Destination</th>
                        <th className="py-3 px-2">Short URL</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2">Retargeting</th>
                        <th className="py-3 px-2 text-right">Clicks</th>
                        <th className="py-3 px-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLinks.map((link) => (
                        <tr key={link.id} className="text-sm group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-2 max-w-xs">
                            <div className="font-bold text-slate-800 leading-tight truncate">{link.title}</div>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block truncate">
                              Redirects to:{" "}
                              <span className="font-bold text-slate-500">
                                {link.destinationUrl || "Not configured"}
                              </span>
                            </span>
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => void copyText(link.shortUrl, "Short URL copied.")}
                                className="text-indigo-600 font-black font-mono hover:underline text-xs"
                                title="Copy short URL"
                              >
                                {link.shortUrl}
                              </button>
                              <button
                                type="button"
                                onClick={() => void copyText(link.shortUrl, "Short URL copied.")}
                                className="text-slate-300 hover:text-indigo-500 transition-colors p-1"
                                title="Copy URL"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(link)}
                              className="focus:outline-none"
                              title="Toggle link delivery"
                            >
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  link.status === "Live"
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                    : "bg-slate-100 text-slate-500 border border-slate-200"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    link.status === "Live" ? "bg-emerald-500" : "bg-slate-400"
                                  }`}
                                />
                                {link.status}
                              </span>
                            </button>
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex gap-1 text-slate-400">
                              {link.retargeting?.includes("fb") && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-black text-[8px] uppercase tracking-wider border border-blue-100">
                                  FB
                                </span>
                              )}
                              {link.retargeting?.includes("google") && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-black text-[8px] uppercase tracking-wider border border-amber-100">
                                  GG
                                </span>
                              )}
                              {link.retargeting?.includes("tiktok") && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-gray-800 font-black text-[8px] uppercase tracking-wider border border-slate-200">
                                  TT
                                </span>
                              )}
                              {(!link.retargeting || link.retargeting.length === 0) && (
                                <span className="text-[10px] text-slate-400 font-medium">None</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-2 text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-mono font-black text-slate-900">{link.clicks}</span>
                              <div className="w-16 bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
                                <div
                                  className="bg-[#6366f1] h-full rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(100, (link.clicks / (totalClicks || 1)) * 100)}%`
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-2 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openShortUrl(link)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                                title="Open live short URL"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span className="text-[9px] font-black">Open</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openDestination(link.destinationUrl)}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl"
                                title="Open destination"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditModal(link)}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl"
                                title="Edit link"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDelete(link)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl"
                                title="Delete link"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Workspace>

          <Workspace panel stack className="bg-white border border-slate-200/60 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display font-black text-lg text-slate-900">Performance Timeline</h3>
              <span className="bg-slate-50 border border-slate-200 text-slate-500 rounded-xl px-3 py-1.5 text-xs font-semibold">
                Click activity
              </span>
            </div>

            <div className="relative pt-4">
              {totalClicks === 0 ? (
                <div className="h-44 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-4 text-center">
                  <p className="text-xs font-bold text-slate-700">Waiting for short-link traffic</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-sm">
                    Share a Live short URL. Real visits to /l/your-slug update this chart automatically.
                  </p>
                </div>
              ) : (
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-44 overflow-visible"
                  role="img"
                  aria-label="Weekly click performance chart"
                >
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                    const y = padding + ratio * (chartHeight - padding * 2);
                    return (
                      <line
                        key={index}
                        x1={padding}
                        y1={y}
                        x2={chartWidth - padding}
                        y2={y}
                        stroke="#f1f5f9"
                        strokeWidth="1"
                      />
                    );
                  })}
                  <polyline
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pointsString}
                  />
                  {clickTrendPoints.map((point, index) => {
                    const x =
                      clickTrendPoints.length <= 1
                        ? chartWidth / 2
                        : padding +
                          (index * (chartWidth - padding * 2)) / (clickTrendPoints.length - 1);
                    const y =
                      chartHeight - padding - (point.value / maxVal) * (chartHeight - padding * 2);
                    return (
                      <g key={point.label}>
                        <circle cx={x} cy={y} r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="2">
                          <title>
                            {point.label}: {point.value} clicks
                          </title>
                        </circle>
                        <text
                          x={x}
                          y={chartHeight - 4}
                          fill="#94a3b8"
                          fontSize="9"
                          fontWeight="black"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {point.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </Workspace>
        </Workspace>

        <Workspace stack className="min-w-0">
          <Workspace panel stack className="bg-white border border-slate-200/60 rounded-2xl shadow-sm">
            <h3 className="font-display font-black text-slate-900 text-base">Click insights</h3>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Period totals
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    [
                      "Today",
                      analyticsList.reduce((sum, item) => sum + (item.summary?.today || 0), 0)
                    ],
                    [
                      "Week",
                      analyticsList.reduce((sum, item) => sum + (item.summary?.week || 0), 0)
                    ],
                    [
                      "Month",
                      analyticsList.reduce((sum, item) => sum + (item.summary?.month || 0), 0)
                    ],
                    ["All time", totalClicks]
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {label}
                    </p>
                    <p className="mt-1 text-lg font-extrabold tabular-nums text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Devices (from real visits)
                </p>
                <span className="text-[10px] font-mono text-slate-500">
                  {activeDevice}: {deviceClicks}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { name: "mobile" as const, icon: Smartphone },
                    { name: "desktop" as const, icon: Monitor },
                    { name: "tablet" as const, icon: Tablet }
                  ]
                ).map((device) => {
                  const DevIcon = device.icon;
                  const isSelected = activeDevice === device.name;
                  const count = aggregatedDevices[device.name] || 0;
                  const percentage =
                    deviceTotal > 0 ? `${Math.round((count / deviceTotal) * 100)}%` : "0%";
                  return (
                    <button
                      key={device.name}
                      type="button"
                      onClick={() => setActiveDevice(device.name)}
                      aria-pressed={isSelected}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                        isSelected
                          ? "bg-slate-900 border-slate-900 text-white shadow-md"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <DevIcon className={`h-4.5 w-4.5 mb-1 ${isSelected ? "text-white" : "text-slate-400"}`} />
                      <span className="text-[8px] font-black tracking-wider leading-none uppercase">
                        {device.name}
                      </span>
                      <span className="text-xs font-black mt-1 font-mono leading-none">{percentage}</span>
                      <span className="text-[10px] font-semibold mt-0.5 opacity-80">{count}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400">
                Device share is measured from User-Agent on each /l/ redirect.
              </p>
            </div>
          </Workspace>
        </Workspace>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-link-title"
            className="bg-white rounded-3xl max-w-md w-full p-4 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 id="create-link-title" className="font-display font-black text-xl text-slate-900">
                Shorten a Link
              </h3>
              <button
                type="button"
                onClick={closeCreateModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Link title
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Winter Sale Promo"
                  value={newTitle}
                  onChange={(event) => {
                    const title = event.target.value;
                    setNewTitle((previousTitle) => {
                      const previousSlug = normalizeSlug(previousTitle);
                      if (!newSlug || newSlug === previousSlug) {
                        setNewSlug(normalizeSlug(title));
                      }
                      return title;
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4F46E5] rounded-xl py-2.5 px-3.5 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Target long URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="e.g. https://mywebsite.com/winter-deal"
                  value={newTarget}
                  onChange={(event) => setNewTarget(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4F46E5] rounded-xl py-2.5 px-3.5 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Domain
                </label>
                <select
                  value={newHostDomain}
                  onChange={(event) => setNewHostDomain(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4F46E5] rounded-xl py-2.5 px-3.5 text-xs focus:outline-none"
                >
                  {hostOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Short slug
                </label>
                <div className="flex min-w-0 items-center">
                  <span className="max-w-[55%] truncate bg-slate-100 border border-slate-200 border-r-0 rounded-l-xl px-3 py-2.5 text-[10px] text-slate-400 font-mono">
                    {newHostDomain || PRIMARY_DOMAIN}/l/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="winter-sale"
                    value={newSlug}
                    onChange={(event) => setNewSlug(normalizeSlug(event.target.value))}
                    className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:border-[#4F46E5] rounded-r-xl py-2.5 px-3.5 text-xs focus:outline-none"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Live URL: https://{newHostDomain || PRIMARY_DOMAIN}/l/{newSlug || "your-slug"}
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Retargeting tags (optional labels)
                </label>
                <div className="flex gap-2">
                  {RETARGET_OPTIONS.map((pixel) => {
                    const isSelected = newRetargeting.includes(pixel.id);
                    return (
                      <button
                        key={pixel.id}
                        type="button"
                        onClick={() => toggleRetarget(newRetargeting, pixel.id, setNewRetargeting)}
                        className={`flex-1 py-2 px-3 rounded-xl border text-[10px] font-bold transition-all ${
                          isSelected
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {pixel.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {createError && (
                <p className="text-xs font-medium text-rose-600" role="alert">
                  {createError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isCreating}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2.5 key-btn-chip disabled:opacity-70 disabled:cursor-not-allowed text-xs font-extrabold"
                >
                  {isCreating ? "Creating…" : "Create Short Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingLink && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-link-title"
            className="bg-white rounded-3xl max-w-md w-full p-4 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 id="edit-link-title" className="font-display font-black text-xl text-slate-900">
                Configure Link
              </h3>
              <button
                type="button"
                onClick={closeEditModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-6" noValidate>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Link title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4F46E5] rounded-xl py-2.5 px-3.5 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Redirect target URL
                </label>
                <input
                  type="url"
                  required
                  value={editTarget}
                  onChange={(event) => setEditTarget(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4F46E5] rounded-xl py-2.5 px-3.5 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Domain
                </label>
                <select
                  value={editHostDomain}
                  onChange={(event) => setEditHostDomain(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4F46E5] rounded-xl py-2.5 px-3.5 text-xs focus:outline-none"
                >
                  {hostOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                  {editHostDomain &&
                    !hostOptions.some((option) => option.value === editHostDomain) && (
                      <option value={editHostDomain}>{editHostDomain}</option>
                    )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Custom short slug
                </label>
                <div className="flex min-w-0 items-center">
                  <span className="max-w-[55%] truncate bg-slate-100 border border-slate-200 border-r-0 rounded-l-xl px-3 py-2.5 text-[10px] text-slate-400 font-mono">
                    {editHostDomain || PRIMARY_DOMAIN}/l/
                  </span>
                  <input
                    type="text"
                    required
                    value={editSlug}
                    onChange={(event) => setEditSlug(normalizeSlug(event.target.value))}
                    className="w-full min-w-0 bg-slate-50 border border-slate-200 focus:border-[#4F46E5] rounded-r-xl py-2.5 px-3.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Routing status
                </label>
                <div className="flex gap-2">
                  {(
                    [
                      { id: "Live" as const, label: "Live" },
                      { id: "Paused" as const, label: "Paused" }
                    ]
                  ).map((status) => (
                    <button
                      key={status.id}
                      type="button"
                      onClick={() => setEditStatus(status.id)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-[10px] font-bold transition-all ${
                        editStatus === status.id
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Retargeting pixels
                </label>
                <div className="flex gap-2">
                  {RETARGET_OPTIONS.map((pixel) => {
                    const isSelected = editRetargeting.includes(pixel.id);
                    return (
                      <button
                        key={pixel.id}
                        type="button"
                        onClick={() => toggleRetarget(editRetargeting, pixel.id, setEditRetargeting)}
                        className={`flex-1 py-2 px-3 rounded-xl border text-[10px] font-bold transition-all ${
                          isSelected
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {pixel.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {editError && (
                <p className="text-xs font-medium text-rose-600" role="alert">
                  {editError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={isSavingEdit}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl disabled:opacity-60"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-950 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black shadow-sm"
                >
                  {isSavingEdit ? "Saving…" : "Save Configuration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
