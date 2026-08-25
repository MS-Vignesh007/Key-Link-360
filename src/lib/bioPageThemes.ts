import type { BioPagePreviewTheme } from "../types";
import type { CSSProperties } from "react";

export interface BioPageThemePreset {
  id: BioPagePreviewTheme;
  label: string;
  swatch: string;
  description: string;
}

export const BIO_PAGE_THEME_PRESETS: BioPageThemePreset[] = [
  { id: "dark", label: "Dark", swatch: "#161b27", description: "Classic dark bio page" },
  { id: "light", label: "Light", swatch: "#ffffff", description: "Clean white layout" },
  { id: "midnight", label: "Midnight", swatch: "#0f172a", description: "Deep navy night" },
  { id: "ocean", label: "Ocean", swatch: "#0c4a6e", description: "Cool teal waters" },
  { id: "rose", label: "Rose", swatch: "#881337", description: "Soft pink accent" },
  { id: "forest", label: "Forest", swatch: "#14532d", description: "Natural green tones" },
  { id: "sunset", label: "Sunset", swatch: "#9a3412", description: "Warm amber glow" },
  { id: "lavender", label: "Lavender", swatch: "#5b21b6", description: "Purple creative vibe" },
  { id: "slate", label: "Slate", swatch: "#334155", description: "Neutral professional" },
  { id: "gold", label: "Gold", swatch: "#92400e", description: "Premium warm gold" },
  { id: "coral", label: "Coral", swatch: "#be123c", description: "Bold coral energy" },
  { id: "arctic", label: "Arctic", swatch: "#e0f2fe", description: "Icy light blue" }
];

const THEME_TOKEN_MAP: Record<
  BioPagePreviewTheme,
  {
    screenBg: string;
    screenText: string;
    title: string;
    handle: string;
    bioBg: string;
    bioText: string;
    bioBorder: string;
    heading: string;
    bodyText: string;
    bodyBg: string;
    bodyBorder: string;
    footer: string;
    coverFade: string;
  }
> = {
  dark: {
    screenBg: "#161b27",
    screenText: "#f1f5f9",
    title: "#f8fafc",
    handle: "#818cf8",
    bioBg: "rgba(30, 41, 59, 0.55)",
    bioText: "#94a3b8",
    bioBorder: "rgba(148, 163, 184, 0.2)",
    heading: "#f8fafc",
    bodyText: "#cbd5e1",
    bodyBg: "rgba(30, 41, 59, 0.45)",
    bodyBorder: "rgba(148, 163, 184, 0.18)",
    footer: "#64748b",
    coverFade: "linear-gradient(to top, #161b27 0%, rgba(22, 27, 39, 0.92) 22%, rgba(22, 27, 39, 0.45) 50%, transparent 100%)"
  },
  light: {
    screenBg: "#f1f5f9",
    screenText: "#0f172a",
    title: "#0f172a",
    handle: "#4f46e5",
    bioBg: "#ffffff",
    bioText: "#64748b",
    bioBorder: "#cbd5e1",
    heading: "#0f172a",
    bodyText: "#475569",
    bodyBg: "#ffffff",
    bodyBorder: "#e2e8f0",
    footer: "#94a3b8",
    coverFade:
      "linear-gradient(to top, #f1f5f9 0%, rgba(241, 245, 249, 0.92) 20%, rgba(241, 245, 249, 0.45) 48%, transparent 100%)"
  },
  midnight: {
    screenBg: "#0f172a",
    screenText: "#e2e8f0",
    title: "#f8fafc",
    handle: "#60a5fa",
    bioBg: "rgba(15, 23, 42, 0.75)",
    bioText: "#94a3b8",
    bioBorder: "rgba(96, 165, 250, 0.2)",
    heading: "#f1f5f9",
    bodyText: "#cbd5e1",
    bodyBg: "rgba(30, 41, 59, 0.55)",
    bodyBorder: "rgba(96, 165, 250, 0.15)",
    footer: "#64748b",
    coverFade: "linear-gradient(to top, #0f172a 0%, rgba(15, 23, 42, 0.9) 24%, rgba(15, 23, 42, 0.4) 52%, transparent 100%)"
  },
  ocean: {
    screenBg: "#082f49",
    screenText: "#e0f2fe",
    title: "#f0f9ff",
    handle: "#22d3ee",
    bioBg: "rgba(8, 47, 73, 0.7)",
    bioText: "#7dd3fc",
    bioBorder: "rgba(34, 211, 238, 0.22)",
    heading: "#f0f9ff",
    bodyText: "#bae6fd",
    bodyBg: "rgba(12, 74, 110, 0.55)",
    bodyBorder: "rgba(34, 211, 238, 0.18)",
    footer: "#67e8f9",
    coverFade: "linear-gradient(to top, #082f49 0%, rgba(8, 47, 73, 0.92) 24%, rgba(8, 47, 73, 0.42) 52%, transparent 100%)"
  },
  rose: {
    screenBg: "#4c0519",
    screenText: "#ffe4e6",
    title: "#fff1f2",
    handle: "#fb7185",
    bioBg: "rgba(76, 5, 25, 0.72)",
    bioText: "#fda4af",
    bioBorder: "rgba(251, 113, 133, 0.22)",
    heading: "#fff1f2",
    bodyText: "#fecdd3",
    bodyBg: "rgba(136, 19, 55, 0.45)",
    bodyBorder: "rgba(251, 113, 133, 0.18)",
    footer: "#fb7185",
    coverFade: "linear-gradient(to top, #4c0519 0%, rgba(76, 5, 25, 0.92) 24%, rgba(76, 5, 25, 0.42) 52%, transparent 100%)"
  },
  forest: {
    screenBg: "#052e16",
    screenText: "#dcfce7",
    title: "#f0fdf4",
    handle: "#4ade80",
    bioBg: "rgba(5, 46, 22, 0.72)",
    bioText: "#86efac",
    bioBorder: "rgba(74, 222, 128, 0.2)",
    heading: "#f0fdf4",
    bodyText: "#bbf7d0",
    bodyBg: "rgba(20, 83, 45, 0.45)",
    bodyBorder: "rgba(74, 222, 128, 0.16)",
    footer: "#4ade80",
    coverFade: "linear-gradient(to top, #052e16 0%, rgba(5, 46, 22, 0.92) 24%, rgba(5, 46, 22, 0.42) 52%, transparent 100%)"
  },
  sunset: {
    screenBg: "#431407",
    screenText: "#ffedd5",
    title: "#fff7ed",
    handle: "#fb923c",
    bioBg: "rgba(67, 20, 7, 0.72)",
    bioText: "#fdba74",
    bioBorder: "rgba(251, 146, 60, 0.22)",
    heading: "#fff7ed",
    bodyText: "#fed7aa",
    bodyBg: "rgba(154, 52, 18, 0.45)",
    bodyBorder: "rgba(251, 146, 60, 0.18)",
    footer: "#fb923c",
    coverFade: "linear-gradient(to top, #431407 0%, rgba(67, 20, 7, 0.92) 24%, rgba(67, 20, 7, 0.42) 52%, transparent 100%)"
  },
  lavender: {
    screenBg: "#2e1065",
    screenText: "#ede9fe",
    title: "#f5f3ff",
    handle: "#c4b5fd",
    bioBg: "rgba(46, 16, 101, 0.72)",
    bioText: "#c4b5fd",
    bioBorder: "rgba(167, 139, 250, 0.22)",
    heading: "#f5f3ff",
    bodyText: "#ddd6fe",
    bodyBg: "rgba(91, 33, 182, 0.45)",
    bodyBorder: "rgba(167, 139, 250, 0.18)",
    footer: "#a78bfa",
    coverFade: "linear-gradient(to top, #2e1065 0%, rgba(46, 16, 101, 0.92) 24%, rgba(46, 16, 101, 0.42) 52%, transparent 100%)"
  },
  slate: {
    screenBg: "#1e293b",
    screenText: "#e2e8f0",
    title: "#f8fafc",
    handle: "#94a3b8",
    bioBg: "rgba(30, 41, 59, 0.72)",
    bioText: "#94a3b8",
    bioBorder: "rgba(148, 163, 184, 0.22)",
    heading: "#f1f5f9",
    bodyText: "#cbd5e1",
    bodyBg: "rgba(51, 65, 85, 0.45)",
    bodyBorder: "rgba(148, 163, 184, 0.18)",
    footer: "#64748b",
    coverFade: "linear-gradient(to top, #1e293b 0%, rgba(30, 41, 59, 0.92) 24%, rgba(30, 41, 59, 0.42) 52%, transparent 100%)"
  },
  gold: {
    screenBg: "#451a03",
    screenText: "#fef3c7",
    title: "#fffbeb",
    handle: "#fbbf24",
    bioBg: "rgba(69, 26, 3, 0.72)",
    bioText: "#fcd34d",
    bioBorder: "rgba(251, 191, 36, 0.22)",
    heading: "#fffbeb",
    bodyText: "#fde68a",
    bodyBg: "rgba(146, 64, 14, 0.45)",
    bodyBorder: "rgba(251, 191, 36, 0.18)",
    footer: "#fbbf24",
    coverFade: "linear-gradient(to top, #451a03 0%, rgba(69, 26, 3, 0.92) 24%, rgba(69, 26, 3, 0.42) 52%, transparent 100%)"
  },
  coral: {
    screenBg: "#4a0418",
    screenText: "#ffe4e6",
    title: "#fff1f2",
    handle: "#fb7185",
    bioBg: "rgba(74, 4, 24, 0.72)",
    bioText: "#fda4af",
    bioBorder: "rgba(244, 63, 94, 0.22)",
    heading: "#fff1f2",
    bodyText: "#fecdd3",
    bodyBg: "rgba(190, 18, 60, 0.45)",
    bodyBorder: "rgba(244, 63, 94, 0.18)",
    footer: "#fb7185",
    coverFade: "linear-gradient(to top, #4a0418 0%, rgba(74, 4, 24, 0.92) 24%, rgba(74, 4, 24, 0.42) 52%, transparent 100%)"
  },
  arctic: {
    screenBg: "#f0f9ff",
    screenText: "#0c4a6e",
    title: "#082f49",
    handle: "#0284c7",
    bioBg: "#e0f2fe",
    bioText: "#0369a1",
    bioBorder: "#bae6fd",
    heading: "#0c4a6e",
    bodyText: "#075985",
    bodyBg: "#e0f2fe",
    bodyBorder: "#bae6fd",
    footer: "#0284c7",
    coverFade: "linear-gradient(to top, #f0f9ff 0%, rgba(240, 249, 255, 0.92) 22%, rgba(240, 249, 255, 0.45) 50%, transparent 100%)"
  }
};

const VALID_THEME_IDS = new Set<string>(BIO_PAGE_THEME_PRESETS.map((preset) => preset.id));

export function normalizePageTheme(value: unknown): BioPagePreviewTheme {
  if (typeof value === "string" && VALID_THEME_IDS.has(value)) {
    return value as BioPagePreviewTheme;
  }
  return "dark";
}

export function getBioPageThemeStyle(theme: BioPagePreviewTheme): CSSProperties {
  const tokens = THEME_TOKEN_MAP[theme] || THEME_TOKEN_MAP.dark;
  return {
    "--key-bio-screen-bg": tokens.screenBg,
    "--key-bio-screen-text": tokens.screenText,
    "--key-bio-title": tokens.title,
    "--key-bio-handle": tokens.handle,
    "--key-bio-bio-bg": tokens.bioBg,
    "--key-bio-bio-text": tokens.bioText,
    "--key-bio-bio-border": tokens.bioBorder,
    "--key-bio-heading": tokens.heading,
    "--key-bio-body-text": tokens.bodyText,
    "--key-bio-body-bg": tokens.bodyBg,
    "--key-bio-body-border": tokens.bodyBorder,
    "--key-bio-footer": tokens.footer,
    "--key-bio-cover-fade": tokens.coverFade
  } as CSSProperties;
}

export function getBioPageThemeClass(theme: BioPagePreviewTheme): string {
  return `key-bio-page-theme-${theme}`;
}
