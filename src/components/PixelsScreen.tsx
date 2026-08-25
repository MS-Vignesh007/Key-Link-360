import React, { useMemo, useState } from "react";
import { TrackingPixel } from "../types";
import {
  Shield,
  Plus,
  Facebook,
  Trash2,
  X,
  Search,
  Copy,
  Check,
  Pencil,
  Pause,
  Play,
  RefreshCw
} from "lucide-react";
import PageShell, { PageHeader, SectionCard, Workspace } from "./layout/PageShell";

interface PixelsScreenProps {
  pixels: TrackingPixel[];
  onAddPixel: (name: string, type: string, pixelId: string) => void;
  onUpdatePixel: (pixel: TrackingPixel) => void;
  onDeletePixel: (id: string) => void;
}

const PIXEL_TYPES = [
  "Facebook Pixel",
  "Google Analytics Tag",
  "TikTok Pixel",
  "Pinterest Tag"
] as const;

function statusBadgeClass(status: TrackingPixel["status"]) {
  if (status === "Active") return "bg-emerald-50 text-emerald-600";
  if (status === "Validation Required") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-500";
}

function isValidPixelId(type: string, value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length < 4) return false;
  if (type === "Facebook Pixel") return /^\d{5,20}$/.test(trimmed);
  if (type === "Google Analytics Tag") return /^(G-|AW-|UA-|GT-)[A-Za-z0-9-]+$/i.test(trimmed);
  if (type === "TikTok Pixel") return /^[A-Za-z0-9_-]{5,40}$/.test(trimmed);
  if (type === "Pinterest Tag") return /^[A-Za-z0-9_-]{5,40}$/.test(trimmed);
  return trimmed.length >= 4;
}

function pixelIdHint(type: string) {
  if (type === "Facebook Pixel") return "Numeric ID, e.g. 882739401928374";
  if (type === "Google Analytics Tag") return "e.g. G-XXXXXXXX or AW-XXXXXXXX";
  if (type === "TikTok Pixel") return "e.g. T-1827463529";
  if (type === "Pinterest Tag") return "e.g. 2612345678901";
  return "Provider pixel / tag ID";
}

function PixelTypeIcon({ type }: { type: string }) {
  if (type.includes("Facebook")) return <Facebook className="h-4.5 w-4.5" />;
  return <Shield className="h-4.5 w-4.5" />;
}

export default function PixelsScreen({
  pixels,
  onAddPixel,
  onUpdatePixel,
  onDeletePixel
}: PixelsScreenProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingPixel, setEditingPixel] = useState<TrackingPixel | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<string>(PIXEL_TYPES[0]);
  const [pixelId, setPixelId] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | TrackingPixel["status"]>("All");
  const [typeFilter, setTypeFilter] = useState<"All" | string>("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const resetForm = () => {
    setName("");
    setType(PIXEL_TYPES[0]);
    setPixelId("");
    setFormError("");
  };

  const filteredPixels = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return pixels.filter((pixel) => {
      const matchesSearch =
        !query ||
        pixel.name.toLowerCase().includes(query) ||
        pixel.pixelId.toLowerCase().includes(query) ||
        pixel.type.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" || pixel.status === statusFilter;
      const matchesType = typeFilter === "All" || pixel.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [pixels, searchQuery, statusFilter, typeFilter]);

  const activeCount = pixels.filter((p) => p.status === "Active").length;
  const needsValidation = pixels.filter((p) => p.status === "Validation Required").length;
  const hasFilters =
    searchQuery.trim().length > 0 || statusFilter !== "All" || typeFilter !== "All";

  const openAdd = () => {
    resetForm();
    setEditingPixel(null);
    setIsAdding(true);
  };

  const openEdit = (pixel: TrackingPixel) => {
    setEditingPixel(pixel);
    setName(pixel.name);
    setType(pixel.type);
    setPixelId(pixel.pixelId);
    setFormError("");
    setIsAdding(false);
  };

  const closeModals = () => {
    if (isSubmitting) return;
    setIsAdding(false);
    setEditingPixel(null);
    resetForm();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");

    const trimmedName = name.trim();
    const trimmedId = pixelId.trim();

    if (!trimmedName) {
      setFormError("Pixel name is required.");
      return;
    }
    if (!isValidPixelId(type, trimmedId)) {
      setFormError(`Enter a valid ID for ${type}. ${pixelIdHint(type)}`);
      return;
    }

    const duplicate = pixels.some(
      (p) =>
        p.pixelId.toLowerCase() === trimmedId.toLowerCase() &&
        (!editingPixel || p.id !== editingPixel.id)
    );
    if (duplicate) {
      setFormError("A pixel with this ID already exists.");
      return;
    }

    setIsSubmitting(true);
    window.setTimeout(() => {
      if (editingPixel) {
        onUpdatePixel({
          ...editingPixel,
          name: trimmedName,
          type,
          pixelId: trimmedId
        });
        triggerToast(`"${trimmedName}" updated.`);
        setEditingPixel(null);
      } else {
        onAddPixel(trimmedName, type, trimmedId);
        triggerToast(`"${trimmedName}" added.`);
        setIsAdding(false);
      }
      resetForm();
      setIsSubmitting(false);
    }, 300);
  };

  const handleCopy = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      triggerToast("Pixel ID copied.");
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      triggerToast("Could not copy. Select the ID and copy manually.");
    }
  };

  const handleDelete = (pixel: TrackingPixel) => {
    if (!window.confirm(`Delete "${pixel.name}"? Tracking for this pixel will stop.`)) return;
    onDeletePixel(pixel.id);
    triggerToast(`"${pixel.name}" deleted.`);
  };

  const toggleStatus = (pixel: TrackingPixel) => {
    if (pixel.status === "Active") {
      onUpdatePixel({ ...pixel, status: "Inactive" });
      triggerToast(`"${pixel.name}" paused.`);
      return;
    }
    if (pixel.status === "Inactive") {
      onUpdatePixel({ ...pixel, status: "Active" });
      triggerToast(`"${pixel.name}" activated.`);
      return;
    }
    onUpdatePixel({ ...pixel, status: "Active" });
    triggerToast(`"${pixel.name}" marked as validated and active.`);
  };

  const renderActions = (pixel: TrackingPixel) => (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => void handleCopy(pixel.pixelId, pixel.id)}
        className="text-gray-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg transition-all"
        title="Copy pixel ID"
        aria-label={`Copy ID for ${pixel.name}`}
      >
        {copiedId === pixel.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={() => toggleStatus(pixel)}
        className="text-gray-400 hover:text-amber-600 p-2 hover:bg-amber-50 rounded-lg transition-all"
        title={
          pixel.status === "Active"
            ? "Pause pixel"
            : pixel.status === "Validation Required"
              ? "Mark as validated"
              : "Activate pixel"
        }
        aria-label={`Toggle status for ${pixel.name}`}
      >
        {pixel.status === "Active" ? (
          <Pause className="h-4 w-4" />
        ) : pixel.status === "Validation Required" ? (
          <RefreshCw className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </button>
      <button
        type="button"
        onClick={() => openEdit(pixel)}
        className="text-gray-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg transition-all"
        title="Edit pixel"
        aria-label={`Edit ${pixel.name}`}
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => handleDelete(pixel)}
        className="text-gray-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-lg transition-all"
        title="Delete pixel"
        aria-label={`Delete ${pixel.name}`}
      >
        <Trash2 className="h-4.5 w-4.5" />
      </button>
    </div>
  );

  const formModalOpen = isAdding || editingPixel !== null;

  return (
    <PageShell>
      <PageHeader
        title="Pixels"
        subtitle="Add tracking pixels to measure campaign conversions across your bio pages."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center justify-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl px-4 sm:px-5 py-2.5 text-sm font-semibold shadow-md shadow-indigo-100 transition-all active:scale-95 w-full sm:w-auto"
          >
            <Plus className="h-4.5 w-4.5 shrink-0" />
            <span>Add Tracking Pixel</span>
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="key-glass-card p-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
          <p className="font-display font-black text-2xl text-slate-900 mt-1">{pixels.length}</p>
        </div>
        <div className="key-glass-card p-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active</p>
          <p className="font-display font-black text-2xl text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="key-glass-card p-4 col-span-2 sm:col-span-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Needs validation</p>
          <p className="font-display font-black text-2xl text-amber-600 mt-1">{needsValidation}</p>
        </div>
      </div>

      {pixels.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="key-icon-field flex-1">
            <span className="key-icon-field__icon">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, type, or pixel ID..."
              aria-label="Search pixels"
              className="key-input key-icon-field__input w-full py-2"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            aria-label="Filter by type"
            className="key-input px-3 py-2 font-medium"
          >
            <option value="All">All types</option>
            {PIXEL_TYPES.map((pixelType) => (
              <option key={pixelType} value={pixelType}>
                {pixelType}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            aria-label="Filter by status"
            className="key-input px-3 py-2 font-medium"
          >
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Validation Required">Validation Required</option>
          </select>
        </div>
      )}

      {formModalOpen && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pixel-form-title"
            className="bg-white rounded-3xl max-w-md w-full p-4 shadow-2xl border border-gray-50 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 id="pixel-form-title" className="font-display font-bold text-lg text-gray-950">
                {editingPixel ? "Edit Tracking Pixel" : "Add Tracking Pixel"}
              </h3>
              <button
                type="button"
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Pixel name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. FB Checkout Pixel"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4F46E5] rounded-xl py-2.5 px-3.5 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Pixel provider type
                </label>
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4F46E5] rounded-xl py-2.5 px-3.5 text-sm focus:outline-none cursor-pointer"
                >
                  {PIXEL_TYPES.map((pixelType) => (
                    <option key={pixelType} value={pixelType}>
                      {pixelType}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Pixel / tag ID
                </label>
                <input
                  type="text"
                  required
                  placeholder={pixelIdHint(type)}
                  value={pixelId}
                  onChange={(event) => setPixelId(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4F46E5] rounded-xl py-2.5 px-3.5 text-sm focus:outline-none font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">{pixelIdHint(type)}</p>
              </div>

              {formError && (
                <p className="text-xs font-medium text-rose-600" role="alert">
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={closeModals}
                  className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-xl disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold"
                >
                  {isSubmitting
                    ? editingPixel
                      ? "Saving…"
                      : "Adding…"
                    : editingPixel
                      ? "Save changes"
                      : "Add Pixel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SectionCard>
        <Workspace>
        {pixels.length === 0 ? (
          <div className="p-5 sm:p-6 text-center flex flex-col items-center justify-center">
            <div className="h-14 w-14 bg-indigo-50 text-[#4F46E5] rounded-2xl flex items-center justify-center mb-6">
              <Shield className="h-6 w-6" />
            </div>
            <h4 className="font-display font-bold text-gray-900">No Tracking Pixels yet</h4>
            <p className="text-gray-500 text-sm max-w-xs mt-1">
              Connect Facebook, Google, TikTok, or Pinterest tags to track conversion events.
            </p>
            <button
              type="button"
              onClick={openAdd}
              className="mt-4 inline-flex items-center gap-1.5 bg-[#4F46E5] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add your first pixel
            </button>
          </div>
        ) : filteredPixels.length === 0 ? (
          <div className="p-6 text-center space-y-2">
            <p className="text-sm text-slate-500">No pixels match your filters.</p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("All");
                  setTypeFilter("All");
                }}
                className="text-[#4F46E5] text-sm font-semibold hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="lg:hidden divide-y divide-gray-50">
              {filteredPixels.map((pixel) => (
                <div key={pixel.id} className="p-4 sm:p-8 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 bg-indigo-50 text-[#4F46E5] rounded-lg flex items-center justify-center shrink-0">
                        <PixelTypeIcon type={pixel.type} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-bold text-gray-950 text-sm">{pixel.name}</p>
                        <p className="text-xs text-gray-600 font-semibold mt-0.5">{pixel.type}</p>
                        <p className="text-xs font-mono text-gray-500 break-all mt-1">{pixel.pixelId}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${statusBadgeClass(pixel.status)}`}
                    >
                      {pixel.status}
                    </span>
                  </div>
                  {renderActions(pixel)}
                </div>
              ))}
            </div>

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-50 bg-slate-50/50">
                    <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Name
                    </th>
                    <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Pixel type
                    </th>
                    <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Pixel ID
                    </th>
                    <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Status
                    </th>
                    <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredPixels.map((pixel) => (
                    <tr key={pixel.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4.5 px-6 font-display font-bold text-gray-950 text-sm">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 bg-indigo-50 text-[#4F46E5] rounded-lg flex items-center justify-center shrink-0">
                            <PixelTypeIcon type={pixel.type} />
                          </div>
                          <span className="truncate">{pixel.name}</span>
                        </div>
                      </td>
                      <td className="py-4.5 px-6">
                        <span className="text-sm font-semibold text-gray-600">{pixel.type}</span>
                      </td>
                      <td className="py-4.5 px-6">
                        <span className="text-sm font-semibold font-mono text-gray-500 break-all">
                          {pixel.pixelId}
                        </span>
                      </td>
                      <td className="py-4.5 px-6">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${statusBadgeClass(pixel.status)}`}
                        >
                          {pixel.status}
                        </span>
                      </td>
                      <td className="py-4.5 px-6">{renderActions(pixel)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        </Workspace>
      </SectionCard>

      {toast && (
        <div className="fixed bottom-6 right-6 left-6 sm:left-auto bg-slate-900 text-white border border-slate-800 text-xs font-black py-3 px-5 rounded-2xl shadow-2xl z-50 max-w-sm sm:ml-auto">
          {toast}
        </div>
      )}
    </PageShell>
  );
}
