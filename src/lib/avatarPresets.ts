const MEMOJI_API = "https://tapback.co/api/avatar";

/** Curated 3D memoji seeds — each maps to a unique round avatar. */
export const KEYS_MEMOJI_SEEDS = [
  "arjun",
  "maya",
  "jordan",
  "sam",
  "riley",
  "leo",
  "zara",
  "kai",
  "nova",
  "blake",
  "sage",
  "drew"
] as const;

export function buildMemojiAvatarUrl(seed: string): string {
  const normalized = seed.trim().toLowerCase().replace(/\s+/g, "-") || "key";
  return `${MEMOJI_API}/${encodeURIComponent(normalized)}.webp`;
}

export const KEYS_AVATAR_PRESETS = KEYS_MEMOJI_SEEDS.map(buildMemojiAvatarUrl);

export const DEFAULT_KEYS_AVATAR_URL = KEYS_AVATAR_PRESETS[0];

export function defaultAvatarUrlForEmail(email: string): string {
  const local = email.split("@")[0]?.trim() || "key";
  return buildMemojiAvatarUrl(local);
}
