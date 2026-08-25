import type { LinkRotatorDestinationRecord } from "./types";

const URL_PATTERN = /^https?:\/\/.+/i;

export function isValidHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || !URL_PATTERN.test(trimmed)) return false;
  try {
    const url = new URL(trimmed);
    return Boolean(url.hostname.includes("."));
  } catch {
    return false;
  }
}

/** Ensure destination redirect targets are absolute http(s) URLs. */
export function toAbsoluteHttpUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (!/^https?:$/i.test(url.protocol) || !url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeDestinations(
  input: unknown
): { destinations?: LinkRotatorDestinationRecord[]; error?: string } {
  if (!Array.isArray(input) || input.length === 0) {
    return { error: "Add at least one destination URL." };
  }

  const destinations: LinkRotatorDestinationRecord[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const row = input[index];
    if (!row || typeof row !== "object") {
      return { error: `Destination ${index + 1} is invalid.` };
    }
    const absoluteUrl = toAbsoluteHttpUrl(String((row as { url?: unknown }).url || ""));
    const probabilityRaw = (row as { probability?: unknown }).probability;
    const probability = Number(probabilityRaw);
    const id =
      String((row as { id?: unknown }).id || "").trim() ||
      `dest_${Date.now()}_${index}`;

    if (!absoluteUrl) {
      return { error: `Destination ${index + 1}: enter a valid URL (https://…).` };
    }
    if (!Number.isFinite(probability) || probability < 0 || probability > 100) {
      return { error: `Destination ${index + 1}: probability must be between 0 and 100.` };
    }

    destinations.push({
      id,
      url: absoluteUrl,
      // Store as integer percent to avoid float drift (30+30+40 === 100).
      probability: Math.round(probability)
    });
  }

  const total = destinations.reduce((sum, item) => sum + item.probability, 0);
  if (total !== 100) {
    return {
      error: `Total probability must equal exactly 100%. Current total: ${total}%.`
    };
  }

  return { destinations };
}

export function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Weighted random pick. Uses integer weights so 50/30/20 behaves correctly.
 */
export function pickDestinationByProbability(
  destinations: LinkRotatorDestinationRecord[]
): LinkRotatorDestinationRecord | null {
  const pool = destinations
    .map((item) => ({
      ...item,
      url: toAbsoluteHttpUrl(item.url) || "",
      probability: Math.max(0, Math.round(Number(item.probability) || 0))
    }))
    .filter((item) => item.probability > 0 && item.url);

  if (pool.length === 0) return null;

  const total = pool.reduce((sum, item) => sum + item.probability, 0);
  if (total <= 0) return pool[0] || null;

  let cursor = Math.floor(Math.random() * total) + 1; // 1..total inclusive
  for (const item of pool) {
    cursor -= item.probability;
    if (cursor <= 0) return item;
  }
  return pool[pool.length - 1] || null;
}
