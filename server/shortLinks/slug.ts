import { randomBytes } from "node:crypto";

const SLUG_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function normalizeShortLinkSlug(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function generateShortLinkSlug(length = 8): string {
  const bytes = randomBytes(length);
  let slug = "";
  for (let i = 0; i < length; i += 1) {
    slug += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  }
  return slug;
}

export function validateShortLinkSlug(slug: string): string | null {
  if (!slug || slug.length < 2) return "Slug must be at least 2 characters.";
  if (slug.length > 48) return "Slug must be 48 characters or fewer.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "Slug may only contain letters, numbers, and hyphens.";
  }
  return null;
}
