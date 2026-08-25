const URL_PATTERN = /^https?:\/\/.+/i;

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

export function isValidHttpUrl(value: string): boolean {
  const absolute = toAbsoluteHttpUrl(value);
  return Boolean(absolute && URL_PATTERN.test(absolute));
}
