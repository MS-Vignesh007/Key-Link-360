import { resolvePlatformHostname } from "../domains/hostname";

/** Canonical host baked into printed Smart QR codes (never change after print). */
export function qrPlatformHostname(): string {
  const fromEnv = String(process.env.QR_PUBLIC_HOST || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  return fromEnv || resolvePlatformHostname();
}

export function buildQrScanUrl(publicCode: string, host = qrPlatformHostname()): string {
  const code = String(publicCode || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
  return `https://${host}/q/${code}`;
}

export function normalizeQrPublicCode(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
}
