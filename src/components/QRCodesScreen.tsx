import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { QRCodeItem } from "../types";
import {
  QrCode,
  Plus,
  Filter,
  MapPin,
  Percent,
  Download,
  Link2,
  Paintbrush,
  Eye,
  X,
  Smartphone,
  Laptop,
  Check,
  Trash2,
  RefreshCw,
  FileImage,
  Search,
  Pause,
  Play,
  Upload
} from "lucide-react";
import PageShell, { PageHeader } from "./layout/PageShell";
import { QrBrandMark } from "./qr/QrBrandMark";
import {
  buildQrImageUrl,
  extractQrColor,
  formatQrScanExact
} from "../lib/qrCodes";
import {
  exportBrandedQrJpegBlob,
  exportBrandedQrPngBlob,
  exportBrandedQrPngDataUrl,
  exportBrandedQrSvgBlob,
  triggerBrowserDownload
} from "../lib/qrExport";

interface QRCodesScreenProps {
  items: QRCodeItem[];
  onGenerateQR: (name: string, targetUrl: string, customColor: string) => void;
  onUpdateTargetUrl: (id: string, newUrl: string) => void | Promise<boolean>;
  onDeleteQR: (id: string) => void;
  onUpdateQR: (item: QRCodeItem) => void;
}

const colorsList = [
  { name: "Indigo", value: "#4F46E5" },
  { name: "Emerald", value: "#10B981" },
  { name: "Rose", value: "#F43F5E" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Slate", value: "#0F172A" }
];

function isValidUrl(value: string): boolean {
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
  if (/^https?:\/\//i.test(trimmed) || trimmed.includes("key.link")) return trimmed;
  return `https://${trimmed}`;
}

function parseNumberValue(val: string) {
  if (!val) return 0;
  const clean = val.toLowerCase().trim().replace(/,/g, "");
  if (clean.endsWith("k")) {
    return Math.round(parseFloat(clean.replace("k", "")) * 1000);
  }
  return parseInt(clean, 10) || 0;
}

function resolveScanPayload(item: QRCodeItem): string {
  return item.scanUrl || item.qrUrl || item.targetUrl;
}

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

export default function QRCodesScreen({
  items,
  onGenerateQR,
  onUpdateTargetUrl,
  onDeleteQR,
  onUpdateQR
}: QRCodesScreenProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [selectedColor, setSelectedColor] = useState("#4F46E5");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [editingItem, setEditingItem] = useState<QRCodeItem | null>(null);
  const [editUrlValue, setEditUrlValue] = useState("");
  const [editError, setEditError] = useState("");
  const [isSavingUrl, setIsSavingUrl] = useState(false);

  const [designingItem, setDesigningItem] = useState<QRCodeItem | null>(null);
  const [designColor, setDesignColor] = useState("#4F46E5");
  const [designPattern, setDesignPattern] = useState<"rounded" | "square" | "compact">("rounded");
  const [designLogo, setDesignLogo] = useState<QRCodeItem["designLogo"]>("none");
  const [designLogoUrl, setDesignLogoUrl] = useState("");
  const [isSavingDesign, setIsSavingDesign] = useState(false);
  const logoUploadRef = useRef<HTMLInputElement>(null);

  const [downloadingItem, setDownloadingItem] = useState<QRCodeItem | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<"png" | "jpeg" | "svg" | "pdf">("png");
  const [downloadQuality, setDownloadQuality] = useState("2000px");
  const [isPreparingDownload, setIsPreparingDownload] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Paused">("All");
  const [toast, setToast] = useState<string | null>(null);

  const anyModalOpen = Boolean(isAdding || editingItem || designingItem || downloadingItem);

  useEffect(() => {
    document.body.classList.toggle("key-qr-modal-open", anyModalOpen);
    return () => document.body.classList.remove("key-qr-modal-open");
  }, [anyModalOpen]);

  const triggerToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.targetUrl.toLowerCase().includes(query) ||
        (item.scanUrl || "").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchQuery, statusFilter]);

  const totalScans = items.reduce((acc, curr) => acc + parseNumberValue(curr.scans), 0);
  const totalUnique = items.reduce((acc, curr) => acc + parseNumberValue(curr.uniqueScanners), 0);
  const locations = items.map((item) => item.topLocation).filter((loc) => loc && loc !== "N/A");
  const topLoc = locations[0] || "N/A";
  const rates = items.map((item) => parseFloat((item.conversionRate || "0%").replace("%", "")) || 0);
  const avgRate =
    rates.length > 0 ? `${(rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(1)}%` : "0%";

  const hasActiveFilters = searchQuery.trim().length > 0 || statusFilter !== "All";

  const resetCreateForm = () => {
    setNewName("");
    setNewTarget("");
    setSelectedColor("#4F46E5");
    setCreateError("");
  };

  const handleGenerate = (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError("");

    const name = newName.trim();
    const target = normalizeUrl(newTarget);

    if (!name) {
      setCreateError("QR code name is required.");
      return;
    }
    if (!isValidUrl(target)) {
      setCreateError("Enter a valid destination URL.");
      return;
    }
    if (items.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      setCreateError("A QR code with this name already exists.");
      return;
    }

    setIsCreating(true);
    window.setTimeout(() => {
      onGenerateQR(name, target, selectedColor);
      setIsCreating(false);
      setIsAdding(false);
      resetCreateForm();
      triggerToast("Smart QR created. The printed matrix stays fixed.");
    }, 300);
  };

  const handleSaveUrl = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingItem) return;
    setEditError("");

    const target = normalizeUrl(editUrlValue);
    if (!isValidUrl(target)) {
      setEditError("Enter a valid destination URL.");
      return;
    }

    setIsSavingUrl(true);
    try {
      const ok = await Promise.resolve(onUpdateTargetUrl(editingItem.id, target));
      setEditingItem(null);
      triggerToast(
        ok === false
          ? "Saved locally — sync failed. Try again so mobile scans use the new URL."
          : "Destination updated. QR code stays the same — scans open the new URL."
      );
    } finally {
      setIsSavingUrl(false);
    }
  };

  const handleSaveDesign = () => {
    if (!designingItem || isSavingDesign) return;
    if (!/^#[0-9A-Fa-f]{6}$/.test(designColor)) {
      triggerToast("Enter a valid hex color like #4F46E5.");
      return;
    }
    if (designLogo === "custom" && !designLogoUrl) {
      triggerToast("Upload a brand logo, or pick another center mark.");
      return;
    }

    const scanPayload = resolveScanPayload(designingItem);
    setIsSavingDesign(true);
    window.setTimeout(() => {
      onUpdateQR({
        ...designingItem,
        qrUrl: buildQrImageUrl(scanPayload, designColor, 250),
        customDesign: true,
        designColor,
        designLogo: designLogo || "none",
        designLogoUrl: designLogo === "custom" ? designLogoUrl : undefined,
        designPattern
      });
      setIsSavingDesign(false);
      setDesigningItem(null);
      triggerToast("Brand design saved. QR payload stays fixed.");
    }, 300);
  };

  const toggleStatus = (item: QRCodeItem) => {
    const nextStatus = item.status === "Active" ? "Paused" : "Active";
    onUpdateQR({ ...item, status: nextStatus });
    triggerToast(`"${item.name}" is now ${nextStatus}.`);
  };

  const triggerDownload = async () => {
    if (!downloadingItem || isPreparingDownload) return;

    const color = downloadingItem.designColor || extractQrColor(downloadingItem.qrUrl);
    const scanPayload = resolveScanPayload(downloadingItem);
    const safeName = downloadingItem.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "qr-code";
    const size =
      downloadQuality.includes("4000") ? 4000 : downloadQuality.includes("1000") ? 1000 : 2000;

    const brandedOptions = {
      scanUrl: scanPayload,
      color,
      size,
      designPattern: downloadingItem.designPattern,
      designLogo: downloadingItem.designLogo,
      designLogoUrl: downloadingItem.designLogoUrl
    };

    setIsPreparingDownload(true);
    try {
      if (downloadFormat === "svg") {
        const svgBlob = await exportBrandedQrSvgBlob({ ...brandedOptions, size: Math.max(size, 1000) });
        triggerBrowserDownload(svgBlob, `${safeName}.svg`);
        triggerToast("SVG QR downloaded with transparent background.");
      } else if (downloadFormat === "pdf") {
        const printWindow = window.open("", "_blank", "noopener,noreferrer,width=720,height=900");
        if (!printWindow) {
          throw new Error("Popup blocked");
        }
        const pngDataUrl = await exportBrandedQrPngDataUrl({
          ...brandedOptions,
          size: 2000,
          transparentBackground: false
        });
        printWindow.document.write(`<!doctype html><html><head><title>${downloadingItem.name} QR</title>
          <style>
            body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;gap:16px;background:#fff}
            img{width:360px;height:360px;object-fit:contain}
            p{color:#64748b;font-size:12px;word-break:break-all;max-width:420px;text-align:center}
          </style></head><body>
          <h1>${downloadingItem.name}</h1>
          <img src="${pngDataUrl}" alt="QR Code" />
          <p>${scanPayload}</p>
          <script>window.onload=()=>{window.print();}</script>
          </body></html>`);
        printWindow.document.close();
        triggerToast("Print dialog opened with branded QR.");
      } else if (downloadFormat === "jpeg") {
        const jpegBlob = await exportBrandedQrJpegBlob(brandedOptions);
        triggerBrowserDownload(jpegBlob, `${safeName}.jpg`);
        triggerToast(`JPEG QR downloaded at ${size}px.`);
      } else {
        const pngBlob = await exportBrandedQrPngBlob(brandedOptions);
        triggerBrowserDownload(pngBlob, `${safeName}.png`);
        triggerToast(`Transparent PNG downloaded at ${size}px.`);
      }
      setDownloadingItem(null);
    } catch {
      triggerToast("Download failed. Check your connection and try again.");
    } finally {
      setIsPreparingDownload(false);
    }
  };

  const openDesignModal = (item: QRCodeItem) => {
    setDesigningItem(item);
    setDesignColor(item.designColor || extractQrColor(item.qrUrl));
    setDesignPattern(item.designPattern || "rounded");
    const isCustom = item.designLogo === "custom" && Boolean(item.designLogoUrl);
    setDesignLogo(isCustom ? "custom" : "none");
    setDesignLogoUrl(isCustom ? item.designLogoUrl || "" : "");
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      triggerToast("Please upload an image file (PNG, JPG, SVG, WebP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      triggerToast("Logo must be under 2 MB.");
      return;
    }
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setDesignLogo("custom");
      setDesignLogoUrl(dataUrl);
    } catch {
      triggerToast("Could not read that image. Try another file.");
    }
  };

  const designPreviewPayload = designingItem ? resolveScanPayload(designingItem) : "";

  const renderModal = (node: React.ReactNode) =>
    createPortal(
      <div className="key-modal-backdrop key-workflow-modal-backdrop key-qr-modal-backdrop">{node}</div>,
      document.body
    );

  return (
    <PageShell className="font-sans text-slate-800">
      <PageHeader
        title="Smart QR Codes"
        subtitle="Print once — destination can change anytime. The QR matrix stays fixed."
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowFilters((open) => !open)}
              className={`flex items-center gap-2 border rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                showFilters || hasActiveFilters
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "border-slate-200 hover:bg-slate-50 text-slate-600 bg-white"
              }`}
              aria-expanded={showFilters}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 key-btn-chip px-5 py-2.5 text-xs font-extrabold active:scale-95"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Generate QR</span>
            </button>
          </>
        }
      />

      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
          <div className="key-icon-field flex-1">
            <span className="key-icon-field__icon">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name or destination URL..."
              className="key-icon-field__input w-full bg-slate-50 border border-slate-200 rounded-xl py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
              aria-label="Search QR codes"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "All" | "Active" | "Paused")}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none"
            aria-label="Filter by status"
          >
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
          </select>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("All");
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          {
            label: "Total Scans",
            value: formatQrScanExact(totalScans),
            change: totalScans > 0 ? "Exact live scans" : "No scans yet",
            isPositive: totalScans > 0,
            icon: QrCode,
            bgIcon: "bg-indigo-50 text-indigo-600"
          },
          {
            label: "Unique Scanners",
            value: formatQrScanExact(totalUnique),
            change: totalUnique > 0 ? "Unique devices tracked" : "No users yet",
            isPositive: totalUnique > 0,
            icon: Eye,
            bgIcon: "bg-amber-50 text-amber-600"
          },
          {
            label: "Top Location",
            value: topLoc,
            change: topLoc !== "N/A" ? "Primary city traffic" : "No regions mapped",
            isPositive: topLoc !== "N/A",
            icon: MapPin,
            bgIcon: "bg-rose-50 text-rose-500"
          },
          {
            label: "Avg Conversion",
            value: avgRate,
            change: parseFloat(avgRate) > 0 ? "Scan-to-unique rate" : "Zero interaction level",
            isPositive: parseFloat(avgRate) > 0,
            icon: Percent,
            bgIcon: "bg-emerald-50 text-emerald-600"
          }
        ].map((metric) => {
          const MIcon = metric.icon;
          return (
            <div
              key={metric.label}
              className="bg-white border border-slate-200/60 rounded-2xl p-4 sm:p-8 shadow-sm hover:shadow-md transition-all flex items-start justify-between min-w-0"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{metric.label}</p>
                <h3 className="font-display font-black text-xl sm:text-2xl text-slate-900 mt-1 truncate">
                  {metric.value}
                </h3>
                <span
                  className={`text-[10px] font-bold flex items-center gap-1 mt-1.5 ${
                    metric.isPositive ? "text-emerald-600" : "text-slate-400"
                  }`}
                >
                  {metric.change}
                </span>
              </div>
              <div className={`h-11 w-11 rounded-xl ${metric.bgIcon} flex items-center justify-center shrink-0`}>
                <MIcon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-4 text-center max-w-xl mx-auto space-y-3 shadow-sm">
          <div className="h-14 w-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <QrCode className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">No QR codes found</h3>
          <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
            Generate your first Smart QR. Print once, then change the destination anytime — the matrix stays fixed.
          </p>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="mt-2 inline-flex items-center gap-1.5 key-btn-chip px-4 py-2 text-xs font-bold"
          >
            Create Your First QR
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-3">
          <p className="text-sm text-slate-500">No QR codes match your filters.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("All");
            }}
            className="text-[#6366f1] text-sm font-semibold hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 key-workspace-grid">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group relative"
            >
              <div className="absolute top-3 right-3 z-20 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleStatus(item)}
                  className="bg-white/90 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 p-2 rounded-xl transition-all shadow-sm border border-slate-100"
                  title={item.status === "Active" ? "Pause QR" : "Activate QR"}
                  aria-label={item.status === "Active" ? "Pause QR" : "Activate QR"}
                >
                  {item.status === "Active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete the "${item.name}" QR code?`)) {
                      onDeleteQR(item.id);
                      triggerToast("QR code deleted.");
                    }
                  }}
                  className="bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 p-2 rounded-xl transition-all shadow-sm border border-slate-100"
                  title="Delete QR"
                  aria-label={`Delete ${item.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="bg-slate-50 border-b border-slate-100 p-4 flex flex-col items-center justify-center h-48 relative overflow-hidden">
                <div className="relative bg-white p-3.5 rounded-2xl border border-slate-100 shadow-md transform group-hover:scale-105 transition-transform duration-300 z-10 flex items-center justify-center">
                  <img
                    src={item.qrUrl}
                    alt={`${item.name} QR code`}
                    referrerPolicy="no-referrer"
                    className={`h-24 w-24 bg-white object-contain ${
                      item.designPattern === "rounded"
                        ? "rounded-lg"
                        : item.designPattern === "compact"
                          ? "rounded-md scale-95"
                          : ""
                    }`}
                  />
                  {item.designLogo && item.designLogo !== "none" ? (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <QrBrandMark logo={item.designLogo} logoUrl={item.designLogoUrl} size="md" />
                    </div>
                  ) : null}
                </div>
                {idx % 2 === 0 ? (
                  <Smartphone className="absolute -right-6 -bottom-6 h-28 w-28 text-slate-200/30 -rotate-12" />
                ) : (
                  <Laptop className="absolute -right-8 -bottom-4 h-24 w-24 text-slate-200/30" />
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-display font-black text-slate-900 text-base leading-snug truncate">
                      {item.name}
                    </h4>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                        item.status === "Active"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <a
                    href={/^https?:\/\//i.test(item.targetUrl) ? item.targetUrl : `https://${item.targetUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 font-bold font-mono truncate flex items-center gap-1 bg-slate-50 py-1 px-2.5 rounded-lg border border-slate-100 hover:bg-indigo-50"
                  >
                    <Link2 className="h-3 w-3 shrink-0 text-indigo-400" />
                    <span className="truncate">{item.targetUrl}</span>
                  </a>
                  {item.scanUrl ? (
                    <p className="text-[10px] text-slate-400 font-mono truncate px-0.5" title={item.scanUrl}>
                      Scan → {item.scanUrl.replace(/^https?:\/\//, "")}
                    </p>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-1">
                    <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-2 text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Scans</p>
                      <p className="font-display font-black text-slate-800 text-sm mt-0.5">
                        {formatQrScanExact(item.scans)}
                      </p>
                    </div>
                    <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-2 text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Unique</p>
                      <p className="font-display font-black text-slate-800 text-sm mt-0.5">
                        {formatQrScanExact(item.uniqueScanners)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1.5">
                    {item.customDesign ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-100">
                        <Paintbrush className="h-3 w-3 text-purple-400" />
                        Custom Design
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
                        Standard QR Pattern
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(item);
                      setEditUrlValue(item.targetUrl);
                      setEditError("");
                    }}
                    className="bg-slate-50 hover:bg-[#EEF2FF] hover:text-[#4F46E5] text-slate-700 rounded-xl py-2.5 text-[11px] font-black border border-slate-200/80"
                  >
                    Edit URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setDownloadingItem(item)}
                    className="bg-slate-50 hover:bg-[#EEF2FF] hover:text-[#4F46E5] text-slate-700 rounded-xl py-2.5 text-[11px] font-black border border-slate-200/80"
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => openDesignModal(item)}
                    className="bg-slate-50 hover:bg-purple-50 hover:text-purple-600 text-slate-700 rounded-xl py-2.5 text-[11px] font-black border border-slate-200/80"
                  >
                    Edit Design
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdding &&
        renderModal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="generate-qr-title"
            className="bg-white rounded-3xl max-w-md w-full p-4 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 id="generate-qr-title" className="font-display font-black text-xl text-slate-900">
                Generate Dynamic QR
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (!isCreating) {
                    setIsAdding(false);
                    resetCreateForm();
                  }
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-6" noValidate>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  QR code name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Marvel Bio Stand QR"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4F46E5] rounded-xl py-2.5 px-3.5 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Destination target URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="e.g. https://key.link/summer-promo"
                  value={newTarget}
                  onChange={(event) => setNewTarget(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4F46E5] rounded-xl py-2.5 px-3.5 text-xs focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Destination can change later. The printed QR matrix stays fixed forever.
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Default theme color
                </label>
                <div className="flex gap-2.5 mt-1.5">
                  {colorsList.map((col) => {
                    const isSelected = selectedColor === col.value;
                    return (
                      <button
                        key={col.value}
                        type="button"
                        onClick={() => setSelectedColor(col.value)}
                        className="h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all hover:scale-105"
                        style={{
                          backgroundColor: col.value,
                          borderColor: isSelected ? "#000000" : "transparent"
                        }}
                        title={col.name}
                      >
                        {isSelected && <Check className="h-4 w-4 text-white" />}
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
                  disabled={isCreating}
                  onClick={() => {
                    setIsAdding(false);
                    resetCreateForm();
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2.5 key-btn-chip disabled:opacity-70 disabled:cursor-not-allowed text-xs font-extrabold"
                >
                  {isCreating ? "Creating…" : "Create Dynamic QR"}
                </button>
              </div>
            </form>
          </div>
        )}

      {editingItem &&
        renderModal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-url-title"
            className="bg-white rounded-3xl max-w-sm w-full p-4 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 id="edit-url-title" className="font-display font-black text-lg text-slate-900">
                Redirect QR Code
              </h3>
              <button
                type="button"
                onClick={() => !isSavingUrl && setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveUrl} className="space-y-6" noValidate>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Target redirect destination
                </label>
                <input
                  type="url"
                  required
                  value={editUrlValue}
                  onChange={(event) => setEditUrlValue(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4F46E5] rounded-xl py-2.5 px-3.5 text-xs focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Only the redirect changes. Printed QR codes keep the same matrix.
                </span>
              </div>
              {editError && (
                <p className="text-xs font-medium text-rose-600" role="alert">
                  {editError}
                </p>
              )}
              <button
                type="submit"
                disabled={isSavingUrl}
                className="w-full bg-slate-900 hover:bg-slate-950 disabled:opacity-70 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm"
              >
                {isSavingUrl ? "Saving…" : "Save Dynamic Destination"}
              </button>
            </form>
          </div>
        )}

      {designingItem &&
        renderModal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="design-qr-title"
            className="bg-white rounded-3xl max-w-md w-full p-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Paintbrush className="h-5 w-5 text-purple-600" />
                <h3 id="design-qr-title" className="font-display font-black text-lg text-slate-900">
                  QR Brand Customizer
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !isSavingDesign && setDesigningItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                  Live style preview
                </p>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm relative">
                  <img
                    src={buildQrImageUrl(designPreviewPayload, designColor, 150)}
                    alt="Styled QR Code"
                    className={`h-28 w-28 ${
                      designPattern === "rounded"
                        ? "rounded-lg"
                        : designPattern === "compact"
                          ? "rounded-md scale-95"
                          : ""
                    }`}
                  />
                  {designLogo && designLogo !== "none" ? (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <QrBrandMark logo={designLogo} logoUrl={designLogoUrl} size="lg" />
                    </div>
                  ) : null}
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-center">
                  Color & logo are branding only. Encoded scan URL never changes.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Brand accent color
                </label>
                <div className="flex gap-2.5">
                  {colorsList.map((col) => (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => setDesignColor(col.value)}
                      className="h-7 w-7 rounded-full border flex items-center justify-center transition-transform hover:scale-110"
                      style={{
                        backgroundColor: col.value,
                        borderColor: designColor === col.value ? "#000000" : "transparent"
                      }}
                    >
                      {designColor === col.value && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                  ))}
                  <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center relative cursor-pointer hover:bg-slate-200">
                    <input
                      type="color"
                      value={designColor}
                      onChange={(event) => setDesignColor(event.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-slate-600">Hex</span>
                  </div>
                </div>
                <input
                  type="text"
                  value={designColor}
                  onChange={(event) => setDesignColor(event.target.value)}
                  className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-mono"
                  placeholder="#000000"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Frame style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "rounded" as const, label: "Rounded" },
                      { id: "square" as const, label: "Classic" },
                      { id: "compact" as const, label: "Compact" }
                    ]
                  ).map((pat) => (
                    <button
                      key={pat.id}
                      type="button"
                      onClick={() => setDesignPattern(pat.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                        designPattern === pat.id
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {pat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Center brand mark
                </label>
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-700">Upload your brand logo</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Optional · PNG / JPG / SVG / WebP · sits on the QR with no white tile
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setDesignLogo("none");
                          setDesignLogoUrl("");
                        }}
                        className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-colors ${
                          designLogo === "none" || !designLogo
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        None
                      </button>
                      <button
                        type="button"
                        onClick={() => logoUploadRef.current?.click()}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold border transition-colors ${
                          designLogo === "custom"
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {designLogoUrl ? "Replace" : "Upload"}
                      </button>
                      <input
                        ref={logoUploadRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </div>
                  </div>
                  {designLogoUrl ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={designLogoUrl}
                        alt="Uploaded brand logo"
                        className="h-10 w-10 rounded-full object-cover shadow-md border-2 border-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setDesignLogo("none");
                          setDesignLogoUrl("");
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:underline"
                      >
                        Remove logo
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSavingDesign}
                  onClick={() => setDesigningItem(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl disabled:opacity-60"
                >
                  Discard
                </button>
                <button
                  type="button"
                  disabled={isSavingDesign}
                  onClick={handleSaveDesign}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-950 disabled:opacity-70 text-white rounded-xl text-xs font-black shadow-sm"
                >
                  {isSavingDesign ? "Saving…" : "Save Style"}
                </button>
              </div>
            </div>
          </div>
        )}

      {downloadingItem &&
        renderModal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="download-qr-title"
            className="bg-white rounded-3xl max-w-sm w-full p-4 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1.5">
                <Download className="h-5 w-5 text-indigo-600" />
                <h3 id="download-qr-title" className="font-display font-black text-lg text-slate-900">
                  Download QR
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !isPreparingDownload && setDownloadingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center gap-3">
                <div className="bg-white p-1.5 rounded-xl shadow-sm border border-slate-100 relative">
                  <img
                    src={downloadingItem.qrUrl}
                    alt="Download target"
                    className={`h-10 w-10 object-contain ${
                      downloadingItem.designPattern === "rounded"
                        ? "rounded-md"
                        : downloadingItem.designPattern === "compact"
                          ? "rounded scale-95"
                          : ""
                    }`}
                  />
                  {downloadingItem.designLogo === "custom" && downloadingItem.designLogoUrl ? (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <QrBrandMark
                        logo={downloadingItem.designLogo}
                        logoUrl={downloadingItem.designLogoUrl}
                        size="sm"
                      />
                    </div>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-slate-800 truncate">{downloadingItem.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{downloadingItem.targetUrl}</p>
                  <p className="text-[9px] text-emerald-600 font-bold mt-0.5">
                    Includes frame + brand mark · PNG = transparent bg
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Output format
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["png", "jpeg", "svg", "pdf"] as const).map((format) => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => setDownloadFormat(format)}
                      className={`py-2 rounded-xl text-xs font-bold border uppercase ${
                        downloadFormat === format
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
                {downloadFormat === "png" ? (
                  <p className="text-[10px] text-emerald-600 font-semibold mt-2">
                    PNG exports with transparent background (no white fill).
                  </p>
                ) : downloadFormat === "jpeg" ? (
                  <p className="text-[10px] text-slate-400 font-semibold mt-2">
                    JPEG keeps a white background (best for print).
                  </p>
                ) : null}
              </div>

              {(downloadFormat === "png" || downloadFormat === "jpeg") && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    {downloadFormat === "jpeg" ? "JPEG quality" : "PNG quality"}
                  </label>
                  <select
                    value={downloadQuality}
                    onChange={(event) => setDownloadQuality(event.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    <option value="1000px">1000px</option>
                    <option value="2000px">2000px</option>
                    <option value="4000px">4000px</option>
                  </select>
                </div>
              )}

              <button
                type="button"
                disabled={isPreparingDownload}
                onClick={() => void triggerDownload()}
                className="w-full key-btn-chip py-3 font-black text-xs disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {isPreparingDownload ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>Preparing branded download…</span>
                  </>
                ) : (
                  <>
                    <FileImage className="h-4 w-4" />
                    <span>
                      {downloadFormat === "pdf"
                        ? "Open Print / PDF"
                        : `Download ${downloadFormat.toUpperCase()}`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      {toast &&
        createPortal(
          <div className="fixed bottom-6 right-6 bg-slate-900 text-white border border-slate-800 text-xs font-black py-3 px-5 rounded-2xl shadow-2xl z-[130]">
            {toast}
          </div>,
          document.body
        )}
    </PageShell>
  );
}
