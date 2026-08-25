import React from "react";
import type { BioPagePreviewTheme } from "../../types";
import { BIO_PAGE_THEME_PRESETS } from "../../lib/bioPageThemes";

interface BioPageThemePickerProps {
  value: BioPagePreviewTheme;
  onChange: (theme: BioPagePreviewTheme) => void;
  compact?: boolean;
}

export default function BioPageThemePicker({ value, onChange, compact = false }: BioPageThemePickerProps) {
  return (
    <div
      className={`key-bio-theme-picker ${compact ? "key-bio-theme-picker--compact" : ""}`}
      role="listbox"
      aria-label="Page theme presets"
    >
      {BIO_PAGE_THEME_PRESETS.map((preset) => {
        const selected = value === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            role="option"
            aria-selected={selected}
            title={preset.description}
            onClick={() => onChange(preset.id)}
            className={`key-bio-theme-picker__item ${selected ? "key-bio-theme-picker__item--active" : ""}`}
          >
            <span
              className="key-bio-theme-picker__swatch"
              style={{ background: preset.swatch }}
              aria-hidden
            />
            <span className="key-bio-theme-picker__label">{preset.label}</span>
          </button>
        );
      })}
    </div>
  );
}
