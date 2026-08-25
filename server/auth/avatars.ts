export function buildDefaultAvatarUrl(seed: string): string {
  const normalized = seed.trim().toLowerCase().replace(/\s+/g, "-") || "key";
  return `https://tapback.co/api/avatar/${encodeURIComponent(normalized)}.webp`;
}

export function defaultAvatarUrlForEmail(email: string): string {
  const local = email.split("@")[0]?.trim() || "key";
  return buildDefaultAvatarUrl(local);
}
