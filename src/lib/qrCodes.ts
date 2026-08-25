import { PRIMARY_DOMAIN } from "../storage/publishStorage";
import type { QRCodeItem } from "../types";

export function generateQrPublicCode(): string {
  return `q${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function buildQrImageUrl(scanUrl: string, color: string, size = 250): string {
  const hex = color.replace("#", "");
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&color=${hex}&data=${encodeURIComponent(scanUrl)}`;
}

export function buildQrSvgImageUrl(scanUrl: string, color: string, size = 500): string {
  const hex = color.replace("#", "");
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&color=${hex}&format=svg&data=${encodeURIComponent(scanUrl)}`;
}

export function buildFixedQrScanUrl(publicCode: string, host = PRIMARY_DOMAIN): string {
  const code = normalizePublicCode(publicCode);
  return `https://${host}/q/${code}`;
}

/** Local / LAN hosts used while testing — not valid for public mobile scans. */
function isEphemeralQrHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  if (!host || host === "localhost" || host === "127.0.0.1" || host === "::1") return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  return false;
}

function normalizePublicCode(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
}

/**
 * Keep each QR's publicCode forever.
 * Upgrade localhost/LAN scan URLs → https://keylink360.mindflo.today/q/{code}
 * so mobile cameras hit the platform redirect (per-code destination), not /login.
 */
export function canonicalizeQrScanUrl(publicCode: string, scanUrl?: string): string {
  const code = normalizePublicCode(publicCode);
  const fallback = buildFixedQrScanUrl(code);
  if (!scanUrl || !code) return fallback;
  try {
    const url = new URL(scanUrl);
    const pathMatch = url.pathname.match(/^\/q\/([^/]+)\/?$/i);
    const codeFromPath = pathMatch?.[1] ? normalizePublicCode(pathMatch[1]) : "";
    const resolvedCode = codeFromPath || code;
    if (isEphemeralQrHostname(url.hostname)) {
      return buildFixedQrScanUrl(resolvedCode);
    }
    // Already on a real host — keep host, force /q/{thisCode} path.
    return `${url.protocol}//${url.host}/q/${resolvedCode}`;
  } catch {
    return fallback;
  }
}

/** Ensure QR has a frozen scanUrl/publicCode; never rewrite publicCode after create. */
export function ensureStableQrPayload(item: QRCodeItem): QRCodeItem {
  const color = item.designColor || extractQrColor(item.qrUrl);
  const publicCode = item.publicCode || generateQrPublicCodeFromId(item.id);
  const scanUrl = canonicalizeQrScanUrl(publicCode, item.scanUrl);
  return {
    ...item,
    publicCode,
    scanUrl,
    designColor: color,
    // Image may refresh color, but data= always stays this QR's unique scanUrl.
    qrUrl: buildQrImageUrl(scanUrl, color, 250)
  };
}

function generateQrPublicCodeFromId(id: string): string {
  const cleaned = String(id || "")
    .replace(/^qr_?/i, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 10)
    .toLowerCase();
  return cleaned || generateQrPublicCode();
}

export function extractQrColor(qrUrl: string, fallback = "#4F46E5"): string {
  const match = qrUrl.match(/color=([0-9A-Fa-f]{6})/i);
  return match?.[1] ? `#${match[1]}` : fallback;
}

export function formatQrScanExact(value: string | number | undefined): string {
  const n = Math.max(0, Math.floor(Number(String(value ?? "0").replace(/,/g, "")) || 0));
  return n.toLocaleString("en-IN");
}
