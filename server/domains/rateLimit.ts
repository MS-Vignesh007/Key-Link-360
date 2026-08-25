type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Returns true if the request is allowed, false if rate limited. */
export function consumeRateLimit(key: string, limit = 60, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function clientIp(req: { ip?: string; headers: Record<string, unknown> }): string {
  const forwarded = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  return forwarded || req.ip || "unknown";
}
