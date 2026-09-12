export type AppTheme = "light" | "dark" | "eyevision" | "cyberpunk" | "luxury" | "synthwave" | "matrix";

const THEME_STORAGE_KEY = "keylink360_ui_theme";

export const ALL_THEMES: {
  id: AppTheme;
  name: string;
  category: string;
  tag?: string;
  description: string;
  accentColor: string;
  previewBg: string;
  badgeBg: string;
  borderGlow: string;
}[] = [
  {
    id: "light",
    name: "Clean Light",
    category: "Primary Light",
    tag: "Default",
    description: "Crisp, airy white surface with subtle slate borders, high contrast and calm visual rhythm",
    accentColor: "#4f46e5",
    previewBg: "linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)",
    badgeBg: "rgba(79, 70, 229, 0.12)",
    borderGlow: "rgba(79, 70, 229, 0.2)",
  },
  {
    id: "dark",
    name: "Executive Dark",
    category: "Primary Dark",
    tag: "Pro",
    description: "Deep obsidian canvas with subtle layered surfaces, refined indigo accents and ambient depth",
    accentColor: "#6366f1",
    previewBg: "linear-gradient(135deg, #090d16 0%, #0e1526 100%)",
    badgeBg: "rgba(99, 102, 241, 0.15)",
    borderGlow: "rgba(99, 102, 241, 0.25)",
  },
  {
    id: "eyevision",
    name: "Eye Vision",
    category: "Eye Comfort",
    tag: "Low Strain",
    description: "Soft warm charcoal & ivory tones designed to eliminate eye fatigue during long sessions",
    accentColor: "#f59e0b",
    previewBg: "linear-gradient(135deg, #181512 0%, #23201d 100%)",
    badgeBg: "rgba(245, 158, 11, 0.15)",
    borderGlow: "rgba(245, 158, 11, 0.25)",
  },
  {
    id: "luxury",
    name: "Executive Onyx",
    category: "Prestige",
    tag: "Warm",
    description: "Charcoal black foundation with subtle warm amber accents and refined borders",
    accentColor: "#d97706",
    previewBg: "linear-gradient(135deg, #09090b 0%, #18181b 100%)",
    badgeBg: "rgba(217, 119, 6, 0.15)",
    borderGlow: "rgba(217, 119, 6, 0.25)",
  },
  {
    id: "cyberpunk",
    name: "Stripe Slate",
    category: "Modern Blue",
    tag: "Calm",
    description: "Serene slate canvas with oceanic blue accents and clean glassy cards",
    accentColor: "#0284c7",
    previewBg: "linear-gradient(135deg, #070d18 0%, #0c182a 100%)",
    badgeBg: "rgba(2, 132, 199, 0.15)",
    borderGlow: "rgba(2, 132, 199, 0.25)",
  },
  {
    id: "synthwave",
    name: "Aurora Indigo",
    category: "Editorial",
    tag: "Vibrant",
    description: "Rich dark violet aesthetic with refined berry accents and subtle ambient depth",
    accentColor: "#a855f7",
    previewBg: "linear-gradient(135deg, #0d0a1a 0%, #17112c 100%)",
    badgeBg: "rgba(168, 85, 247, 0.15)",
    borderGlow: "rgba(168, 85, 247, 0.25)",
  },
  {
    id: "matrix",
    name: "Emerald Modern",
    category: "Fintech",
    tag: "Focused",
    description: "Deep spruce dark mode with subtle emerald green highlights and precise hierarchy",
    accentColor: "#10b981",
    previewBg: "linear-gradient(135deg, #040e0b 0%, #091a14 100%)",
    badgeBg: "rgba(16, 185, 129, 0.15)",
    borderGlow: "rgba(16, 185, 129, 0.25)",
  },
];

export function getStoredTheme(): AppTheme {
  try {
    const saved = (localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem("keyslink_ui_theme")) as AppTheme;
    if (saved && ["light", "dark", "eyevision", "cyberpunk", "luxury", "synthwave", "matrix"].includes(saved)) {
      return saved;
    }
    return "light";
  } catch {
    return "light";
  }
}

export function saveTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore storage failures
  }
}

