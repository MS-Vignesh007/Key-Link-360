import type { Request } from "express";

/** Ignore rapid repeat hits from the same client (browser double-load / preview). */
const DEDUPE_WINDOW_MS = 5_000;
const recentHits = new Map<string, number>();

const BOT_UA =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|facebot|slackbot|twitterbot|linkedinbot|whatsapp|discordbot|telegrambot|pingdom|uptimerobot|semrush|ahrefs|bytespider|gptbot|headless/i;

function pruneRecent(now: number) {
  if (recentHits.size < 500) return;
  for (const [key, at] of recentHits) {
    if (now - at > DEDUPE_WINDOW_MS) recentHits.delete(key);
  }
}

/** True only for a real user document navigation — never invent/fake clicks. */
export function shouldCountRotatorHit(req: Request): boolean {
  if (req.method === "HEAD") return false;

  const purpose = String(req.get("Sec-Fetch-Purpose") || req.get("Purpose") || "").toLowerCase();
  if (purpose === "prefetch" || purpose === "prerender") return false;

  const dest = String(req.get("Sec-Fetch-Dest") || "").toLowerCase();
  // Subresource / iframe probes must not inflate destination counters.
  if (dest && dest !== "document") return false;

  const mode = String(req.get("Sec-Fetch-Mode") || "").toLowerCase();
  if (mode && mode !== "navigate") return false;

  const ua = String(req.get("user-agent") || "");
  if (!ua.trim() || BOT_UA.test(ua)) return false;

  return true;
}

/**
 * Returns false if this IP already counted a click on this rotator inside the dedupe window.
 * Prevents Destination 2/3 (and others) getting double/triple counts from one user action.
 */
export function claimRotatorClickSlot(rotatorId: string, ip: string): boolean {
  const id = String(rotatorId || "").trim();
  const client = String(ip || "unknown").slice(0, 64);
  if (!id) return false;

  const now = Date.now();
  pruneRecent(now);
  const key = `${id}::${client}`;
  const prev = recentHits.get(key) || 0;
  if (prev && now - prev < DEDUPE_WINDOW_MS) {
    return false;
  }
  recentHits.set(key, now);
  return true;
}
