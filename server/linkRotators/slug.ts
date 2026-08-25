import { randomBytes } from "node:crypto";

const SLUG_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function normalizeRotatorSlug(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 32);
}

export function generateRotatorSlug(length = 8): string {
  const bytes = randomBytes(length);
  let slug = "";
  for (let i = 0; i < length; i += 1) {
    slug += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  }
  return slug;
}

export function validateRotatorSlug(slug: string): string | null {
  if (!slug || slug.length < 3) return "Slug must be at least 3 characters.";
  if (slug.length > 32) return "Slug must be 32 characters or fewer.";
  if (!/^[a-z0-9]+$/.test(slug)) return "Slug may only contain letters and numbers.";
  return null;
}
