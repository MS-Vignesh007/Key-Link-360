import React, { useMemo, useRef, useState } from "react";
import { MediaFile } from "../types";
import {
  UploadCloud,
  X,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Eye,
  Search,
  Pencil,
  Download,
  ImageOff,
  Film,
  FileText,
  Archive
} from "lucide-react";
import PageShell, { PageHeader, Workspace } from "./layout/PageShell";

interface MediaLibraryScreenProps {
  files: MediaFile[];
  onUploadFile: (file: Omit<MediaFile, "id">) => void;
  onUpdateFile: (file: MediaFile) => void;
  onDeleteFile: (id: string) => void;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUploadDate(date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function TypeIcon({ type }: { type: MediaFile["type"] }) {
  if (type === "video") return <Film className="h-4 w-4" />;
  if (type === "document") return <FileText className="h-4 w-4" />;
  if (type === "archive") return <Archive className="h-4 w-4" />;
  return <UploadCloud className="h-4 w-4" />;
}

function Thumbnail({ file }: { file: MediaFile }) {
  const [failed, setFailed] = useState(false);

  if (failed || !file.url) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300 bg-slate-100">
        <ImageOff className="h-8 w-8" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{file.type}</span>
      </div>
    );
  }

  return (
    <img
      src={file.url}
      alt={file.name}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-full h-full object-cover"
    />
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function readImageDimensions(dataUrl: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve(`${img.naturalWidth} × ${img.naturalHeight}`);
    img.onerror = () => resolve(undefined);
    img.src = dataUrl;
  });
}

export default function MediaLibraryScreen({
  files,
  onUploadFile,
  onUpdateFile,
  onDeleteFile
}: MediaLibraryScreenProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [renamingFile, setRenamingFile] = useState<MediaFile | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | MediaFile["type"]>("All");
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const filteredFiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return files.filter((file) => {
      const matchesType = typeFilter === "All" || file.type === typeFilter;
      const matchesSearch =
        !query ||
        file.name.toLowerCase().includes(query) ||
        (file.dimensions || "").toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }, [files, searchQuery, typeFilter]);

  const imageCount = files.filter((f) => f.type === "image").length;
  const videoCount = files.filter((f) => f.type === "video").length;
  const hasFilters = searchQuery.trim().length > 0 || typeFilter !== "All";

  const validateAndBuildMedia = async (file: File): Promise<Omit<MediaFile, "id"> | null> => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
      triggerToast(`"${file.name}" is not a supported image type.`);
      return null;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      triggerToast(`"${file.name}" exceeds the 5MB limit.`);
      return null;
    }
    if (file.size === 0) {
      triggerToast(`"${file.name}" is empty.`);
      return null;
    }

    const dataUrl = await readFileAsDataUrl(file);
    if (!dataUrl.startsWith("data:image/")) {
      triggerToast(`Could not process "${file.name}".`);
      return null;
    }

    const dimensions = await readImageDimensions(dataUrl);
    return {
      name: file.name,
      type: "image",
      size: formatBytes(file.size),
      url: dataUrl,
      dimensions,
      uploadedAt: formatUploadDate()
    };
  };

  const processFiles = async (fileList: FileList | File[]) => {
    const list = Array.from(fileList);
    if (list.length === 0 || isUploading) return;

    setIsUploading(true);
    let uploaded = 0;
    let failed = 0;

    for (let i = 0; i < list.length; i += 1) {
      const file = list[i];
      setUploadProgress(`Uploading ${i + 1} of ${list.length}…`);
      try {
        const media = await validateAndBuildMedia(file);
        if (media) {
          onUploadFile(media);
          uploaded += 1;
        } else {
          failed += 1;
        }
      } catch {
        failed += 1;
        triggerToast(`Failed to upload "${file.name}".`);
      }
    }

    setIsUploading(false);
    setUploadProgress("");
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (uploaded > 0) {
      triggerToast(
        uploaded === 1 ? "1 file uploaded successfully." : `${uploaded} files uploaded successfully.`
      );
    } else if (failed > 0 && uploaded === 0) {
      // Individual toasts already shown for validation failures
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files?.length) {
      void processFiles(event.dataTransfer.files);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      void processFiles(event.target.files);
    }
  };

  const handleCopy = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      triggerToast("Media URL copied.");
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      triggerToast("Could not copy. Open the file and copy from the address bar.");
    }
  };

  const handleDelete = (file: MediaFile) => {
    if (!window.confirm(`Delete "${file.name}"? This cannot be undone.`)) return;
    onDeleteFile(file.id);
    if (previewFile?.id === file.id) setPreviewFile(null);
    if (renamingFile?.id === file.id) setRenamingFile(null);
    triggerToast(`"${file.name}" deleted.`);
  };

  const handleDownload = (file: MediaFile) => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast(`Download started for "${file.name}".`);
  };

  const openRename = (file: MediaFile) => {
    setRenamingFile(file);
    setRenameValue(file.name);
    setRenameError("");
  };

  const handleRenameSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!renamingFile) return;
    const nextName = renameValue.trim();
    if (!nextName) {
      setRenameError("File name is required.");
      return;
    }
    if (nextName.length < 2) {
      setRenameError("Enter at least 2 characters.");
      return;
    }
    if (
      files.some(
        (f) => f.id !== renamingFile.id && f.name.toLowerCase() === nextName.toLowerCase()
      )
    ) {
      setRenameError("A file with this name already exists.");
      return;
    }

    setIsRenaming(true);
    window.setTimeout(() => {
      onUpdateFile({ ...renamingFile, name: nextName });
      if (previewFile?.id === renamingFile.id) {
        setPreviewFile({ ...renamingFile, name: nextName });
      }
      setIsRenaming(false);
      setRenamingFile(null);
      triggerToast("File renamed.");
    }, 250);
  };

  return (
    <PageShell>
      <PageHeader
        title="Media Library"
        subtitle="Upload and store images to use on your bio pages and campaigns."
        actions={
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-70 text-white rounded-xl px-5 py-2.5 text-sm font-semibold shadow-md shadow-indigo-100 transition-all active:scale-95 w-full sm:w-auto justify-center"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>{isUploading ? "Uploading…" : "Upload File"}</span>
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total files</p>
          <p className="font-display font-black text-2xl text-slate-900 mt-1">{files.length}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Images</p>
          <p className="font-display font-black text-2xl text-indigo-600 mt-1">{imageCount}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Videos</p>
          <p className="font-display font-black text-2xl text-rose-500 mt-1">{videoCount}</p>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
        multiple
        className="hidden"
        aria-label="Upload media files"
      />

      <div
        role="button"
        tabIndex={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!isUploading) fileInputRef.current?.click();
          }
        }}
        aria-disabled={isUploading}
        className={`border-2 border-dashed rounded-2xl p-4 sm:p-8 flex flex-col items-center justify-center text-center transition-all ${
          isUploading ? "cursor-wait opacity-80" : "cursor-pointer"
        } ${
          isDragging
            ? "border-[#4F46E5] bg-indigo-50/40"
            : "border-gray-200 hover:border-gray-300 bg-white"
        }`}
      >
        <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center mb-6">
          <UploadCloud className={`h-6 w-6 ${isUploading ? "animate-pulse" : ""}`} />
        </div>
        <h4 className="font-display font-bold text-gray-950 text-base">
          {isUploading ? uploadProgress || "Uploading…" : "Drag & drop images here, or click to upload"}
        </h4>
        <p className="text-gray-400 text-xs mt-1.5">Supports PNG, JPG, GIF, WebP up to 5MB · multiple files OK</p>
      </div>

      {files.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="key-icon-field flex-1">
            <span className="key-icon-field__icon">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by file name..."
              aria-label="Search media files"
              className="key-icon-field__input w-full bg-white border border-slate-200 rounded-xl py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
            aria-label="Filter by type"
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none"
          >
            <option value="All">All types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
            <option value="archive">Archives</option>
          </select>
        </div>
      )}

      {files.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-5 sm:p-6 text-center space-y-3">
          <div className="h-14 w-14 bg-indigo-50 text-[#4F46E5] rounded-2xl flex items-center justify-center mx-auto">
            <UploadCloud className="h-6 w-6" />
          </div>
          <h4 className="font-display font-bold text-gray-900">No media files yet</h4>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Upload images to reuse across bio pages, QR designs, and campaigns.
          </p>
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 bg-[#4F46E5] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm disabled:opacity-70"
          >
            <Plus className="h-4 w-4" />
            Upload your first file
          </button>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center space-y-2">
          <p className="text-sm text-slate-500">No files match your filters.</p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setTypeFilter("All");
              }}
              className="text-[#4F46E5] text-sm font-semibold hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 key-workspace-grid">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm group flex flex-col justify-between min-w-0"
            >
              <div className="h-36 sm:h-40 bg-slate-50 relative flex items-center justify-center overflow-hidden border-b border-gray-50">
                <Thumbnail file={file} />
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center gap-1 bg-black/50 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                    <TypeIcon type={file.type} />
                    {file.type}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gray-900/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewFile(file)}
                    className="p-2 bg-white text-gray-800 rounded-xl hover:bg-slate-50 shadow-sm"
                    title="Preview"
                    aria-label={`Preview ${file.name}`}
                  >
                    <Eye className="h-4.5 w-4.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCopy(file.id, file.url)}
                    className="p-2 bg-white text-gray-800 rounded-xl hover:bg-slate-50 shadow-sm"
                    title="Copy URL"
                    aria-label={`Copy URL for ${file.name}`}
                  >
                    {copiedId === file.id ? (
                      <Check className="h-4.5 w-4.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
              </div>

              <Workspace stack className="flex-1 flex flex-col justify-between min-w-0">
                <div className="min-w-0">
                  <h5 className="font-sans font-semibold text-gray-950 text-xs truncate" title={file.name}>
                    {file.name}
                  </h5>
                  <span className="text-[10px] text-gray-400 font-medium font-mono mt-0.5 block truncate">
                    {file.size}
                    {file.dimensions ? ` • ${file.dimensions}` : ""}
                    {file.uploadedAt ? ` • ${file.uploadedAt}` : ""}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-0.5">
                  <button
                    type="button"
                    onClick={() => openRename(file)}
                    className="text-gray-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-xl transition-all"
                    title="Rename"
                    aria-label={`Rename ${file.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(file)}
                    className="text-gray-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-xl transition-all"
                    title="Download"
                    aria-label={`Download ${file.name}`}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(file)}
                    className="text-gray-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition-all"
                    title="Delete"
                    aria-label={`Delete ${file.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Workspace>
            </div>
          ))}
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 bg-gray-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="media-preview-title"
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white shrink-0 gap-3">
              <h4 id="media-preview-title" className="font-display font-bold text-gray-950 text-base truncate">
                {previewFile.name}
              </h4>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full shrink-0"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-100 flex items-center justify-center p-4 max-h-[400px] overflow-hidden">
              <img
                src={previewFile.url}
                alt={previewFile.name}
                referrerPolicy="no-referrer"
                className="max-h-[350px] max-w-full object-contain rounded-xl"
              />
            </div>

            <div className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-50 shrink-0">
              <div className="text-xs text-gray-400 font-mono min-w-0">
                {previewFile.size}
                {previewFile.dimensions ? ` • ${previewFile.dimensions}` : ""}
                {previewFile.uploadedAt ? ` • ${previewFile.uploadedAt}` : ""}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopy(previewFile.id, previewFile.url)}
                  className="px-3 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  {copiedId === previewFile.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(previewFile)}
                  className="px-3 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </button>
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-[#4F46E5] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {renamingFile && (
        <div className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-media-title"
            className="bg-white rounded-3xl max-w-sm w-full p-4 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 id="rename-media-title" className="font-display font-black text-lg text-slate-900">
                Rename file
              </h3>
              <button
                type="button"
                onClick={() => !isRenaming && setRenamingFile(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleRenameSubmit} className="space-y-6" noValidate>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  File name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={renameValue}
                  onChange={(event) => setRenameValue(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              {renameError && (
                <p className="text-xs font-medium text-rose-600" role="alert">
                  {renameError}
                </p>
              )}
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isRenaming}
                  onClick={() => setRenamingFile(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenaming}
                  className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-70 text-white rounded-xl text-xs font-extrabold"
                >
                  {isRenaming ? "Saving…" : "Save name"}
                </button>
              </div>
            </form>
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
