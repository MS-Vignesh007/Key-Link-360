import { useEffect, useMemo, useState } from "react";
import type { BioPage } from "../../types";
import { checkPlatformSlugAvailability, createPlatformSubdomain } from "../../lib/platformSubdomainApi";
import {
  buildPlatformSubdomainHostname,
  normalizePlatformSlug,
  platformSubdomainBase,
  validatePlatformSlug
} from "../../lib/platformSubdomain";
import { Loader2, Sparkles, X } from "lucide-react";

interface PlatformSubdomainClaimModalProps {
  open: boolean;
  page: BioPage | null;
  onClose: () => void;
  onClaimed: () => void;
}

export default function PlatformSubdomainClaimModal({
  open,
  page,
  onClose,
  onClaimed
}: PlatformSubdomainClaimModalProps) {
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !page) return;
    const suggested = normalizePlatformSlug(page.slug || page.title || "mysite");
    setSlug(suggested.length >= 3 ? suggested : "");
    setError("");
    setAvailable(null);
    setChecking(false);
    setSubmitting(false);
  }, [open, page]);

  const hostnamePreview = useMemo(() => {
    const normalized = normalizePlatformSlug(slug);
    if (!normalized || normalized.length < 3) return `yourname.${platformSubdomainBase()}`;
    return buildPlatformSubdomainHostname(normalized);
  }, [slug]);

  useEffect(() => {
    if (!open) return;
    const normalized = normalizePlatformSlug(slug);
    const validationError = validatePlatformSlug(normalized);
    if (validationError || !normalized) {
      setAvailable(null);
      return;
    }

    let cancelled = false;
    setChecking(true);
    const timer = window.setTimeout(() => {
      void checkPlatformSlugAvailability(normalized)
        .then((result) => {
          if (cancelled) return;
          setAvailable(result.available);
          if (!result.available) setError(result.reason || "That name is taken.");
          else setError("");
        })
        .catch(() => {
          if (cancelled) return;
          setAvailable(null);
        })
        .finally(() => {
          if (!cancelled) setChecking(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, slug]);

  const submit = async () => {
    if (!page) return;
    const normalized = normalizePlatformSlug(slug);
    const validationError = validatePlatformSlug(normalized);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (available === false) {
      setError("That name is already taken.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await createPlatformSubdomain(normalized, page.id);
      onClaimed();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not claim this address.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !page) return null;

  return (
    <div className="key-modal-backdrop key-workflow-modal-backdrop">
      <div className="key-domain-remove-dialog animate-in fade-in zoom-in-95 duration-200 max-w-md w-full" role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">Free KEY address</p>
            <h3 className="mt-1 text-lg font-bold text-slate-950">Claim a clean URL</h3>
            <p className="mt-2 text-sm text-slate-600">
              Replace the long <code>?previewPageId=</code> link with a short address like{" "}
              <strong>yourname.{platformSubdomainBase()}</strong> for <strong>{page.title}</strong>.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mt-5 block text-xs font-semibold text-slate-700" htmlFor="platform-slug">
          Choose your name
        </label>
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <input
            id="platform-slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder="keysfashion"
            autoFocus
          />
          <span className="shrink-0 text-xs text-slate-500">.{platformSubdomainBase()}</span>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Live preview: <span className="font-mono text-indigo-700">{hostnamePreview}</span>
          {checking && <Loader2 className="ml-1 inline h-3 w-3 animate-spin" />}
          {!checking && available === true && <span className="ml-2 text-emerald-600">Available</span>}
        </p>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="key-domain-remove-dialog__cancel flex-1">
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting || checking || available === false || !slug.trim()}
            onClick={() => void submit()}
            className="key-domain-wizard__primary flex-1 inline-flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Claim address
          </button>
        </div>
      </div>
    </div>
  );
}
