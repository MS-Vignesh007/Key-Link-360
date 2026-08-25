import type { CSSProperties } from "react";
import type { BioCoverPhotoSettings, CoverBandHeight, CoverFitMode, CoverFocusPoint } from "../types";

export type { BioCoverPhotoSettings, CoverBandHeight, CoverFitMode, CoverFocusPoint };

export const DEFAULT_COVER_SETTINGS: BioCoverPhotoSettings = {
  fit: "cover",
  focus: "center",
  zoom: 100,
  height: "md",
  widthPercent: 100,
  imageWidthPercent: 100,
  imageHeightPercent: 100,
  padding: 0,
  marginX: 0,
  marginY: 0
};

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const raw = typeof value === "number" ? value : fallback;
  return Math.min(max, Math.max(min, Math.round(raw)));
}

export function normalizeCoverSettings(
  partial?: Partial<BioCoverPhotoSettings> | null
): BioCoverPhotoSettings {
  if (!partial) return { ...DEFAULT_COVER_SETTINGS };

  const fit: CoverFitMode =
    partial.fit === "contain" || partial.fit === "fill" ? partial.fit : "cover";

  const focus: CoverFocusPoint =
    partial.focus === "top" ||
    partial.focus === "bottom" ||
    partial.focus === "left" ||
    partial.focus === "right"
      ? partial.focus
      : "center";

  const height: CoverBandHeight =
    partial.height === "sm" || partial.height === "lg" ? partial.height : "md";

  const normalized: BioCoverPhotoSettings = {
    fit,
    focus,
    height,
    zoom: clampNumber(partial.zoom, 50, 250, DEFAULT_COVER_SETTINGS.zoom),
    widthPercent: clampNumber(partial.widthPercent, 60, 100, DEFAULT_COVER_SETTINGS.widthPercent),
    imageWidthPercent: clampNumber(
      partial.imageWidthPercent,
      50,
      150,
      DEFAULT_COVER_SETTINGS.imageWidthPercent
    ),
    imageHeightPercent: clampNumber(
      partial.imageHeightPercent,
      50,
      150,
      DEFAULT_COVER_SETTINGS.imageHeightPercent
    ),
    padding: clampNumber(partial.padding, 0, 40, DEFAULT_COVER_SETTINGS.padding),
    marginX: clampNumber(partial.marginX, 0, 32, DEFAULT_COVER_SETTINGS.marginX),
    marginY: clampNumber(partial.marginY, 0, 24, DEFAULT_COVER_SETTINGS.marginY)
  };

  if (typeof partial.customHeight === "number" && partial.customHeight > 0) {
    normalized.customHeight = clampNumber(partial.customHeight, 96, 320, 192);
  }

  return normalized;
}

export function getCoverObjectPosition(focus: CoverFocusPoint): string {
  switch (focus) {
    case "top":
      return "center top";
    case "bottom":
      return "center bottom";
    case "left":
      return "left center";
    case "right":
      return "right center";
    default:
      return "center center";
  }
}

export function getCoverTransformOrigin(focus: CoverFocusPoint): string {
  return getCoverObjectPosition(focus);
}

export function getCoverHeightClass(
  height: CoverBandHeight,
  variant: "editor" | "preview"
): string {
  return `key-cover-photo--${variant}-${height}`;
}

export function getCoverBandHeightPx(
  settings: BioCoverPhotoSettings,
  variant: "editor" | "preview"
): number | undefined {
  if (settings.customHeight) return settings.customHeight;

  const presetHeights: Record<CoverBandHeight, { editor: number; preview: number }> = {
    sm: { editor: 128, preview: 144 },
    md: { editor: 160, preview: 192 },
    lg: { editor: 224, preview: 240 }
  };

  return presetHeights[settings.height][variant];
}

export function getCoverContainerStyle(settings: BioCoverPhotoSettings): CSSProperties {
  const normalized = normalizeCoverSettings(settings);
  const style: CSSProperties = {};

  if (normalized.marginY > 0) {
    style.marginTop = `${normalized.marginY}px`;
    style.marginBottom = `${normalized.marginY}px`;
  }

  if (normalized.widthPercent < 100) {
    style.width = `${normalized.widthPercent}%`;
    style.marginLeft = "auto";
    style.marginRight = "auto";
  }

  if (normalized.marginX > 0) {
    style.marginLeft = normalized.widthPercent < 100 ? "auto" : `${normalized.marginX}px`;
    style.marginRight = normalized.widthPercent < 100 ? "auto" : `${normalized.marginX}px`;
    if (normalized.widthPercent < 100) {
      style.maxWidth = `calc(${normalized.widthPercent}% - ${normalized.marginX * 2}px)`;
    }
  }

  return style;
}

export function getCoverInnerStyle(settings: BioCoverPhotoSettings): CSSProperties {
  const normalized = normalizeCoverSettings(settings);
  if (normalized.padding <= 0) return {};

  return {
    padding: `${normalized.padding}px`,
    boxSizing: "border-box"
  };
}

export function getCoverImageStyle(settings: BioCoverPhotoSettings): CSSProperties {
  const normalized = normalizeCoverSettings(settings);
  const style: CSSProperties = {
    objectFit: normalized.fit,
    objectPosition: getCoverObjectPosition(normalized.focus),
    width: `${normalized.imageWidthPercent}%`,
    height: `${normalized.imageHeightPercent}%`,
    maxWidth: "none",
    flexShrink: 0
  };

  if (normalized.zoom !== 100) {
    style.transform = `scale(${normalized.zoom / 100})`;
    style.transformOrigin = getCoverTransformOrigin(normalized.focus);
  }

  return style;
}
