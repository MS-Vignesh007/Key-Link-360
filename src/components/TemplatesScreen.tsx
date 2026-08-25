import React, { useEffect, useMemo, useState } from "react";
import type { BioEditorBlock, BioPageTemplate, TemplateItem } from "../types";
import {
  formatStorageDate,
  getTemplateEditorPayload
} from "../storage/bioBuilderStorage";
import {
  getBlankTemplate,
  resolveSystemTemplate,
  SYSTEM_TEMPLATE_COUNT,
  TEMPLATE_CATEGORIES
} from "../lib/systemTemplates";
import { getBioPageThemeClass, getBioPageThemeStyle } from "../lib/bioPageThemes";
import { Workspace } from "./layout/PageShell";
import BlockRenderer from "./bio/BlockRenderer";
import CoverPhotoView from "./bio/CoverPhotoView";
import type { BlockRecord } from "../lib/bioBlocks";
import {
  Plus,
  Layers,
  Trash2,
  Search,
  Eye,
  X,
  ImageOff,
  Sparkles
} from "lucide-react";

interface TemplatesScreenProps {
  items: TemplateItem[];
  savedTemplates: BioPageTemplate[];
  onUseTemplate: (name: string, isCustom?: boolean, customTpl?: BioPageTemplate) => void;
  onDeleteCustomTemplate: (id: string) => void;
}

type PreviewTarget =
  | { kind: "system"; item: TemplateItem }
  | { kind: "custom"; item: BioPageTemplate };

function getBlockCount(tpl: BioPageTemplate) {
  return tpl.data?.blocks?.length ?? 0;
}

function resolvePreviewState(target: PreviewTarget) {
  if (target.kind === "custom") {
    return getTemplateEditorPayload(target.item);
  }
  return resolveSystemTemplate(target.item.name) ?? getBlankTemplate(target.item.name);
}

function TemplateExplorePhone({
  title,
  bio,
  coverImage,
  handle,
  blocks
}: {
  title: string;
  bio: string;
  coverImage: string;
  handle?: string;
  blocks: BioEditorBlock[];
}) {
  const themeClass = getBioPageThemeClass("light");
  const themeStyle = getBioPageThemeStyle("light");

  return (
    <div
      className="key-phone-preview key-phone-preview--samsung key-phone-preview--slim key-template-explore-phone"
      aria-label="Template mobile preview"
    >
      <div className="key-phone-preview__side-key key-phone-preview__side-key--volume-up" aria-hidden />
      <div className="key-phone-preview__side-key key-phone-preview__side-key--volume-down" aria-hidden />
      <div className="key-phone-preview__bezel">
        <div className="key-phone-preview__hole-punch" aria-hidden />
        <div className="key-phone-preview__display">
          <div className="key-phone-preview__chrome">
            <div className="key-phone-preview__status-bar">
              <span>9:41</span>
              <span className="key-phone-preview__status-icons">▮▮▮ 100%</span>
            </div>
            <div className="key-phone-preview__browser-bar">
              <span className="key-phone-preview__browser-home" aria-hidden>
                ⌂
              </span>
              <span className="key-phone-preview__browser-url">key.link/preview</span>
              <span className="key-phone-preview__browser-tabs" aria-hidden>
                1
              </span>
            </div>
          </div>

          <div
            className={`key-preview-isolate key-phone-preview__screen ${themeClass} no-scrollbar key-template-explore-phone__screen`}
            style={themeStyle}
          >
            <CoverPhotoView
              src={coverImage}
              alt={`${title} cover`}
              variant="preview"
              className="key-phone-preview__cover key-public-bio-page__cover"
            />
            <div className="key-phone-preview__body key-public-bio-page__body">
              <div className="key-public-bio-page__profile">
                <h1 className="key-public-bio-page__title font-display">{title}</h1>
                {handle ? <p className="key-public-bio-page__handle">{handle}</p> : null}
              </div>
              {bio ? <p className="key-phone-preview__bio-text">{bio}</p> : null}
              <div className="key-phone-preview__blocks space-y-3">
                {blocks.map((block) => (
                  <BlockRenderer
                    key={block.id}
                    block={block as BlockRecord}
                    mode="preview"
                    context={{ compact: true, displayTitle: title, displayHandle: handle }}
                  />
                ))}
                {blocks.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
                    This template starts blank — build it in the editor.
                  </p>
                )}
              </div>
              <div className="key-bio-page-footer key-phone-preview__footer">
                <span>Powered by KEYLINK360</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="key-phone-preview__side-key key-phone-preview__side-key--power" aria-hidden />
    </div>
  );
}

function ThumbnailImage({
  src,
  alt,
  className,
  overlayClassName
}: {
  src?: string;
  alt: string;
  className?: string;
  overlayClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-slate-300 ${overlayClassName ?? ""}`}>
        <ImageOff className="h-8 w-8" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

function TemplatePhonePreview({
  imageUrl,
  name,
  onPreview
}: {
  imageUrl?: string;
  name: string;
  onPreview: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPreview}
      aria-label={`Preview ${name}`}
      className="key-template-phone group w-full"
    >
      <div className="key-template-phone__frame">
        <div className="key-template-phone__notch" aria-hidden />
        <div className="key-template-phone__screen">
          <ThumbnailImage
            src={imageUrl}
            alt={name}
            overlayClassName="w-full h-full"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <div className="key-template-phone__overlay">
        <span className="text-white text-xs font-bold flex items-center gap-1.5 bg-black/45 px-3 py-1.5 rounded-full">
          <Eye className="h-3.5 w-3.5" />
          Preview
        </span>
      </div>
    </button>
  );
}

export default function TemplatesScreen({
  items,
  savedTemplates,
  onUseTemplate,
  onDeleteCustomTemplate
}: TemplatesScreenProps) {
  const [activeTab, setActiveTab] = useState<"SYSTEM" | "MY_TEMPLATES">("SYSTEM");
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory =
        activeCategory === "All Categories" || item.category === activeCategory;
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [items, activeCategory, searchQuery]);

  const filteredCustomTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return savedTemplates;
    return savedTemplates.filter(
      (tpl) =>
        tpl.name.toLowerCase().includes(query) ||
        (tpl.description || "").toLowerCase().includes(query)
    );
  }, [savedTemplates, searchQuery]);

  const previewState = useMemo(
    () => (previewTarget ? resolvePreviewState(previewTarget) : null),
    [previewTarget]
  );

  useEffect(() => {
    if (!previewTarget) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewTarget(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [previewTarget]);

  const handleUseFromPreview = () => {
    if (!previewTarget) return;
    if (previewTarget.kind === "custom") {
      onUseTemplate(previewTarget.item.name, true, previewTarget.item);
    } else {
      onUseTemplate(previewTarget.item.name);
    }
    setPreviewTarget(null);
  };

  const confirmDelete = (id: string, name: string) => {
    onDeleteCustomTemplate(id);
    setPendingDeleteId(null);
    triggerToast(`"${name}" was deleted from your templates.`);
  };

  const templateBeingDeleted = pendingDeleteId
    ? savedTemplates.find((tpl) => tpl.id === pendingDeleteId)
    : null;

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto w-full min-w-0 relative">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-gray-950 tracking-tight">
            Templates
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {SYSTEM_TEMPLATE_COUNT} system templates + Start from Scratch — preview, use, and edit any design.
          </p>
        </div>
        <div className="key-icon-field w-full lg:w-80 shrink-0">
          <span className="key-icon-field__icon">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search templates..."
            aria-label="Search templates"
            className="key-input key-icon-field__input w-full py-2"
          />
        </div>
      </div>

      <div className="border-b border-gray-100 flex gap-4 overflow-x-auto" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "SYSTEM"}
          onClick={() => setActiveTab("SYSTEM")}
          className={`pb-4 text-sm font-semibold tracking-wide transition-all border-b-2 px-1 relative shrink-0 ${
            activeTab === "SYSTEM"
              ? "border-[#4F46E5] text-[#4F46E5]"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          System Templates
          <span className="ml-1.5 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs">
            {SYSTEM_TEMPLATE_COUNT}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "MY_TEMPLATES"}
          onClick={() => setActiveTab("MY_TEMPLATES")}
          className={`pb-4 text-sm font-semibold tracking-wide transition-all border-b-2 px-1 relative shrink-0 ${
            activeTab === "MY_TEMPLATES"
              ? "border-[#4F46E5] text-[#4F46E5]"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          My Templates
          <span className="ml-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">
            {savedTemplates.length}
          </span>
        </button>
      </div>

      {activeTab === "SYSTEM" && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar animate-in fade-in duration-200">
          {TEMPLATE_CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all border whitespace-nowrap shrink-0 ${
                  isSelected
                    ? "bg-[#4F46E5] border-[#4F46E5] text-white shadow-sm"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {activeTab === "MY_TEMPLATES" ? (
        savedTemplates.length === 0 ? (
          <Workspace className="key-section-card text-center flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="h-14 w-14 bg-indigo-50 text-[#4F46E5] rounded-2xl flex items-center justify-center mb-6">
              <Layers className="h-6 w-6" />
            </div>
            <h4 className="font-display font-bold text-gray-900">No custom templates yet</h4>
            <p className="text-gray-500 text-sm max-w-xs mt-1">
              Design your custom page in the editor and click "Save as Template" to persist your layout here.
            </p>
          </Workspace>
        ) : filteredCustomTemplates.length === 0 ? (
          <Workspace className="key-section-card text-center flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="h-14 w-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-6">
              <Search className="h-6 w-6" />
            </div>
            <h4 className="font-display font-bold text-gray-900">No templates match "{searchQuery}"</h4>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-[#4F46E5] text-sm font-semibold mt-2 hover:underline"
            >
              Clear search
            </button>
          </Workspace>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 key-workspace-grid animate-in fade-in duration-300">
            {filteredCustomTemplates.map((tpl) => (
              <article
                key={tpl.id}
                className="key-template-card key-glass-card overflow-hidden flex flex-col min-w-0"
              >
                <div className="p-4 pb-0 relative">
                  <TemplatePhonePreview
                    imageUrl={tpl.previewImage}
                    name={tpl.name}
                    onPreview={() => setPreviewTarget({ kind: "custom", item: tpl })}
                  />
                  <button
                    type="button"
                    onClick={() => setPendingDeleteId(tpl.id)}
                    aria-label={`Delete ${tpl.name}`}
                    title="Delete Template"
                    className="absolute top-6 right-6 p-2 rounded-xl bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white transition-all border border-red-500/20 z-10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <Workspace stack className="flex-1 flex flex-col justify-between min-w-0 p-4 pt-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-display font-bold text-gray-950 text-base leading-tight truncate">
                        {tpl.name}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Custom</span>
                    </div>
                    <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                      {tpl.description ||
                        `Custom design with ${getBlockCount(tpl)} widgets. Updated ${formatStorageDate(tpl.updatedAt)}.`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-4 mt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setPreviewTarget({ kind: "custom", item: tpl })}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => onUseTemplate(tpl.name, true, tpl)}
                      className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA] text-white py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
                    >
                      Use Custom Template
                    </button>
                  </div>
                </Workspace>
              </article>
            ))}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 key-workspace-grid animate-in fade-in duration-300">
          <button
            type="button"
            onClick={() => onUseTemplate("Start from Scratch")}
            className="key-template-card key-template-card--scratch border-2 border-dashed border-gray-200 hover:border-[#4F46E5] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-lg transition-all duration-300 min-h-[420px] group w-full"
          >
            <div className="key-template-phone key-template-phone--scratch mb-5 pointer-events-none">
              <div className="key-template-phone__frame key-template-phone__frame--scratch">
                <div className="key-template-phone__screen flex items-center justify-center bg-slate-50">
                  <Plus className="h-8 w-8 text-slate-400 group-hover:text-[#4F46E5] transition-colors" />
                </div>
              </div>
            </div>
            <h4 className="font-display font-bold text-gray-950 text-base">Start from Scratch</h4>
            <p className="text-gray-400 text-xs mt-2 max-w-[220px] leading-relaxed">
              Begin with a blank page and build your own design in the editor.
            </p>
          </button>

          {filteredItems.map((item) => (
            <article key={item.id} className="key-template-card key-glass-card overflow-hidden flex flex-col min-w-0">
              <div className="p-4 pb-0 relative">
                {item.suggested && (
                  <span className="key-template-suggested absolute top-5 left-5 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide">
                    <Sparkles className="h-3 w-3" />
                    Suggested for you
                  </span>
                )}
                <TemplatePhonePreview
                  imageUrl={item.imageUrl}
                  name={item.name}
                  onPreview={() => setPreviewTarget({ kind: "system", item })}
                />
              </div>

              <Workspace stack className="flex-1 flex flex-col justify-between min-w-0 p-4 pt-3">
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-display font-bold text-gray-950 text-base leading-tight">
                      {item.name}
                    </h4>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase shrink-0">
                      {item.price || "Free"}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">
                    {item.category} · {item.widgets} widgets · Used {item.usedCount}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-4 mt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPreviewTarget({ kind: "system", item })}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => onUseTemplate(item.name)}
                    className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA] text-white py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
                  >
                    Use Template
                  </button>
                </div>
              </Workspace>
            </article>
          ))}

          {filteredItems.length === 0 && (
            <div className="sm:col-span-2 xl:col-span-3 2xl:col-span-3 key-glass-card border-dashed p-8 text-center flex flex-col items-center justify-center min-h-[320px]">
              <p className="text-gray-500 text-sm">
                {searchQuery
                  ? `No system templates match "${searchQuery}".`
                  : `No templates found in "${activeCategory}".`}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All Categories");
                }}
                className="text-[#4F46E5] text-sm font-semibold mt-2 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {previewTarget && previewState && (
        <div
          className="key-template-explore-overlay fixed inset-0 z-[80] flex items-stretch justify-center p-3 sm:p-5"
          onClick={(event) => {
            if (event.target === event.currentTarget) setPreviewTarget(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-template-title"
            className="key-template-explore-dialog flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-6">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">
                  Mobile template preview
                </p>
                <h3
                  id="preview-template-title"
                  className="mt-1 font-display text-xl font-black text-slate-900 sm:text-2xl"
                >
                  {previewTarget.item.name}
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                  {previewTarget.kind === "system"
                    ? previewTarget.item.description
                    : previewTarget.item.description ||
                      `Custom design with ${getBlockCount(previewTarget.item)} widgets.`}
                </p>
                <p className="mt-2 text-[11px] font-semibold text-slate-400">
                  Scroll inside the phone to explore the full layout before editing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTarget(null)}
                aria-label="Close preview"
                className="shrink-0 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="key-template-explore-stage min-h-0 flex-1 overflow-y-auto">
              <div className="flex min-h-full items-start justify-center px-3 py-5 sm:px-6 sm:py-7">
                <TemplateExplorePhone
                  title={previewState.pageMeta.title}
                  bio={previewState.pageMeta.shortBio}
                  coverImage={previewState.pageMeta.coverImage}
                  handle={previewState.pageMeta.handle}
                  blocks={previewState.blocks}
                />
              </div>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <button
                type="button"
                onClick={() => setPreviewTarget(null)}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleUseFromPreview}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#4338CA] active:scale-[0.98]"
              >
                Use This Template
                <span className="text-[11px] font-semibold opacity-80">→ Edit page</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {templateBeingDeleted && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            className="bg-white rounded-3xl max-w-sm w-full p-4 shadow-2xl border border-slate-100"
          >
            <h3 id="confirm-delete-title" className="font-display font-black text-lg text-slate-900 mb-2">
              Delete this template?
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              <span className="font-semibold text-slate-700">"{templateBeingDeleted.name}"</span> will be
              permanently removed from your templates. This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDelete(templateBeingDeleted.id, templateBeingDeleted.name)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow-sm"
              >
                Delete Template
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white border border-slate-800 text-xs font-black py-3 px-5 rounded-2xl shadow-2xl z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
