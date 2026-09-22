import React from "react";
import type { BioPagePreviewTheme } from "../../types";
import { BIO_PAGE_THEME_PRESETS } from "../../lib/bioPageThemes";

interface BioPageThemePickerProps {
  value: BioPagePreviewTheme;
  onChange: (theme: BioPagePreviewTheme) => void;
  compact?: boolean;
}

export default function BioPageThemePicker({ value, onChange, compact = false }: BioPageThemePickerProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1" role="listbox" aria-label="Page theme presets">
        {BIO_PAGE_THEME_PRESETS.map((preset) => {
          const selected = value === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              role="option"
              aria-selected={selected}
              title={`${preset.label}: ${preset.description}`}
              onClick={() => onChange(preset.id)}
              className={`relative h-5 w-5 rounded-full shrink-0 transition-all duration-150 cursor-pointer ${
                selected
                  ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 scale-110 shadow-md"
                  : "opacity-75 hover:opacity-100 hover:scale-110"
              }`}
              style={{ background: preset.swatch }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 gap-2"
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
            className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all duration-200 cursor-pointer border ${
              selected
                ? "bg-indigo-600/25 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/50 scale-[1.02]"
                : "bg-slate-900/80 hover:bg-slate-800/90 border-slate-700/60 text-slate-300 hover:text-white"
            }`}
          >
            <span
              className="h-4 w-4 rounded-full border border-white/20 shrink-0 shadow-inner"
              style={{ background: preset.swatch }}
              aria-hidden
            />
            <span className="text-xs font-semibold truncate">{preset.label}</span>
          </button>
        );
      })}
    </div>
  );
}
