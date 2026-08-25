import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Eye,
  Pencil,
  Plus,
  Search,
  Shuffle,
  Trash2
} from "lucide-react";
import {
  ScreenId,
  type CustomDomain,
  type LinkRotator,
  type LinkRotatorAnalytics,
  type LinkRotatorDestination
} from "../types";
import {
  createLinkRotator,
  deleteLinkRotator,
  fetchLinkRotatorAnalytics,
  LinkRotatorApiError,
  updateLinkRotator,
  type LinkRotatorInput
} from "../lib/linkRotatorApi";
import { screenToPath } from "../navigation";
import { PRIMARY_DOMAIN } from "../storage/publishStorage";
import PageShell, { PageHeader, SectionCard, Workspace } from "./layout/PageShell";

type ScreenMode = "list" | "form" | "view";

interface LinkRotatorScreenProps {
  rotators: LinkRotator[];
  domains?: CustomDomain[];
  onReload: () => Promise<void>;
  /** Apply create/update response immediately so list/edit show saved URL without stale state. */
  onUpsertRotator?: (rotator: LinkRotator) => void;
  loading?: boolean;
  loadError?: string | null;
}

type DestinationDraft = {
  key: string;
  url: string;
  probability: string;
};

function newDestinationDraft(probability = ""): DestinationDraft {
  return {
    key: `d_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    url: "",
    probability
  };
}

function emptyForm(defaultHost = PRIMARY_DOMAIN) {
  return {
    name: "",
    description: "",
    hostDomain: defaultHost,
    status: "Active" as "Active" | "Inactive",
    destinations: [newDestinationDraft("50"), newDestinationDraft("50")]
  };
}

function slugPreviewFromName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 32);
  return slug || "yourname";
}

function isValidHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return Boolean(url.hostname.includes("."));
  } catch {
    return false;
  }
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function formatCreatedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function probabilityTotal(destinations: DestinationDraft[]): number {
  return destinations.reduce((sum, item) => {
    const value = Number(item.probability);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
}

function validateForm(form: ReturnType<typeof emptyForm>): string | null {
  if (!form.name.trim()) return "Rotator name is required.";
  if (slugPreviewFromName(form.name).length < 3) {
    return "Rotator name needs at least 3 letters or numbers for the URL (example: summer-sale).";
  }
  if (form.destinations.length === 0) return "Add at least one destination URL.";

  for (let index = 0; index < form.destinations.length; index += 1) {
    const row = form.destinations[index];
    const url = normalizeUrl(row.url);
    const probability = Number(row.probability);

    if (!isValidHttpUrl(url)) {
      return `Destination ${index + 1}: enter a valid URL.`;
    }
    if (!Number.isFinite(probability) || !Number.isInteger(probability) || probability < 0 || probability > 100) {
      return `Destination ${index + 1}: probability must be a whole number between 0 and 100.`;
    }
  }

  const total = Math.round(probabilityTotal(form.destinations));
  if (total !== 100) {
    return `Total probability must equal exactly 100%. Current total: ${total}%.`;
  }

  return null;
}

function toInput(form: ReturnType<typeof emptyForm>): LinkRotatorInput {
  const name = form.name.trim();
  return {
    name,
    description: form.description.trim(),
    hostDomain: form.hostDomain.trim() || PRIMARY_DOMAIN,
    slug: slugPreviewFromName(name),
    status: form.status,
    destinations: form.destinations.map((item) => ({
      id: item.key,
      url: normalizeUrl(item.url),
      probability: Math.round(Number(item.probability))
    }))
  };
}

const PERIOD_RING_COLORS = {
  today: { ring: "#0d9488", text: "text-teal-600", chip: "bg-teal-50 text-teal-700" },
  week: { ring: "#6366f1", text: "text-indigo-600", chip: "bg-indigo-50 text-indigo-700" },
  month: { ring: "#9333ea", text: "text-purple-600", chip: "bg-purple-50 text-purple-700" },
  all: { ring: "#4f46e5", text: "text-indigo-700", chip: "bg-indigo-50 text-indigo-800" }
} as const;

/** Exact count with grouping: 1,000 · 10,000 — always the real integer. */
function formatCountExact(value: number): string {
  const n = Math.max(0, Math.floor(Number(value) || 0));
  return n.toLocaleString("en-IN");
}

/** Exact click count for the UI (no k/M shortcuts). */
function formatCountDisplay(value: number): { text: string; title: string } {
  const exact = formatCountExact(value);
  return { text: exact, title: exact };
}

function StatCircle({
  label,
  value,
  percent,
  accent,
  percentClassName = "text-indigo-600"
}: {
  label: string;
  value: number;
  percent: number;
  accent: string;
  percentClassName?: string;
}) {
  const size = 88;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference * (1 - clamped / 100);
  const count = formatCountDisplay(value);

  return (
    <div className="flex flex-col items-center gap-2" title={count.title}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={accent}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.45s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-1">
          <span className="text-sm font-extrabold tabular-nums leading-none text-slate-900">
            {count.text}
          </span>
          <span className={`mt-0.5 text-[11px] font-bold tabular-nums ${percentClassName}`}>
            {Math.round(clamped)}%
          </span>
        </div>
      </div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">{label}</p>
    </div>
  );
}

function periodPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 1000) / 10;
}

function destinationClickTotal(destination: LinkRotatorDestination): number {
  // Always show the real stored destination click counter.
  return Number(destination.clicks) || 0;
}

function rotatorDestinationClicksTotal(rotator: LinkRotator): number {
  const fromDestinations = rotator.destinations.reduce(
    (sum, destination) => sum + destinationClickTotal(destination),
    0
  );
  return fromDestinations > 0 ? fromDestinations : Number(rotator.totalClicks) || 0;
}

export default function LinkRotatorScreen({
  rotators,
  domains = [],
  onReload,
  onUpsertRotator,
  loading = false,
  loadError = null
}: LinkRotatorScreenProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewIdFromUrl = searchParams.get("view");
  const [mode, setMode] = useState<ScreenMode>(() => (searchParams.get("view") ? "view" : "list"));
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState(() => emptyForm(PRIMARY_DOMAIN));
  const [viewBootstrapping, setViewBootstrapping] = useState(() => Boolean(searchParams.get("view")));
  const loadedViewIdRef = useRef<string | null>(null);

  const hostOptions = useMemo(() => {
    const custom = domains
      .filter((domain) => domain.status === "Verified" || domain.status === "DNS Verified")
      .map((domain) => domain.domainName.trim().toLowerCase())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    const uniqueCustom = Array.from(new Set(custom));
    const options = [
      { value: PRIMARY_DOMAIN, label: `KEYLINK360 (${PRIMARY_DOMAIN})` },
      ...uniqueCustom.map((host) => ({ value: host, label: host }))
    ];
    const currentHost = (form.hostDomain || "").trim().toLowerCase();
    if (currentHost && !options.some((option) => option.value === currentHost)) {
      options.push({ value: currentHost, label: currentHost });
    }
    return options;
  }, [domains, form.hostDomain]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<LinkRotator | null>(null);
  const [viewAnalytics, setViewAnalytics] = useState<LinkRotatorAnalytics | null>(null);
  const [selectedDestinationKey, setSelectedDestinationKey] = useState("");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  };

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rotators;
    return rotators.filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.slug.toLowerCase().includes(query) ||
        item.hostDomain?.toLowerCase().includes(query) ||
        item.rotatorUrl.toLowerCase().includes(query) ||
        (item.description || "").toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query)
      );
    });
  }, [rotators, searchQuery]);

  useEffect(() => {
    if (!viewing) return;
    const fresh = rotators.find((item) => item.id === viewing.id);
    if (fresh) setViewing(fresh);
  }, [rotators, viewing?.id]);

  useEffect(() => {
    if (!viewing?.destinations?.length) return;
    const keys = viewing.destinations.map((item) => item.id || item.url);
    if (!selectedDestinationKey || !keys.includes(selectedDestinationKey)) {
      setSelectedDestinationKey(keys[0] || "");
    }
  }, [viewing?.destinations, selectedDestinationKey]);

  const totalProbability = Math.round(probabilityTotal(form.destinations) * 100) / 100;
  const previewUrl = `https://${form.hostDomain || PRIMARY_DOMAIN}/r/${slugPreviewFromName(form.name)}`;

  const openCreate = () => {
    setEditingId(null);
    setViewing(null);
    setForm(emptyForm(PRIMARY_DOMAIN));
    setFormError("");
    setMode("form");
  };

  const openEdit = (rotator: LinkRotator) => {
    setEditingId(rotator.id);
    setViewing(null);
    setForm({
      name: rotator.name,
      description: rotator.description || "",
      hostDomain: rotator.hostDomain || PRIMARY_DOMAIN,
      status: rotator.status,
      destinations: rotator.destinations.map((destination) => ({
        key: destination.id || newDestinationDraft().key,
        url: destination.url,
        probability: String(destination.probability)
      }))
    });
    setFormError("");
    setMode("form");
  };

  const buildLocalAnalytics = (rotator: LinkRotator): LinkRotatorAnalytics => {
    const total = rotator.totalClicks || 0;
    return {
      rotator,
      summary: { total, today: 0, week: 0, month: 0 },
      destinations: rotator.destinations.map((destination) => {
        const clicks = destination.clicks || 0;
        return {
          id: destination.id,
          url: destination.url,
          probability: destination.probability,
          clicks: { total: clicks, today: 0, week: 0, month: 0 },
          clickSharePercent: total > 0 ? Math.round((clicks / total) * 1000) / 10 : 0
        };
      })
    };
  };

  const loadViewAnalytics = async (rotatorId: string, fallback?: LinkRotator | null) => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const data = await fetchLinkRotatorAnalytics(rotatorId);
      setViewAnalytics(data);
      if (data.rotator) setViewing(data.rotator);
    } catch {
      const local = fallback || viewing || rotators.find((item) => item.id === rotatorId) || null;
      if (local) setViewAnalytics(buildLocalAnalytics(local));
      setAnalyticsError(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const openView = (rotator: LinkRotator) => {
    const first = rotator.destinations[0];
    setViewing(rotator);
    setViewAnalytics(buildLocalAnalytics(rotator));
    setAnalyticsError(null);
    setSelectedDestinationKey(first ? first.id || first.url : "");
    setMode("view");
    setViewBootstrapping(false);
    loadedViewIdRef.current = rotator.id;
    void loadViewAnalytics(rotator.id, rotator);
    // Push history so browser Back closes this view instead of leaving Link Rotator.
    if (viewIdFromUrl !== rotator.id) {
      navigate(
        `${screenToPath(ScreenId.LINK_ROTATOR)}?view=${encodeURIComponent(rotator.id)}`
      );
    }
  };

  const backToList = (options?: { force?: boolean }) => {
    if (isSaving && !options?.force) return;
    setMode("list");
    setEditingId(null);
    setViewing(null);
    setViewAnalytics(null);
    setSelectedDestinationKey("");
    setAnalyticsError(null);
    setAnalyticsLoading(false);
    setViewBootstrapping(false);
    loadedViewIdRef.current = null;
    setForm(emptyForm(PRIMARY_DOMAIN));
    setFormError("");
    if (searchParams.has("view")) {
      navigate(screenToPath(ScreenId.LINK_ROTATOR), { replace: true });
    }
  };

  // Keep eye-view tied to ?view= so refresh and Chrome Back stay on Link Rotator.
  useEffect(() => {
    if (!viewIdFromUrl) {
      setViewBootstrapping(false);
      loadedViewIdRef.current = null;
      if (mode === "view") {
        setMode("list");
        setViewing(null);
        setViewAnalytics(null);
        setSelectedDestinationKey("");
        setAnalyticsError(null);
        setAnalyticsLoading(false);
      }
      return;
    }

    setMode("view");
    setEditingId(null);

    const applyRotator = (rotator: LinkRotator, analytics?: LinkRotatorAnalytics | null) => {
      const first = rotator.destinations[0];
      setViewing(rotator);
      if (analytics) setViewAnalytics(analytics);
      setSelectedDestinationKey((current) => {
        const keys = rotator.destinations.map((item) => item.id || item.url);
        return current && keys.includes(current) ? current : first ? first.id || first.url : "";
      });
      setViewBootstrapping(false);
      setAnalyticsError(null);
      if (loadedViewIdRef.current !== rotator.id) {
        loadedViewIdRef.current = rotator.id;
        if (!analytics) setViewAnalytics(buildLocalAnalytics(rotator));
        void loadViewAnalytics(rotator.id, rotator);
      }
    };

    const fromList = rotators.find((item) => item.id === viewIdFromUrl);
    if (fromList) {
      applyRotator(fromList);
      return;
    }

    // List not ready yet (page refresh) — fetch this rotator directly; keep ?view=.
    if (loading || rotators.length === 0) {
      setViewBootstrapping(true);
      let cancelled = false;
      void (async () => {
        try {
          const data = await fetchLinkRotatorAnalytics(viewIdFromUrl);
          if (cancelled || !data.rotator) return;
          loadedViewIdRef.current = data.rotator.id;
          applyRotator(data.rotator, data);
        } catch {
          if (!cancelled && !loading && rotators.length > 0) {
            setViewBootstrapping(false);
            navigate(screenToPath(ScreenId.LINK_ROTATOR), { replace: true });
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    // List loaded but this id is gone.
    setViewBootstrapping(false);
    navigate(screenToPath(ScreenId.LINK_ROTATOR), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from URL only
  }, [viewIdFromUrl, rotators, loading]);

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      triggerToast("Rotator URL copied.");
    } catch {
      triggerToast("Unable to copy. Copy the URL manually.");
    }
  };

  const updateDestination = (key: string, patch: Partial<DestinationDraft>) => {
    setForm((current) => ({
      ...current,
      destinations: current.destinations.map((item) =>
        item.key === key ? { ...item, ...patch } : item
      )
    }));
  };

  const addDestination = () => {
    setForm((current) => ({
      ...current,
      destinations: [...current.destinations, newDestinationDraft("0")]
    }));
  };

  const distributeEvenly = () => {
    setForm((current) => {
      const count = current.destinations.length;
      if (count === 0) return current;
      const base = Math.floor(100 / count);
      let remainder = 100 - base * count;
      return {
        ...current,
        destinations: current.destinations.map((item) => {
          const extra = remainder > 0 ? 1 : 0;
          if (remainder > 0) remainder -= 1;
          return { ...item, probability: String(base + extra) };
        })
      };
    });
  };

  const removeDestination = (key: string) => {
    setForm((current) => ({
      ...current,
      destinations:
        current.destinations.length <= 1
          ? current.destinations
          : current.destinations.filter((item) => item.key !== key)
    }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const error = validateForm(form);
    if (error) {
      setFormError(error);
      return;
    }

    setIsSaving(true);
    setFormError("");
    try {
      const payload = toInput(form);
      const saved = editingId
        ? await updateLinkRotator(editingId, payload)
        : await createLinkRotator(payload);
      onUpsertRotator?.(saved);
      triggerToast(editingId ? "Link rotator updated." : "Link rotator created.");
      // Clear loading before leaving the form so the button never sticks on "Saving…".
      setIsSaving(false);
      backToList({ force: true });
      // Refresh list in the background — do not block Save on slow network/reload.
      void onReload();
    } catch (err) {
      setFormError(
        err instanceof LinkRotatorApiError ? err.message : "Unable to save link rotator."
      );
      setIsSaving(false);
    }
  };

  const handleDelete = async (rotator: LinkRotator) => {
    const confirmed = window.confirm(
      `Delete "${rotator.name}"?\n\nThe rotator URL will stop working.`
    );
    if (!confirmed) return;
    try {
      await deleteLinkRotator(rotator.id);
      triggerToast("Link rotator deleted.");
      await onReload();
      if (viewing?.id === rotator.id || editingId === rotator.id) backToList();
    } catch (err) {
      triggerToast(err instanceof LinkRotatorApiError ? err.message : "Unable to delete.");
    }
  };

  if (mode === "form") {
    return (
      <PageShell className="font-sans text-slate-800">
        <PageHeader
          title={editingId ? "Edit Link Rotator" : "Add Link Rotator"}
          subtitle="Split traffic across destination URLs using redirect probability."
          actions={
            <button
              type="button"
              onClick={backToList}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to list
            </button>
          }
        />

        <Workspace panel stack>
          <SectionCard className="p-5 sm:p-6">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Domain <span className="text-rose-500">*</span>
                  </span>
                  <select
                    value={form.hostDomain}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, hostDomain: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    required
                  >
                    {hostOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Default is KEYLINK360. Verified custom domains from Custom Domains also appear here.
                  </p>
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Rotator Name <span className="text-rose-500">*</span>
                  </span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    placeholder="summer-sale"
                    required
                  />
                </label>

                <div className="sm:col-span-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-3.5 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                    Rotator URL {editingId ? "(saves on Save changes)" : ""}
                  </p>
                  <p className="mt-1 break-all font-mono text-sm font-semibold text-slate-800">
                    {previewUrl}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Domain + rotator name become the live URL after you save. Example:
                    rog.keysfashionshop.com/r/yourname
                  </p>
                </div>

                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Description
                  </span>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    rows={3}
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    placeholder="Optional notes about this rotator"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value === "Inactive" ? "Inactive" : "Active"
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Destination URLs</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Probabilities must add up to exactly 100%.
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      Math.abs(totalProbability - 100) < 0.01
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    Total: {totalProbability}%
                  </span>
                </div>

                <div className="space-y-3">
                  {form.destinations.map((destination, index) => (
                    <div
                      key={destination.key}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Destination {index + 1}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeDestination(destination.key)}
                          disabled={form.destinations.length <= 1}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                        <label className="block min-w-0">
                          <span className="mb-1.5 block text-xs font-semibold text-slate-500">
                            Destination URL <span className="text-rose-500">*</span>
                          </span>
                          <input
                            type="url"
                            value={destination.url}
                            onChange={(event) =>
                              updateDestination(destination.key, { url: event.target.value })
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                            placeholder="https://example.com"
                            required
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-semibold text-slate-500">
                            Probability (%) <span className="text-rose-500">*</span>
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={destination.probability}
                            onChange={(event) =>
                              updateDestination(destination.key, {
                                probability: event.target.value
                              })
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                            required
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={addDestination}
                    className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                  >
                    <Plus className="h-4 w-4" />
                    Add destination
                  </button>
                  <button
                    type="button"
                    onClick={distributeEvenly}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Split evenly to 100%
                  </button>
                </div>
              </div>

              {formError && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">
                  {formError}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="key-btn-chip inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold disabled:opacity-60"
                >
                  {isSaving ? "Saving…" : editingId ? "Save changes" : "Create rotator"}
                </button>
                <button
                  type="button"
                  onClick={backToList}
                  disabled={isSaving}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </SectionCard>
        </Workspace>

        {toast && (
          <div className="fixed bottom-6 right-6 z-[200] rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3.5 text-sm font-bold text-white shadow-2xl">
            {toast}
          </div>
        )}
      </PageShell>
    );
  }

  if ((mode === "view" || viewIdFromUrl) && !viewing && (viewBootstrapping || loading)) {
    return (
      <PageShell>
        <PageHeader
          title="Link Rotator"
          subtitle="Loading destination stats…"
          actions={
            <button
              type="button"
              onClick={backToList}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          }
        />
        <Workspace panel>
          <SectionCard className="p-8 text-center text-sm font-semibold text-slate-500">
            Opening destinations…
          </SectionCard>
        </Workspace>
      </PageShell>
    );
  }

  if (mode === "view" && viewing) {
    return (
      <PageShell className="font-sans text-slate-800">
        <PageHeader
          title={viewing.name}
          subtitle="Rotator details and destination split."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={backToList}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={() => openEdit(viewing)}
                className="key-btn-chip inline-flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            </div>
          }
        />

        <Workspace panel stack>
          <SectionCard className="p-5 sm:p-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Domain</p>
                <p className="mt-1.5 text-sm font-bold text-slate-900">
                  {viewing.hostDomain || PRIMARY_DOMAIN}
                </p>
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">Rotator URL</p>
                <div className="mt-1.5 flex min-w-0 items-center gap-2">
                  <a
                    href={viewing.rotatorUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-sm font-semibold text-indigo-600 hover:underline"
                  >
                    {viewing.rotatorUrl}
                  </a>
                  <button
                    type="button"
                    onClick={() => void copyText(viewing.rotatorUrl)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                    title="Copy URL"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Status</p>
                  <p className="mt-1.5 text-sm font-bold text-slate-900">{viewing.status}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Total clicks
                  </p>
                  <p className="mt-1.5 text-sm font-bold tabular-nums text-slate-900">
                    {formatCountExact(rotatorDestinationClicksTotal(viewing))}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Created</p>
                  <p className="mt-1.5 text-sm font-bold text-slate-900">
                    {formatCreatedAt(viewing.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {viewing.description && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Description</p>
                <p className="mt-1.5 text-sm text-slate-700">{viewing.description}</p>
              </div>
            )}

            <div>
              <div className="mb-3 flex items-end justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Destinations ({viewing.destinations.length})
                </p>
                <p className="hidden text-[11px] font-semibold text-slate-400 sm:block">
                  Clicks = people sent to that link · Traffic = split %
                </p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="hidden grid-cols-[minmax(0,1fr)_5.5rem_4.5rem] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:grid">
                  <span>Link</span>
                  <span className="text-right">Clicks</span>
                  <span className="text-right">Traffic</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {viewing.destinations.map((destination: LinkRotatorDestination, index) => {
                    const clicks = destinationClickTotal(destination);
                    const exactClicks = formatCountExact(clicks);
                    return (
                      <div
                        key={destination.id || `${destination.url}-${index}`}
                        className="grid grid-cols-1 gap-2 bg-white px-4 py-3 sm:grid-cols-[minmax(0,1fr)_5.5rem_4.5rem] sm:items-center sm:gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-400">Destination {index + 1}</p>
                          <a
                            href={destination.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-0.5 block truncate text-sm font-semibold text-slate-800 hover:text-indigo-600 hover:underline"
                          >
                            {destination.url}
                          </a>
                        </div>
                        <div className="flex items-center justify-between sm:block sm:text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:hidden">
                            Clicks
                          </span>
                          <p
                            className="text-sm font-extrabold tabular-nums text-slate-900"
                            title={`${exactClicks} real redirects`}
                          >
                            {exactClicks}
                          </p>
                        </div>
                        <div className="flex items-center justify-between sm:block sm:text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:hidden">
                            Traffic
                          </span>
                          <p className="text-sm font-bold text-indigo-600">{destination.probability}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Traffic breakdown
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Choose a destination to see its click summary.
                  </p>
                </div>
                <label className="block w-full sm:w-64">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Show stats for
                  </span>
                  <select
                    value={selectedDestinationKey}
                    onChange={(event) => setSelectedDestinationKey(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  >
                    {viewing.destinations.map((destination, index) => {
                      const key = destination.id || destination.url;
                      return (
                        <option key={key} value={key}>
                          Destination {index + 1}
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>

              {analyticsLoading && (
                <p className="mt-3 text-xs font-semibold text-slate-400">Updating stats…</p>
              )}

              {(() => {
                const selected =
                  viewing.destinations.find(
                    (item) => (item.id || item.url) === selectedDestinationKey
                  ) || viewing.destinations[0];
                if (!selected) return null;

                const selectedAnalytics = viewAnalytics?.destinations.find(
                  (item) =>
                    (selected.id && item.id === selected.id) ||
                    (!!selected.url && item.url === selected.url)
                );
                // Lifetime total: prefer analytics (reconciled from real events) else stored counter.
                const realTotal = Math.max(
                  0,
                  Number(selectedAnalytics?.clicks.total) || destinationClickTotal(selected)
                );
                const clicks = {
                  total: realTotal,
                  today: Math.min(selectedAnalytics?.clicks.today ?? 0, realTotal),
                  week: Math.min(selectedAnalytics?.clicks.week ?? 0, realTotal),
                  month: Math.min(selectedAnalytics?.clicks.month ?? 0, realTotal)
                };
                const summaryTotal = Math.max(
                  rotatorDestinationClicksTotal(viewing),
                  Number(viewAnalytics?.summary.total) || 0
                );
                const periodTodayTotal = Math.max(Number(viewAnalytics?.summary.today) || 0, 1);
                const periodWeekTotal = Math.max(Number(viewAnalytics?.summary.week) || 0, 1);
                const periodMonthTotal = Math.max(Number(viewAnalytics?.summary.month) || 0, 1);
                const sharePercent = periodPercent(clicks.total, summaryTotal);
                const totalCount = formatCountExact(clicks.total);

                return (
                  <>
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Target link
                      </p>
                      <a
                        href={selected.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block break-all text-sm font-semibold text-indigo-600 hover:underline"
                      >
                        {selected.url}
                      </a>
                      <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Clicks
                          </p>
                          <p
                            className="mt-0.5 text-xl font-extrabold tabular-nums text-slate-900"
                            title={`${totalCount} real redirects`}
                          >
                            {totalCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Traffic split
                          </p>
                          <p className="mt-0.5 text-xl font-extrabold tabular-nums text-indigo-600">
                            {selected.probability}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Share of total
                          </p>
                          <p className="mt-0.5 text-xl font-extrabold tabular-nums text-slate-900">
                            {Math.round(sharePercent)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {(
                        [
                          ["Today", clicks.today, PERIOD_RING_COLORS.today.chip],
                          ["This week", clicks.week, PERIOD_RING_COLORS.week.chip],
                          ["This month", clicks.month, PERIOD_RING_COLORS.month.chip],
                          ["All time", clicks.total, PERIOD_RING_COLORS.all.chip]
                        ] as const
                      ).map(([label, value, chip]) => {
                        const count = formatCountDisplay(value);
                        return (
                          <div key={label} className={`rounded-xl px-3 py-2.5 ${chip}`}>
                            <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                              {label}
                            </p>
                            <p
                              className="mt-1 text-lg font-extrabold tabular-nums leading-none"
                              title={count.title}
                            >
                              {count.text}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-6 sm:justify-between sm:gap-4 sm:px-2">
                      <StatCircle
                        label="Today"
                        value={clicks.today}
                        percent={periodPercent(clicks.today, periodTodayTotal)}
                        accent={PERIOD_RING_COLORS.today.ring}
                        percentClassName={PERIOD_RING_COLORS.today.text}
                      />
                      <StatCircle
                        label="Week"
                        value={clicks.week}
                        percent={periodPercent(clicks.week, periodWeekTotal)}
                        accent={PERIOD_RING_COLORS.week.ring}
                        percentClassName={PERIOD_RING_COLORS.week.text}
                      />
                      <StatCircle
                        label="Month"
                        value={clicks.month}
                        percent={periodPercent(clicks.month, periodMonthTotal)}
                        accent={PERIOD_RING_COLORS.month.ring}
                        percentClassName={PERIOD_RING_COLORS.month.text}
                      />
                      <StatCircle
                        label="All time"
                        value={clicks.total}
                        percent={sharePercent}
                        accent={PERIOD_RING_COLORS.all.ring}
                        percentClassName={PERIOD_RING_COLORS.all.text}
                      />
                    </div>
                  </>
                );
              })()}
            </div>
          </SectionCard>
        </Workspace>

        {toast && (
          <div className="fixed bottom-6 right-6 z-[200] rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3.5 text-sm font-bold text-white shadow-2xl">
            {toast}
          </div>
        )}
      </PageShell>
    );
  }

  return (
    <PageShell className="font-sans text-slate-800">
      <PageHeader
        title="Link Rotator"
        subtitle="Create one shareable URL that randomly redirects by probability."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 key-btn-chip px-5 py-2.5 text-xs font-extrabold"
          >
            <Plus className="h-4 w-4" />
            Add Link Rotator
          </button>
        }
      />

      <Workspace panel stack>
        <SectionCard className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="key-icon-field flex-1">
              <span className="key-icon-field__icon">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search rotators by name, URL, or status…"
                className="key-icon-field__input w-full"
              />
            </div>
            <p className="text-xs font-semibold text-slate-500">
              Showing {filtered.length} of {rotators.length}
            </p>
          </div>
        </SectionCard>

        {loadError && (
          <SectionCard className="border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            {loadError}
          </SectionCard>
        )}

        <SectionCard className="overflow-hidden">
          {loading && rotators.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">Loading rotators…</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Shuffle className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                {rotators.length === 0 ? "No link rotators yet" : "No rotators match your search"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {rotators.length === 0
                  ? "Create your first rotator to split traffic across destinations."
                  : "Try a different search term."}
              </p>
              {rotators.length === 0 && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="key-btn-chip mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold"
                >
                  <Plus className="h-4 w-4" />
                  Add Link Rotator
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-bold">Rotator Name</th>
                    <th className="px-4 py-3 font-bold">Rotator URL</th>
                    <th className="px-4 py-3 font-bold">Destinations</th>
                    <th className="px-4 py-3 font-bold">Clicks</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold">Created</th>
                    <th className="px-4 py-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((rotator) => (
                    <tr key={rotator.id} className="bg-white hover:bg-slate-50/70">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{rotator.name}</p>
                        {rotator.description ? (
                          <p className="mt-0.5 max-w-[14rem] truncate text-xs text-slate-500">
                            {rotator.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex max-w-[18rem] items-center gap-1.5">
                          <a
                            href={rotator.rotatorUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate font-mono text-xs font-semibold text-indigo-600 hover:underline"
                            title={rotator.rotatorUrl}
                          >
                            {rotator.rotatorUrl}
                          </a>
                          <button
                            type="button"
                            onClick={() => void copyText(rotator.rotatorUrl)}
                            className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="Copy"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700">
                        {rotator.destinations.length}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700">
                        {rotator.totalClicks}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            rotator.status === "Active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {rotator.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {formatCreatedAt(rotator.createdAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openView(rotator)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-indigo-600"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(rotator)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-indigo-600"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <a
                            href={rotator.rotatorUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-indigo-600"
                            title={`Open rotator URL\n${rotator.rotatorUrl}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          {rotator.hostDomain &&
                            rotator.hostDomain !== PRIMARY_DOMAIN && (
                              <a
                                href={`https://${PRIMARY_DOMAIN}/r/${rotator.slug}`}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-indigo-600"
                                title={`Open via KEYLINK360\nhttps://${PRIMARY_DOMAIN}/r/${rotator.slug}`}
                              >
                                <Shuffle className="h-4 w-4" />
                              </a>
                            )}
                          <button
                            type="button"
                            onClick={() => void handleDelete(rotator)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </Workspace>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3.5 text-sm font-bold text-white shadow-2xl">
          {toast}
        </div>
      )}
    </PageShell>
  );
}
