import React, { useEffect, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { BioCoverPhotoSettings, CoverBandHeight, CoverFitMode, CoverFocusPoint } from "../../types";
import { DEFAULT_COVER_SETTINGS, normalizeCoverSettings } from "../../lib/bioCoverPhoto";

interface CoverPhotoControlsProps {
  settings: BioCoverPhotoSettings;
  onChange: (next: BioCoverPhotoSettings) => void;
}

const FIT_OPTIONS: { value: CoverFitMode; label: string; hint: string }[] = [
  { value: "cover", label: "Cover", hint: "Fill the band, crop edges" },
  { value: "contain", label: "Fit", hint: "Show full image" },
  { value: "fill", label: "Stretch", hint: "Fill exactly" }
];

const FOCUS_OPTIONS: { value: CoverFocusPoint; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
  { value: "bottom", label: "Bottom" }
];

const HEIGHT_OPTIONS: { value: CoverBandHeight; label: string }[] = [
  { value: "sm", label: "S" },
  { value: "md", label: "M" },
  { value: "lg", label: "L" }
];

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
  ariaLabel
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
  ariaLabel: string;
}) {
  return (
    <div className="key-cover-photo-controls__section">
      <div className="key-cover-photo-controls__label-row">
        <span className="key-cover-photo-controls__label">{label}</span>
        <span className="key-cover-photo-controls__value">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="key-cover-photo-controls__range"
        aria-label={ariaLabel}
      />
    </div>
  );
}

export default function CoverPhotoControls({ settings, onChange }: CoverPhotoControlsProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const normalized = normalizeCoverSettings(settings);
  const customHeightEnabled = typeof normalized.customHeight === "number";

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const patch = (partial: Partial<BioCoverPhotoSettings>) => {
    onChange(normalizeCoverSettings({ ...normalized, ...partial }));
  };

  const reset = () => onChange({ ...DEFAULT_COVER_SETTINGS });

  return (
    <div ref={rootRef} className="key-cover-photo-controls relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`key-cover-photo-controls__trigger key-cover-url-edit-btn ${
          open ? "key-cover-photo-controls__trigger--active" : ""
        }`}
        aria-label="Adjust cover image size and fit"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
        <span className="key-cover-url-edit-btn__tooltip">Cover size &amp; fit</span>
      </button>

      {open && (
        <div className="key-cover-photo-controls__panel" role="dialog" aria-label="Cover image controls">
          <div className="key-cover-photo-controls__head">
            <span className="key-cover-photo-controls__title">Cover display</span>
            <button type="button" className="key-cover-photo-controls__reset" onClick={reset}>
              Reset
            </button>
          </div>

          <div className="key-cover-photo-controls__section">
            <span className="key-cover-photo-controls__label">Fit mode</span>
            <div className="key-cover-photo-controls__segmented">
              {FIT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  title={option.hint}
                  className={`key-cover-photo-controls__segment ${
                    normalized.fit === option.value ? "key-cover-photo-controls__segment--active" : ""
                  }`}
                  onClick={() => patch({ fit: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="key-cover-photo-controls__section">
            <span className="key-cover-photo-controls__label">Focus</span>
            <div className="key-cover-photo-controls__focus-grid">
              {FOCUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`key-cover-photo-controls__focus-btn ${
                    normalized.focus === option.value ? "key-cover-photo-controls__focus-btn--active" : ""
                  }`}
                  onClick={() => patch({ focus: option.value })}
                  aria-label={`Focus ${option.label.toLowerCase()}`}
                >
                  {option.label.charAt(0)}
                </button>
              ))}
            </div>
          </div>

          <RangeControl
            label="Scale"
            value={normalized.zoom}
            min={50}
            max={250}
            step={5}
            suffix="%"
            onChange={(zoom) => patch({ zoom })}
            ariaLabel="Cover scale"
          />

          <RangeControl
            label="Band width"
            value={normalized.widthPercent}
            min={60}
            max={100}
            step={1}
            suffix="%"
            onChange={(widthPercent) => patch({ widthPercent })}
            ariaLabel="Cover band width"
          />

          <div className="key-cover-photo-controls__section">
            <span className="key-cover-photo-controls__label">Band height preset</span>
            <div className="key-cover-photo-controls__segmented">
              {HEIGHT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`key-cover-photo-controls__segment ${
                    !customHeightEnabled && normalized.height === option.value
                      ? "key-cover-photo-controls__segment--active"
                      : ""
                  }`}
                  onClick={() => {
                    const { customHeight: _removed, ...rest } = normalized;
                    onChange(normalizeCoverSettings({ ...rest, height: option.value }));
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <RangeControl
            label="Band height (px)"
            value={normalized.customHeight ?? 192}
            min={96}
            max={320}
            step={4}
            suffix="px"
            onChange={(customHeight) => patch({ customHeight })}
            ariaLabel="Cover band height in pixels"
          />

          <RangeControl
            label="Image width"
            value={normalized.imageWidthPercent}
            min={50}
            max={150}
            step={1}
            suffix="%"
            onChange={(imageWidthPercent) => patch({ imageWidthPercent })}
            ariaLabel="Cover image width"
          />

          <RangeControl
            label="Image height"
            value={normalized.imageHeightPercent}
            min={50}
            max={150}
            step={1}
            suffix="%"
            onChange={(imageHeightPercent) => patch({ imageHeightPercent })}
            ariaLabel="Cover image height"
          />

          <RangeControl
            label="Padding"
            value={normalized.padding}
            min={0}
            max={40}
            step={1}
            suffix="px"
            onChange={(padding) => patch({ padding })}
            ariaLabel="Cover image padding"
          />

          <RangeControl
            label="Margin X"
            value={normalized.marginX}
            min={0}
            max={32}
            step={1}
            suffix="px"
            onChange={(marginX) => patch({ marginX })}
            ariaLabel="Cover horizontal margin"
          />

          <RangeControl
            label="Margin Y"
            value={normalized.marginY}
            min={0}
            max={24}
            step={1}
            suffix="px"
            onChange={(marginY) => patch({ marginY })}
            ariaLabel="Cover vertical margin"
          />
        </div>
      )}
    </div>
  );
}
