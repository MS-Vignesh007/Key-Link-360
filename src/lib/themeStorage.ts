export type AppTheme = "dark" | "light";

const THEME_STORAGE_KEY = "keylink360_ui_theme";

export function getStoredTheme(): AppTheme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem("keyslink_ui_theme");
    return saved === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function saveTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore storage failures
  }
}
